// Tipos específicos para o contexto do Elysia com autenticação
export interface ElysiaContext {
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string | undefined>;
  cookie: Record<string, unknown>;
  server: unknown;
  redirect: (url: string, status?: number) => Response;
  status: <T = number>(code: T) => Response;
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}
