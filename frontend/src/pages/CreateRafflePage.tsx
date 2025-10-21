import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { CreateRaffleRequest } from '../types';

interface CreateRaffleForm {
  titulo: string;
  descricao?: string;
  valorUnitario: number;
  totalNumeros: number;
  dataSorteio: string;
  imageUrl?: string;
}

const CreateRafflePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateRaffleForm>({
    defaultValues: {
      titulo: '',
      descricao: '',
      valorUnitario: 10,
      totalNumeros: 100,
      dataSorteio: '',
      imageUrl: '',
    },
  });

  const createRaffleMutation = useMutation({
    mutationFn: (data: CreateRaffleRequest) =>
      api.post('/raffles', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['raffles'] });
      navigate('/dashboard');
    },
    onError: (error: Error & { response?: { data?: { error: string } } }) => {
      alert(error.response?.data?.error || 'Erro ao criar rifa');
    },
  });

  const onSubmit = async (data: CreateRaffleForm) => {
    setIsSubmitting(true);
    try {
      await createRaffleMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedValues = watch();

  const calculateTotalValue = (): number => {
    return watchedValues.valorUnitario * watchedValues.totalNumeros;
  };

  const calculateServiceFee = (): number => {
    return calculateTotalValue() * 0.05; // 5%
  };

  const calculateGatewayFee = (): number => {
    return calculateTotalValue() * 0.01; // 1%
  };

  const calculateNetValue = (): number => {
    return (
      calculateTotalValue() - calculateServiceFee() - calculateGatewayFee()
    );
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0] || '';
  };

  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split('T')[0] || '';
  };

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Criar Nova Rifa</h1>
        <p className='text-gray-600 mt-2'>
          Preencha os dados abaixo para criar sua rifa
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Formulário */}
        <div className='lg:col-span-2'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Informações Básicas */}
            <div className='card'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Informações Básicas
              </h2>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Título da Rifa *
                  </label>
                  <input
                    type='text'
                    {...register('titulo', {
                      required: 'Título é obrigatório',
                      minLength: {
                        value: 3,
                        message: 'Título deve ter pelo menos 3 caracteres',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Título deve ter no máximo 100 caracteres',
                      },
                    })}
                    className='input'
                    placeholder='Ex: iPhone 15 Pro Max'
                  />
                  {errors.titulo && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.titulo.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Descrição
                  </label>
                  <textarea
                    {...register('descricao')}
                    rows={4}
                    className='input'
                    placeholder='Descreva o prêmio da sua rifa...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    URL da Imagem
                  </label>
                  <input
                    type='url'
                    {...register('imageUrl', {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'URL deve começar com http:// ou https://',
                      },
                    })}
                    className='input'
                    placeholder='https://exemplo.com/imagem.jpg'
                  />
                  {errors.imageUrl && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.imageUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Configurações da Rifa */}
            <div className='card'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Configurações da Rifa
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Valor por Número (R$) *
                  </label>
                  <input
                    type='number'
                    min='1'
                    step='0.01'
                    {...register('valorUnitario', {
                      required: 'Valor é obrigatório',
                      min: {
                        value: 1,
                        message: 'Valor deve ser pelo menos R$ 1,00',
                      },
                    })}
                    className='input'
                    placeholder='10.00'
                  />
                  {errors.valorUnitario && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.valorUnitario.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Total de Números *
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='10000'
                    {...register('totalNumeros', {
                      required: 'Total de números é obrigatório',
                      min: {
                        value: 1,
                        message: 'Deve ter pelo menos 1 número',
                      },
                      max: {
                        value: 10000,
                        message: 'Máximo de 10.000 números',
                      },
                    })}
                    className='input'
                    placeholder='100'
                  />
                  {errors.totalNumeros && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.totalNumeros.message}
                    </p>
                  )}
                </div>
              </div>

              <div className='mt-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Data do Sorteio *
                </label>
                <input
                  type='date'
                  min={getMinDate()}
                  max={getMaxDate()}
                  {...register('dataSorteio', {
                    required: 'Data do sorteio é obrigatória',
                  })}
                  className='input'
                />
                {errors.dataSorteio && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.dataSorteio.message}
                  </p>
                )}
                <p className='mt-1 text-sm text-gray-500'>
                  Data deve ser entre amanhã e 90 dias no futuro
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className='flex space-x-4'>
              <button
                type='button'
                onClick={() => navigate('/dashboard')}
                className='btn-secondary flex-1'
              >
                Cancelar
              </button>
              <button
                type='submit'
                disabled={isSubmitting || createRaffleMutation.isPending}
                className='btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting || createRaffleMutation.isPending
                  ? 'Criando...'
                  : 'Criar Rifa'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumo */}
        <div className='lg:col-span-1'>
          <div className='card sticky top-8'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Resumo da Rifa
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Valor por Número
                </label>
                <p className='text-lg font-semibold text-gray-900'>
                  {formatCurrency(watchedValues.valorUnitario || 0)}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Total de Números
                </label>
                <p className='text-lg font-semibold text-gray-900'>
                  {watchedValues.totalNumeros || 0}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Valor Total
                </label>
                <p className='text-lg font-semibold text-gray-900'>
                  {formatCurrency(calculateTotalValue())}
                </p>
              </div>

              <hr className='my-4' />

              <div className='space-y-2 text-sm'>
                <div className='flex justify-between text-gray-600'>
                  <span>Taxa de Serviço (5%):</span>
                  <span>-{formatCurrency(calculateServiceFee())}</span>
                </div>
                <div className='flex justify-between text-gray-600'>
                  <span>Taxa Gateway (1%):</span>
                  <span>-{formatCurrency(calculateGatewayFee())}</span>
                </div>
                <hr className='my-2' />
                <div className='flex justify-between text-lg font-bold'>
                  <span>Valor Líquido:</span>
                  <span className='text-success-600'>
                    {formatCurrency(calculateNetValue())}
                  </span>
                </div>
              </div>

              <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>💡 Dicas</h4>
                <ul className='text-sm text-blue-800 space-y-1'>
                  <li>• Escolha um título atrativo</li>
                  <li>• Adicione uma imagem de qualidade</li>
                  <li>• Defina um valor acessível</li>
                  <li>• Programe o sorteio com antecedência</li>
                </ul>
              </div>

              <div className='mt-4 p-4 bg-yellow-50 rounded-lg'>
                <h4 className='font-medium text-yellow-900 mb-2'>
                  ⚠️ Importante
                </h4>
                <ul className='text-sm text-yellow-800 space-y-1'>
                  <li>• A rifa será criada como rascunho</li>
                  <li>• Você poderá editá-la antes de ativar</li>
                  <li>• Após ativar, não será possível editar</li>
                  <li>• Taxas serão descontadas automaticamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRafflePage;
