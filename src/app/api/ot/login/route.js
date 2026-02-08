import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { id, password } = await request.json();

        const CS_ID = process.env.SWC_CS_ID;
        const CS_PW = process.env.SWC_CS_PW;
        const AI_ID = process.env.SWC_AI_ID;
        const AI_PW = process.env.SWC_AI_PW;

        let department = null;

        if (id === CS_ID && password === CS_PW) {
            department = 'CS';
        } else if (id === AI_ID && password === AI_PW) {
            department = 'AI';
        }

        if (department) {
            const cookieStore = await cookies();
            cookieStore.set('ot_admin_session', JSON.stringify({ department, loggedIn: true }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            return NextResponse.json({ success: true, department });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
