// Recupera il payload del messaggio
const panels = msg.payload.dashboard.panels; // Lista dei pannelli
const grafanaServer = "http://<grafana-server>"; // Sostituisci con l'URL del tuo server Grafana
const dashboardUid = "<dashboard-uid>"; // Sostituisci con l'UID del tuo dashboard
const dashboardSlug = "<dashboard-slug>"; // Sostituisci con il nome del tuo dashboard

// Parametri di rendering
const width = 1000; // Larghezza dell'immagine
const height = 500; // Altezza dell'immagine
const theme = "light"; // Tema del rendering (light o dark)

// Array per le richieste di rendering
let rendererRequests = [];

// Genera una richiesta per ogni pannello
panels.forEach(panel => {
    const panelId = panel.id; // ID del pannello
    if (panelId) { // Verifica che l'ID del pannello esista
        const renderUrl = `${grafanaServer}/render/d/${dashboardUid}/${dashboardSlug}?panelId=${panelId}&width=${width}&height=${height}&theme=${theme}`;
        rendererRequests.push(renderUrl);
    }
});

// Aggiunge l'elenco delle richieste al messaggio in uscita
msg.renderer_requests = rendererRequests;

// Restituisce il messaggio aggiornato
return msg;
