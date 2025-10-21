# README - Sistema de Rifas Rifaz

## 🎯 Visão Geral

O **Rifaz** é um sistema de rifas online de alto desempenho e escalabilidade, projetado para digitalizar e otimizar a venda de bilhetes e a realização de sorteios. O sistema converte objetivos de negócio em regras transacionais robustas, utilizando uma arquitetura event-driven para garantir atomicidade na atribuição dos números e resiliência no processamento dos pagamentos via PIX.

## 🏗️ Arquitetura

### Tecnologias Utilizadas

**Backend:**

- Node.js + Bun (runtime)
- Elysia (framework web)
- Prisma (ORM)
- PostgreSQL (banco de dados)
- Redis (cache e filas)
- Bull (processamento assíncrono)

**Frontend:**

- React 18 + TypeScript
- Tailwind CSS (estilização)
- React Query (gerenciamento de estado)
- React Router (roteamento)
- Zustand (estado global)

**Infraestrutura:**

- Docker + Docker Compose
- Nginx (proxy reverso)
- PostgreSQL (banco principal)
- Redis (cache e mensageria)

### Arquitetura de Microserviços

O sistema é dividido em contextos delimitados seguindo DDD:

1. **Serviço de Rifas** (Core da RN-RIFA)
2. **Serviço de Vendas/Pagamento** (Core da RN-VEND)
3. **Serviço de Comunicação/Dashboard** (RN-DASH/RN-EMAIL)

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose instalados
- Git

### Instalação e Execução

1. **Clone o repositório:**

```bash
git clone <repository-url>
cd rifaz
```

2. **Configure as variáveis de ambiente:**

```bash
# Backend
cp backend/env.example backend/.env
# Edite o arquivo .env com suas configurações

# Frontend
cp frontend/env.example frontend/.env
# Edite o arquivo .env com suas configurações
```

3. **Inicie o sistema:**

```bash
./start.sh
```

4. **Acesse a aplicação:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/swagger

## 📋 Funcionalidades Implementadas

### ✅ Regras de Negócio Implementadas

**Core - Usuário e Segurança:**

- ✅ RN-USR-01: Cadastro e Login com JWT
- ✅ RN-USR-02: Criação de Rifas (Role CREATOR)
- ✅ RN-SEC-01: Autorização RBAC
- ✅ RN-SEC-02: Transações Seguras

**Core - Gerenciamento de Rifas:**

- ✅ RN-RIFA-01: Estrutura Básica de Rifas
- ✅ RN-RIFA-02: Criação e Ativação
- ✅ RN-RIFA-03: Sorteio Auditável
- ✅ RN-RIFA-04: Regra de Venda
- ✅ RN-RIFA-05: Transição de Status

**Core - Vendas e Pagamentos:**

- ✅ RN-VEND-01: Seleção e Reserva Atômica (15 min)
- ✅ RN-VEND-02: Geração de PIX e Taxas
- ✅ RN-VEND-03: Detecção de Pagamento (Webhook)
- ✅ RN-VEND-04: Expiração de Reservas

**Interface e Comunicação:**

- ✅ RN-DASH-01: Dashboard do Criador
- ✅ RN-DASH-02: Tela de Compras (Buyer)
- ✅ RN-EMAIL-01: Confirmação de Venda
- ✅ RN-EMAIL-02: Notificação de Venda (Criador)
- ✅ RN-EMAIL-03: Notificação de Sorteio

### 🎨 Interface de Usuário

**Design System:**

- Paleta de cores baseada em confiança (Azul) e sucesso (Verde)
- Tipografia moderna com Inter
- Componentes reutilizáveis com Tailwind CSS
- Responsividade completa
- Microinterações para feedback

**Páginas Implementadas:**

- ✅ Homepage com listagem de rifas
- ✅ Detalhes da rifa com seleção de números
- ✅ Sistema de pagamento PIX
- ✅ Dashboard do criador
- ✅ Página de login/registro
- ✅ Meus números (comprador)

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
rifaz/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── types/           # Definições de tipos TypeScript
│   │   ├── routes/          # Rotas da API
│   │   ├── index.ts         # Servidor principal
│   │   └── worker.ts        # Workers assíncronos
│   ├── prisma/
│   │   └── schema.prisma    # Schema do banco
│   ├── tsconfig.json        # Configuração TypeScript rigorosa
│   ├── .eslintrc.json       # Configuração ESLint
│   └── Dockerfile
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── types/           # Definições de tipos TypeScript
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   └── store/           # Estado global
│   ├── tsconfig.json        # Configuração TypeScript rigorosa
│   ├── .eslintrc.json       # Configuração ESLint
│   └── Dockerfile
├── docker-compose.yml       # Orquestração de containers
└── start.sh                 # Script de inicialização
```

### Comandos Úteis

```bash
# Desenvolvimento local
bun run dev

# Build para produção
bun run build

# Verificação de tipos
bun run type-check

# Linting
bun run lint
bun run lint:fix

# Formatação
bun run format

# Parar o sistema
docker-compose down

# Ver logs
docker-compose logs -f

# Acessar banco de dados
docker-compose exec postgres psql -U rifaz_user -d rifaz

# Executar migrações
docker-compose exec backend bun run db:push
```

### 🎯 Tipagem Rigorosa

O projeto implementa tipagem TypeScript rigorosa com as seguintes configurações:

- **Proibição de `any`**: Todos os tipos devem ser explícitos
- **Strict Mode**: Todas as verificações de tipo ativadas
- **ESLint**: Regras rigorosas para prevenir uso de `any`
- **Type Checking**: Verificação de tipos em tempo de compilação

#### Comandos de Verificação

```bash
# Backend
cd backend
bun run type-check    # Verificar tipos
bun run lint          # Verificar código
bun run lint:fix      # Corrigir problemas automaticamente

# Frontend
cd frontend
bun run type-check    # Verificar tipos
bun run lint          # Verificar código
bun run lint:fix      # Corrigir problemas automaticamente
```

## 🔒 Segurança

- Autenticação JWT com expiração
- Autorização RBAC (Role-Based Access Control)
- Validação de entrada com Zod
- Sanitização de dados
- HTTPS obrigatório em produção
- Secrets Manager para chaves sensíveis

## 📊 Performance

- Cache Redis para consultas frequentes
- Índices otimizados no banco de dados
- Processamento assíncrono com Bull
- Compressão de assets
- Lazy loading de componentes
- Otimização de queries com Prisma

## 🧪 Testes

```bash
# Backend
cd backend && bun test

# Frontend
cd frontend && npm test
```

## 🚀 Deploy em Produção

1. Configure variáveis de ambiente de produção
2. Configure certificados SSL
3. Configure secrets manager
4. Execute: `docker-compose -f docker-compose.prod.yml up -d`

## 📈 Monitoramento

- Logs estruturados
- Métricas de performance
- Health checks
- Alertas de erro

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

**Desenvolvido com ❤️ por LChampz**
