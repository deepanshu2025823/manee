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
  if (res.socket.server.io) {
    console.log('Socket already running');
    res.end();
    return;
  }

  console.log('Socket is initializing...');
  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('User connected via Vercel Socket');

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
        console.error('Socket Logic Error:', error);
        socket.emit('error', { message: 'Database sync error or AI timeout.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  });

  res.end();
}