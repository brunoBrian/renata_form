import React from 'react';

const ErrorStep = ({ error, onBack }) => {
  const { message } = error || { message: 'Erro desconhecido' };

  const normalizedMessage = message
    ? message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : '';

  const renderErrorContent = () => {
    if (normalizedMessage.includes('cpf ja possui uma proposta em andamento')) {
      return (
        <>
          <p className="text-red-500 font-medium text-sm">
            Você já tem uma proposta em andamento no Juca.
          </p>
          <p className="text-gray-600 text-sm">
            Entre em contato pelo WhatsApp: 11 5199-4338. Vamos ajudar! :)
          </p>
          <button
            onClick={() => onBack('1')}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            OK
          </button>
        </>
      );
    }

    if (normalizedMessage.includes('cliente nao esta com adesao ao saque-aniversario')) {
      return (
        <>
          <p className="text-red-500 font-medium text-sm">
            Você não aderiu ao Saque Aniversário! Altere no app do FGTS.
          </p>
          <p className="text-gray-600 text-sm">
            Após alterar para Saque Aniversário, tente novamente!
          </p>
          <button
            onClick={() => onBack('1')}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            OK
          </button>
        </>
      );
    }

    if (normalizedMessage.includes('cliente nao tem saldo suficiente')) {
      return (
        <>
          <p className="text-red-500 font-medium text-sm">
            Você não tem saldo para Antecipação...
          </p>
          <p className="text-gray-600 text-sm">
            A partir do próximo dia 20, podemos tentar novamente!
          </p>
          <button
            onClick={() => onBack('1')}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            OK
          </button>
        </>
      );
    }

    if (normalizedMessage.includes('cliente nao autorizou consultar saldo')) {
      return (
        <>
          <p className="text-red-500 font-medium text-sm">
            Você não autorizou a consulta no app do FGTS.
          </p>
          <p className="text-gray-600 text-sm">
            Acesse o app do FGTS e autorize a consulta do banco BMP.
          </p>
          <button
            onClick={() => onBack('2')}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Tentar novamente
          </button>
        </>
      );
    }

    if (normalizedMessage.includes('ops, tivemos um erro na hora de subir sua proposta')) {
      return (
        <>
          <p className="text-red-500 font-medium text-sm">
            Erro ao subir sua proposta.
          </p>
          <p className="text-gray-600 text-sm">
            Vamos continuar tentando e avisaremos por WhatsApp!
          </p>
          <button
            onClick={() => onBack('1')}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            OK
          </button>
        </>
      );
    }

    return (
      <>
        <p className="text-red-500 font-medium text-sm">
          A Caixa (FGTS) está fora do ar no momento...
        </p>
        <p className="text-gray-600 text-sm">
          Tente novamente!
        </p>
        <button
          onClick={() => onBack('1')}
          className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
        >
          OK
        </button>
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto h-[500px] flex flex-col justify-center">
      <div className="step-container space-y-4 text-center">
        <h2 className="text-lg font-bold text-gray-800">Erro na Consulta</h2>
        {renderErrorContent()}
      </div>
    </div>
  );
};

export default ErrorStep;