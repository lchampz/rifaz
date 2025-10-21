import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { raffleRoutes } from './routes/raffles'
import { paymentRoutes } from './routes/payments'
import type { 
  User, 
  Role, 
  RaffleStatus, 
  ElysiaContext,
  RegisterRequest,
  LoginRequest,
  AuthResponse
} from './types'

// Configuração do Prisma
const prisma = new PrismaClient()

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// Middleware de autorização RBAC
const authorize = (roles: Role[]) => {
  return async (ctx: ElysiaContext & { headers: Record<string, string>; jwt: { verify: (token: string) => Promise<Record<string, unknown>> } }) => {
    const token = ctx.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const payload = await ctx.jwt.verify(token) as { id: string; email: string; roles: Role[] }
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, roles: true, name: true }
      })

      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const hasRole = roles.some(role => user.roles.includes(role))
      if (!hasRole) {
        return new Response(JSON.stringify({ error: 'Acesso negado' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      ctx.user = user as User
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

// Aplicação principal
const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Rifaz API',
        version: '1.0.0',
        description: 'API para Sistema de Rifas Online'
      }
    }
  }))
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  
  // Health check
  .get('/health', () => ({ status: 'OK', timestamp: new Date().toISOString() }))
  
  // Rotas de autenticação
  .post('/auth/register', async ({ body, jwt }: { body: RegisterRequest; jwt: { sign: (payload: Record<string, unknown>) => Promise<string> } }) => {
    try {
      const { email, password, name } = registerSchema.parse(body)
      
      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'E-mail já cadastrado' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12)
      
      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          roles: ['BUYER']
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          emailVerified: true
        }
      })
      
      // Gerar JWT
      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        roles: user.roles
      })
      
      return {
        user,
        token
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
  
  .post('/auth/login', async ({ body, jwt }: { body: LoginRequest; jwt: { sign: (payload: Record<string, unknown>) => Promise<string> } }) => {
    try {
      const { email, password } = loginSchema.parse(body)
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user || !user.passwordHash) {
        return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Gerar JWT
      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        roles: user.roles
      })
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          emailVerified: user.emailVerified
        },
        token
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
  
  .get('/auth/me', authorize(['BUYER', 'CREATOR', 'ADMIN']), async ({ user }: { user: User }) => {
    return { user }
  })
  
  // Rotas de rifas (protegidas)
  .get('/raffles', async ({ query }: { query: Record<string, string> }) => {
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 10
    const status = query.status as RaffleStatus | undefined
    
    const where = status ? { status } : {}
    
    const [raffles, total] = await Promise.all([
      prisma.raffle.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          tickets: {
            where: { status: 'PAID' },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.raffle.count({ where })
    ])
    
    return {
      raffles: raffles.map(raffle => ({
        ...raffle,
        soldTickets: raffle.tickets.length,
        progressPercentage: Math.round((raffle.tickets.length / raffle.totalNumeros) * 100)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  })
  
  .get('/raffles/:id', async ({ params }: { params: { id: string } }) => {
    const raffle = await prisma.raffle.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        tickets: {
          where: { status: 'PAID' },
          select: { number: true }
        }
      }
    })
    
    if (!raffle) {
      return new Response(JSON.stringify({ error: 'Rifa não encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return {
      ...raffle,
      soldTickets: raffle.tickets.length,
      progressPercentage: Math.round((raffle.tickets.length / raffle.totalNumeros) * 100),
      availableNumbers: raffle.totalNumeros - raffle.tickets.length
    }
  })
  
  // Incluir rotas de rifas e pagamentos
  .use(raffleRoutes)
  .use(paymentRoutes)
  
  .listen(3001)

console.log(`🚀 Servidor rodando em http://localhost:3001`)

export default app
