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

        const imageKeywords = ['generate', 'create', 'draw', 'banao', 'photo', 'image', 'picture'];
        const isImageRequest = imageKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

        await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', 
            [chatId, prompt.substring(0, 50), userEmail]);
        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
            [chatId, 'user', prompt]);

        let finalResponseText = "";
        let generatedImageData = null;

        if (isImageRequest) {
            const imgModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
            
            const result = await imgModel.generateContent(prompt);
            const response = await result.response;
            
            for (const part of response.candidates![0].content.parts) {
                if (part.text) {
                    finalResponseText += part.text;
                } else if (part.inlineData) {
                    generatedImageData = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || "image/png";
                    
                    const imgMarkdown = `\n\n![Generated Image](data:${mimeType};base64,${generatedImageData})`;
                    finalResponseText += imgMarkdown;
                }
            }
        } else {
            const [rows]: any = await pool.query(
                'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC LIMIT 10',
                [chatId]
            );

            const history = rows.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const chatModel = genAI.getGenerativeModel({ 
                model: "gemini-3.1-flash", 
                systemInstruction: "You are Manee, a helpful, witty AI. Use Hinglish if needed. Be concise." 
            });

            const chatSession = chatModel.startChat({ history });
            const result = await chatSession.sendMessage(prompt);
            finalResponseText = result.response.text();
        }

        await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
            [chatId, 'manee', finalResponseText]);

        return NextResponse.json({ 
            text: finalResponseText, 
            chatId,
            image: generatedImageData 
        });

    } catch (error: any) {
        console.error('Logic Error:', error.message);
        return NextResponse.json({ error: 'Mafi chahta hoon, image generate nahi ho saki.' }, { status: 500 });
    }
}