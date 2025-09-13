const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configurações
const DOMAIN = 'mdinheiro.com.br';
const TIMEOUT = 10000;

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                ...options.headers
            },
            timeout: TIMEOUT
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data,
                    url: url
                });
            });
        });
        
        req.on('error', (error) => {
            reject({ error: error.message, url: url });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'Timeout', url: url });
        });
        
        if (options.data) {
            req.write(options.data);
        }
        
        req.end();
    });
}

// Função para testar recursos específicos
async function testResources() {
    console.log('🔍 DIAGNÓSTICO DETALHADO - mdinheiro.com.br');
    console.log('=' .repeat(50));
    
    const tests = [
        {
            name: 'Página Principal (HTTPS)',
            url: `https://${DOMAIN}/`
        },
        {
            name: 'Página Principal (HTTP)',
            url: `http://${DOMAIN}/`
        },
        {
            name: 'Página de Login',
            url: `https://${DOMAIN}/login`
        },
        {
            name: 'Assets JavaScript',
            url: `https://${DOMAIN}/assets/index.js`
        },
        {
            name: 'Assets CSS',
            url: `https://${DOMAIN}/assets/index.css`
        },
        {
            name: 'Manifest',
            url: `https://${DOMAIN}/manifest.json`
        },
        {
            name: 'Favicon',
            url: `https://${DOMAIN}/favicon.ico`
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n📋 Testando: ${test.name}`);
            console.log(`🔗 URL: ${test.url}`);
            
            const result = await makeRequest(test.url);
            
            console.log(`✅ Status: ${result.status}`);
            console.log(`📏 Tamanho: ${result.data.length} bytes`);
            
            // Verificar headers importantes
            const importantHeaders = ['content-type', 'content-encoding', 'cache-control', 'access-control-allow-origin'];
            importantHeaders.forEach(header => {
                if (result.headers[header]) {
                    console.log(`📄 ${header}: ${result.headers[header]}`);
                }
            });
            
            // Análise específica do conteúdo
            if (test.name.includes('Principal')) {
                const hasReact = result.data.includes('react') || result.data.includes('React');
                const hasVite = result.data.includes('vite') || result.data.includes('Vite');
                const hasScript = result.data.includes('<script');
                const hasCSS = result.data.includes('<link') && result.data.includes('stylesheet');
                const hasDiv = result.data.includes('<div id="root">');
                
                console.log(`🔍 Análise do HTML:`);
                console.log(`   - React detectado: ${hasReact}`);
                console.log(`   - Vite detectado: ${hasVite}`);
                console.log(`   - Scripts presentes: ${hasScript}`);
                console.log(`   - CSS presente: ${hasCSS}`);
                console.log(`   - Div root presente: ${hasDiv}`);
                
                if (!hasScript || !hasDiv) {
                    console.log(`⚠️  PROBLEMA DETECTADO: HTML pode estar incompleto!`);
                }
            }
            
            // Verificar redirecionamentos
            if (result.status >= 300 && result.status < 400) {
                console.log(`🔄 Redirecionamento para: ${result.headers.location}`);
            }
            
        } catch (error) {
            console.log(`❌ Erro: ${error.error}`);
            
            if (error.error === 'Timeout') {
                console.log(`⏱️  Servidor demorou mais que ${TIMEOUT}ms para responder`);
            }
        }
    }
}

// Função para testar conectividade básica
async function testConnectivity() {
    console.log('\n🌐 TESTE DE CONECTIVIDADE BÁSICA');
    console.log('=' .repeat(50));
    
    try {
        // Teste de DNS
        const dns = require('dns');
        const { promisify } = require('util');
        const lookup = promisify(dns.lookup);
        
        console.log(`🔍 Resolvendo DNS para ${DOMAIN}...`);
        const dnsResult = await lookup(DOMAIN);
        console.log(`✅ IP resolvido: ${dnsResult.address} (família: IPv${dnsResult.family})`);
        
    } catch (error) {
        console.log(`❌ Erro de DNS: ${error.message}`);
    }
}

// Função para simular comportamento do iPhone
async function testIPhoneBehavior() {
    console.log('\n📱 SIMULAÇÃO DE COMPORTAMENTO DO IPHONE');
    console.log('=' .repeat(50));
    
    try {
        // Simular requisição como Safari no iPhone
        const result = await makeRequest(`https://${DOMAIN}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        console.log(`📱 Resposta para iPhone Safari:`);
        console.log(`   - Status: ${result.status}`);
        console.log(`   - Tamanho: ${result.data.length} bytes`);
        
        // Verificar se há diferenças no conteúdo
        const hasViewport = result.data.includes('viewport');
        const hasTouchIcon = result.data.includes('apple-touch-icon');
        const hasManifest = result.data.includes('manifest');
        
        console.log(`📋 Otimizações mobile:`);
        console.log(`   - Meta viewport: ${hasViewport}`);
        console.log(`   - Apple touch icon: ${hasTouchIcon}`);
        console.log(`   - Web manifest: ${hasManifest}`);
        
    } catch (error) {
        console.log(`❌ Erro na simulação iPhone: ${error.error}`);
    }
}

// Executar todos os testes
async function runAllTests() {
    try {
        await testConnectivity();
        await testResources();
        await testIPhoneBehavior();
        
        console.log('\n🎯 RESUMO E RECOMENDAÇÕES');
        console.log('=' .repeat(50));
        console.log('1. Se todos os recursos carregaram mas ainda há tela branca:');
        console.log('   - Problema pode ser JavaScript/React não executando');
        console.log('   - Verificar console do navegador no iPhone');
        console.log('   - Testar em modo privado/incógnito');
        console.log('');
        console.log('2. Se recursos não carregaram:');
        console.log('   - Problema de servidor/proxy');
        console.log('   - Verificar configurações do Nginx');
        console.log('   - Verificar logs do servidor');
        console.log('');
        console.log('3. Próximos passos:');
        console.log('   - Acessar https://mdinheiro.com.br no iPhone');
        console.log('   - Abrir DevTools (Safari > Desenvolver)');
        console.log('   - Verificar erros no Console');
        console.log('   - Verificar Network para recursos que falharam');
        
    } catch (error) {
        console.log(`❌ Erro geral: ${error.message}`);
    }
}

// Executar
runAllTests();