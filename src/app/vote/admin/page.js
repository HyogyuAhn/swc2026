'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, Plus, Trash2, StopCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');

    const [votes, setVotes] = useState([]);
    const [selectedVote, setSelectedVote] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const [newVote, setNewVote] = useState({
        title: '',
        start_at: '',
        end_at: '',
        options: ['']
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ id, pw }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsAuthenticated(true);
            fetchVotes();
        } else {
            setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
    };

    const fetchVotes = async () => {
        const { data, error } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('created_at', { ascending: false });

        if (data) setVotes(data);
    };

    const getStatusColor = (vote) => {
        const now = new Date();
        const start = new Date(vote.start_at);
        const end = new Date(vote.end_at);

        if (now < start) return 'bg-yellow-400';
        if (now >= start && now <= end) return 'bg-green-500';
        return 'bg-red-500';
    };

    const handleCreateVote = async () => {
        const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .insert({
                title: newVote.title,
                start_at: new Date(newVote.start_at).toISOString(),
                end_at: new Date(newVote.end_at).toISOString()
            })
            .select()
            .single();

        if (voteError) {
            alert('투표 생성 실패: ' + voteError.message);
            return;
        }

        const optionsToInsert = newVote.options
            .filter(o => o.trim() !== '')
            .map(name => ({ vote_id: voteData.id, name }));

        const { error: optionError } = await supabase
            .from('vote_options')
            .insert(optionsToInsert);

        if (optionError) {
            alert('옵션 저장 실패');
        } else {
            alert('투표가 생성되었습니다.');
            setIsCreating(false);
            fetchVotes();
        }
    };

    const handleEarlyEnd = async (voteId) => {
        if (!confirm('정말 투표를 조기 종료하시겠습니까?')) return;

        await supabase
            .from('votes')
            .update({ end_at: new Date().toISOString() })
            .eq('id', voteId);

        fetchVotes();
        if (selectedVote?.id === voteId) {
            setSelectedVote(prev => ({ ...prev, end_at: new Date().toISOString() }));
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Admin Login</h1>
                    {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Admin ID"
                            value={id}
                            onChange={e => setId(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={pw}
                            onChange={e => setPw(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-xl text-gray-800">투표 목록</h2>
                    <button onClick={() => { setIsCreating(true); setSelectedVote(null); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {votes.map(vote => (
                        <div
                            key={vote.id}
                            onClick={() => { setSelectedVote(vote); setIsCreating(false); }}
                            className={`p-4 rounded-lg cursor-pointer transition border ${selectedVote?.id === vote.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(vote)}`}></div>
                                <span className="font-medium text-gray-700 truncate">{vote.title}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {new Date(vote.start_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {isCreating ? (
                    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-2xl font-bold mb-6">새 투표 생성</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">투표 제목</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg"
                                    value={newVote.title}
                                    onChange={e => setNewVote({ ...newVote, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 border rounded-lg"
                                        value={newVote.start_at}
                                        onChange={e => setNewVote({ ...newVote, start_at: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 border rounded-lg"
                                        value={newVote.end_at}
                                        onChange={e => setNewVote({ ...newVote, end_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">투표 항목</label>
                                {newVote.options.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        className="w-full p-3 border rounded-lg mb-2"
                                        placeholder={`항목 ${idx + 1}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...newVote.options];
                                            newOpts[idx] = e.target.value;
                                            setNewVote({ ...newVote, options: newOpts });
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => setNewVote({ ...newVote, options: [...newVote.options, ''] })}
                                    className="text-blue-500 text-sm hover:underline"
                                >
                                    + 항목 추가
                                </button>
                            </div>
                            <button
                                onClick={handleCreateVote}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                            >
                                투표 생성하기
                            </button>
                        </div>
                    </div>
                ) : selectedVote ? (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-8 rounded-xl shadow-sm mb-6">
                            <div className="flex justify-between items-start mb-6">
                                <h1 className="text-3xl font-bold text-gray-900">{selectedVote.title}</h1>
                                <div className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(selectedVote)}`}>
                                    {getStatusColor(selectedVote).includes('yellow') ? '예정됨' : getStatusColor(selectedVote).includes('green') ? '진행중' : '종료됨'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>시작: {new Date(selectedVote.start_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>종료: {new Date(selectedVote.end_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <h3 className="font-semibold text-gray-700">투표 항목</h3>
                                <ul>
                                    {selectedVote.vote_options?.map(opt => (
                                        <li key={opt.id} className="p-3 bg-gray-50 rounded-lg mb-2">{opt.name}</li>
                                    ))}
                                </ul>
                            </div>

                            {getStatusColor(selectedVote).includes('green') && (
                                <button
                                    onClick={() => handleEarlyEnd(selectedVote.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                >
                                    <StopCircle size={18} />
                                    투표 조기 종료
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus size={32} />
                        </div>
                        <p>왼쪽 메뉴에서 투표를 선택하거나<br />새로운 투표를 만들어보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
