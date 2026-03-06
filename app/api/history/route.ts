// app/api/history/route.ts

import { NextResponse } from 'next/server';
const pool = require('@/lib/db');

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM chats ORDER BY created_at DESC');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    try {
        if (chatId) {
            await pool.query('DELETE FROM chats WHERE chat_id = ?', [chatId]);
            return NextResponse.json({ message: "Chat deleted" });
        } else {
            await pool.query('SET FOREIGN_KEY_CHECKS = 0');
            await pool.query('TRUNCATE TABLE messages');
            await pool.query('TRUNCATE TABLE chats');
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
            return NextResponse.json({ message: "History cleared" });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}