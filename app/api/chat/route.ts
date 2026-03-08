import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';
const pool = require('@/lib/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userEmail = session?.user?.email || 'guest';
        let { prompt, chatId } = await req.json();

        if (!chatId) chatId = uuidv4();

        await pool.query(
            'INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)',
            [chatId, prompt.substring(0, 50), userEmail]
        );

        await pool.query(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chatId, 'user', prompt]
        );

        const [prevMessages]: any = await pool.query(
            'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC LIMIT 10',
            [chatId]
        );

        const history: Content[] = prevMessages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: "Your name is Manee. You are a highly professional, witty, and helpful AI assistant. You provide concise and accurate answers. You focus on helping Full Stack Developers with high-quality code. Speak like a genius peer, not a robot."
        });

        const chatSession = model.startChat({
            history: history.slice(0, -1), 
        });

        const result = await chatSession.sendMessage(prompt);
        const fullManeeResponse = result.response.text();

        await pool.query(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chatId, 'manee', fullManeeResponse]
        );

        return NextResponse.json({ text: fullManeeResponse, chatId });

    } catch (error: any) {
        console.error('Logic Error:', error.message);
        return NextResponse.json({ 
            error: 'Database sync error', 
            details: error.message 
        }, { status: 500 });
    }
}