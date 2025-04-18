// src/components/LoanForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputMask from 'react-input-mask';
import SuccessMessage from './SuccessMessage';

/* ---- de‑para UF → Estado ---- */
const ufToEstado = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

const LoanForm = () => {
  const [step, setStep] = useState(1);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState('');
  const [uuid, setUuid] = useState('');

  const [formData, setFormData] = useState({
    cpf: '',
    dataNascimento: '',
    celular: '',
    nomeCompleto: '',
    cep: '',
    rua: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero: '',
    agencia: '',
    conta: '',
    tipoConta: 'Checking',
    banco: '',
  });

  /* debug – mostra passo atual no console */
  useEffect(() => console.log('step', step), [step]);

  /* ---- handlers ---- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'numero' ? value.replace(/\D/g, '') : value,
    });
  };

  /* ---- passo 1 ---- */
  const validateStep1 = () => {
    const cpfRx = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const dateRx = /^\d{2}\/\d{2}\/\d{4}$/;
    const phoneRx = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
    if (!cpfRx.test(formData.cpf)) return 'CPF inválido';
    if (!dateRx.test(formData.dataNascimento)) return 'Data inválida';
    if (!phoneRx.test(formData.celular)) return 'Celular inválido';
    return '';
  };

  const submitStep1 = (e) => {
    e.preventDefault();
    const msg = validateStep1();
    if (msg) { setError(msg); return; }
    setError('');
    setStep(2);
  };

  /* ---- passo 2 ---- */
  const submitStep2 = () => setStep(3);

  /* ---- passo 3 ---- */
  const submitStep3 = async () => {
    try {
      const { data } = await axios.post(
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
        },
        { headers: { 'x-api-key': 'Cq43wFdJm83I80lixDcTA1POVr9elPuPaqkfc7bf' } }
      );
      if (data.HasError) { setError('Erro na consulta'); return; }
      setApiResponse(data);
      setUuid(data.uuid);
      setError('');
      setStep(4);
    } catch { setError('Falha na conexão'); }
  };

  /* ---- passo 4 ---- */
  const submitStep4 = async (e) => {
    e.preventDefault();
    if (!formData.nomeCompleto || !formData.cep) {
      setError('Preencha todos os campos');
      return;
    }
    try {
      const cep = formData.cep.replace(/\D/g, '');
      const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      setFormData({
        ...formData,
        rua:    data?.logradouro || '',
        bairro: data?.bairro     || '',
        cidade: data?.localidade || '',
        uf:     data?.uf         || '',
        numero: '',
      });
      setError('');
      setStep(5);
    } catch { setError('Erro ao consultar CEP'); }
  };

  /* ---- passo 5 ---- */
  const submitStep5 = (e) => {
    e.preventDefault();
    if (!formData.numero) { setError('Digite o número'); return; }
    setError('');
    setStep(6);
  };

  /* ---- passo 6 ---- */
  const submitStep6 = async (e) => {
    e.preventDefault();
    if (!formData.agencia || !formData.conta || !formData.banco) {
      setError('Preencha todos os campos bancários');
      return;
    }
    try {
      const { data } = await axios.post(
        'https://api.vemprojuca.com/util/internal/fgts/proposta/criar',
        {
          uuid: uuid,
          parcelas: '10',
          nomecompleto: formData.nomeCompleto,
          cep: formData.cep,
          endereconumero: formData.numero,
          uf: formData.uf,
          cidade: formData.cidade,
          bairro: formData.bairro,
          rua: formData.rua,
          agencia: formData.agencia,
          conta: formData.conta,
          tipoconta: formData.tipoConta,
          banco: formData.banco,
        },
        { headers: { 'x-api-key': 'Cq43wFdJm83I80lixDcTA1POVr9elPuPaqkfc7bf' } }
      );
      if (data.status === 'Success') { setStep(7); setError(''); }
      else { setError('Erro ao criar oferta'); }
    } catch { setError('Falha na conexão'); }
  };

  /* ---- UI ---- */
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">

      {/* passo 1 */}
      {step === 1 && (
        <form onSubmit={submitStep1} className="space-y-4">
          <h2 className="text-2xl font-bold">Dados pessoais</h2>
          {error && <p className="text-red-500">{error}</p>}
          <InputMask mask="999.999.999-99" name="cpf" value={formData.cpf}
            onChange={handleInputChange} placeholder="CPF" className="input" />
          <InputMask mask="99/99/9999" name="dataNascimento" value={formData.dataNascimento}
            onChange={handleInputChange} placeholder="Data de nascimento" className="input" />
          <InputMask mask="(99) 99999-9999" name="celular" value={formData.celular}
            onChange={handleInputChange} placeholder="Celular" className="input" />
          <button type="submit" className="btn">Enviar</button>
        </form>
      )}

      {/* passo 2 */}
      {step === 2 && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Autorize no app FGTS</h2>
          <img src="/placeholder.png" alt="FGTS" className="mx-auto" />
          <button onClick={submitStep2} className="btn">Quando autorizar, clique em OK</button>
        </div>
      )}

      {/* passo 3 */}
      {step === 3 && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Confirme a autorização</h2>
          {error && <p className="text-red-500">{error}</p>}
          <button onClick={submitStep3} className="btn">OK</button>
        </div>
      )}

      {/* passo 4 */}
      {step === 4 && apiResponse && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Simulação</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p>Valor Liberado: R$ {apiResponse.Simulacao.VlrLiberado.toFixed(2)}</p>
            <p>Valor da Operação: R$ {apiResponse.Simulacao.VlrOperacao.toFixed(2)}</p>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={submitStep4} className="space-y-4">
            <input name="nomeCompleto" value={formData.nomeCompleto}
              onChange={handleInputChange} placeholder="Nome completo" className="input" />
            <InputMask mask="99999-999" name="cep" value={formData.cep}
              onChange={handleInputChange} placeholder="CEP" className="input" />
            <button type="submit" className="btn">Seguir</button>
          </form>
        </div>
      )}

      {/* passo 5 */}
      {step === 5 && (
        <form onSubmit={submitStep5} className="space-y-4">
          <h2 className="text-2xl font-bold">Confirme seu endereço</h2>
          {error && <p className="text-red-500">{error}</p>}
          <InputMask mask="99999-999" value={formData.cep} disabled className="input bg-gray-100" />
          <input name="cidade" value={formData.cidade} onChange={handleInputChange}
            placeholder="Cidade" className="input" />
          <input value={ufToEstado[formData.uf] || ''} disabled className="input bg-gray-100" />
          <input name="bairro" value={formData.bairro} onChange={handleInputChange}
            placeholder="Bairro" className="input" />
          <input name="rua" value={formData.rua} onChange={handleInputChange}
            placeholder="Rua" className="input" />
          <input name="numero" value={formData.numero} onChange={handleInputChange}
            placeholder="Número" className="input" inputMode="numeric" pattern="\d*" />
          <button type="submit" className="btn">Seguir</button>
        </form>
      )}

      {/* passo 6 */}
      {step === 6 && (
        <form onSubmit={submitStep6} className="space-y-4">
          <h2 className="text-2xl font-bold">Dados bancários</h2>
          {error && <p className="text-red-500">{error}</p>}
          <input name="banco" value={formData.banco} onChange={handleInputChange}
            placeholder="Banco" className="input" />
          <input name="agencia" value={formData.agencia} onChange={handleInputChange}
            placeholder="Agência" className="input" />
          <input name="conta" value={formData.conta} onChange={handleInputChange}
            placeholder="Conta" className="input" />
          <select name="tipoConta" value={formData.tipoConta} onChange={handleInputChange}
            className="input">
            <option value="Checking">Conta Corrente</option>
            <option value="Savings">Conta Salário</option>
          </select>
          <button type="submit" className="btn">Enviar Proposta</button>
        </form>
      )}

      {/* passo 7 */}
      {step === 7 && <SuccessMessage />}
    </div>
  );
};

export default LoanForm;
