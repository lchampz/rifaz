import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type {
  PaymentModalProps,
  Raffle,
  ReserveTicketsRequest,
  ReserveTicketsResponse,
} from '../types';

const RaffleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const {
    data: raffle,
    isLoading,
    error,
  } = useQuery<Raffle>({
    queryKey: ['raffle', id],
    queryFn: () => api.get(`/raffles/${id}`).then(res => res.data),
    enabled: !!id,
  });

  const reserveMutation = useMutation<
    ReserveTicketsResponse,
    Error,
    ReserveTicketsRequest
  >({
    mutationFn: (data: ReserveTicketsRequest) =>
      api.post('/payments/reserve', data).then(res => res.data),
    onSuccess: () => {
      setShowPaymentModal(true);
      queryClient.invalidateQueries({ queryKey: ['raffle', id] });
    },
    onError: (error: Error & { response?: { data?: { error: string } } }) => {
      alert(error.response?.data?.error || 'Erro ao reservar números');
    },
  });

  // Timer para reserva
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [timeLeft]);

  const handleNumberSelect = (number: number) => {
    if (raffle?.status !== 'ACTIVE') return;

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else if (prev.length < 10) {
        return [...prev, number];
      }
      return prev;
    });
  };

  const handleReserve = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (selectedNumbers.length === 0) {
      alert('Selecione pelo menos um número');
      return;
    }

    reserveMutation.mutate({
      raffleId: id!,
      numbers: selectedNumbers,
    });
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

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>Rifa não encontrada</p>
      </div>
    );
  }

  const raffleData = raffle;
  const totalAmount = raffleData.valorUnitario * selectedNumbers.length;
  const serviceFee = totalAmount * 0.05;
  const gatewayFee = totalAmount * 0.01;
  const finalAmount = totalAmount + serviceFee + gatewayFee;

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Header da Rifa */}
      <div className='card mb-8'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Imagem */}
          {raffleData.imageUrl && (
            <div className='md:w-1/3'>
              <img
                src={raffleData.imageUrl}
                alt={raffleData.titulo}
                className='w-full h-64 md:h-full object-cover rounded-lg'
              />
            </div>
          )}

          {/* Informações */}
          <div className='flex-1'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              {raffleData.titulo}
            </h1>

            {raffleData.descricao && (
              <p className='text-gray-600 mb-6'>{raffleData.descricao}</p>
            )}

            {/* Status e Progresso */}
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-lg font-semibold'>
                  Progresso da Venda
                </span>
                <span className='text-sm text-gray-600'>
                  {raffleData.soldTickets}/{raffleData.totalNumeros} números
                  vendidos
                </span>
              </div>

              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{ width: `${raffleData.progressPercentage}%` }}
                ></div>
              </div>

              <div className='text-center text-sm text-gray-600'>
                {raffleData.progressPercentage}% vendido
              </div>
            </div>

            {/* Informações da Rifa */}
            <div className='grid grid-cols-2 gap-4 mt-6'>
              <div>
                <span className='text-gray-600'>Valor por número:</span>
                <div className='text-xl font-bold text-success-600'>
                  {formatCurrency(raffleData.valorUnitario)}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>Data do sorteio:</span>
                <div className='font-semibold'>
                  {formatDate(raffleData.dataSorteio)}
                </div>
              </div>
              <div>
                <span className='text-gray-600'>Criador:</span>
                <div className='font-semibold'>{raffleData.creator.name}</div>
              </div>
              <div>
                <span className='text-gray-600'>Números disponíveis:</span>
                <div className='font-semibold'>
                  {raffleData.availableNumbers}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado do Sorteio */}
      {raffleData.status === 'FINISHED' && raffleData.winningNumber && (
        <div className='card mb-8 bg-success-50 border-success-200'>
          <h2 className='text-2xl font-bold text-success-800 mb-4'>
            🎉 Resultado do Sorteio
          </h2>
          <div className='text-center'>
            <div className='text-6xl font-bold text-success-600 mb-4'>
              {raffleData.winningNumber}
            </div>
            <p className='text-success-700 text-lg'>Parabéns ao ganhador!</p>
            {raffleData.drawingHash && (
              <p className='text-sm text-success-600 mt-2'>
                Hash de auditoria: {raffleData.drawingHash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Seleção de Números */}
      {raffleData.status === 'ACTIVE' && (
        <div className='card mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Selecione seus números
          </h2>

          {/* Grid de Números */}
          <div className='number-grid mb-6'>
            {Array.from(
              { length: raffleData.totalNumeros },
              (_, i) => i + 1
            ).map(number => {
              const isSold =
                raffleData.soldTickets > 0 && raffleData.soldTickets >= number; // Simulação simplificada
              const isSelected = selectedNumbers.includes(number);

              return (
                <button
                  key={number}
                  onClick={() => handleNumberSelect(number)}
                  disabled={isSold}
                  className={`number-button ${
                    isSelected ? 'selected' : ''
                  } ${isSold ? 'sold' : ''}`}
                >
                  {number}
                </button>
              );
            })}
          </div>

          {/* Resumo da Compra */}
          {selectedNumbers.length > 0 && (
            <div className='bg-gray-50 rounded-lg p-6 mb-6'>
              <h3 className='text-lg font-semibold mb-4'>Resumo da Compra</h3>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Números selecionados:</span>
                  <span className='font-medium'>
                    {selectedNumbers.sort((a, b) => a - b).join(', ')}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Quantidade:</span>
                  <span className='font-medium'>{selectedNumbers.length}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Valor dos números:</span>
                  <span className='font-medium'>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className='flex justify-between text-sm text-gray-600'>
                  <span>Taxa de serviço (5%):</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className='flex justify-between text-sm text-gray-600'>
                  <span>Taxa do gateway (1%):</span>
                  <span>{formatCurrency(gatewayFee)}</span>
                </div>
                <hr className='my-2' />
                <div className='flex justify-between text-lg font-bold'>
                  <span>Total:</span>
                  <span className='text-success-600'>
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Reserva */}
          <button
            onClick={handleReserve}
            disabled={selectedNumbers.length === 0 || reserveMutation.isPending}
            className='btn-success w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {reserveMutation.isPending ? 'Processando...' : 'Reservar e Pagar'}
          </button>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          selectedNumbers={selectedNumbers}
          totalAmount={finalAmount}
        />
      )}
    </div>
  );
};

// Componente do Modal de Pagamento
const PaymentModal: React.FC<PaymentModalProps> = ({
  onClose,
  selectedNumbers,
  totalAmount,
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-8 max-w-md w-full mx-4'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          Pagamento via PIX
        </h2>

        {/* Timer */}
        <div className='text-center mb-6'>
          <div className='timer mb-2'>{formatTime(timeLeft)}</div>
          <p className='text-sm text-gray-600'>Tempo restante para pagamento</p>
        </div>

        {/* QR Code */}
        <div className='text-center mb-6'>
          <div className='bg-gray-100 rounded-lg p-4 mb-4'>
            <div className='w-48 h-48 bg-white rounded mx-auto flex items-center justify-center'>
              <span className='text-gray-400'>QR Code PIX</span>
            </div>
          </div>
          <button className='btn-secondary'>Copiar Chave PIX</button>
        </div>

        {/* Resumo */}
        <div className='bg-gray-50 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold mb-2'>Resumo da Compra</h3>
          <div className='space-y-1 text-sm'>
            <div className='flex justify-between'>
              <span>Números:</span>
              <span>{selectedNumbers.sort((a, b) => a - b).join(', ')}</span>
            </div>
            <div className='flex justify-between font-bold'>
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className='flex space-x-4'>
          <button onClick={onClose} className='btn-secondary flex-1'>
            Cancelar
          </button>
          <button className='btn-success flex-1'>Já Paguei</button>
        </div>
      </div>
    </div>
  );
};

export default RaffleDetailPage;
