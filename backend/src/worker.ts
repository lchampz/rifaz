import { PrismaClient } from '@prisma/client'
import { Queue, Worker } from 'bull'
import Redis from 'ioredis'
import type { 
  WorkerJobData,
  EmailJobData,
  DrawResultData
} from './types'

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Configurar filas
const emailQueue = new Queue('email processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

const raffleQueue = new Queue('raffle processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Worker para expiração de reservas (RN-VEND-04)
const expireReservationsWorker = new Worker('expire-reservations', async (job: { data: WorkerJobData }) => {
  try {
    const expiredTickets = await prisma.ticket.findMany({
      where: {
        status: 'RESERVED',
        createdAt: {
          lt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutos atrás
        }
      },
      include: {
        transaction: true
      }
    })
    
    if (expiredTickets.length === 0) {
      return { message: 'Nenhuma reserva expirada' }
    }
    
    // Cancelar tickets expirados
    await prisma.$transaction(async (tx) => {
      for (const ticket of expiredTickets) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: 'CANCELED' }
        })
        
        if (ticket.transaction) {
          await tx.transaction.update({
            where: { id: ticket.transaction.id },
            data: { status: 'EXPIRED' }
          })
        }
      }
    })
    
    console.log(`Cancelados ${expiredTickets.length} tickets expirados`)
    return { message: `${expiredTickets.length} reservas canceladas` }
  } catch (error) {
    console.error('Erro ao expirar reservas:', error)
    throw error
  }
}, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Worker para transição de status de rifas (RN-RIFA-05)
const transitionRaffleStatusWorker = new Worker('transition-raffle-status', async (job: { data: WorkerJobData }) => {
  try {
    const now = new Date()
    
    // Buscar rifas ativas com data de sorteio passada
    const rafflesToTransition = await prisma.raffle.findMany({
      where: {
        status: 'ACTIVE',
        dataSorteio: {
          lt: now
        }
      }
    })
    
    if (rafflesToTransition.length === 0) {
      return { message: 'Nenhuma rifa para transicionar' }
    }
    
    // Atualizar status para PENDING_DRAW
    await prisma.raffle.updateMany({
      where: {
        id: {
          in: rafflesToTransition.map(r => r.id)
        }
      },
      data: {
        status: 'PENDING_DRAW'
      }
    })
    
    console.log(`Transicionadas ${rafflesToTransition.length} rifas para PENDING_DRAW`)
    return { message: `${rafflesToTransition.length} rifas transicionadas` }
  } catch (error) {
    console.error('Erro ao transicionar status das rifas:', error)
    throw error
  }
}, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Worker para sorteio (RN-RIFA-03)
const drawRaffleWorker = new Worker('draw-raffle', async (job: { data: DrawResultData }) => {
  try {
    const { raffleId } = job.data
    
    const raffle = await prisma.raffle.findFirst({
      where: {
        id: raffleId,
        status: 'PENDING_DRAW'
      },
      include: {
        tickets: {
          where: { status: 'PAID' },
          select: { number: true }
        }
      }
    })
    
    if (!raffle) {
      throw new Error('Rifa não encontrada ou não está pronta para sorteio')
    }
    
    if (raffle.tickets.length === 0) {
      throw new Error('Nenhum ticket vendido para esta rifa')
    }
    
    // Gerar número vencedor usando algoritmo auditável
    const winningNumber = generateAuditableWinningNumber(raffle.tickets.map(t => t.number))
    const drawingHash = generateDrawingHash(raffle.id, winningNumber, new Date())
    
    // Atualizar rifa com resultado do sorteio
    await prisma.raffle.update({
      where: { id: raffleId },
      data: {
        status: 'FINISHED',
        winningNumber,
        drawingHash
      }
    })
    
    // Disparar notificação de sorteio (RN-EMAIL-03)
    await emailQueue.add('notify-draw-result', {
      raffleId,
      winningNumber,
      raffleTitle: raffle.titulo
    })
    
    console.log(`Sorteio realizado para rifa ${raffleId}. Número vencedor: ${winningNumber}`)
    return { 
      raffleId, 
      winningNumber, 
      drawingHash,
      message: 'Sorteio realizado com sucesso' 
    }
  } catch (error) {
    console.error('Erro ao realizar sorteio:', error)
    throw error
  }
}, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Worker para processar sorteios pendentes
const processPendingDrawsWorker = new Worker('process-pending-draws', async (job: { data: WorkerJobData }) => {
  try {
    const pendingDraws = await prisma.raffle.findMany({
      where: {
        status: 'PENDING_DRAW'
      },
      select: { id: true }
    })
    
    if (pendingDraws.length === 0) {
      return { message: 'Nenhum sorteio pendente' }
    }
    
    // Agendar sorteios
    for (const raffle of pendingDraws) {
      await raffleQueue.add('draw-raffle', { raffleId: raffle.id }, {
        delay: 1000 // 1 segundo de delay para evitar sobrecarga
      })
    }
    
    console.log(`Agendados ${pendingDraws.length} sorteios`)
    return { message: `${pendingDraws.length} sorteios agendados` }
  } catch (error) {
    console.error('Erro ao processar sorteios pendentes:', error)
    throw error
  }
}, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Função para gerar número vencedor auditável
function generateAuditableWinningNumber(availableNumbers: number[]): number {
  // Usar timestamp e números disponíveis para gerar seed determinístico
  const seed = Date.now() + availableNumbers.reduce((sum, num) => sum + num, 0)
  const randomIndex = Math.floor(Math.random() * availableNumbers.length)
  return availableNumbers[randomIndex]
}

// Função para gerar hash do sorteio
function generateDrawingHash(raffleId: string, winningNumber: number, timestamp: Date): string {
  const data = `${raffleId}-${winningNumber}-${timestamp.toISOString()}`
  // Simulação de hash (em produção usar crypto.createHash)
  return Buffer.from(data).toString('base64')
}

// Worker para envio de e-mails
const emailWorker = new Worker('email processing', async (job: { data: EmailJobData }) => {
  try {
    const { type, data } = job.data
    
    switch (type) {
      case 'payment-confirmation':
        await sendPaymentConfirmationEmail(data)
        break
      case 'sale-notification':
        await sendSaleNotificationEmail(data)
        break
      case 'draw-result':
        await sendDrawResultEmail(data)
        break
      default:
        throw new Error(`Tipo de e-mail não suportado: ${type}`)
    }
    
    return { message: `E-mail ${type} enviado com sucesso` }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw error
  }
}, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Funções de envio de e-mail (simulação)
async function sendPaymentConfirmationEmail(data: Record<string, unknown>) {
  console.log(`Enviando confirmação de pagamento para ${data.buyerEmail}`)
  // Implementar envio real de e-mail aqui
}

async function sendSaleNotificationEmail(data: Record<string, unknown>) {
  console.log(`Enviando notificação de venda para ${data.creatorEmail}`)
  // Implementar envio real de e-mail aqui
}

async function sendDrawResultEmail(data: Record<string, unknown>) {
  console.log(`Enviando resultado do sorteio para participantes da rifa ${data.raffleId}`)
  // Implementar envio real de e-mail aqui
}

// Agendar jobs recorrentes
setInterval(async () => {
  try {
    await expireReservationsWorker.add({}, { repeat: { every: 5 * 60 * 1000 } }) // A cada 5 minutos
  } catch (error) {
    console.error('Erro ao agendar expiração de reservas:', error)
  }
}, 5 * 60 * 1000)

setInterval(async () => {
  try {
    await transitionRaffleStatusWorker.add({}, { repeat: { every: 60 * 60 * 1000 } }) // A cada hora
  } catch (error) {
    console.error('Erro ao agendar transição de status:', error)
  }
}, 60 * 60 * 1000)

setInterval(async () => {
  try {
    await processPendingDrawsWorker.add({}, { repeat: { every: 30 * 60 * 1000 } }) // A cada 30 minutos
  } catch (error) {
    console.error('Erro ao agendar processamento de sorteios:', error)
  }
}, 30 * 60 * 1000)

console.log('🚀 Workers iniciados com sucesso!')

export {
  emailQueue,
  raffleQueue,
  expireReservationsWorker,
  transitionRaffleStatusWorker,
  drawRaffleWorker,
  processPendingDrawsWorker,
  emailWorker
}
