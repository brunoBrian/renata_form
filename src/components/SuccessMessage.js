import React from 'react';

const SuccessMessage = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto h-[500px] flex flex-col justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Oferta Criada com Sucesso!</h2>
        <p className="text-gray-600 text-sm">
          Em instantes, você receberá o link da sua proposta pelo WhatsApp!
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;