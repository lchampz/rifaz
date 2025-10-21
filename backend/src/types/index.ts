// Tipos para o sistema de rifas
export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = 'ADMIN' | 'CREATOR' | 'BUYER';

export interface Raffle {
  id: string;
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: Date;
  status: RaffleStatus;
  creatorId: string;
  imageUrl?: string;
  winningNumber?: number;
  drawingHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RaffleStatus = 'DRAFT' | 'ACTIVE' | 'PENDING_DRAW' | 'FINISHED' | 'CANCELED';

export interface Ticket {
  id: string;
  raffleId: string;
  number: number;
  buyerId?: string;
  status: TicketStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELED';

export interface Transaction {
  id: string;
  ticketIds: string[];
  amount: number;
  serviceFee: number;
  gatewayFee: number;
  netValue: number;
  externalId?: string;
  buyerId: string;
  raffleId: string;
  status: TransactionStatus;
  pixCode?: string;
  pixQrCode?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELED';

export interface EventLog {
  id: string;
  eventType: string;
  entityId: string;
  entityType: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
}

// Tipos para requests/responses da API
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export interface CreateRaffleRequest {
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: string;
  imageUrl?: string;
}

export interface UpdateRaffleRequest {
  titulo?: string;
  descricao?: string;
  valorUnitario?: number;
  totalNumeros?: number;
  dataSorteio?: string;
  imageUrl?: string;
}

export interface ReserveTicketsRequest {
  raffleId: string;
  numbers: number[];
}

export interface ReserveTicketsResponse {
  transaction: Transaction;
  tickets: Ticket[];
  amount: number;
  fees: {
    serviceFee: number;
    gatewayFee: number;
    netValue: number;
  };
  expiresIn: number;
}

export interface WebhookRequest {
  externalId: string;
  status: 'PAID' | 'EXPIRED' | 'CANCELED';
  amount: number;
  timestamp: string;
}

export interface DashboardMetrics {
  totalRaffles: number;
  activeRaffles: number;
  finishedRaffles: number;
  totalRevenue: number;
  totalServiceFees: number;
  totalGatewayFees: number;
  netProfit: number;
}

export interface RaffleWithStats extends Raffle {
  soldTickets: number;
  progressPercentage: number;
  availableNumbers: number;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TicketWithRaffle extends Ticket {
  raffle: {
    id: string;
    titulo: string;
    status: RaffleStatus;
    dataSorteio: Date;
    winningNumber?: number;
    imageUrl?: string;
  };
}

// Tipos para contexto do Elysia
export interface ElysiaContext {
  user?: User;
  jwt?: {
    sign: (payload: Record<string, unknown>) => Promise<string>;
    verify: (token: string) => Promise<Record<string, unknown>>;
  };
}

// Tipos para workers
export interface WorkerJobData {
  raffleId?: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface EmailJobData {
  type: 'payment-confirmation' | 'sale-notification' | 'draw-result';
  data: Record<string, unknown>;
}

export interface DrawResultData {
  raffleId: string;
  winningNumber: number;
  raffleTitle: string;
}
