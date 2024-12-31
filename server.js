const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de IPs excluidas
const excludedIPs = ['192.168.1.1', '203.0.113.5', '123.45.67.89']; // Añade tus IPs bloqueadas aquí

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint del formulario
app.post('/submit', async (req, res) => {
    const { name, email, message, 'cf-turnstile-response': token } = req.body;
    
    // Obtener la IP real del cliente (a través de X-Forwarded-For si está detrás de un proxy)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Excluir por IP
    if (excludedIPs.includes(clientIP)) {
        return res.status(403).send('Acceso denegado: IP bloqueada.');
    }

    // Verificar Turnstile
    const turnstileSecret = '0x4AAAAAAA4HSZwKaQW1z_NXN-tgfOl8ISY'; // Tu clave secreta de Turnstile
    const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    try {
        // Llamada para verificar el CAPTCHA de Turnstile
        const response = await fetch(verifyURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: token, remoteip: clientIP }),
        });

        const data = await response.json();

        // Si la verificación de Turnstile falla
        if (!data.success) {
            return res.status(400).send('Error de verificación CAPTCHA.');
        }

        // Si la verificación es exitosa, procesamos los datos del formulario
        console.log(`Nombre: ${name}, Email: ${email}, Mensaje: ${message}`);
        res.send('Formulario enviado correctamente.');
    } catch (error) {
        console.error('Error verificando CAPTCHA:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// Servir el frontend (archivos estáticos)
app.use(express.static('public'));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
