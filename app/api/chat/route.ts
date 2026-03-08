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

        try {
            await pool.query('INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)', 
                [chatId, prompt.substring(0, 50), userEmail]);
            await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
                [chatId, 'user', prompt]);
        } catch (dbErr) {
            console.error("DB User Message Error:", dbErr);
        }

        const imageKeywords = ['generate', 'create', 'draw', 'banao', 'photo', 'image'];
        const isImageRequest = imageKeywords.some(kw => prompt.toLowerCase().includes(kw));

        let responseText = "";
        
        if (isImageRequest) {
            const imgModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
            
            const result = await imgModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    // @ts-ignore 
                    responseModalities: ["TEXT", "IMAGE"],
                }
            });

            const response = await result.response;
            const candidates = response.candidates;

            if (!candidates || candidates.length === 0) {
                throw new Error("No candidates returned from Image Model");
            }

            for (const part of candidates[0].content.parts) {
                if (part.text) {
                    responseText += part.text;
                } else if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    responseText += `\n\n![Generated Image](data:${mimeType};base64,${base64Data})`;
                }
            }
        } else {
            const chatModel = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash", 
                systemInstruction: "You are Manee, a helpful, witty AI. Use Hinglish if the user talks in Hindi. Be concise." 
            });

            const result = await chatModel.generateContent(prompt);
            responseText = result.response.text();
        }

        try {
            await pool.query('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', 
                [chatId, 'manee', responseText]);
        } catch (dbErr) {
            console.error("DB Manee Response Error:", dbErr);
        }

        return NextResponse.json({ text: responseText, chatId });

    } catch (error: any) {
        console.error('Logic Error Details:', error);
        return NextResponse.json(
            { error: `Manee busy hai. Error: ${error.message}` }, 
            { status: 500 }
        );
    }
}