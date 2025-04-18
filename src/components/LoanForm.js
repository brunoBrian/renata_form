import React, { useState } from 'react';
import axios from 'axios';
import InputMask from 'react-input-mask';
import SuccessMessage from './SuccessMessage';

const LoanForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cpf: '',
    dataNascimento: '',
    celular: '',
    nomeCompleto: '',
    cep: '',
    agencia: '',
    conta: '',
    tipoConta: 'Checking',
    banco: '',
  });
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState('');
  const [uuid, setUuid] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateStep1 = () => {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const phoneRegex = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
    if (!cpfRegex.test(formData.cpf)) {
      setError('CPF inválido');
      return false;
    }
    if (!dateRegex.test(formData.dataNascimento)) {
      setError('Data de nascimento inválida (use DD/MM/AAAA)');
      return false;
    }
    if (!phoneRegex.test(formData.celular)) {
      setError('Celular inválido (use (XX) 9XXXX-XXXX)');
      return false;
    }
    setError('');
    return true;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleFgtsAuthorization = () => {
    setStep(3);
    handleOkAfterAuthorization();
  };

  const handleOkAfterAuthorization = async () => {
    try {
      const response = await axios.post(
        'https://api.vemprojuca.com/util/internal/fgts/contato',
        {
          cpf: formData.cpf.replace(/\D/g, ''),
          celular: formData.celular.replace(/\D/g, ''),
          id_collaborator: '1',
          id_store: '1',
          datanascimento: formData.dataNascimento,
          acceptMessage: true,
          acceptTerms: true,
          host: window.location.origin,
          origin: '',
          tac_juca: '',
        },
        {
          headers: {
            'x-api-key': 'Cq43wFdJm83I80lixDcTA1POVr9elPuPaqkfc7bf',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.HasError) {
        setError('Erro na consulta. Tente novamente.');
        return;
      }

      setApiResponse(response.data);
      setUuid(response.data.uuid);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    if (!formData.nomeCompleto || !formData.cep) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      const cepResponse = await axios.get(`https://viacep.com.br/ws/${formData.cep}/json/`);
      if (cepResponse.data.erro) {
        setError('CEP inválido');
        return;
      }

      setFormData({
        ...formData,
        rua: cepResponse.data.logradouro,
        bairro: cepResponse.data.bairro,
        cidade: cepResponse.data.localidade,
        uf: cepResponse.data.uf,
      });

      setStep(5);
    } catch (err) {
      setError('Erro ao consultar o CEP. Tente novamente.');
    }
  };

  const handleStep5Submit = async (e) => {
    e.preventDefault();
    if (!formData.agencia || !formData.conta || !formData.banco) {
      setError('Preencha todos os campos bancários');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.vemprojuca.com/util/internal/fgts/proposta/criar',
        {
          uuid: uuid,
          parcelas: '10',
          nomecompleto: formData.nomeCompleto,
          cep: formData.cep,
          endereconumero: '5000',
          uf: formData.uf,
          cidade: formData.cidade,
          enderecocomplemento: '',
          bairro: formData.bairro,
          rua: formData.rua,
          agencia: formData.agencia,
          conta: formData.conta,
          tipoconta: formData.tipoConta,
          banco: formData.banco,
        },
        {
          headers: {
            'x-api-key': 'Cq43wFdJm83I80lixDcTA1POVr9elPuPaqkfc7bf',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'Success') {
        setStep(6);
      } else {
        setError('Erro ao criar oferta. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6">
    <div className="text-center mb-4">
        <h3 className="text-xl font-medium text-gray-700 leading-tight">Simule rápido a sua</h3>
        <h2 className="text-2xl font-bold text-gray-800 leading-snug mt-1">Antecipação de Saque Aniversário FGTS</h2>
    </div>


          {error && <p className="text-red-500">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <InputMask
              mask="999.999.999-99"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="123.456.789-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
            <InputMask
              mask="99/99/9999"
              name="dataNascimento"
              value={formData.dataNascimento}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Celular</label>
            <InputMask
              mask="(99) 99999-9999"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="(XX) 9XXXX-XXXX"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Enviar
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Autorize a Consulta</h2>
          <p className="text-gray-600">
            Por favor, autorize a consulta do banco BMP no seu aplicativo do FGTS.
          </p>
          <img
            src="/placeholder.png"
            alt="Instruções FGTS"
            className="mx-auto max-w-full h-auto rounded-md"
          />
          <button
            onClick={handleFgtsAuthorization}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Quando autorizar, clique em OK
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-6 animate-pulse">
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-stripe-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-700">Aguarde, estamos simulando nos sistemas do FGTS...</h2>
        </div>
      )}

      {step === 4 && apiResponse && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Sua Simulação</h2>
          {error && <p className="text-red-500">{error}</p>}
          <div className="bg-stripe-gray p-4 rounded-md">
            <p className="text-lg">
              <span className="font-medium">Valor Liberado:</span> R$ {apiResponse.Simulacao.VlrLiberado.toFixed(2)}
            </p>
            <p className="text-lg">
              <span className="font-medium">Valor da Operação:</span> R$ {apiResponse.Simulacao.VlrOperacao.toFixed(2)}
            </p>
          </div>
          <form onSubmit={handleStep4Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CEP</label>
              <InputMask
                mask="99999-999"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="12345-678"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
            >
              Quero Receber
            </button>
          </form>
        </div>
      )}

      {step === 5 && (
        <form onSubmit={handleStep5Submit} className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Dados Bancários</h2>
          {error && <p className="text-red-500">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Banco</label>
            <input
              type="text"
              name="banco"
              value={formData.banco}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="Ex: Nubank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agência</label>
            <input
              type="text"
              name="agencia"
              value={formData.agencia}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="0001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Conta</label>
            <input
              type="text"
              name="conta"
              value={formData.conta}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="123456-7"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              name="tipoConta"
              value={formData.tipoConta}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
            >
              <option value="Checking">Conta Corrente</option>
              <option value="Savings">Conta Salário</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Enviar Proposta
          </button>
        </form>
      )}

      {step === 6 && <SuccessMessage />}
    </div>
  );
};

export default LoanForm;
