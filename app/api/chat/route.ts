import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';
const pool = require('@/lib/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userEmail = session?.user?.email || 'guest';
        const { prompt, chatId: existingChatId } = await req.json();
        const chatId = existingChatId || uuidv4();

        const imageKeywords = ['generate image', 'create image', 'banao image', 'photo banao', 'generate an image of', 'draw'];
        const isImageRequest = imageKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

        if (isImageRequest) {
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

            const imageMarkdown = `![Generated Image](${imageUrl})`;
            const responseText = `Zaroor! Maine aapke liye ye image generate ki hai: \n\n ${imageMarkdown}`;

            await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', [chatId, "Image: " + prompt.substring(0, 30), userEmail]);
            await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', prompt]);
            await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'manee', responseText]);

            return NextResponse.json({ text: responseText, chatId });
        }

        const [rows]: any = await pool.query(
            'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC LIMIT 10',
            [chatId]
        );

        const history = rows.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', [chatId, prompt.substring(0, 50), userEmail]);
        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', prompt]);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: "You are Manee, a witty and helpful AI. If someone asks to draw or create an image, acknowledge it briefly. Use Hinglish." 
        });

        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();

        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'manee', responseText]);

        return NextResponse.json({ text: responseText, chatId });

    } catch (error: any) {
        console.error('Logic Error:', error.message);
        return NextResponse.json({ error: 'Mafi chahta hoon, database sync error.' }, { status: 500 });
    }
}