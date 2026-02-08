import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('ot_admin_session');

    if (!session) {
        return NextResponse.json({ loggedIn: false });
    }

    try {
        const data = JSON.parse(session.value);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ loggedIn: false });
    }
}
