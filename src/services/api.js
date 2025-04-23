import axios from 'axios';

const BASE_URL = 'https://n8nio.vemprojuca.com';

/**
 * Envia dados de contato para autorização FGTS
 * @param {{ cpf: string, celular: string, dataNascimento: string }} params
 */
export async function authorizeContact({ cpf, celular, dataNascimento }) {
  const { data } = await axios.post(
    `${BASE_URL}/webhook/simulate`,
    {
      cpf: cpf.replace(/\D/g, ''),
      celular: celular.replace(/\D/g, ''),
      id_collaborator: '1',
      id_store: '1',
      datanascimento: dataNascimento,
      acceptMessage: true,
      acceptTerms: true,
      host: window.vemprojucaConfig?.host || 'example.com',
      userAgent: window.vemprojucaConfig?.userAgent || 'Mozilla/5.0',
      cid: window.vemprojucaConfig?.cid || '123456789',
      sid: window.vemprojucaConfig?.sid || '987654321',
      fbp: window.vemprojucaConfig?.fbp || 'fb.1.123456789012345',
      partner_id: window.vemprojucaConfig?.partner_id || 'partner_001'
    }
  );
  return data;
}

/**
 * Busca endereço pelo CEP
 * @param {string} cepUnmasked
 */
export async function getAddressByCep(cepUnmasked) {
  const { data } = await axios.get(
    `https://viacep.com.br/ws/${cepUnmasked}/json/`
  );
  return data;
}

/**
 * Cria uma proposta de antecipação FGTS
 * @param {Object} params - Dados da proposta
 */
export async function createProposal({
  uuid,
  parcelas,
  nomeCompleto,
  cep,
  numero,
  uf,
  cidade,
  bairro,
  rua,
  agencia,
  conta,
  digito,
  tipoConta,
  banco,
}) {
  const { data } = await axios.post(
    `${BASE_URL}/webhook/proposal`,
    {
      uuid,
      parcelas,
      nomecompleto: nomeCompleto,
      cep,
      endereconumero: numero,
      uf,
      cidade,
      enderecocomplemento: '',
      bairro,
      rua,
      agencia,
      conta: `${conta}-${digito}`,
      tipoconta: tipoConta,
      banco,
    }
  );
  return data;
}

/**
 * Simula uma proposta com nova quantidade de parcelas
 * @param {{ uuid: string, parcelas: string | number }} params
 */
export async function simulateProposal({ uuid, parcelas }) {
  const { data } = await axios.post(
    `${BASE_URL}/webhook/parcelas`,
    {
      uuid,
      parcelas: parseInt(parcelas),
    }
  );
  return data;
}