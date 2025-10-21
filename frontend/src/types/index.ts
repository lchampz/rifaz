// Tipos para o frontend
export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  emailVerified: boolean;
}

export type Role = 'ADMIN' | 'CREATOR' | 'BUYER';

export interface Raffle {
  id: string;
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: string;
  status: RaffleStatus;
  imageUrl?: string;
  winningNumber?: number;
  drawingHash?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  soldTickets: number;
  progressPercentage: number;
  availableNumbers: number;
}

export type RaffleStatus = 'DRAFT' | 'ACTIVE' | 'PENDING_DRAW' | 'FINISHED' | 'CANCELED';

export interface Ticket {
  id: string;
  raffleId: string;
  number: number;
  status: TicketStatus;
  createdAt: string;
}

export type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELED' | 'EXPIRED';

export interface Transaction {
  id: string;
  ticketIds: string[];
  amount: number;
  serviceFee: number;
  gatewayFee: number;
  netValue: number;
  status: TransactionStatus;
  pixCode?: string;
  pixQrCode?: string;
  expiresAt?: string;
  createdAt: string;
  tickets: Ticket[];
  raffle: {
    id: string;
    titulo: string;
    status: RaffleStatus;
  };
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELED';

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
  totalRevenue: number;
}

export interface TicketWithRaffle {
  id: string;
  number: number;
  status: TicketStatus;
  value: number;
  createdAt: string;
  raffle: {
    id: string;
    titulo: string;
    status: RaffleStatus;
    dataSorteio: string;
    winningNumber?: number;
    imageUrl?: string;
    creator: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// Tipos para requests/responses da API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
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

export interface RafflesResponse {
  raffles: Raffle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  raffles: RaffleWithStats[];
}

// Tipos para formulários
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateRaffleForm {
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: string;
  imageUrl?: string;
}

// Tipos para componentes
export interface PaymentModalProps {
  onClose: () => void;
  selectedNumbers: number[];
  totalAmount: number;
}

export interface RaffleCardProps {
  raffle: Raffle;
}

// Tipos para estado da aplicação
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Tipos para erros da API
export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Tipos para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: RaffleStatus;
}

// Tipos para filtros
export interface RaffleFilters {
  status?: RaffleStatus;
  creatorId?: string;
  search?: string;
}
