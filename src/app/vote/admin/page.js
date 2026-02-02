'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LogOut, Plus, Trash2, StopCircle, CheckCircle, Clock, LayoutDashboard, Settings, List, X, Edit3, Eye, EyeOff } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');

    const [view, setView] = useState('DASHBOARD');
    const [votes, setVotes] = useState([]);
    const [selectedVote, setSelectedVote] = useState(null);

    const [counts, setCounts] = useState({ upcoming: 0, active: 0, ended: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());

    const [formData, setFormData] = useState({
        title: '',
        startDate: '', startAmPm: 'AM', startHour: '12', startMinute: '00', startSecond: '00',
        endDate: '', endAmPm: 'AM', endHour: '12', endMinute: '00', endSecond: '00',
        options: [''],
        showLiveResults: false,
        showFinalResults: false
    });

    useEffect(() => {
        const session = localStorage.getItem('swc_admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchVotes();
        }

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const poller = setInterval(() => {
            if (localStorage.getItem('swc_admin_session') === 'true') fetchVotes();
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(poller);
        };
    }, []);

    useEffect(() => {
        if (votes.length > 0) {
            const now = new Date();
            let u = 0, a = 0, e = 0;
            votes.forEach(v => {
                const s = new Date(v.start_at);
                const end = new Date(v.end_at);
                if (now < s) u++;
                else if (now <= end) a++;
                else e++;
            });
            setCounts({ upcoming: u, active: a, ended: e });
        }
    }, [votes, currentTime]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ id, pw }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setIsAuthenticated(true);
            localStorage.setItem('swc_admin_session', 'true');
            fetchVotes();
        } else {
            setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('swc_admin_session');
        setIsAuthenticated(false);
        setId('');
        setPw('');
    };

    const fetchVotes = async () => {
        const { data } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('created_at', { ascending: false });

        if (data) setVotes(data);
    };

    const getStatus = (vote) => {
        const now = new Date();
        const start = new Date(vote.start_at);
        const end = new Date(vote.end_at);
        if (now < start) return 'UPCOMING';
        if (now >= start && now <= end) return 'ACTIVE';
        return 'ENDED';
    };

    const getRemainingTime = (endDate) => {
        const total = Date.parse(endDate) - Date.parse(new Date());
        if (total <= 0) return null;
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}일 ${hours}시간 남음`;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 남음`;
    };

    const parseDateToForm = (isoStr) => {
        const d = new Date(isoStr);
        let h = d.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return {
            date: d.toISOString().split('T')[0],
            ampm,
            hour: h.toString(),
            minute: d.getMinutes().toString().padStart(2, '0'),
            second: d.getSeconds().toString().padStart(2, '0')
        };
    };

    const startCreate = () => {
        setFormData({
            title: '',
            startDate: '', startAmPm: 'AM', startHour: '12', startMinute: '00', startSecond: '00',
            endDate: '', endAmPm: 'AM', endHour: '12', endMinute: '00', endSecond: '00',
            options: [''],
            showLiveResults: false,
            showFinalResults: false
        });
        setView('CREATE');
    };

    const startEdit = (vote) => {
        const start = parseDateToForm(vote.start_at);
        const end = parseDateToForm(vote.end_at);

        setFormData({
            id: vote.id,
            title: vote.title,
            startDate: start.date, startAmPm: start.ampm, startHour: start.hour, startMinute: start.minute, startSecond: start.second,
            endDate: end.date, endAmPm: end.ampm, endHour: end.hour, endMinute: end.minute, endSecond: end.second,
            options: vote.vote_options.map(o => o.name),
            showLiveResults: vote.show_live_results || false,
            showFinalResults: vote.show_final_results || false
        });
        setSelectedVote(vote);
        setView('EDIT');
    };

    const convertToISO = (date, ampm, hour, minute, second) => {
        let h = parseInt(hour);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return new Date(`${date}T${h.toString().padStart(2, '0')}:${minute}:${second}`).toISOString();
    };

    const handleSave = async () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            alert('필수 정보를 입력해주세요.');
            return;
        }

        const startAt = convertToISO(formData.startDate, formData.startAmPm, formData.startHour, formData.startMinute, formData.startSecond);
        const endAt = convertToISO(formData.endDate, formData.endAmPm, formData.endHour, formData.endMinute, formData.endSecond);

        if (new Date(endAt) <= new Date(startAt)) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        const status = view === 'EDIT' ? getStatus(selectedVote) : 'NEW';
        const isRestricted = status === 'ACTIVE' || status === 'ENDED';

        const votePayload = {
            title: formData.title,
            start_at: startAt,
            end_at: endAt,
            show_live_results: formData.showLiveResults,
            show_final_results: formData.showFinalResults
        };

        if (view === 'EDIT' && isRestricted) {
            const { error } = await supabase
                .from('votes')
                .update({
                    show_live_results: formData.showLiveResults,
                    show_final_results: formData.showFinalResults,
                })
                .eq('id', selectedVote.id);

            if (error) alert(error.message);
            else {
                alert('설정이 저장되었습니다.');
                fetchVotes();
                setView('DASHBOARD');
            }
            return;
        }

        let voteId = selectedVote?.id;

        if (view === 'CREATE') {
            const { data, error } = await supabase
                .from('votes')
                .insert(votePayload)
                .select()
                .single();

            if (error) { alert(error.message); return; }
            voteId = data.id;
        } else {
            const { error } = await supabase
                .from('votes')
                .update(votePayload)
                .eq('id', voteId);
            if (error) { alert(error.message); return; }
        }

        if (!isRestricted) {
            if (view === 'EDIT') {
                await supabase.from('vote_options').delete().eq('vote_id', voteId);
            }

            const optionsToInsert = formData.options
                .filter(o => o.trim() !== '')
                .map(name => ({ vote_id: voteId, name }));

            await supabase.from('vote_options').insert(optionsToInsert);
        }

        alert('저장되었습니다.');
        fetchVotes();
        setView('DASHBOARD');
    };

    const handleDelete = async () => {
        if (!confirm('정말 이 투표를 삭제하시겠습니까? 데이터가 복구되지 않습니다.')) return;
        await supabase.from('votes').delete().eq('id', selectedVote.id);
        fetchVotes();
        setView('DASHBOARD');
    };

    const handleEarlyEnd = async (vote) => {
        if (!confirm('정말 조기 종료하시겠습니까?')) return;
        await supabase.from('votes').update({ end_at: new Date().toISOString() }).eq('id', vote.id);
        fetchVotes();
    };

    const removeOption = (index) => {
        if (formData.options.length <= 1) return;
        setFormData({
            ...formData,
            options: formData.options.filter((_, i) => i !== index)
        });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Admin Login</h1>
                    {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                    <div className="space-y-4">
                        <input type="text" placeholder="Admin ID" value={id} onChange={e => setId(e.target.value)} className="w-full p-3 border rounded-lg" />
                        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} className="w-full p-3 border rounded-lg" />
                        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">Login</button>
                    </div>
                </form>
            </div>
        );
    }

    const TimeSelector = ({ prefix, disabled }) => (
        <div className="flex gap-1 w-full text-sm">
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}AmPm`]} onChange={e => setFormData({ ...formData, [`${prefix}AmPm`]: e.target.value })}>
                <option value="AM">오전</option><option value="PM">오후</option>
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Hour`]} onChange={e => setFormData({ ...formData, [`${prefix}Hour`]: e.target.value })}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}시</option>)}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Minute`]} onChange={e => setFormData({ ...formData, [`${prefix}Minute`]: e.target.value })}>
                {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Second`]} onChange={e => setFormData({ ...formData, [`${prefix}Second`]: e.target.value })}>
                {Array.from({ length: 60 }, (_, i) => i).map(s => <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}초</option>)}
            </select>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
                <div className="p-6 border-b border-gray-100 cursor-pointer" onClick={() => setView('DASHBOARD')}>
                    <h1 className="font-bold text-xl text-blue-900 flex items-center gap-2">
                        <LayoutDashboard size={20} /> ADMIN
                    </h1>
                </div>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="text-xs font-bold text-gray-500">LIST VIEW</span>
                    <button onClick={() => { setView('CREATE'); setSelectedVote(null); }} className="p-1 bg-white border rounded hover:bg-blue-50 text-blue-600">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {votes.map(vote => {
                        const s = getStatus(vote);
                        return (
                            <div
                                key={vote.id}
                                onClick={() => startEdit(vote)}
                                className={`p-3 rounded-lg cursor-pointer text-sm transition border
                            ${selectedVote?.id === vote.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100 border-transparent'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${s === 'ACTIVE' ? 'bg-green-500' : s === 'UPCOMING' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
                                    <span className="font-medium truncate">{vote.title}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {view === 'DASHBOARD' && (
                    <div className="p-10 max-w-5xl mx-auto">
                        <h2 className="text-3xl font-bold mb-8 text-gray-800">대시보드</h2>

                        {/* Status Cards */}
                        <div className="grid grid-cols-3 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">진행 중</p>
                                    <p className="text-4xl font-bold text-green-600">{counts.active}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><CheckCircle /></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">시작 전</p>
                                    <p className="text-4xl font-bold text-yellow-500">{counts.upcoming}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500"><Clock /></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">종료됨</p>
                                    <p className="text-4xl font-bold text-gray-500">{counts.ended}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><StopCircle /></div>
                            </div>
                        </div>

                        {/* Active Votes Actions */}
                        <h3 className="font-bold text-lg text-gray-700 mb-4">진행 중인 투표 관리</h3>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {votes.filter(v => getStatus(v) === 'ACTIVE').length === 0 ? (
                                <div className="p-8 text-center text-gray-400">현재 진행 중인 투표가 없습니다.</div>
                            ) : (
                                votes.filter(v => getStatus(v) === 'ACTIVE').map(vote => (
                                    <div key={vote.id} className="p-6 border-b last:border-0 hover:bg-gray-50 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                                {vote.title}
                                                <span className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                                    {getRemainingTime(vote.end_at)}
                                                </span>
                                            </h4>
                                            <p className="text-sm text-gray-500">~ {new Date(vote.end_at).toLocaleString()} 종료 예정</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(vote)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                                                관리 / 설정
                                            </button>
                                            <button onClick={() => handleEarlyEnd(vote)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                                조기 종료
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {(view === 'CREATE' || view === 'EDIT') && (
                    <div className="p-10 max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {view === 'CREATE' ? '새 투표 생성' : '투표 수정 / 관리'}
                            </h2>
                            {view === 'EDIT' && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                            ${getStatus(selectedVote) === 'ACTIVE' ? 'bg-green-500' :
                                        getStatus(selectedVote) === 'UPCOMING' ? 'bg-yellow-400' : 'bg-red-500'}`}>
                                    {getStatus(selectedVote)}
                                </span>
                            )}
                        </div>

                        {view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED') && (
                            <div className="mb-6 p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-100 flex items-center gap-2">
                                <AlertCircle size={16} />
                                <span>진행 중이거나 종료된 투표는 <b>공개 설정</b>만 변경 가능합니다. (내용 수정 불가)</span>
                            </div>
                        )}

                        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">투표 제목</label>
                                <input
                                    type="text"
                                    disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')}
                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Time Settings */}
                            <div className="grid grid-cols-1 gap-4">
                                <label className="block text-sm font-bold text-gray-700">진행 기간</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 block mb-2">시작</span>
                                        <input
                                            type="date"
                                            disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')}
                                            className="w-full p-2 border rounded mb-2 bg-white"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                        <TimeSelector prefix="start" disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')} />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 block mb-2">종료</span>
                                        <input
                                            type="date"
                                            disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')}
                                            className="w-full p-2 border rounded mb-2 bg-white"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                        <TimeSelector prefix="end" disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')} />
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">투표 항목</label>
                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')}
                                            className="flex-1 p-3 border rounded-lg"
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...formData.options];
                                                newOpts[idx] = e.target.value;
                                                setFormData({ ...formData, options: newOpts });
                                            }}
                                        />
                                        {!(view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')) && (
                                            <button onClick={() => removeOption(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!(view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')) && (
                                    <button onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })} className="text-blue-600 font-bold text-sm flex items-center gap-1 mt-2">
                                        <Plus size={16} /> 항목 추가
                                    </button>
                                )}
                            </div>

                            <hr className="border-gray-100 my-6" />

                            {/* Visibility Settings */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <Settings size={18} /> 공개 설정
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition
                                  ${formData.showLiveResults ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                                        <input type="checkbox" className="w-5 h-5 mr-3"
                                            checked={formData.showLiveResults}
                                            onChange={e => setFormData({ ...formData, showLiveResults: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-bold block text-gray-800">실시간 결과 공개</span>
                                            <span className="text-xs text-gray-500">진행 중에 득표율을 공개합니다.</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition
                                  ${formData.showFinalResults ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                                        <input type="checkbox" className="w-5 h-5 mr-3"
                                            checked={formData.showFinalResults}
                                            onChange={e => setFormData({ ...formData, showFinalResults: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-bold block text-gray-800">종료 후 결과 공개</span>
                                            <span className="text-xs text-gray-500">투표 종료 시 결과를 공개합니다.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6">
                                {view === 'EDIT' && (
                                    <button onClick={handleDelete} className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">
                                        삭제
                                    </button>
                                )}
                                <div className="flex-1"></div>
                                <button onClick={() => setView('DASHBOARD')} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">
                                    취소
                                </button>
                                <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    저장하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AlertCircle({ size }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
}
