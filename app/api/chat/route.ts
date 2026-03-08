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

        await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', 
            [chatId, prompt.substring(0, 50), userEmail]);
        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
            [chatId, 'user', prompt]);

        const imageKeywords = ['generate', 'create', 'draw', 'banao', 'photo', 'image'];
        const isImageRequest = imageKeywords.some(kw => prompt.toLowerCase().includes(kw));

        let responseText = "";
        let modelId = isImageRequest ? "gemini-3.1-flash-image-preview" : "gemini-1.5-flash";

        const model = genAI.getGenerativeModel({ 
            model: modelId,
            ...(!isImageRequest && { systemInstruction: "You are Manee, a witty AI. Use Hinglish." })
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;

        for (const part of response.candidates![0].content.parts) {
            if (part.text) {
                responseText += part.text;
            } else if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                responseText += `\n\n![Generated Image](data:${mimeType};base64,${base64Data})`;
            }
        }

        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
            [chatId, 'manee', responseText]);

        return NextResponse.json({ text: responseText, chatId });

    } catch (error: any) {
        console.error('Logic Error:', error.message);
        return NextResponse.json({ error: 'Mafi chahta hoon, Manee abhi busy hai.' }, { status: 500 });
    }
}