import React from 'react';

const SuccessMessage = () => {
  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Oferta Criada com Sucesso!</h2>
      <p className="text-gray-600">
        Você receberá o link da sua proposta pelo WhatsApp.
      </p>
      <div className="bg-stripe-gray p-4 rounded-md">
        <p className="text-lg text-green-600">Parabéns! Sua solicitação foi enviada.</p>
      </div>
    </div>
  );
};

export default SuccessMessage;
