if (typeof window === 'undefined') {
    // Inside the Service Worker context
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
    
    self.addEventListener("fetch", event => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.status === 0) {
                        return response;
                    }
                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders
                    });
                })
                .catch(e => console.error(e))
        );
    });
} else {
    // Inside the browser window context
    (() => {
        // Only run if crossOriginIsolated is not enabled and we are in a secure context (like localhost or HTTPS)
        if (window.crossOriginIsolated) return;
        
        const scriptUrl = document.currentScript ? document.currentScript.src : '/coi-serviceworker.js';
        
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register(scriptUrl).then(registration => {
                registration.addEventListener("updatefound", () => {
                    console.log("coi-serviceworker: Service worker updated, reloading page...");
                    window.location.reload();
                });
                if (registration.active && !navigator.serviceWorker.controller) {
                    console.log("coi-serviceworker: Service worker activated, reloading page to apply headers...");
                    window.location.reload();
                }
            }).catch(err => {
                console.error("coi-serviceworker: Registration failed:", err);
            });
        }
    })();
}
