# Script de inicialização do sistema
#!/bin/bash

echo "🚀 Iniciando Sistema de Rifas Rifaz..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não encontrado. Instale o docker-compose primeiro."
    exit 1
fi

# Verificar se Bun está instalado
if ! command -v bun &> /dev/null; then
    echo "❌ Bun não encontrado. Instale o Bun primeiro: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "📦 Instalando dependências com Bun..."
bun install

echo "📦 Construindo containers..."
docker-compose build

echo "🗄️ Iniciando banco de dados..."
docker-compose up -d postgres redis

echo "⏳ Aguardando banco de dados inicializar..."
sleep 10

echo "🔧 Executando migrações do banco de dados..."
docker-compose exec backend bun run db:push

echo "🚀 Iniciando todos os serviços..."
docker-compose up -d

echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Swagger Docs: http://localhost:3001/swagger"
echo "🗄️ PostgreSQL: localhost:5432"
echo "📦 Redis: localhost:6379"
echo ""
echo "Para parar o sistema: docker-compose down"
echo "Para ver logs: docker-compose logs -f"
echo "Para desenvolvimento: bun run dev"
