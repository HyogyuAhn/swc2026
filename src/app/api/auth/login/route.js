import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, pw } = body;

        const adminId = process.env.VOTE_ADMIN_ID;
        const adminPw = process.env.VOTE_ADMIN_PW;

        if (id === adminId && pw === adminPw) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
