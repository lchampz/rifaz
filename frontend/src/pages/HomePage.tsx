import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Raffle, RafflesResponse } from '../types';

const HomePage: React.FC = () => {
  const { data: rafflesData, isLoading, error } = useQuery<RafflesResponse>({
    queryKey: ['raffles'],
    queryFn: () => api.get('/raffles').then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar rifas</p>
      </div>
    );
  }

  const raffles: Raffle[] = rafflesData?.raffles || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Rifas Online de Alto Desempenho
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Participe de rifas seguras e transparentes. Sistema auditável com sorteios justos e pagamentos via PIX.
        </p>
      </div>

      {/* Rifas Grid */}
      {raffles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma rifa disponível no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {raffles.map((raffle) => (
            <RaffleCard key={raffle.id} raffle={raffle} />
          ))}
        </div>
      )}
    </div>
  );
};

const RaffleCard: React.FC<{ raffle: Raffle }> = ({ raffle }) => {
  const getStatusBadge = (status: Raffle['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge-active">Ativa</span>;
      case 'PENDING_DRAW':
        return <span className="badge-pending">Aguardando Sorteio</span>;
      case 'FINISHED':
        return <span className="badge-finished">Finalizada</span>;
      case 'CANCELED':
        return <span className="badge-canceled">Cancelada</span>;
      default:
        return <span className="badge-draft">Rascunho</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      {/* Imagem da Rifa */}
      {raffle.imageUrl && (
        <div className="mb-4">
          <img
            src={raffle.imageUrl}
            alt={raffle.titulo}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Status */}
      <div className="flex justify-between items-center mb-3">
        {getStatusBadge(raffle.status)}
        <span className="text-sm text-gray-500">
          {raffle.soldTickets}/{raffle.totalNumeros} números
        </span>
      </div>

      {/* Título */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
        {raffle.titulo}
      </h3>

      {/* Descrição */}
      {raffle.descricao && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {raffle.descricao}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso</span>
          <span>{raffle.progressPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${raffle.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Valor por número:</span>
          <span className="font-semibold text-success-600">
            {formatCurrency(raffle.valorUnitario)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sorteio:</span>
          <span className="font-medium">{formatDate(raffle.dataSorteio)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Criador:</span>
          <span className="font-medium">{raffle.creator.name}</span>
        </div>
      </div>

      {/* Botão de Ação */}
      <Link
        to={`/raffle/${raffle.id}`}
        className="btn-primary w-full text-center block"
      >
        {raffle.status === 'ACTIVE' ? 'Participar' : 'Ver Detalhes'}
      </Link>
    </div>
  );
};

export default HomePage;
