// app/api/history/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 
const pool = require('@/lib/db');

export async function GET() {
    try {
        const session = await getServerSession(authOptions); 
        const userEmail = session?.user?.email || 'guest';

        if (!pool) {
            return NextResponse.json({ error: "DB pool is missing" }, { status: 500 });
        }

        const [rows] = await pool.query(
            'SELECT * FROM chats WHERE user_email = ? ORDER BY created_at DESC', 
            [userEmail]
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("API GET Error:", error);
        return NextResponse.json({ 
            error: "Failed to fetch history", 
            db_error_message: error.message,
            db_error_code: error.code 
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userEmail = session?.user?.email || 'guest';
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');

        if (chatId) {
            await pool.query('DELETE FROM chats WHERE chat_id = ? AND user_email = ?', [chatId, userEmail]);
            return NextResponse.json({ message: "Chat deleted" });
        } else {
            await pool.query('DELETE FROM chats WHERE user_email = ?', [userEmail]);
            return NextResponse.json({ message: "History cleared" });
        }
    } catch (error: any) {
        return NextResponse.json({ error: "Delete failed", details: error.message }, { status: 500 });
    }
}