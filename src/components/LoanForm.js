import ReCAPTCHA from "react-google-recaptcha";

import React, { useRef, useState } from "react";
import InputMask from "react-input-mask";
import SuccessMessage from "./SuccessMessage";
import ErrorStep from "./ErrorStep";
import {
  authorizeContact,
  getAddressByCep,
  createProposal,
  simulateProposal,
} from "../services/api";

const SITE_KEY = "SUA_CHAVE_DO_SITE"; // Troque pela sua chave

/* ========== UF ↔ nome ========== */
const ufToEstado = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};
const ufCodes = Object.keys(ufToEstado);

/* ========== Bancos (label, value API) ========== */
const banks = [
  ["Nubank", "Nubank"],
  ["Caixa Econômica Federal", "Caixa"],
  ["Bradesco", "Bradesco"],
  ["Banco do Brasil", "Banco do Brasil"],
  ["Itaú", "Itaú"],
  ["Santander", "Santander"],
  ["Inter", "Inter"],
  ["C6", "C6"],
  ["Pan", "Pan"],
  ["Bmg", "Bmg"],
  ["Banrisul", "Banrisul"],
  ["Banese", "Banese"],
  ["Banco Real de Brasilia", "Banco Real de Brasilia"],
  ["Sicoob", "Sicoob"],
  ["Banco Banestes", "Banco Banestes"],
  ["Agibank", "Agibank"],
  ["Sicredi", "Sicredi"],
  ["BV", "Banco BV"],
];

/* -------- Funções de Formatação -------- */
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "N/A";
  const number = Number(value);
  if (isNaN(number)) return "N/A";
  const [integerPart, decimalPart] = number.toFixed(2).split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedInteger},${decimalPart}`;
};

const formatPercentage = (value) => {
  if (value === undefined || value === null) return "N/A";
  return Number(value).toFixed(2).replace(".", ",");
};

const LoanForm = () => {
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const [step, setStep] = useState("1");
  const [formData, setFormData] = useState({
    cpf: "",
    dataNascimento: "",
    celular: "",
    nomeCompleto: "",
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    uf: "",
    numero: "",
    agencia: "",
    conta: "",
    digito: "",
    banco: "",
    tipoConta: "Checking",
    parcelas: "10",
  });
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [uuid, setUuid] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDetailsLightboxOpen, setIsDetailsLightboxOpen] = useState(false);
  const [previousSimulation, setPreviousSimulation] = useState(null);

  const isValidCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[10])) return false;
    return true;
  };

  const handleInputChange = ({ target: { name, value } }) => {
    if (name === "numero") value = value.replace(/\D/g, "");
    if (name === "digito") value = value.replace(/\D/g, "").slice(0, 1);
    setFormData({ ...formData, [name]: value });
  };

  const validateStep1 = () => {
    const cpfRx = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const dateRx = /^\d{2}\/\d{2}\/\d{4}$/;
    const phoneRx = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
    if (!cpfRx.test(formData.cpf)) return "CPF inválido (use XXX.XXX.XXX-XX)";
    if (!isValidCPF(formData.cpf)) return "CPF inválido (dígitos incorretos)";
    if (!dateRx.test(formData.dataNascimento))
      return "Data de nascimento inválida (use DD/MM/AAAA)";
    if (!phoneRx.test(formData.celular))
      return "Celular inválido (use (XX) 9XXXX-XXXX)";
    return "";
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();

    const token = await recaptchaRef.current.executeAsync();
    setCaptchaToken(token);

    if (!token) {
      alert("Por favor, confirme que você não é um robô.");
      return;
    }

    const msg = validateStep1();
    if (msg) {
      setError({ message: msg, code: "validation" });
      return;
    }
    setError(null);
    setStep("2");
  };

  const handleFgtsAuthorization = async () => {
    setStep("3");
    try {
      await handleOkAfterAuthorization();
    } catch (error) {
      console.log("Setting error state:", {
        message: error.message,
        code: error.code || "unknown",
      });
      setStep("2.1");
      setError({ message: error.message, code: error.code || "unknown" });
    }
  };

  const handleOkAfterAuthorization = async () => {
    try {
      const data = await authorizeContact({
        cpf: formData.cpf,
        celular: formData.celular,
        dataNascimento: formData.dataNascimento,
      });
      console.log("API Response:", data);

      const responseData =
        Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (responseData.status === "Error") {
        throw Object.assign(
          new Error(
            responseData.message ||
              "Erro na consulta. Verifique CPF, celular ou data de nascimento."
          ),
          {
            code: "api_error",
            uuid: responseData.uuid,
          }
        );
      }

      if (responseData.status === "DuplicatedProposal") {
        throw Object.assign(
          new Error(
            responseData.message ||
              "CPF já possui uma proposta em andamento no Juca! Finalize ou cancele a proposta em andamento antes de fazer outra."
          ),
          {
            code: "duplicated_proposal",
            uuid: responseData.uuid,
          }
        );
      }

      if (responseData.error) {
        const errorMessageString = responseData.error.message;
        try {
          const jsonString = errorMessageString.replace(/^400 - /, "");
          const errorData = JSON.parse(jsonString);
          throw Object.assign(
            new Error(
              errorData.message ||
                "Erro na consulta. Verifique CPF, celular ou data de nascimento."
            ),
            {
              code: "api_error",
              uuid: errorData.uuid,
            }
          );
        } catch (parseError) {
          throw Object.assign(
            new Error(
              "Erro na consulta. Verifique CPF, celular ou data de nascimento."
            ),
            { code: "api_error" }
          );
        }
      }

      if (responseData.HasError) {
        throw Object.assign(
          new Error(
            responseData.ErrorMessage ||
              "Erro na consulta. Verifique CPF, celular ou data de nascimento."
          ),
          { code: "api_error" }
        );
      }

      setApiResponse(responseData);
      setUuid(responseData.uuid);
      setError(null);
      setStep("4");
    } catch (error) {
      console.error("Erro na autorização FGTS:", error);
      throw error;
    }
  };

  const handleParcelasChange = async (newParcelas) => {
    if (newParcelas === formData.parcelas) return;

    if (apiResponse) {
      setPreviousSimulation({ apiResponse, parcelas: formData.parcelas });
    }
    setFormData({ ...formData, parcelas: newParcelas });
    setStep("3");

    try {
      const data = await simulateProposal({ uuid, parcelas: newParcelas });
      console.log("Webhook Response:", data);

      const responseData =
        Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (
        responseData.Simulacao &&
        !responseData.HasError &&
        responseData.status !== "Error"
      ) {
        setApiResponse(responseData);
        setError(null);
        setStep("4");
      } else {
        if (previousSimulation) {
          setApiResponse(previousSimulation.apiResponse);
          setFormData({ ...formData, parcelas: previousSimulation.parcelas });
        }
        setError({
          message: "Não foi possível simular essa quantidade de parcelas",
          code: "simulation_error",
        });
        setStep("4");
      }
    } catch (error) {
      console.error("Erro na re-simulação:", error);
      if (previousSimulation) {
        setApiResponse(previousSimulation.apiResponse);
        setFormData({ ...formData, parcelas: previousSimulation.parcelas });
      }
      setError({
        message: "Não foi possível simular essa quantidade de parcelas",
        code: "network_error",
      });
      setStep("4");
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    if (!formData.nomeCompleto || !formData.cep) {
      setError({ message: "Preencha todos os campos", code: "validation" });
      return;
    }
    try {
      const cep = formData.cep.replace(/\D/g, "");
      const data = await getAddressByCep(cep);
      setFormData({
        ...formData,
        rua: data?.logradouro || "",
        bairro: data?.bairro || "",
        cidade: data?.localidade || "",
        uf: data?.uf || "",
        numero: "",
      });
      setError(null);
      setStep("5");
    } catch {
      setError({ message: "Erro ao consultar o CEP", code: "api_error" });
    }
  };

  const handleStep5Submit = (e) => {
    e.preventDefault();
    const { cep, cidade, uf, bairro, rua, numero } = formData;
    if (!cep || !cidade || !uf || !bairro || !rua || !numero) {
      setError({
        message: "Preencha todos os campos do endereço",
        code: "validation",
      });
      return;
    }
    setError(null);
    setStep("6");
  };

  const handleStep6Submit = async (e) => {
    e.preventDefault();
    if (
      !formData.agencia ||
      !formData.conta ||
      !formData.digito ||
      !formData.banco
    ) {
      setError({
        message: "Preencha todos os dados bancários",
        code: "validation",
      });
      return;
    }
    setStep("6.1");
    try {
      const data = await createProposal({
        uuid,
        parcelas: formData.parcelas,
        nomeCompleto: formData.nomeCompleto,
        cep: formData.cep,
        numero: formData.numero,
        uf: formData.uf,
        cidade: formData.cidade,
        bairro: formData.bairro,
        rua: formData.rua,
        agencia: formData.agencia,
        conta: formData.conta,
        digito: formData.digito,
        tipoConta: formData.tipoConta,
        banco: formData.banco,
      });
      if (data.status === "Success") {
        setStep("7");
      } else {
        setError({
          message:
            "Ops, tivemos um erro na hora de subir sua proposta. Vamos continuar tentando por aqui e avisaremos por WhatsApp assim que tiver pronto!",
          code: "api_error",
        });
        setStep("2.1");
      }
    } catch {
      setError({
        message:
          "Ops, tivemos um erro na hora de subir sua proposta. Vamos continuar tentando por aqui e avisaremos por WhatsApp assim que tiver pronto!",
        code: "network",
      });
      setStep("2.1");
    }
  };

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);
  const openDetailsLightbox = () => setIsDetailsLightboxOpen(true);
  const closeDetailsLightbox = () => setIsDetailsLightboxOpen(false);

  const handleBackToStep1 = (targetStep = "1") => {
    setError(null);
    setStep(targetStep);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const [day, month, year] = dateString.split("/");
    if (!day || !month || !year) return "N/A";
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto h-[500px] flex flex-col justify-center">
      {/* STEP 1 */}
      {step === "1" && (
        <form onSubmit={handleStep1Submit} className="step-container space-y-4">
          <div className="text-center">
            {/* <h3 className="text-xl font-medium text-gray-700 leading-tight">Simulador Express de</h3> */}
            {/* <h2 className="text-3xl font-bold text-gray-800 leading-snug">Antecipação Saque Aniversário FGTS</h2> */}
            <h2 className="text-3xl font-bold text-gray-800 leading-snug">
              Simule agora
            </h2>
            <h3 className="mb-20 text-xl font-medium text-gray-700 leading-tight">
              Preencha abaixo
            </h3>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error.message}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <InputMask
              mask="999.999.999-99"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="123.456.789.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data de Nascimento
            </label>
            <InputMask
              mask="99/99/9999"
              name="dataNascimento"
              value={formData.dataNascimento}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Celular
            </label>
            <InputMask
              mask="(99) 99999-9999"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              placeholder="(XX) 9XXXX-XXXX"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Simular!
          </button>
        </form>
      )}

      {/* STEP 2 */}
      {step === "2" && (
        <div className="step-container space-y-4 text-center">
          <h2 className="text-lg font-bold text-gray-800">
            Autorize a Consulta
          </h2>
          <p className="text-sm text-gray-600">
            Autorize a consulta do
            <br />
            <strong>BMP SOCIEDADE DE CREDITO DIRETO S.A</strong>
            <br />
            no app do FGTS
          </p>
          <h3 className="text-base font-medium text-gray-700">
            Passo a passo para autorizar
          </h3>
          <div className="cursor-pointer" onClick={openLightbox}>
            <img
              src="/placeholder.png"
              alt="Instruções FGTS"
              className="mx-auto w-32 h-32 object-cover rounded-md"
            />
            <p className="text-xs text-stripe-blue">Clique para visualizar</p>
          </div>
          <button
            onClick={handleFgtsAuthorization}
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Quando autorizar, clique em OK
          </button>
        </div>
      )}

      {/* STEP 2.1 - Tela de erro */}
      {step === "2.1" && (
        <div className="step-container space-y-4">
          <ErrorStep error={error} onBack={handleBackToStep1} />
        </div>
      )}

      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-lg w-full">
            <img
              src="/placeholder.png"
              alt="Instruções FGTS"
              className="w-full max-h-[70vh] object-contain"
            />
            <button
              onClick={closeLightbox}
              className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === "3" && (
        <div className="step-container space-y-4 text-center animate-pulse flex flex-col justify-center items-center">
          <svg
            className="animate-spin h-10 w-10 text-stripe-blue mx-auto"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-700">
            Aguarde, simulando no FGTS...
          </h2>
        </div>
      )}

      {/* STEP 6.1 - Loading para criação da proposta */}
      {step === "6.1" && (
        <div className="step-container space-y-4 text-center animate-pulse flex flex-col justify-center items-center">
          <svg
            className="animate-spin h-10 w-10 text-stripe-blue mx-auto"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-700">
            Aguarde, criando sua proposta!
          </h2>
        </div>
      )}

      {/* STEP 4 */}
      {step === "4" &&
        apiResponse &&
        apiResponse.Simulacao &&
        !apiResponse.HasError && (
          <div className="step-container space-y-4">
            <h2 className="text-lg font-bold text-center text-gray-800">
              Sua Simulação
            </h2>
            <div className="bg-stripe-gray p-3 rounded-md text-center space-y-1">
              <p className="text-base font-medium">Valor a receber no PIX</p>
              <p className="text-lg font-bold text-gray-800">
                R$ {formatCurrency(apiResponse.Simulacao.VlrLiberado)}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Parcelas antecipadas:
                </label>
                <select
                  name="parcelas"
                  value={formData.parcelas}
                  onChange={(e) => handleParcelasChange(e.target.value)}
                  className="block w-20 mx-auto border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue text-sm text-center"
                >
                  {[...Array(9)].map((_, i) => {
                    const num = i + 2;
                    return (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-700">Selecione para alterar</p>
              </div>
              <hr className="border-t border-black" />
              <div>
                <p className="text-xs text-gray-700">
                  Valor retido do FGTS: R${" "}
                  {formatCurrency(apiResponse.Simulacao.VlrOperacao)}
                </p>
                <p
                  className="text-xs text-gray-700 underline cursor-pointer"
                  onClick={openDetailsLightbox}
                >
                  Veja detalhes da proposta
                </p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-700">
              Preencha abaixo para continuar
            </p>
            {error && (
              <p className="text-red-500 text-center text-sm">
                {error.message}
              </p>
            )}
            <form onSubmit={handleStep4Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <InputMask
                  mask="99999-999"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                  placeholder="12345-678"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
              >
                Seguir
              </button>
            </form>
          </div>
        )}

      {/* Lightbox de Detalhes da Proposta */}
      {isDetailsLightboxOpen && apiResponse && apiResponse.Simulacao && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="text-base font-bold text-gray-800 text-center">
              Detalhes da Proposta
            </h3>
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Valor Liberado
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    R$ {formatCurrency(apiResponse.Simulacao.VlrLiberado)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Quantidade de Parcelas
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    {formData.parcelas}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Taxa de Juros Mensal
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    {apiResponse.Simulacao.TaxaMensal
                      ? `${formatPercentage(apiResponse.Simulacao.TaxaMensal)}%`
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Taxa CET Mensal
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    {apiResponse.Simulacao.TaxaCETMensal
                      ? `${formatPercentage(
                          apiResponse.Simulacao.TaxaCETMensal
                        )}%`
                      : "N/A"}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Valor Operação
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    R$ {formatCurrency(apiResponse.Simulacao.VlrOperacao)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                    Taxas
                  </td>
                  <td className="border border-gray-300 p-1 text-xs text-gray-800">
                    {apiResponse.Simulacao.VlrEmprestimoCliente &&
                    apiResponse.Simulacao.VlrLiberado
                      ? `R$ ${formatCurrency(
                          apiResponse.Simulacao.VlrEmprestimoCliente -
                            apiResponse.Simulacao.VlrLiberado
                        )}`
                      : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Parcelas</h4>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                      Data de Repasse
                    </th>
                    <th className="border border-gray-300 p-1 text-xs font-medium text-gray-700">
                      Valor Repasse
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apiResponse.Simulacao &&
                  apiResponse.Simulacao.SimulacaoParcelas &&
                  apiResponse.Simulacao.SimulacaoParcelas.length > 0 ? (
                    apiResponse.Simulacao.SimulacaoParcelas.map(
                      (parcela, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="border border-gray-300 p-1 text-xs text-gray-800">
                            {formatDate(parcela.DtRepasse)}
                          </td>
                          <td className="border border-gray-300 p-1 text-xs text-gray-800">
                            R$ {formatCurrency(parcela.VlrRepasse)}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="2"
                        className="border border-gray-300 p-1 text-xs text-gray-800 text-center"
                      >
                        Nenhuma parcela disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={closeDetailsLightbox}
              className="w-full bg-stripe-blue text-white py-1 rounded-md hover:bg-opacity-90 transition text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 */}
      {step === "5" && (
        <form onSubmit={handleStep5Submit} className="step-container space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            Confirme seu Endereço
          </h2>
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CEP
              </label>
              <InputMask
                mask="99999-999"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="CEP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cidade
              </label>
              <input
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                UF
              </label>
              <select
                name="uf"
                value={formData.uf}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
              >
                <option value="">Selecione</option>
                {ufCodes.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bairro
              </label>
              <input
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rua
              </label>
              <input
                name="rua"
                value={formData.rua}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="Rua"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número
              </label>
              <input
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="Só números"
                inputMode="numeric"
                pattern="\d*"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-stripe-blue text-white py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Seguir
          </button>
        </form>
      )}

      {/* STEP 6 */}
      {step === "6" && (
        <form onSubmit={handleStep6Submit} className="step-container space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Dados Bancários</h2>
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Banco
            </label>
            <select
              name="banco"
              value={formData.banco}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
            >
              <option value="">Selecione</option>
              {banks.map(([label, val]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Agência – sem dígito
              </label>
              <input
                name="agencia"
                value={formData.agencia}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                placeholder="0001"
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Conta
                </label>
                <input
                  name="conta"
                  value={formData.conta}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                  placeholder="123456"
                />
              </div>
              <div className="w-16">
                <label className="block text-sm font-medium text-gray-700">
                  Dígito
                </label>
                <input
                  name="digito"
                  value={formData.digito}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
                  placeholder="7"
                  inputMode="numeric"
                  pattern="\d*"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Conta
            </label>
            <select
              name="tipoConta"
              value={formData.tipoConta}
              onChange={handleInputChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-stripe-blue focus:border-stripe-blue"
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

      {/* STEP 7 */}
      {step === "7" && <SuccessMessage />}

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={SITE_KEY}
        size="invisible"
        badge="bottomleft"
      />
    </div>
  );
};

export default LoanForm;
