// Script de Diagnóstico para Tela Branca
// Execute este script no console do navegador (F12) quando acessar mdinheiro.com.br

console.log('🔍 DIAGNÓSTICO DE TELA BRANCA - mdinheiro.com.br');
console.log('================================================');

// 1. Verificar se o React está carregado
if (typeof React !== 'undefined') {
    console.log('✅ React carregado:', React.version);
} else {
    console.log('❌ React NÃO carregado');
}

// 2. Verificar se há erros JavaScript
const originalError = console.error;
console.error = function(...args) {
    console.log('🚨 ERRO DETECTADO:', ...args);
    originalError.apply(console, args);
};

// 3. Verificar se o root element existe
const rootElement = document.getElementById('root');
if (rootElement) {
    console.log('✅ Elemento #root encontrado');
    console.log('📊 Conteúdo do root:', rootElement.innerHTML.length > 0 ? 'Tem conteúdo' : 'VAZIO');
    if (rootElement.innerHTML.length === 0) {
        console.log('❌ ROOT ESTÁ VAZIO - Possível problema de renderização');
    }
} else {
    console.log('❌ Elemento #root NÃO encontrado');
}

// 4. Verificar recursos carregados
const scripts = document.querySelectorAll('script[src]');
const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

console.log('📦 Scripts carregados:', scripts.length);
scripts.forEach((script, index) => {
    console.log(`   ${index + 1}. ${script.src}`);
});

console.log('🎨 Stylesheets carregados:', stylesheets.length);
stylesheets.forEach((css, index) => {
    console.log(`   ${index + 1}. ${css.href}`);
});

// 5. Verificar variáveis de ambiente
if (typeof import.meta !== 'undefined' && import.meta.env) {
    console.log('🔧 Variáveis de ambiente:');
    console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('   VITE_APP_URL:', import.meta.env.VITE_APP_URL);
    console.log('   MODE:', import.meta.env.MODE);
} else {
    console.log('❌ Variáveis de ambiente não acessíveis');
}

// 6. Verificar Network requests
console.log('🌐 Verificando requests de rede...');
const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
            const status = entry.responseStatus || 'unknown';
            const duration = Math.round(entry.duration);
            console.log(`📡 ${entry.name} - Status: ${status} - ${duration}ms`);
        }
    });
});
observer.observe({entryTypes: ['resource']});

// 7. Verificar CORS
fetch(window.location.origin + '/vite.svg')
    .then(response => {
        console.log('✅ CORS OK - Status:', response.status);
    })
    .catch(error => {
        console.log('❌ CORS Error:', error.message);
    });

// 8. Verificar Service Workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
            console.log('🔄 Service Workers ativos:', registrations.length);
        } else {
            console.log('ℹ️ Nenhum Service Worker ativo');
        }
    });
}

// 9. Verificar Local Storage
try {
    const testKey = 'test-storage';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('✅ Local Storage funcionando');
} catch (error) {
    console.log('❌ Local Storage com problema:', error.message);
}

// 10. Resumo final
setTimeout(() => {
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('================================================');
    console.log('1. Copie todos os logs acima');
    console.log('2. Verifique se há erros em vermelho');
    console.log('3. Observe se o #root está vazio');
    console.log('4. Verifique se todos os recursos carregaram (status 200)');
    console.log('5. Confirme se as variáveis de ambiente estão corretas');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('- Se #root vazio: problema de build ou JavaScript');
    console.log('- Se erro CORS: configurar VITE_APP_URL corretamente');
    console.log('- Se recursos 404: problema de deploy ou paths');
    console.log('- Se erro JS: verificar compatibilidade do navegador');
}, 2000);

console.log('\n⏳ Aguarde 2 segundos para o resumo final...');