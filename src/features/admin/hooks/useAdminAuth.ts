'use client';

import { useEffect, useState, type FormEvent } from 'react';

export default function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const session = localStorage.getItem('swc_admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ id, pw }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            setError('아이디 또는 비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsAuthenticated(true);
        setError('');
        localStorage.setItem('swc_admin_session', 'true');
    };

    const handleLogout = () => {
        localStorage.removeItem('swc_admin_session');
        setIsAuthenticated(false);
        setId('');
        setPw('');
        setError('');
    };

    return {
        isAuthenticated,
        id,
        setId,
        pw,
        setPw,
        error,
        handleLogin,
        handleLogout
    };
}
