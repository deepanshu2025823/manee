// app/api/chat/route.ts

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
        const { prompt, chatId = uuidv4() } = await req.json();

        await pool.query(
            'INSERT IGNORE INTO chats (chat_id, title, user_email) VALUES (?, ?, ?)',
            [chatId, prompt.substring(0, 50), userEmail]
        );

        await pool.query(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chatId, 'user', prompt]
        );

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        const result = await model.generateContent(prompt);
        const fullManeeResponse = result.response.text();

        await pool.query(
            'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
            [chatId, 'manee', fullManeeResponse]
        );

        return NextResponse.json({ text: fullManeeResponse, chatId });

    } catch (error: any) {
        console.error('Logic Error:', error.message);
        return NextResponse.json({ error: 'Database sync error' }, { status: 500 });
    }
}