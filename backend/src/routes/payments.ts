import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { 
  User,
  ReserveTicketsRequest,
  ReserveTicketsResponse,
  WebhookRequest,
  TicketWithRaffle
} from '../types'

const prisma = new PrismaClient()

// Schemas de validação
const reserveTicketsSchema = z.object({
  raffleId: z.string(),
  numbers: z.array(z.number().min(1)).min(1).max(10)
})

const webhookSchema = z.object({
  externalId: z.string(),
  status: z.enum(['PAID', 'EXPIRED', 'CANCELED']),
  amount: z.number(),
  timestamp: z.string()
})

// Função para calcular taxas (RN-VEND-02)
const calculateFees = (amount: number) => {
  const serviceFeeRate = 0.05 // 5%
  const gatewayFeeRate = 0.01 // 1%
  
  const serviceFee = amount * serviceFeeRate
  const gatewayFee = amount * gatewayFeeRate
  const netValue = amount - serviceFee - gatewayFee
  
  return {
    serviceFee: Math.round(serviceFee * 100) / 100,
    gatewayFee: Math.round(gatewayFee * 100) / 100,
    netValue: Math.round(netValue * 100) / 100
  }
}

// Função para gerar PIX (simulação do AbacatePay)
const generatePixPayment = async (amount: number, externalId: string) => {
  // Simulação da integração com AbacatePay
  const pixCode = `00020126580014br.gov.bcb.pix0136${externalId}520400005303986540${amount.toFixed(2)}5802BR5913Rifaz System6009Sao Paulo62070503***6304`
  const pixQrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
  
  return {
    pixCode,
    pixQrCode,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
  }
}

// Rotas de pagamento
export const paymentRoutes = new Elysia({ prefix: '/payments' })
  
  // Reservar números e gerar PIX (RN-VEND-01, RN-VEND-02)
  .post('/reserve', async ({ body, user }) => {
    try {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const { raffleId, numbers } = reserveTicketsSchema.parse(body)
      
      // Verificar se rifa existe e está ativa
      const raffle = await prisma.raffle.findFirst({
        where: {
          id: raffleId,
          status: 'ACTIVE'
        },
        include: {
          tickets: {
            where: { status: 'PAID' },
            select: { number: true }
          }
        }
      })
      
      if (!raffle) {
        return new Response(JSON.stringify({ error: 'Rifa não encontrada ou não está ativa' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Verificar se números estão disponíveis
      const soldNumbers = raffle.tickets.map(t => t.number)
      const unavailableNumbers = numbers.filter(num => 
        soldNumbers.includes(num) || 
        num < 1 || 
        num > raffle.totalNumeros
      )
      
      if (unavailableNumbers.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Números indisponíveis', 
          unavailableNumbers 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Verificar se ainda há números disponíveis (RN-RIFA-04)
      if (soldNumbers.length + numbers.length > raffle.totalNumeros) {
        return new Response(JSON.stringify({ error: 'Não há números suficientes disponíveis' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const amount = raffle.valorUnitario * numbers.length
      const fees = calculateFees(amount)
      const externalId = uuidv4()
      
      // Criar transação e reservar tickets atomicamente
      const result = await prisma.$transaction(async (tx) => {
        // Criar transação
        const transaction = await tx.transaction.create({
          data: {
            ticketIds: [],
            amount,
            serviceFee: fees.serviceFee,
            gatewayFee: fees.gatewayFee,
            netValue: fees.netValue,
            externalId,
            buyerId: user.id,
            raffleId,
            status: 'PENDING'
          }
        })
        
        // Reservar tickets
        const tickets = []
        for (const number of numbers) {
          const ticket = await tx.ticket.create({
            data: {
              raffleId,
              number,
              buyerId: user.id,
              status: 'RESERVED',
              transactionId: transaction.id
            }
          })
          tickets.push(ticket)
        }
        
        // Atualizar transação com IDs dos tickets
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { ticketIds: tickets.map(t => t.id) }
        })
        
        return { transaction, tickets }
      })
      
      // Gerar PIX
      const pixData = await generatePixPayment(amount, externalId)
      
      // Atualizar transação com dados do PIX
      await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: {
          pixCode: pixData.pixCode,
          pixQrCode: pixData.pixQrCode,
          expiresAt: pixData.expiresAt
        }
      })
      
      return {
        transaction: {
          ...result.transaction,
          pixCode: pixData.pixCode,
          pixQrCode: pixData.pixQrCode,
          expiresAt: pixData.expiresAt
        },
        tickets: result.tickets,
        amount,
        fees,
        expiresIn: 15 * 60 // 15 minutos em segundos
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ 
          error: 'Dados inválidos', 
          details: error.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })
  
  // Webhook do AbacatePay (RN-VEND-03)
  .post('/webhook', async ({ body, headers }) => {
    try {
      // Verificar assinatura do webhook (simulação)
      const webhookSecret = process.env.ABACATE_PAY_WEBHOOK_SECRET
      const signature = headers['x-webhook-signature']
      
      if (!webhookSecret || !signature) {
        return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const data = webhookSchema.parse(body)
      
      // Processar pagamento de forma idempotente
      const transaction = await prisma.transaction.findUnique({
        where: { externalId: data.externalId },
        include: {
          tickets: true,
          raffle: true,
          buyer: true
        }
      })
      
      if (!transaction) {
        return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Se já foi processada, retornar sucesso (idempotência)
      if (transaction.status === 'PAID') {
        return { success: true, message: 'Pagamento já processado' }
      }
      
      if (data.status === 'PAID') {
        // Confirmar pagamento
        await prisma.$transaction(async (tx) => {
          // Atualizar transação
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'PAID' }
          })
          
          // Atualizar tickets
          await tx.ticket.updateMany({
            where: { transactionId: transaction.id },
            data: { status: 'PAID' }
          })
          
          // Verificar se rifa deve ser encerrada (RN-RIFA-04)
          const paidTicketsCount = await tx.ticket.count({
            where: {
              raffleId: transaction.raffleId,
              status: 'PAID'
            }
          })
          
          if (paidTicketsCount >= transaction.raffle.totalNumeros) {
            await tx.raffle.update({
              where: { id: transaction.raffleId },
              data: { status: 'PENDING_DRAW' }
            })
          }
        })
        
        // Disparar eventos assíncronos (RN-EMAIL-01, RN-EMAIL-02)
        // Isso seria feito via queue/worker
        console.log(`Pagamento confirmado para transação ${data.externalId}`)
        
        return { success: true, message: 'Pagamento processado com sucesso' }
      } else if (data.status === 'EXPIRED' || data.status === 'CANCELED') {
        // Cancelar transação e liberar tickets
        await prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'EXPIRED' }
          })
          
          await tx.ticket.updateMany({
            where: { transactionId: transaction.id },
            data: { status: 'CANCELED' }
          })
        })
        
        return { success: true, message: 'Transação cancelada' }
      }
      
      return { success: true, message: 'Webhook processado' }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ 
          error: 'Dados inválidos', 
          details: error.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })
  
  // Meus números (RN-DASH-02)
  .get('/my-tickets', async ({ user }) => {
    try {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const tickets = await prisma.ticket.findMany({
        where: { buyerId: user.id },
        include: {
          raffle: {
            select: {
              id: true,
              titulo: true,
              status: true,
              dataSorteio: true,
              winningNumber: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      // Agrupar por rifa
      const groupedTickets = tickets.reduce((acc, ticket) => {
        const raffleId = ticket.raffleId
        if (!acc[raffleId]) {
          acc[raffleId] = {
            raffle: ticket.raffle,
            tickets: []
          }
        }
        acc[raffleId].tickets.push({
          id: ticket.id,
          number: ticket.number,
          status: ticket.status,
          createdAt: ticket.createdAt
        })
        return acc
      }, {} as any)
      
      return Object.values(groupedTickets)
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })
  
  // Verificar status da transação
  .get('/transaction/:id', async ({ params, user }) => {
    try {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: params.id,
          buyerId: user.id
        },
        include: {
          tickets: {
            select: { id: true, number: true, status: true }
          },
          raffle: {
            select: { id: true, titulo: true, status: true }
          }
        }
      })
      
      if (!transaction) {
        return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return transaction
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })
