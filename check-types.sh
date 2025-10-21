#!/bin/bash

# Script para verificação de tipos e linting
echo "🔍 Verificando tipos e qualidade do código..."

# Verificar backend
echo "📦 Verificando backend..."
cd backend

echo "  - Verificando tipos TypeScript..."
if ! bun run type-check; then
  echo "❌ Erro de tipos no backend"
  exit 1
fi

echo "  - Verificando linting..."
if ! bun run lint; then
  echo "❌ Erro de linting no backend"
  exit 1
fi

echo "✅ Backend verificado com sucesso!"

# Verificar frontend
echo "📦 Verificando frontend..."
cd ../frontend

echo "  - Verificando tipos TypeScript..."
if ! bun run type-check; then
  echo "❌ Erro de tipos no frontend"
  exit 1
fi

echo "  - Verificando linting..."
if ! bun run lint; then
  echo "❌ Erro de linting no frontend"
  exit 1
fi

echo "✅ Frontend verificado com sucesso!"

echo "🎉 Todas as verificações passaram!"
