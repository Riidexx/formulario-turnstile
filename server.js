import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de IPs excluidas
const excludedIPs = ['192.168.1.1', '186.112.30.85'];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (CSS, JS, imágenes) desde la carpeta public
app.use(express.static('public'));

// Endpoint del formulario
app.post('/submit', async (req, res) => {
    const { name, email, message, 'cf-turnstile-response': token } = req.body;

    // Obtener la IP real del cliente
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Excluir por IP
    if (excludedIPs.includes(clientIP)) {
        return res.status(403).send('Acceso denegado: IP bloqueada.');
    }

    // Verificar Turnstile
    const turnstileSecret = '0x4AAAAAAA4HSZwKaQW1z_NXN-tgfOl8ISY';
    const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    try {
        const response = await fetch(verifyURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: token, remoteip: clientIP }),
        });

        const data = await response.json();

        if (!data.success) {
            return res.status(400).send('Error de verificación CAPTCHA.');
        }

        // Procesar datos del formulario
        console.log(`Nombre: ${name}, Email: ${email}, Mensaje: ${message}`);
        res.send('Formulario enviado correctamente.');
    } catch (error) {
        console.error('Error verificando CAPTCHA:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
