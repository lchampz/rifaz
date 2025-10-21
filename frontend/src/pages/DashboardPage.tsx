import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { api } from '../services/api';
import type { DashboardMetrics, RaffleWithStats } from '../types';

const DashboardPage: React.FC = () => {
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<{
    metrics: DashboardMetrics;
    raffles: RaffleWithStats[];
  }>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/raffles/dashboard').then(res => res.data),
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>Erro ao carregar dashboard</p>
      </div>
    );
  }

  const { metrics, raffles } = dashboardData;

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-2'>
          Acompanhe o desempenho das suas rifas
        </p>
      </div>

      {/* Métricas */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='card'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-primary-100 text-primary-600'>
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Total de Rifas
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {metrics.totalRaffles}
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-success-100 text-success-600'>
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Rifas Ativas</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {metrics.activeRaffles}
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-warning-100 text-warning-600'>
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Rifas Finalizadas
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {metrics.finishedRaffles}
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-info-100 text-info-600'>
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Receita Total</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        <div className='card'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Resumo Financeiro
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Receita Bruta:</span>
              <span className='font-medium'>
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>Taxa de Serviço:</span>
              <span>-{formatCurrency(metrics.totalServiceFees)}</span>
            </div>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>Taxa Gateway:</span>
              <span>-{formatCurrency(metrics.totalGatewayFees)}</span>
            </div>
            <hr className='my-2' />
            <div className='flex justify-between text-lg font-bold'>
              <span>Lucro Líquido:</span>
              <span className='text-success-600'>
                {formatCurrency(metrics.netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className='card'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Ações Rápidas
          </h3>
          <div className='space-y-3'>
            <button className='btn-primary w-full'>
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Criar Nova Rifa
            </button>
            <button className='btn-secondary w-full'>
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                />
              </svg>
              Minhas Rifas
            </button>
            <button className='btn-secondary w-full'>
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                />
              </svg>
              Meus Tickets
            </button>
          </div>
        </div>

        <div className='card'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Estatísticas
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Taxa de Conversão:</span>
              <span className='font-medium'>
                {metrics.totalRaffles > 0
                  ? Math.round(
                      (metrics.finishedRaffles / metrics.totalRaffles) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Receita Média:</span>
              <span className='font-medium'>
                {formatCurrency(
                  metrics.totalRaffles > 0
                    ? metrics.totalRevenue / metrics.totalRaffles
                    : 0
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Lucro Médio:</span>
              <span className='font-medium'>
                {formatCurrency(
                  metrics.totalRaffles > 0
                    ? metrics.netProfit / metrics.totalRaffles
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Rifas */}
      <div className='card'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>Suas Rifas</h2>
          <button className='btn-primary'>
            <svg
              className='w-5 h-5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
            Nova Rifa
          </button>
        </div>

        {raffles.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              Nenhuma rifa encontrada
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Comece criando sua primeira rifa!
            </p>
            <div className='mt-6'>
              <button className='btn-primary'>
                <svg
                  className='w-5 h-5 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Criar Primeira Rifa
              </button>
            </div>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Rifa
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Progresso
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Receita
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Data Sorteio
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {raffles.map(raffle => (
                  <tr key={raffle.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        {raffle.imageUrl && (
                          <div className='flex-shrink-0 h-10 w-10'>
                            <img
                              className='h-10 w-10 rounded-full object-cover'
                              src={raffle.imageUrl}
                              alt={raffle.titulo}
                            />
                          </div>
                        )}
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {raffle.titulo}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {raffle.soldTickets}/{raffle.totalNumeros} números
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          raffle.status === 'ACTIVE'
                            ? 'bg-success-100 text-success-800'
                            : raffle.status === 'FINISHED'
                              ? 'bg-info-100 text-info-800'
                              : raffle.status === 'DRAFT'
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {raffle.status === 'ACTIVE' && 'Ativa'}
                        {raffle.status === 'FINISHED' && 'Finalizada'}
                        {raffle.status === 'DRAFT' && 'Rascunho'}
                        {raffle.status === 'CANCELED' && 'Cancelada'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='w-16 bg-gray-200 rounded-full h-2 mr-2'>
                          <div
                            className='bg-primary-600 h-2 rounded-full'
                            style={{ width: `${raffle.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-600'>
                          {raffle.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatCurrency(raffle.totalRevenue)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatDate(raffle.dataSorteio)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex space-x-2'>
                        <button className='text-primary-600 hover:text-primary-900'>
                          Ver
                        </button>
                        {raffle.status === 'DRAFT' && (
                          <>
                            <button className='text-warning-600 hover:text-warning-900'>
                              Editar
                            </button>
                            <button className='text-success-600 hover:text-success-900'>
                              Ativar
                            </button>
                          </>
                        )}
                        {raffle.status === 'ACTIVE' && (
                          <button className='text-danger-600 hover:text-danger-900'>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
