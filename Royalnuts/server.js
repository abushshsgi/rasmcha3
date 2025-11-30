// Environment variables ni yuklash
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const net = require('net');

const app = express();
const DEFAULT_PORT = 3002;
let PORT = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;

// Bo'sh port topish funksiyasi
function findAvailablePort(startPort, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        function checkPort(port) {
            const server = net.createServer();
            
            server.listen(port, () => {
                server.once('close', () => {
                    resolve(port);
                });
                server.close();
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error(`Bo'sh port topilmadi. ${maxAttempts} ta urinishdan keyin to'xtatildi.`));
                    } else {
                        checkPort(port + 1);
                    }
                } else {
                    reject(err);
                }
            });
        }

        checkPort(startPort);
    });
}

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// PostgreSQL Pool
let pool = null;


// Telegram Bot API orqali xabar yuborish
async function sendToTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('⚠️  Telegram Bot Token yoki Chat ID sozlanmagan');
        console.log('💡 .env faylga quyidagilarni qo\'shing:');
        console.log('   TELEGRAM_BOT_TOKEN=your_bot_token');
        console.log('   TELEGRAM_CHAT_ID=your_chat_id');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        console.log('📤 Telegram\'ga yuborilmoqda...');
        console.log('   Chat ID:', TELEGRAM_CHAT_ID);
        
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        }, {
            timeout: 10000 // 10 soniya timeout
        });
        
        if (response.data.ok) {
            console.log('✅ Telegram\'ga muvaffaqiyatli yuborildi!');
            return true;
        } else {
            console.error('❌ Telegram API xatosi:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        if (error.response) {
            // Server javob berdi, lekin xatolik bor
            console.error('❌ Telegram API xatosi:', error.response.status, error.response.data);
            console.error('   Xatolik tafsilotlari:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // So'rov yuborildi, lekin javob kelmadi
            console.error('❌ Telegram serverga ulanib bo\'lmadi');
            console.error('   Internet aloqasini tekshiring');
        } else {
            // Boshqa xatolik
            console.error('❌ Telegram yuborishda xatolik:', error.message);
        }
        return false;
    }
}

// PostgreSQL ulanish va jadvallarni yaratish
async function connectDatabase() {
    if (!DATABASE_URL) {
        console.log('⚠️  PostgreSQL URL sozlanmagan. Database ishlatilmaydi.');
        console.log('💡 .env faylga DATABASE_URL qo\'shing');
        return false;
    }

    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
        });

        // Ulanishni tekshirish
        const client = await pool.connect();
        console.log('✅ PostgreSQL\'ga muvaffaqiyatli ulandi');

        // Jadval yaratish
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                date VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                items JSONB NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                customer_info JSONB,
                order_message TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                date VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        client.release();
        console.log('✅ Database jadvallari tayyor');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL ulanishda xatolik:', error.message);
        return false;
    }
}

// Dastlabki sozlash
connectDatabase();

// Server ishga tushganda Telegram bot sozlamalarini tekshirish
console.log('\n📋 Telegram Bot Sozlamalari:');
if (TELEGRAM_BOT_TOKEN) {
    console.log('   ✅ Bot Token: Sozlangan');
} else {
    console.log('   ❌ Bot Token: Sozlanmagan');
}
if (TELEGRAM_CHAT_ID) {
    console.log('   ✅ Chat ID: Sozlangan');
} else {
    console.log('   ❌ Chat ID: Sozlanmagan');
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('\n💡 Telegram botni sozlash uchun:');
    console.log('   1. .env faylga quyidagilarni qo\'shing:');
    console.log('      TELEGRAM_BOT_TOKEN=your_bot_token');
    console.log('      TELEGRAM_CHAT_ID=your_chat_id');
    console.log('   2. Bot yaratish: @BotFather ga /newbot');
    console.log('   3. Chat ID olish: @userinfobot ga xabar yuboring\n');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Serve index.html as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint for contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlar to\'ldirilishi kerak'
            });
        }

        // 1. DATABASE'GA SAQLASH
        let savedContact = null;
        const dateStr = new Date().toLocaleString('uz-UZ');
        
        if (pool) {
            try {
                const result = await pool.query(
                    `INSERT INTO contacts (name, email, subject, message, date) 
                     VALUES ($1, $2, $3, $4, $5) 
                     RETURNING id, name, email, subject, message, date, created_at`,
                    [name, email, subject, message, dateStr]
                );
                savedContact = result.rows[0];
                console.log('✅ Database\'ga saqlandi:', savedContact.id);
            } catch (dbError) {
                console.error('Database saqlashda xatolik:', dbError.message);
            }
        }
        
        // 2. Telegram'ga yuborish (real-time bildirishnoma)
        const telegramMessage = `
📧 <b>Yangi Xabar</b>

👤 <b>Ism:</b> ${name}
📧 <b>Email:</b> ${email}
📌 <b>Mavzu:</b> ${subject}
💬 <b>Xabar:</b>
${message}

🕐 <b>Sana:</b> ${dateStr}
🆔 <b>ID:</b> ${savedContact?.id || 'N/A'}
        `.trim();
        
        await sendToTelegram(telegramMessage);

        const savedTo = [];
        if (pool) savedTo.push('Database');
        if (TELEGRAM_BOT_TOKEN) savedTo.push('Telegram');

        console.log('✅ Yangi xabar saqlandi:', {
            id: savedContact?.id,
            name,
            email,
            subject,
            savedTo
        });

        res.json({
            success: true,
            message: 'Xabaringiz muvaffaqiyatli yuborildi va saqlandi!'
        });
    } catch (error) {
        console.error('Xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq qayta urinib ko\'ring.'
        });
    }
});

// API endpoint for order submission
app.post('/api/order', async (req, res) => {
    try {
        const { items, total, customerInfo } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Savatcha bo\'sh'
            });
        }

        // Build order message (HTML format for Telegram)
        let orderMessage = '🛒 <b>Yangi Buyurtma</b>\n\n';
        orderMessage += `📅 <b>Sana:</b> ${new Date().toLocaleString('uz-UZ')}\n\n`;
        
        if (customerInfo && (customerInfo.name || customerInfo.phone || customerInfo.address)) {
            orderMessage += `👤 <b>Mijoz ma\'lumotlari:</b>\n`;
            if (customerInfo.name) orderMessage += `Ism: ${customerInfo.name}\n`;
            if (customerInfo.phone) orderMessage += `Telefon: ${customerInfo.phone}\n`;
            if (customerInfo.address) orderMessage += `Manzil: ${customerInfo.address}\n`;
            orderMessage += '\n';
        }

        orderMessage += `📦 <b>Mahsulotlar:</b>\n`;
        items.forEach((item, index) => {
            orderMessage += `${index + 1}. <b>${item.name}</b>\n`;
            orderMessage += `   Miqdor: ${item.quantity}\n`;
            orderMessage += `   Narx: ${item.price.toLocaleString()} so'm\n`;
            orderMessage += `   Jami: ${(item.price * item.quantity).toLocaleString()} so'm\n\n`;
        });

        orderMessage += `💰 <b>Umumiy summa: ${total.toLocaleString()} so'm</b>`;

        // 1. DATABASE'GA SAQLASH
        let savedOrder = null;
        const dateStr = new Date().toLocaleString('uz-UZ');
        
        if (pool) {
            try {
                const result = await pool.query(
                    `INSERT INTO orders (items, total, customer_info, order_message, status, date) 
                     VALUES ($1, $2, $3, $4, $5, $6) 
                     RETURNING id, items, total, customer_info, order_message, status, date, created_at`,
                    [
                        JSON.stringify(items),
                        total,
                        JSON.stringify(customerInfo || {}),
                        orderMessage,
                        'pending',
                        dateStr
                    ]
                );
                savedOrder = result.rows[0];
                console.log('✅ Buyurtma database\'ga saqlandi:', savedOrder.id);
            } catch (dbError) {
                console.error('Database saqlashda xatolik:', dbError.message);
            }
        }

        // 2. Telegram'ga yuborish
        await sendToTelegram(orderMessage);

        const savedTo = [];
        if (pool) savedTo.push('Database');
        if (TELEGRAM_BOT_TOKEN) savedTo.push('Telegram');

        console.log('✅ Yangi buyurtma saqlandi:', {
            id: savedOrder?.id,
            total,
            itemsCount: items.length,
            savedTo
        });

        res.json({
            success: true,
            message: 'Buyurtma muvaffaqiyatli qabul qilindi va saqlandi!',
            orderMessage: orderMessage,
            orderId: savedOrder?.id
        });
    } catch (error) {
        console.error('Xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq qayta urinib ko\'ring.'
        });
    }
});

// Public endpoint'lar o'chirildi - ma'lumotlar faqat database'da va Telegram'da

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        telegram: {
            botToken: TELEGRAM_BOT_TOKEN ? 'Sozlangan' : 'Sozlanmagan',
            chatId: TELEGRAM_CHAT_ID ? 'Sozlangan' : 'Sozlanmagan'
        }
    });
});

// Telegram bot test endpoint
app.get('/api/test-telegram', async (req, res) => {
    try {
        const testMessage = `
🧪 <b>Test Xabari</b>

Bu test xabari. Agar siz buni ko'ryapsiz, Telegram bot to'g'ri ishlayapti!

🕐 Sana: ${new Date().toLocaleString('uz-UZ')}
        `.trim();
        
        const result = await sendToTelegram(testMessage);
        
        res.json({
            success: result,
            message: result 
                ? '✅ Telegram bot to\'g\'ri ishlayapti! Xabarni tekshiring.' 
                : '❌ Telegram bot ishlamayapti. Console\'dagi xatoliklarni ko\'ring.',
            botToken: TELEGRAM_BOT_TOKEN ? 'Sozlangan' : 'Sozlanmagan',
            chatId: TELEGRAM_CHAT_ID ? 'Sozlangan' : 'Sozlanmagan'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Xatolik: ' + error.message
        });
    }
});

// Server ishga tushirish funksiyasi
async function startServer(port) {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server ishga tushdi: http://localhost:${port}`);
            console.log(`🌐 Tashqi kirish: http://0.0.0.0:${port}`);
            console.log(`📁 Statik fayllar: ${__dirname}`);
            console.log(`\n🧪 Telegram botni test qilish: http://localhost:${port}/api/test-telegram\n`);
            resolve(server);
        });

        server.on('error', async (error) => {
            if (error.code === 'EADDRINUSE') {
                const usedPort = error.port || port;
                console.error(`\n⚠️  Port ${usedPort} band. Bo'sh port qidiryapman...`);
                
                try {
                    const availablePort = await findAvailablePort(usedPort + 1);
                    console.log(`✅ Bo'sh port topildi: ${availablePort}`);
                    console.log(`🔄 Server ${availablePort} portida ishga tushmoqda...\n`);
                    
                    // Yangi port bilan qayta ishga tushirish
                    startServer(availablePort).then(resolve).catch(reject);
                } catch (findError) {
                    console.error(`\n❌ Xatolik: ${findError.message}`);
                    console.error(`\n💡 Qo'lda hal qilish:`);
                    console.error(`   1. Eski process'ni to'xtatish:`);
                    console.error(`      pm2 stop royal-nuts`);
                    console.error(`      pm2 delete royal-nuts`);
                    console.error(`      yoki`);
                    console.error(`      kill -9 $(lsof -t -i:${usedPort})`);
                    console.error(`\n   2. Port ${usedPort} ishlatayotgan process'ni topish:`);
                    console.error(`      lsof -i :${usedPort}`);
                    console.error(`      yoki`);
                    console.error(`      netstat -tulpn | grep :${usedPort}\n`);
                    reject(findError);
                }
            } else {
                console.error('❌ Server xatolik:', error);
                reject(error);
            }
        });
    });
}

// Server ishga tushirish
console.log(`🔧 Server port: ${PORT} (${process.env.PORT ? '.env dan' : 'default 3002'})`);

startServer(PORT).catch((error) => {
    console.error('❌ Server ishga tushirishda xatolik:', error);
    process.exit(1);
});

// Xatoliklarni tutish
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

