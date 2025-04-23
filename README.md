# Formulário de Empréstimo FGTS

Versao 2.1 - ja entende o erro de nao autorizar bmp e traz o erro certo OK
Versao 2.2.1 - erro de sem saldo OK
Versao 2.2.2 - nao habilitou saque aniversario OK
Versao 2.2.3 - erro na Caixa, vamos enviar por whatsapp quando voltar OK
Versao 2.3 - verificar cpf na entrada OK
Versao 3.0 - colocar as novas APIs OK
Versao 3.1 - colocar um loading antes da resposta da api OK
Versao 4.0 - alterar parcelas OK
versao 5.0 - ajustar tamanho ficar dentro de um iframe fixo OK
Versao 5.1 - melhorar UX das parcelas OK
Versao 6.0 - colocar detalhes da proposta OK
Versao 7.0 - criar iframe site p embedar OK
Versao 7.1 - colocar os dados de host, sid/cid etc OK

colocar retentativas de chamada api caixa


iframe

<div id="iframe-container"></div>

<script>
  function getDataLayerValue(key) {
    if (!window.dataLayer) return null;
    for (let i = dataLayer.length - 1; i >= 0; i--) {
      const item = dataLayer[i].value || dataLayer[i];
      if (item && item[key]) return item[key];
    }
    return null;
  }

  function getGAClientId() {
    const gaCookie = document.cookie.split('; ').find(row => row.startsWith('_ga='));
    if (!gaCookie) return null;
    const parts = gaCookie.split('.');
    return parts.length >= 4 ? ${parts[2]}.${parts[3]} : null;
  }

  function getGASessionId() {
    const gaCookie = document.cookie.split('; ').find(row => row.startsWith('_ga='));
    if (!gaCookie) return null;
    const parts = gaCookie.split('.');
    return parts.length >= 4 ? parts[2] : null;
  }

  function getFacebookClickId() {
    const fbpCookie = document.cookie.split('; ').find(row => row.startsWith('_fbp='));
    return fbpCookie ? fbpCookie.split('=')[1] : null;
  }

  function loadIframeWithParams() {
    const cid = getGAClientId() || getDataLayerValue('client_id');
    const sid = getGASessionId() || getDataLayerValue('session_id');
    const fbp = getDataLayerValue('fbp') || getFacebookClickId();
    const name = "Renata";
    const avatar = "https://randomuser.me/api/portraits/women/30.jpg";
    const partner_id = "12345";
    const parent_url = window.location.href;
    const userAgent = navigator.userAgent;

    const params = new URLSearchParams({
      cid,
      sid,
      fbp,
      name,
      avatar,
      partner_id,
      parent_url,
      userAgent
    });

    const iframe = document.createElement("iframe");
    iframe.id = "juca-iframe";
    iframe.src = https://chat.vemprojuca.com/?${params.toString()};
    iframe.width = "100%";
    iframe.style.border = "none";
    iframe.allowFullscreen = true;

    document.getElementById("iframe-container").appendChild(iframe);

    // Recebe altura exata do iframe pelo postMessage
    window.addEventListener('message', function(event) {
      if (event.data.type === 'ajusteAlturaIframe') {
        iframe.style.height = event.data.height + 'px';
      }
    });
  }

  window.addEventListener("load", loadIframeWithParams);
</script>
