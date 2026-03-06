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
const hostname = 'localhost';
const port = process.env.PORT || 3000; 

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
      origin: dev ? "*" : ["https://manee-two.vercel.app"], 
      methods: ["GET", "POST"]
    } 
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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
        console.error('Logic Error:', error);
        socket.emit('error', { message: 'Database sync error.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Manee AI is ready for https://manee-two.vercel.app/`);
  });
});