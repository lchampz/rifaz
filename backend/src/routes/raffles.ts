import { PrismaClient } from '@prisma/client';
import { Elysia } from 'elysia';
import { z } from 'zod';
import type { ElysiaContext } from '../types';

const prisma = new PrismaClient();

// Schemas de validação para rifas
const createRaffleSchema = z.object({
  titulo: z.string().min(3).max(100),
  descricao: z.string().optional(),
  valorUnitario: z.number().min(1),
  totalNumeros: z.number().min(1).max(10000),
  dataSorteio: z.string().datetime(),
  imageUrl: z.string().url().optional(),
});

const updateRaffleSchema = createRaffleSchema.partial();

// Middleware para verificar se usuário é CREATOR
const requireCreator = async (ctx: ElysiaContext): Promise<Response | void> => {
  if (!ctx.user?.roles.includes('CREATOR')) {
    return new Response(
      JSON.stringify({ error: 'Acesso negado. Role CREATOR necessário.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Função para verificar se rifa pode ser ativada
const canActivateRaffle = (raffle: {
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: Date;
  imageUrl?: string;
}) => {
  const requiredFields: (keyof typeof raffle)[] = [
    'titulo',
    'descricao',
    'valorUnitario',
    'totalNumeros',
    'dataSorteio',
    'imageUrl',
  ];
  const missingFields = requiredFields.filter(field => !raffle[field]);

  if (missingFields.length > 0) {
    return {
      canActivate: false,
      reason: `Campos obrigatórios: ${missingFields.join(', ')}`,
    };
  }

  if (raffle.dataSorteio <= new Date()) {
    return { canActivate: false, reason: 'Data de sorteio deve ser futura' };
  }

  if (raffle.dataSorteio > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
    return {
      canActivate: false,
      reason: 'Data de sorteio não pode ser superior a 90 dias',
    };
  }

  return { canActivate: true };
};

// Rotas de rifas
export const raffleRoutes = new Elysia({ prefix: '/raffles' })

  // Criar rifa (RN-RIFA-01, RN-RIFA-02)
  .post('/', async ctx => {
    try {
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;

      const data = createRaffleSchema.parse(ctx.body);

      // Validar data de sorteio
      const dataSorteio = new Date(data.dataSorteio);
      if (dataSorteio <= new Date()) {
        return new Response(
          JSON.stringify({ error: 'Data de sorteio deve ser futura' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (dataSorteio > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        return new Response(
          JSON.stringify({
            error: 'Data de sorteio não pode ser superior a 90 dias',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const raffle = await prisma.raffle.create({
        data: {
          ...data,
          dataSorteio: dataSorteio,
          creatorId: (ctx as any).user.id,
          status: 'DRAFT',
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return raffle;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Dados inválidos',
            details: error.errors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  })

  // Ativar rifa (RN-RIFA-02)
  .patch('/:id/activate', async ctx => {
    try {
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;
      const user = (ctx as ElysiaContext).user;
      const raffle = await prisma.raffle.findFirst({
        where: {
          id: ctx.params.id,
          creatorId: user?.id,
          status: 'DRAFT',
        },
      });

      if (!raffle) {
        return new Response(
          JSON.stringify({
            error: 'Rifa não encontrada ou não pode ser ativada',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const { canActivate, reason } = canActivateRaffle(raffle);
      if (!canActivate) {
        return new Response(JSON.stringify({ error: reason }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Ativar rifa e promover usuário para CREATOR se necessário
      const updatedRaffle = await prisma.$transaction(
        async (tx: PrismaClient) => {
          const raffle = await tx.raffle.update({
            where: { id: ctx.params.id },
            data: { status: 'ACTIVE' },
          });
          const user = (ctx as ElysiaContext).user;
          // Promover usuário para CREATOR se ainda não for
          if (!user?.roles.includes('CREATOR')) {
            await tx.user.update({
              where: { id: user?.id },
              data: {
                roles: [...(user?.roles || []), 'CREATOR'],
              },
            });
          }

          return raffle;
        }
      );

      return updatedRaffle;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  })

  // Atualizar rifa
  .patch('/:id', async ctx => {
    try {
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;

      const data = updateRaffleSchema.parse(ctx.body);

      const raffle = await prisma.raffle.findFirst({
        where: {
          id: ctx.params.id,
          creatorId: (ctx as ElysiaContext).user?.id,
          status: 'DRAFT',
        },
      });

      if (!raffle) {
        return new Response(
          JSON.stringify({
            error: 'Rifa não encontrada ou não pode ser editada',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const updatedRaffle = await prisma.raffle.update({
        where: { id: ctx.params.id },
        data: {
          ...data,
          dataSorteio: data.dataSorteio
            ? new Date(data.dataSorteio)
            : undefined,
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return updatedRaffle;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Dados inválidos',
            details: error.errors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  })

  // Dashboard do criador (RN-DASH-01)
  .get('/dashboard', async ctx => {
    try {
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;

      const user = (ctx as ElysiaContext).user;
      const [
        totalRaffles,
        activeRaffles,
        finishedRaffles,
        totalRevenue,
        totalServiceFees,
        totalGatewayFees,
        raffles,
      ] = await Promise.all([
        prisma.raffle.count({
          where: { creatorId: user?.id },
        }),
        prisma.raffle.count({
          where: { creatorId: user?.id, status: 'ACTIVE' },
        }),
        prisma.raffle.count({
          where: { creatorId: user?.id, status: 'FINISHED' },
        }),
        prisma.transaction.aggregate({
          where: {
            buyerId: user?.id,
            status: 'PAID',
          },
          _sum: { netValue: true },
        }),
        prisma.transaction.aggregate({
          where: {
            buyerId: user?.id,
            status: 'PAID',
          },
          _sum: { serviceFee: true },
        }),
        prisma.transaction.aggregate({
          where: {
            buyerId: user?.id,
            status: 'PAID',
          },
          _sum: { gatewayFee: true },
        }),
        prisma.raffle.findMany({
          where: { creatorId: user?.id },
          include: {
            tickets: {
              where: { status: 'PAID' },
              select: { id: true },
            },
            transactions: {
              where: { status: 'PAID' },
              select: { netValue: true, serviceFee: true, gatewayFee: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const netProfit =
        (totalRevenue._sum.netValue || 0) -
        (totalServiceFees._sum.serviceFee || 0) -
        (totalGatewayFees._sum.gatewayFee || 0);

      return {
        metrics: {
          totalRaffles,
          activeRaffles,
          finishedRaffles,
          totalRevenue: totalRevenue._sum.netValue || 0,
          totalServiceFees: totalServiceFees._sum.serviceFee || 0,
          totalGatewayFees: totalGatewayFees._sum.gatewayFee || 0,
          netProfit,
        },
        raffles: raffles.map((raffle: any) => ({
          ...raffle,
          soldTickets: raffle.tickets.length,
          progressPercentage: Math.round(
            (raffle.tickets.length / raffle.totalNumeros) * 100
          ),
          totalRevenue: raffle.transactions.reduce(
            (sum: number, t: { netValue: number }) => sum + Number(t.netValue),
            0
          ),
        })),
      };
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  })

  // Minhas rifas
  .get('/my-raffles', async ctx => {
    try {
      const user = (ctx as ElysiaContext).user;
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;

      const raffles = await prisma.raffle.findMany({
        where: { creatorId: user?.id },
        include: {
          tickets: {
            where: { status: 'PAID' },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return raffles.map((raffle: any) => ({
        ...raffle,
        soldTickets: raffle.tickets.length,
        progressPercentage: Math.round(
          (raffle.tickets.length / raffle.totalNumeros) * 100
        ),
      }));
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  })

  // Cancelar rifa
  .patch('/:id/cancel', async ctx => {
    try {
      const user = (ctx as ElysiaContext).user;
      const authCheck = await requireCreator(ctx as ElysiaContext);
      if (authCheck) return authCheck;

      const raffle = await prisma.raffle.findFirst({
        where: {
          id: ctx.params.id,
          creatorId: user?.id,
          status: { in: ['DRAFT', 'ACTIVE'] },
        },
      });

      if (!raffle) {
        return new Response(
          JSON.stringify({
            error: 'Rifa não encontrada ou não pode ser cancelada',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const updatedRaffle = await prisma.raffle.update({
        where: { id: ctx.params.id },
        data: { status: 'CANCELED' },
      });

      return updatedRaffle;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
