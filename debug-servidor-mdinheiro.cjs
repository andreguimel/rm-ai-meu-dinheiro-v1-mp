// Script de Diagnóstico para mdinheiro.com.br
// Execute com: node debug-servidor-mdinheiro.js

const https = require("https");
const http = require("http");

const DOMAIN = "mdinheiro.com.br";
const URLS_TO_TEST = [
  `https://${DOMAIN}`,
  `https://${DOMAIN}/`,
  `http://${DOMAIN}`,
  `http://${DOMAIN}/`,
];

console.log("🔍 Iniciando diagnóstico do servidor mdinheiro.com.br\n");

// Função para testar uma URL
function testUrl(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    console.log(`📡 Testando: ${url}`);

    const req = client.get(
      url,
      {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        },
      },
      (res) => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   📋 Headers:`);
        Object.keys(res.headers).forEach((key) => {
          if (
            [
              "content-type",
              "access-control-allow-origin",
              "access-control-allow-credentials",
              "location",
            ].includes(key)
          ) {
            console.log(`      ${key}: ${res.headers[key]}`);
          }
        });

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const isHtml = data.includes("<html") || data.includes("<!DOCTYPE");
          console.log(
            `   📄 Conteúdo: ${isHtml ? "HTML detectado" : "Não é HTML"}`
          );
          if (!isHtml && data.length < 200) {
            console.log(`   📝 Resposta: ${data.substring(0, 100)}...`);
          }
          console.log("");
          resolve({ url, status: res.statusCode, success: true });
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Erro: ${err.message}`);
      console.log("");
      resolve({ url, error: err.message, success: false });
    });

    req.on("timeout", () => {
      console.log(`   ⏰ Timeout após 10 segundos`);
      console.log("");
      req.destroy();
      resolve({ url, error: "Timeout", success: false });
    });
  });
}

// Função para testar CORS
function testCors() {
  return new Promise((resolve) => {
    console.log("🌐 Testando CORS...");

    const postData = JSON.stringify({
      test: "cors",
    });

    const options = {
      hostname: DOMAIN,
      port: 443,
      path: "/",
      method: "OPTIONS",
      headers: {
        Origin: "https://mdinheiro.com.br",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ CORS Status: ${res.statusCode}`);
      console.log(`   📋 CORS Headers:`);
      Object.keys(res.headers).forEach((key) => {
        if (key.startsWith("access-control")) {
          console.log(`      ${key}: ${res.headers[key]}`);
        }
      });
      console.log("");
      resolve({ success: true, status: res.statusCode });
    });

    req.on("error", (err) => {
      console.log(`   ❌ CORS Erro: ${err.message}`);
      console.log("");
      resolve({ success: false, error: err.message });
    });

    req.end();
  });
}

// Função principal
async function runDiagnostic() {
  console.log("=".repeat(60));
  console.log("🏥 DIAGNÓSTICO DO SERVIDOR MDINHEIRO.COM.BR");
  console.log("=".repeat(60));
  console.log("");

  // Testar URLs
  const results = [];
  for (const url of URLS_TO_TEST) {
    const result = await testUrl(url);
    results.push(result);
  }

  // Testar CORS
  const corsResult = await testCors();

  // Resumo
  console.log("📊 RESUMO DO DIAGNÓSTICO");
  console.log("-".repeat(40));

  const successfulUrls = results.filter((r) => r.success);
  const failedUrls = results.filter((r) => !r.success);

  console.log(
    `✅ URLs funcionando: ${successfulUrls.length}/${results.length}`
  );
  successfulUrls.forEach((r) => console.log(`   - ${r.url} (${r.status})`));

  if (failedUrls.length > 0) {
    console.log(`❌ URLs com problema: ${failedUrls.length}`);
    failedUrls.forEach((r) => console.log(`   - ${r.url}: ${r.error}`));
  }

  console.log(`🌐 CORS: ${corsResult.success ? "✅ OK" : "❌ Problema"}`);

  console.log("");
  console.log("🔧 RECOMENDAÇÕES:");

  if (failedUrls.length > 0) {
    console.log("   1. Verificar se o servidor está rodando");
    console.log("   2. Verificar configurações de firewall");
    console.log("   3. Verificar configurações de DNS");
  }

  if (!corsResult.success) {
    console.log("   4. Configurar CORS corretamente no servidor");
    console.log("   5. Verificar se VITE_APP_URL está definido");
  }

  console.log("   6. Verificar logs do servidor para erros específicos");
  console.log("   7. Testar com diferentes navegadores/dispositivos");

  console.log("");
  console.log("📱 Para testar no iPhone:");
  console.log("   - Abrir Safari e ir para https://mdinheiro.com.br");
  console.log(
    "   - Verificar Console do Safari (Configurações > Safari > Avançado > Web Inspector)"
  );
  console.log("   - Procurar por erros de CORS ou JavaScript");
}

// Executar diagnóstico
runDiagnostic().catch(console.error);
