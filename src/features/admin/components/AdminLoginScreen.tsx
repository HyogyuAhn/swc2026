import type { FormEvent } from 'react';

type AdminLoginScreenProps = {
    id: string;
    pw: string;
    error: string;
    onIdChange: (value: string) => void;
    onPwChange: (value: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function AdminLoginScreen({
    id,
    pw,
    error,
    onIdChange,
    onPwChange,
    onSubmit
}: AdminLoginScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Admin Login</h1>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                <div className="space-y-4">
                    <input type="text" placeholder="Admin ID" value={id} onChange={e => onIdChange(e.target.value)} className="w-full p-3 border rounded-lg" />
                    <input type="password" placeholder="Password" value={pw} onChange={e => onPwChange(e.target.value)} className="w-full p-3 border rounded-lg" />
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">Login</button>
                </div>
            </form>
        </div>
    );
}
