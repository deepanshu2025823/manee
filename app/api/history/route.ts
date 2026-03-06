// app/api/history/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
const pool = require('@/lib/db');

export async function GET() {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'guest';

    try {
        const [rows] = await pool.query(
            'SELECT * FROM chats WHERE user_email = ? ORDER BY created_at DESC', 
            [userEmail]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'guest';
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    try {
        if (chatId) {
            await pool.query(
                'DELETE FROM chats WHERE chat_id = ? AND user_email = ?', 
                [chatId, userEmail]
            );
            return NextResponse.json({ message: "Chat deleted" });
        } else {
            await pool.query('DELETE FROM chats WHERE user_email = ?', [userEmail]);
            return NextResponse.json({ message: "User history cleared" });
        }
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}