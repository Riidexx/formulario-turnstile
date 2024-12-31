import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de IPs excluidas
const excludedIPs = ["186.112.30.85"]; // Asegúrate de agregar las IPs que deseas excluir

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint del formulario
app.post('/submit', async (req, res) => {
    const { name, email, message, 'cf-turnstile-response': token } = req.body;
    
    // Obtener la IP real del cliente
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Excluir por IP (no verificar Turnstile si la IP está en la lista de exclusión)
    if (excludedIPs.includes(clientIP)) {
        console.log(`IP ${clientIP} está excluida. Se salta la verificación de Turnstile.`);
        
        // Enviar respuesta con el estado de la IP
        return res.json({
            message: 'Formulario enviado correctamente.',
            isIPExcluded: true // Esto se enviará al frontend para que sepa si debe omitir el CAPTCHA
        });
    }

    // Si la IP no está excluida, verificar Turnstile
    const turnstileSecret = '0x4AAAAAAA4HSZwKaQW1z_NXN-tgfOl8ISY';
    const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    try {
        const response = await fetch(verifyURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: token, remoteip: clientIP }),
        });

        const data = await response.json();

        // Si Turnstile no verifica correctamente, devolver un error
        if (!data.success) {
            return res.status(400).send('Error de verificación CAPTCHA.');
        }

        // Si Turnstile valida correctamente, procesar datos del formulario
        console.log(`Nombre: ${name}, Email: ${email}, Mensaje: ${message}`);
        res.send('Formulario enviado correctamente.');
    } catch (error) {
        console.error('Error verificando CAPTCHA:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// Servir el frontend
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
