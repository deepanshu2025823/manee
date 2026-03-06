// pages/api/socket.ts
import { Server } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
const pool = require('../../lib/db');
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: any, res: any) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      connectTimeout: 45000,
      pingTimeout: 45000,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      socket.on('sendMessage', async (data) => {
        const { prompt, chatId = uuidv4(), userEmail = 'guest' } = data;
        try {
          await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', [chatId, prompt.substring(0, 50), userEmail]);
          await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', prompt]);

          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContentStream(prompt);

          let fullResponse = "";
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            socket.emit('receiveMessageChunk', { text, chatId });
          }
          await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'manee', fullResponse]);
          socket.emit('messageComplete', { chatId });
        } catch (error) {
          console.error("AI/DB Error:", error);
          socket.emit('error', { message: 'Manee sync error.' });
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}