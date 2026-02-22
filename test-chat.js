const fetch = require('node-fetch'); // Ensure node 18+ syntax isn't choking if it isn't set up

async function testChat() {
    try {
        const payload = {
            messages: [{ role: 'user', content: 'Cielo abierto, necesito que busques cual fue la ultima imagen tomada por el rover perseverance en marte. Usa tus herramientas para buscar esto urgente.' }]
        };
        const res = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log("RAW STREAM OUTPUT:");
        console.log(text);
    } catch (e) {
        console.error(e);
    }
}
testChat();
