'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/ot/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/ot/admin/dashboard');
            } else {
                setError(data.message === 'Invalid credentials' ? '아이디 또는 비밀번호가 올바르지 않습니다.' : '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 -translate-y-1/2"></div>
            </div>

            <div className="relative z-10 max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-5 bg-white rounded-2xl shadow-xl shadow-indigo-100 mb-6 ring-1 ring-gray-100">
                        <svg className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 font-outfit tracking-tight">
                        Admin Portal
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        인하대학교 소프트웨어융합대학 OT 관리 시스템
                    </p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="id" className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide ml-1">
                                    ID
                                </label>
                                <input
                                    id="id"
                                    name="id"
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="관리자 아이디"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide ml-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="비밀번호"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-pulse">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? '로그인 중...' : (
                                <span className="flex items-center text-base">
                                    로그인
                                    <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-center text-xs font-medium text-gray-400">
                    Secure Access • Authorized Personnel Only
                </p>
            </div>
        </div>
    );
}
