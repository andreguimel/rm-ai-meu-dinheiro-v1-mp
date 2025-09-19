// iPhone/Safari Fallback Script
// Este script resolve problemas específicos de SSL e conectividade no iPhone

(function() {
    'use strict';
    
    // Detectar iPhone/iOS
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS || isSafari) {
        console.log('🍎 iPhone/Safari detected - applying compatibility fixes');
        
        // Fix 1: Force HTTPS redirect if needed
        if (location.protocol === 'http:' && location.hostname !== 'localhost') {
            console.log('🔒 Redirecting to HTTPS for iPhone compatibility');
            location.replace('https:' + window.location.href.substring(window.location.protocol.length));
            return;
        }
        
        // Fix 2: WebSocket fallback for SSL issues
        if (window.WebSocket && location.protocol === 'https:') {
            const originalWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
                // Convert ws:// to wss:// for HTTPS pages
                if (url.startsWith('ws://') && location.protocol === 'https:') {
                    url = url.replace('ws://', 'wss://');
                    console.log('🔄 Converting WebSocket to secure connection for iPhone');
                }
                return new originalWebSocket(url, protocols);
            };
        }
        
        // Fix 3: Storage fallback for private mode
        try {
            localStorage.setItem('__test__', 'test');
            localStorage.removeItem('__test__');
        } catch (e) {
            console.warn('📱 Private mode detected - using session storage fallback');
            // Fallback já implementado no supabase client
        }
        
        // Fix 4: Viewport fixes for iPhone
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && isIPhone) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
        
        // Fix 5: Prevent zoom on input focus
        if (isIPhone) {
            document.addEventListener('focusin', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    document.body.style.zoom = '1';
                }
            });
        }
        
        // Fix 6: SSL certificate validation bypass for development
        if (location.hostname === 'localhost' || location.hostname.includes('192.168')) {
            console.log('🔧 Development environment detected - applying SSL fixes');
            
            // Add meta tag to prevent mixed content issues
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = 'upgrade-insecure-requests';
            document.head.appendChild(meta);
        }
        
        console.log('✅ iPhone compatibility fixes applied');
    }
})();