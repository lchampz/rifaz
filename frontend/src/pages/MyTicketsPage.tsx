import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { api } from '../services/api';
import type { TicketWithRaffle } from '../types';

const MyTicketsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'PAID' | 'RESERVED' | 'EXPIRED'
  >('ALL');

  const {
    data: tickets,
    isLoading,
    error,
  } = useQuery<TicketWithRaffle[]>({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/payments/my-tickets').then(res => res.data),
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { label: 'Pago', className: 'bg-success-100 text-success-800' },
      RESERVED: {
        label: 'Reservado',
        className: 'bg-warning-100 text-warning-800',
      },
      EXPIRED: {
        label: 'Expirado',
        className: 'bg-danger-100 text-danger-800',
      },
      CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.CANCELLED;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const filteredTickets =
    tickets?.filter(ticket => {
      if (filterStatus === 'ALL') return true;
      return ticket.status === filterStatus;
    }) || [];

  const getStatusCounts = () => {
    if (!tickets) return { ALL: 0, PAID: 0, RESERVED: 0, EXPIRED: 0 };

    return {
      ALL: tickets.length,
      PAID: tickets.filter(t => t.status === 'PAID').length,
      RESERVED: tickets.filter(t => t.status === 'RESERVED').length,
      EXPIRED: tickets.filter(t => t.status === 'EXPIRED').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>Erro ao carregar seus tickets</p>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Meus Tickets</h1>
        <p className='text-gray-600 mt-2'>
          Acompanhe todos os seus tickets de rifas
        </p>
      </div>

      {/* Estatísticas */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
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
                  d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Total</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.ALL}
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
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Pagos</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.PAID}
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
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Reservados</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.RESERVED}
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='p-3 rounded-full bg-danger-100 text-danger-600'>
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
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Expirados</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {statusCounts.EXPIRED}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className='card mb-8'>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({statusCounts.ALL})
          </button>
          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'PAID'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pagos ({statusCounts.PAID})
          </button>
          <button
            onClick={() => setFilterStatus('RESERVED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'RESERVED'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reservados ({statusCounts.RESERVED})
          </button>
          <button
            onClick={() => setFilterStatus('EXPIRED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'EXPIRED'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expirados ({statusCounts.EXPIRED})
          </button>
        </div>
      </div>

      {/* Lista de Tickets */}
      <div className='card'>
        {filteredTickets.length === 0 ? (
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
                d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              Nenhum ticket encontrado
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {filterStatus === 'ALL'
                ? 'Você ainda não possui tickets de rifas.'
                : `Nenhum ticket com status "${filterStatus.toLowerCase()}".`}
            </p>
            <div className='mt-6'>
              <button
                onClick={() => (window.location.href = '/')}
                className='btn-primary'
              >
                Ver Rifas Disponíveis
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
                    Número
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Valor
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Data Compra
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        {ticket.raffle.imageUrl && (
                          <div className='flex-shrink-0 h-10 w-10'>
                            <img
                              className='h-10 w-10 rounded-full object-cover'
                              src={ticket.raffle.imageUrl}
                              alt={ticket.raffle.titulo}
                            />
                          </div>
                        )}
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {ticket.raffle.titulo}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Criado por {ticket.raffle.creator.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-bold text-gray-900 text-center'>
                        {ticket.number.toString().padStart(4, '0')}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatCurrency(ticket.value)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex space-x-2'>
                        <button
                          onClick={() =>
                            (window.location.href = `/raffle/${ticket.raffle.id}`)
                          }
                          className='text-primary-600 hover:text-primary-900'
                        >
                          Ver Rifa
                        </button>
                        {ticket.status === 'PAID' && (
                          <button className='text-success-600 hover:text-success-900'>
                            Download
                          </button>
                        )}
                        {ticket.status === 'RESERVED' && (
                          <button className='text-warning-600 hover:text-warning-900'>
                            Pagar
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

      {/* Resumo Financeiro */}
      {filteredTickets.length > 0 && (
        <div className='mt-8 card'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Resumo Financeiro
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Total Investido</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatCurrency(
                  filteredTickets
                    .filter(t => t.status === 'PAID')
                    .reduce((sum, t) => sum + t.value, 0)
                )}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Tickets Pagos</p>
              <p className='text-2xl font-bold text-success-600'>
                {filteredTickets.filter(t => t.status === 'PAID').length}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Chance de Ganhar</p>
              <p className='text-2xl font-bold text-primary-600'>
                {filteredTickets.length > 0
                  ? `${((filteredTickets.length / 1000) * 100).toFixed(2)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
