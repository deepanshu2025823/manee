// server.js
require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('./lib/db'); 
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; 
const port = process.env.PORT || 10000; 

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, { 
    cors: { 
      origin: ["https://manee-two.vercel.app", "http://localhost:3000"], 
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    connectTimeout: 60000
  });

  io.on('connection', (socket) => {
    console.log('User connected to Manee AI:', socket.id);

    socket.on('loadChatHistory', async ({ chatId, userEmail }) => {
      try {
        const [messages] = await pool.query(
          `SELECT role, content FROM messages m 
           JOIN chats c ON m.chat_id = c.chat_id 
           WHERE m.chat_id = ? AND c.user_email = ? 
           ORDER BY m.id ASC`, 
          [chatId, userEmail || 'guest']
        );
        socket.emit('chatHistoryLoaded', { messages, chatId });
      } catch (error) {
        console.error('History Load Error:', error.message);
        socket.emit('error', { message: 'History fetch failed.' });
      }
    });

    socket.on('sendMessage', async (data) => {
      const { prompt, chatId = uuidv4(), userEmail = 'guest' } = data;
      
      try {
        await pool.query(
          'INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', 
          [chatId, prompt.substring(0, 50), userEmail]
        );

        await pool.query(
          'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
          [chatId, 'user', prompt]
        );

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContentStream(prompt);

        let fullManeeResponse = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullManeeResponse += chunkText;
          socket.emit('receiveMessageChunk', { text: chunkText, chatId });
        }

        await pool.query(
          'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
          [chatId, 'manee', fullManeeResponse]
        );
        
        socket.emit('messageComplete', { chatId });

      } catch (error) {
        console.error('Logic Error Details:', error.message);
        socket.emit('error', { message: 'Database sync error. Please try again.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Manee AI is live on port ${port}`);
  });
});