'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { LogOut, Plus, Trash2, StopCircle, CheckCircle, Clock, LayoutDashboard, Settings, List, X, Edit3, Eye, EyeOff, BarChart2, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TimeSelector = ({ prefix, formData, setFormData, disabled }) => {
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex gap-1 w-full text-sm">
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}AmPm`]} onChange={e => handleChange(`${prefix}AmPm`, e.target.value)}>
                <option value="AM">오전</option><option value="PM">오후</option>
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Hour`]} onChange={e => handleChange(`${prefix}Hour`, e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}시</option>)}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Minute`]} onChange={e => handleChange(`${prefix}Minute`, e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Second`]} onChange={e => handleChange(`${prefix}Second`, e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => i).map(s => <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}초</option>)}
            </select>
        </div>
    );
};

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');

    const [view, setView] = useState('DASHBOARD');
    const [dashboardFilter, setDashboardFilter] = useState('ALL');
    const [votes, setVotes] = useState<any[]>([]);
    const [selectedVote, setSelectedVote] = useState<any>(null);
    const [voteRecords, setVoteRecords] = useState<any[]>([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsVote, setDetailsVote] = useState<any>(null);

    const [students, setStudents] = useState<any[]>([]);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [showStudentModal, setShowStudentModal] = useState(false);

    const [counts, setCounts] = useState({ upcoming: 0, active: 0, ended: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());

    const [voteStats, setVoteStats] = useState<Record<string, any>>({});

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    useEffect(() => {
        if (showDetailsModal || showStudentModal || showDeleteModal || view === 'CREATE' || view === 'EDIT') {
        }
        if (showDetailsModal || showStudentModal || showDeleteModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showDetailsModal, showStudentModal, showDeleteModal]);

    const [forceVoteData, setForceVoteData] = useState({
        targetStudentId: '',
        targetVoteId: '',
        targetOptionId: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        startDate: '', startAmPm: 'AM', startHour: '12', startMinute: '00', startSecond: '00',
        endDate: '', endAmPm: 'AM', endHour: '12', endMinute: '00', endSecond: '00',
        options: [''],
        showLiveResults: false,
        liveResultType: 'BOTH',
        liveResultShowTotal: true,
        liveResultShowTurnout: false,
        showFinalResults: false,
        finalResultType: 'BOTH',
        finalResultShowTotal: true,
        finalResultShowTurnout: false,
        showAfterEnd: true
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

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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
        const { data: votesData, error: voteError } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('created_at', { ascending: false });

        if (voteError) {
            console.error('Error fetching votes:', voteError);
            return;
        }

        if (votesData) {
            setVotes(votesData);

            const { data: records, error: recordError } = await supabase
                .from('vote_records')
                .select('vote_id, option_id')
                .eq('is_valid', true);

            if (recordError) {
                console.error('Error fetching records:', recordError);
                return;
            }

            if (records) {
                const stats = {};
                records.forEach(r => {
                    if (!stats[r.vote_id]) stats[r.vote_id] = { total: 0 };
                    if (!stats[r.vote_id][r.option_id]) stats[r.vote_id][r.option_id] = 0;

                    stats[r.vote_id][r.option_id]++;
                    stats[r.vote_id].total++;
                });
                setVoteStats(stats);
            }
        }
    };

    const fetchVoteDetails = async (vote: any) => {
        setDetailsVote(vote);
        setForceVoteData({ targetVoteId: vote.id, targetStudentId: '', targetOptionId: '' })
        const { data } = await supabase
            .from('vote_records')
            .select('*')
            .eq('vote_id', vote.id)
            .order('created_at', { ascending: false });

        if (data) setVoteRecords(data);
        setShowDetailsModal(true);
    };

    const toggleValidity = async (recordId, currentStatus) => {
        const { error } = await supabase
            .from('vote_records')
            .update({ is_valid: !currentStatus })
            .eq('id', recordId);

        if (!error) {
            setVoteRecords(prev => prev.map(r => r.id === recordId ? { ...r, is_valid: !currentStatus } : r));
            setStudentHistory(prev => prev.map(r => r.id === recordId ? { ...r, is_valid: !currentStatus } : r));
            fetchVotes();
        }
    };

    const handlePin = async (voteId) => {
        await supabase.from('votes').update({ is_pinned: false }).neq('id', '00000000-0000-0000-0000-000000000000');

        if (voteId !== 'NONE') {
            await supabase.from('votes').update({ is_pinned: true }).eq('id', voteId);
        }
        fetchVotes();
    };

    const getStatus = (vote: any): 'UPCOMING' | 'ACTIVE' | 'ENDED' => {
        const now = new Date();
        const start = new Date(vote.start_at);
        const end = new Date(vote.end_at);
        if (now < start) return 'UPCOMING';
        if (now >= start && now <= end) return 'ACTIVE';
        if (now < start) return 'UPCOMING';
        if (now >= start && now <= end) return 'ACTIVE';
        return 'ENDED';
    };

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setStudents(data);
        if (error) console.error(error);
    };

    const handleAddStudent = async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!/^\d{8}$/.test(studentIdInput)) {
            alert('학번은 8자리 숫자여야 합니다.');
            return;
        }

        const { error } = await supabase
            .from('students')
            .insert({ student_id: studentIdInput });

        if (error) {
            if (error.code === '23505') alert('이미 등록된 학번입니다.');
            else alert('등록 실패: ' + error.message);
        } else {
            setStudentIdInput('');
            fetchStudents();
        }
    };

    const handleToggleSuspend = async (student: any) => {
        const confirmMsg = student.is_suspended
            ? `${student.student_id} 학번의 정지를 해제하시겠습니까?`
            : `${student.student_id} 학번을 정지시키겠습니까?\n정지 시 해당 사용자는 로그아웃 처리됩니다.`;

        if (!confirm(confirmMsg)) return;

        const { error } = await supabase
            .from('students')
            .update({ is_suspended: !student.is_suspended })
            .eq('student_id', student.student_id);

        if (error) alert('처리 실패: ' + error.message);
        else fetchStudents();
    };

    const handleDeleteStudent = (student: any) => {
        setDeleteTarget({ type: 'STUDENT', data: student });
        setShowDeleteModal(true);
    };

    const executeDeleteStudent = async (mode: 'ID_ONLY' | 'ALL') => {
        const studentId = deleteTarget.data.student_id;

        if (mode === 'ALL') {
            const { error: historyError } = await supabase.from('vote_records').delete().eq('student_id', studentId);
            if (historyError) { alert(historyError.message); return; }
        }

        const { error } = await supabase.from('students').delete().eq('student_id', studentId);

        if (error) alert('삭제 실패: ' + error.message);
        else {
            fetchStudents();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleResetStudentVotes = async (student: any) => {
        if (!confirm(`${student.student_id} 의 모든 투표 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        const { error } = await supabase.from('vote_records').delete().eq('student_id', student.student_id);
        if (error) alert('초기화 실패: ' + error.message);
        else {
            alert('초기화되었습니다.');
            fetchStudents();
        }
    };

    const handleDeleteRecord = async (recordId: string, refreshCallback?: (() => void) | null) => {
        if (!confirm('정말 이 투표 기록을 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('vote_records').delete().eq('id', recordId);
        if (error) alert('삭제 실패: ' + error.message);
        else {
            if (refreshCallback) refreshCallback();
            fetchVotes();
        }
    };

    const handleForceAddVote = async () => {
        const { targetStudentId, targetVoteId, targetOptionId } = forceVoteData;
        if (!targetStudentId || !targetVoteId || !targetOptionId) {
            alert('모든 항목을 선택해주세요.');
            return;
        }

        const { data: student } = await supabase.from('students').select('student_id').eq('student_id', targetStudentId).single();
        const { data: existingVote } = await supabase.from('vote_records').select('id').eq('vote_id', targetVoteId).eq('student_id', targetStudentId).maybeSingle();

        if (!student) {
            if (!confirm(`등록되지 않은 학번(${targetStudentId})입니다.\n강제로 투표를 진행하시겠습니까? (학번이 자동 등록되지 않습니다)`)) return;
        }

        if (existingVote) {
            alert('이미 해당 투표에 참여한 기록이 있습니다.');
            return;
        }

        const { error } = await supabase.from('vote_records').insert({
            vote_id: targetVoteId,
            student_id: targetStudentId,
            option_id: targetOptionId,
            is_valid: true
        });

        if (error) alert('추가 실패: ' + error.message);
        else {
            alert('투표가 강제 추가되었습니다.');
            setForceVoteData({ ...forceVoteData, targetOptionId: '', targetStudentId: '' });
            if (showDetailsModal) fetchVoteDetails(detailsVote);
            if (showStudentModal) handleStudentDetails(selectedStudent);
            fetchVotes();
        }
    };

    const handleStudentDetails = async (student: any) => {
        setSelectedStudent(student);
        setForceVoteData({ targetStudentId: student.student_id, targetVoteId: '', targetOptionId: '' });
        const { data } = await supabase
            .from('vote_records')
            .select('*, votes(title, vote_options(id, name))')
            .eq('student_id', student.student_id)
            .order('created_at', { ascending: false });

        if (data) setStudentHistory(data);
        setShowStudentModal(true);
    };

    const getRemainingTime = (endDate: string | Date) => {
        const total = new Date(endDate).getTime() - Date.now();
        if (total <= 0) return null;
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}일 ${hours}시간 남음`;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 남음`;
    };

    const parseDateToForm = (isoStr: string) => {
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
            liveResultType: 'ALL',
            liveResultShowTotal: true,
            liveResultShowTurnout: true,
            showFinalResults: false,
            finalResultType: 'ALL',
            finalResultShowTotal: true,
            finalResultShowTurnout: false,
            showAfterEnd: true
        });
        setView('CREATE');
    };

    const startEdit = (vote: any) => {
        const start = parseDateToForm(vote.start_at);
        const end = parseDateToForm(vote.end_at);

        setFormData({
            title: vote.title,
            startDate: start.date, startAmPm: start.ampm, startHour: start.hour, startMinute: start.minute, startSecond: start.second,
            endDate: end.date, endAmPm: end.ampm, endHour: end.hour, endMinute: end.minute, endSecond: end.second,
            options: vote.vote_options.map(o => o.name),
            showLiveResults: vote.show_live_results || false,
            liveResultType: vote.live_result_type || 'BOTH',
            liveResultShowTotal: vote.live_result_show_total ?? true,
            liveResultShowTurnout: vote.live_result_show_turnout ?? false,
            showFinalResults: vote.show_final_results || false,
            finalResultType: vote.final_result_type || 'BOTH',
            finalResultShowTotal: vote.final_result_show_total ?? true,
            finalResultShowTurnout: vote.final_result_show_turnout ?? false,
            showAfterEnd: vote.show_after_end ?? true
        });
        setSelectedVote(vote);
        setView('EDIT');
    };

    const convertToISO = (date: string, ampm: string, hour: string, minute: string, second: string) => {
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
            live_result_type: formData.liveResultType,
            live_result_show_total: formData.liveResultShowTotal,
            live_result_show_turnout: formData.liveResultShowTurnout,
            show_final_results: formData.showFinalResults,
            final_result_type: formData.finalResultType,
            final_result_show_total: formData.finalResultShowTotal,
            final_result_show_turnout: formData.finalResultShowTurnout,
            show_after_end: formData.showAfterEnd,
            ...(formData.showAfterEnd ? {} : { is_pinned: false })
        };

        if (view === 'EDIT' && isRestricted) {
            const { error } = await supabase
                .from('votes')
                .update({
                    show_live_results: formData.showLiveResults,
                    live_result_type: formData.liveResultType,
                    live_result_show_total: formData.liveResultShowTotal,
                    live_result_show_turnout: formData.liveResultShowTurnout,
                    show_final_results: formData.showFinalResults,
                    final_result_type: formData.finalResultType,
                    final_result_show_total: formData.finalResultShowTotal,
                    final_result_show_turnout: formData.finalResultShowTurnout,
                    show_after_end: formData.showAfterEnd,
                    ...(formData.showAfterEnd ? {} : { is_pinned: false })
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

    const handleEarlyEnd = async (vote: any) => {
        if (!confirm('정말 조기 종료하시겠습니까?')) return;
        await supabase.from('votes').update({ end_at: new Date().toISOString() }).eq('id', vote.id);
        fetchVotes();
    };

    const removeOption = (index: number) => {
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

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-20 shadow-sm">
                <div className="p-6 border-b border-gray-100 cursor-pointer" onClick={() => setView('DASHBOARD')}>
                    <h1 className="font-bold text-xl text-blue-900 flex items-center gap-2">
                        <LayoutDashboard size={20} /> ADMIN
                    </h1>
                </div>
                <div className="p-4 border-b border-gray-100 space-y-2">
                    <button
                        onClick={() => setView('DASHBOARD')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm
                        ${view === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <LayoutDashboard size={18} /> 대시보드
                    </button>
                    <button
                        onClick={() => { fetchStudents(); setView('STUDENTS'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm
                        ${view === 'STUDENTS' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Users size={18} /> 학번 관리
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <span className="text-xs font-bold text-gray-500">투표 목록</span>
                    <button onClick={startCreate} className="p-1 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 text-blue-600">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
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
            <div className="flex-1 h-full overflow-y-auto relative bg-gray-50">
                {view === 'DASHBOARD' && (
                    <div className="p-10 max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm">
                                <span className="text-sm font-bold text-gray-500 flex items-center gap-1"><AlertCircle size={16} /> 메인 고정 (Pin)</span>
                                <select
                                    className="p-2 border rounded-lg text-sm min-w-[200px]"
                                    value={votes.find(v => v.is_pinned)?.id || 'NONE'}
                                    onChange={(e) => handlePin(e.target.value)}
                                >
                                    <option value="NONE">고정 안함</option>
                                    {votes
                                        .filter(v => getStatus(v) === 'ACTIVE' || (getStatus(v) === 'ENDED' && v.show_after_end))
                                        .map(v => (
                                            <option key={v.id} value={v.id}>
                                                [{getStatus(v) === 'ACTIVE' ? '진행중' : '종료'}] {v.title}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

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

                        {/* Active & Ended Votes List */}
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-bold text-lg text-gray-700">투표 관리 및 현황</h3>
                            <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                                {['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setDashboardFilter(cat)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all
                                        ${dashboardFilter === cat
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                    >
                                        {cat === 'ALL' ? '전체' : cat === 'ACTIVE' ? '진행중' : cat === 'UPCOMING' ? '시작 전' : '종료됨'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-10">
                            {votes.filter(v => {
                                if (dashboardFilter === 'ALL') return true;
                                return getStatus(v) === dashboardFilter;
                            }).length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    {dashboardFilter === 'ALL' ? '등록된 투표가 없습니다.' : '해당 카테고리의 투표가 없습니다.'}
                                </div>
                            ) : (
                                votes.filter(v => {
                                    if (dashboardFilter === 'ALL') return true;
                                    return getStatus(v) === dashboardFilter;
                                }).map(vote => {
                                    const total = voteStats[vote.id]?.total || 0;

                                    return (
                                        <div key={vote.id} className="p-6 border-b last:border-0 hover:bg-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                                        {vote.title}
                                                        {getStatus(vote) === 'ACTIVE' && (
                                                            <span className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                                                {getRemainingTime(vote.end_at)}
                                                            </span>
                                                        )}
                                                        {getStatus(vote) === 'ENDED' && (
                                                            <span className="text-sm font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                                                                종료됨
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">~ {new Date(vote.end_at).toLocaleString()} 종료 예정</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => fetchVoteDetails(vote)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
                                                        상세 보기
                                                    </button>
                                                    <button onClick={() => startEdit(vote)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                                                        설정
                                                    </button>
                                                    {getStatus(vote) === 'ACTIVE' && (
                                                        <button onClick={() => handleEarlyEnd(vote)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                                            종료
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unconditional Results View */}
                                            <div className="bg-gray-100 rounded-lg p-4">
                                                <div className="flex justify-between items-end mb-2">
                                                    <h5 className="text-xs font-bold text-gray-500 flex items-center gap-1"><BarChart2 size={14} /> 실시간 현황 (관리자 전용)</h5>
                                                    <span className="text-xs font-bold text-blue-600">총 {total}명 투표</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {vote.vote_options.map(opt => {
                                                        const count = voteStats[vote.id]?.[opt.id] || 0;
                                                        const percent = total === 0 ? 0 : Math.round((count / total) * 100);
                                                        return (
                                                            <div key={opt.id} className="relative text-sm">
                                                                <div className="flex justify-between mb-1 px-1">
                                                                    <span className="font-medium text-gray-700">{opt.name}</span>
                                                                    <span className="font-bold text-gray-900">{percent}% ({count}표)</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${percent > 0 ? 'bg-blue-500' : 'bg-transparent'}`} style={{ width: `${percent}%` }}></div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}



                {view === 'STUDENTS' && (
                    <div className="p-10 max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">학번 관리</h2>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                            <h3 className="font-bold text-lg mb-4 text-gray-700">신규 학번 등록</h3>
                            <form onSubmit={handleAddStudent} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="학번 8자리 (예: 12240000)"
                                    className="flex-1 p-3 border rounded-xl text-lg"
                                    maxLength={8}
                                    value={studentIdInput}
                                    onChange={e => setStudentIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm whitespace-nowrap">
                                    등록하기
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-700">
                                    등록된 학번 목록 <span className="text-blue-600 ml-1">({students.length}명)</span>
                                </h3>
                                <input
                                    type="text"
                                    placeholder="학번 검색"
                                    className="p-2 border rounded-lg text-sm w-64"
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3">학번</th>
                                            <th className="px-6 py-3">상태</th>
                                            <th className="px-6 py-3">등록일</th>
                                            <th className="px-6 py-3 text-right">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students
                                            .filter(s => s.student_id.includes(studentSearch))
                                            .map(student => (
                                                <tr key={student.student_id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-bold text-gray-800">{student.student_id}</td>
                                                    <td className="px-6 py-4">
                                                        {student.is_suspended ? (
                                                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">정지됨</span>
                                                        ) : (
                                                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">정상</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {new Date(student.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                                        <button
                                                            onClick={() => handleResetStudentVotes(student)}
                                                            className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded font-medium border border-transparent hover:border-gray-200"
                                                            title="투표 기록 초기화"
                                                        >
                                                            초기화
                                                        </button>
                                                        <button
                                                            onClick={() => handleStudentDetails(student)}
                                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded font-medium border border-transparent hover:border-blue-100"
                                                        >
                                                            투표 상세
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleSuspend(student)}
                                                            className={`px-3 py-1.5 rounded font-medium border transition-colors
                                                                        ${student.is_suspended
                                                                    ? 'text-green-600 border-green-200 hover:bg-green-50'
                                                                    : 'text-orange-500 border-orange-200 hover:bg-orange-50'}`}
                                                        >
                                                            {student.is_suspended ? '정지 해제' : '정지'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStudent(student)}
                                                            className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded font-medium border border-transparent hover:border-red-100"
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Student Delete Modal */}
                        {
                            showDeleteModal && deleteTarget && (
                                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Trash2 size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{deleteTarget.data.student_id} 학번 삭제</h3>
                                        <p className="text-sm text-gray-500 mb-6">
                                            해당 학번을 삭제하시겠습니까?<br />
                                            삭제 시 복구할 수 있는 방법은 없습니다.
                                        </p>
                                        <div className="space-y-2">
                                            <button onClick={() => executeDeleteStudent('ALL')} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
                                                초기화 후 제거 (투표기록 포함)
                                            </button>
                                            <button onClick={() => executeDeleteStudent('ID_ONLY')} className="w-full py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">
                                                학번만 제거 (투표기록 유지)
                                            </button>
                                            <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">
                                                취소
                                            </button>
                                        </div>
                                    </div >
                                </div >
                            )
                        }

                        {/* Student Detail Modal */}
                        {
                            showStudentModal && selectedStudent && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-base">{selectedStudent.student_id}</span>
                                                    투표 기록
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    총 {studentHistory.length}건의 투표에 참여했습니다.
                                                </p>
                                            </div>
                                            <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Force Add Vote (Student Context) */}
                                        <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                                            <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Plus size={12} /> 투표 강제 추가</p>
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                                                    value={forceVoteData.targetVoteId}
                                                    onChange={e => setForceVoteData({ ...forceVoteData, targetVoteId: e.target.value, targetOptionId: '' })}
                                                >
                                                    <option value="">투표 선택...</option>
                                                    {votes.filter(v => getStatus(v) !== 'UPCOMING').map(v => (
                                                        <option key={v.id} value={v.id}>[{getStatus(v)}] {v.title}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                                    value={forceVoteData.targetOptionId}
                                                    onChange={e => setForceVoteData({ ...forceVoteData, targetOptionId: e.target.value })}
                                                    disabled={!forceVoteData.targetVoteId}
                                                >
                                                    <option value="">항목 선택...</option>
                                                    {forceVoteData.targetVoteId && votes.find(v => v.id === forceVoteData.targetVoteId)?.vote_options.map(o => (
                                                        <option key={o.id} value={o.id}>{o.name}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={handleForceAddVote}
                                                    disabled={!forceVoteData.targetOptionId}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-sm"
                                                >
                                                    추가
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                            {studentHistory.length === 0 ? (
                                                <div className="text-center py-10 text-gray-400">참여한 투표 기록이 없습니다.</div>
                                            ) : (
                                                studentHistory.map(record => {
                                                    const optionName = record.votes?.vote_options?.find(o => o.id === record.option_id)?.name || '삭제된 항목';
                                                    const voteTitle = record.votes?.title || '삭제된 투표';

                                                    return (
                                                        <div key={record.id} className={`p-4 rounded-xl border flex justify-between items-center
                                                        ${record.is_valid ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                                                            <div>
                                                                <div className="font-bold text-gray-800 mb-1">{voteTitle}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    선택: <span className="font-bold text-blue-600">{optionName}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {new Date(record.created_at).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {!record.is_valid && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">무효 처리됨</span>}
                                                                <button
                                                                    onClick={() => toggleValidity(record.id, record.is_valid)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                                                                ${record.is_valid
                                                                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                                                                            : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                                >
                                                                    {record.is_valid ? '무효 처리' : '유효 복구'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRecord(record.id, () => handleStudentDetails(selectedStudent))}
                                                                    className="px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div >
                )
                }

                {
                    (view === 'CREATE' || view === 'EDIT') && (
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

                            {view === 'EDIT' && (
                                <div className="mb-6 flex gap-2">
                                    <button onClick={() => fetchVoteDetails(selectedVote)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow flex items-center justify-center gap-2">
                                        <Users size={20} /> 투표 내역 및 유효성 관리 (상세보기)
                                    </button>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">투표 제목</label>
                                    <input
                                        type="text"
                                        disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')}
                                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                                            <TimeSelector prefix="start" disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')} formData={formData} setFormData={setFormData} />
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
                                            <TimeSelector prefix="end" disabled={view === 'EDIT' && (getStatus(selectedVote) === 'ACTIVE' || getStatus(selectedVote) === 'ENDED')} formData={formData} setFormData={setFormData} />
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
                                        {/* Live Results Config */}
                                        <div className={`p-5 rounded-2xl border transition-all duration-200
                                  ${formData.showLiveResults ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="font-bold flex items-center gap-2">
                                                    <span className={formData.showLiveResults ? 'text-blue-900' : 'text-gray-600'}>실시간 결과</span>
                                                    {formData.showLiveResults && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{formData.liveResultType === 'ALL' ? '전체 공개' : '부분 공개'}</span>}
                                                    {!formData.showLiveResults && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">비공개</span>}
                                                </div>
                                            </div>

                                            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm mb-4">
                                                {['ALL', 'PARTIAL', 'OFF'].map(mode => {
                                                    const currentMode = !formData.showLiveResults ? 'OFF' : formData.liveResultType === 'ALL' ? 'ALL' : 'PARTIAL';
                                                    return (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => {
                                                                if (mode === 'OFF') {
                                                                    setFormData({ ...formData, showLiveResults: false });
                                                                } else if (mode === 'ALL') {
                                                                    setFormData({ ...formData, showLiveResults: true, liveResultType: 'ALL', liveResultShowTotal: true, liveResultShowTurnout: true });
                                                                } else {
                                                                    const defaultPartial = 'COUNT,PERCENT,GAUGE';
                                                                    const nextType = (formData.liveResultType === 'ALL' || formData.liveResultType === 'BOTH') ? defaultPartial : (formData.liveResultType || defaultPartial);
                                                                    setFormData({ ...formData, showLiveResults: true, liveResultType: nextType });
                                                                }
                                                            }}
                                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                                                            ${currentMode === mode
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                                        >
                                                            {mode === 'ALL' ? '모두 공개' : mode === 'PARTIAL' ? '부분 공개' : '비공개'}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Summary Stats - Always Visible */}
                                            <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="text-xs font-bold text-gray-500 mb-2">전체 통계 설정</div>
                                                <label className="flex items-center cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${formData.liveResultShowTotal ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                        {formData.liveResultShowTotal && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={formData.liveResultShowTotal} onChange={e => setFormData({ ...formData, liveResultShowTotal: e.target.checked })} />
                                                    <span className="text-sm text-gray-600 font-medium">참여 인원수 표시</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${formData.liveResultShowTurnout ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                        {formData.liveResultShowTurnout && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={formData.liveResultShowTurnout} onChange={e => setFormData({ ...formData, liveResultShowTurnout: e.target.checked })} />
                                                    <span className="text-sm text-gray-600 font-medium">총 투표율 표시 (게이지)</span>
                                                </label>
                                            </div>

                                            {formData.showLiveResults && formData.liveResultType !== 'ALL' && (
                                                <div className="space-y-3 pt-2 border-t border-blue-100 animate-fadeIn">
                                                    <div className="text-xs font-bold text-gray-500 mb-2">항목별 표시 설정 (1개 이상 선택)</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[
                                                            { id: 'COUNT', label: '투표수' },
                                                            { id: 'PERCENT', label: '비율(%)' },
                                                            { id: 'GAUGE', label: '게이지바' }
                                                        ].map(item => {
                                                            const currentTypes = (formData.liveResultType === 'BOTH' ? 'COUNT,PERCENT,GAUGE' : formData.liveResultType).split(',');
                                                            const isChecked = currentTypes.includes(item.id);
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        let newTypes;
                                                                        if (isChecked) newTypes = currentTypes.filter(t => t !== item.id);
                                                                        else newTypes = [...currentTypes, item.id];
                                                                        if (newTypes.length === 0) return;
                                                                        setFormData({ ...formData, liveResultType: newTypes.join(',') });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1
                                                                    ${isChecked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isChecked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                                        {isChecked && <CheckCircle size={8} className="text-white" />}
                                                                    </div>
                                                                    {item.label}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>

                                                </div>
                                            )}
                                        </div>

                                        {/* Final Results Config */}
                                        <div className={`p-5 rounded-2xl border transition-all duration-200
                                  ${formData.showFinalResults ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="font-bold flex items-center gap-2">
                                                    <span className={formData.showFinalResults ? 'text-blue-900' : 'text-gray-600'}>종료 후 결과</span>
                                                    {formData.showFinalResults && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{formData.finalResultType === 'ALL' ? '전체 공개' : '부분 공개'}</span>}
                                                    {!formData.showFinalResults && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">비공개</span>}
                                                </div>
                                            </div>

                                            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm mb-4">
                                                {['ALL', 'PARTIAL', 'OFF'].map(mode => {
                                                    const currentMode = !formData.showFinalResults ? 'OFF' : formData.finalResultType === 'ALL' ? 'ALL' : 'PARTIAL';
                                                    return (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => {
                                                                if (mode === 'OFF') {
                                                                    setFormData({ ...formData, showFinalResults: false });
                                                                } else if (mode === 'ALL') {
                                                                    setFormData({ ...formData, showFinalResults: true, finalResultType: 'ALL', finalResultShowTotal: true, finalResultShowTurnout: true });
                                                                } else {
                                                                    const defaultPartial = 'COUNT,PERCENT,GAUGE';
                                                                    const nextType = (formData.finalResultType === 'ALL' || formData.finalResultType === 'BOTH') ? defaultPartial : (formData.finalResultType || defaultPartial);
                                                                    setFormData({ ...formData, showFinalResults: true, finalResultType: nextType });
                                                                }
                                                            }}
                                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                                                            ${currentMode === mode
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                                        >
                                                            {mode === 'ALL' ? '모두 공개' : mode === 'PARTIAL' ? '부분 공개' : '비공개'}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Summary Stats - Always Visible */}
                                            <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="text-xs font-bold text-gray-500 mb-2">전체 통계 설정</div>
                                                <label className="flex items-center cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${formData.finalResultShowTotal ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                        {formData.finalResultShowTotal && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={formData.finalResultShowTotal} onChange={e => setFormData({ ...formData, finalResultShowTotal: e.target.checked })} />
                                                    <span className="text-sm text-gray-600 font-medium">참여 인원수 표시</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${formData.finalResultShowTurnout ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                        {formData.finalResultShowTurnout && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={formData.finalResultShowTurnout} onChange={e => setFormData({ ...formData, finalResultShowTurnout: e.target.checked })} />
                                                    <span className="text-sm text-gray-600 font-medium">총 투표율 표시 (게이지)</span>
                                                </label>
                                            </div>

                                            {formData.showFinalResults && formData.finalResultType !== 'ALL' && (
                                                <div className="space-y-3 pt-2 border-t border-blue-100 animate-fadeIn">
                                                    <div className="text-xs font-bold text-gray-500 mb-2">항목별 표시 설정</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[
                                                            { id: 'COUNT', label: '투표수' },
                                                            { id: 'PERCENT', label: '비율(%)' },
                                                            { id: 'GAUGE', label: '게이지바' }
                                                        ].map(item => {
                                                            const currentTypes = (formData.finalResultType === 'BOTH' ? 'COUNT,PERCENT,GAUGE' : formData.finalResultType).split(',');
                                                            const isChecked = currentTypes.includes(item.id);
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        let newTypes;
                                                                        if (isChecked) newTypes = currentTypes.filter(t => t !== item.id);
                                                                        else newTypes = [...currentTypes, item.id];
                                                                        if (newTypes.length === 0) return;
                                                                        setFormData({ ...formData, finalResultType: newTypes.join(',') });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1
                                                                    ${isChecked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isChecked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                                                        {isChecked && <CheckCircle size={8} className="text-white" />}
                                                                    </div>
                                                                    {item.label}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Show After End Config */}
                                        <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-center col-span-1 md:col-span-2
                                  ${formData.showAfterEnd ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                                            <label className="flex items-center cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors
                                                 ${formData.showAfterEnd ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                                                    {formData.showAfterEnd && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input type="checkbox" className="hidden"
                                                    checked={formData.showAfterEnd}
                                                    onChange={e => setFormData({ ...formData, showAfterEnd: e.target.checked })}
                                                />
                                                <div>
                                                    <span className={`font-bold block transition-colors ${formData.showAfterEnd ? 'text-gray-800' : 'text-gray-500'}`}>종료 후 투표 목록 노출</span>
                                                    <span className="text-xs text-gray-400">체크 해제 시 종료된 투표는 목록에서 사라집니다. (핀 고정도 해제됨)</span>
                                                </div>
                                            </label>
                                        </div>
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
                    )
                }

                {/* Details Modal */}
                {
                    showDetailsModal && detailsVote && (
                        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-10">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">투표 내역 상세</h3>
                                        <p className="text-sm text-gray-500">{detailsVote.title}</p>
                                    </div>
                                    <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Plus size={12} /> 투표 강제 추가</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="학번 입력 (8자리)"
                                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                                            maxLength={8}
                                            value={forceVoteData.targetStudentId}
                                            onChange={e => setForceVoteData({ ...forceVoteData, targetStudentId: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                        <select
                                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                                            value={forceVoteData.targetOptionId}
                                            onChange={e => setForceVoteData({ ...forceVoteData, targetOptionId: e.target.value })}
                                        >
                                            <option value="">항목 선택...</option>
                                            {detailsVote.vote_options.map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleForceAddVote}
                                            disabled={!forceVoteData.targetStudentId || !forceVoteData.targetOptionId || forceVoteData.targetStudentId.length < 8}
                                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-sm"
                                        >
                                            추가
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                                            <tr>
                                                <th className="px-4 py-3">학번</th>
                                                <th className="px-4 py-3">선택 항목</th>
                                                <th className="px-4 py-3">투표 시간</th>
                                                <th className="px-4 py-3">상태 (유효성)</th>
                                                <th className="px-4 py-3 text-right">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {voteRecords.map(record => {
                                                const optionName = detailsVote.vote_options?.find(o => o.id === record.option_id)?.name || '알수없음';
                                                return (
                                                    <tr key={record.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{record.student_id}</td>
                                                        <td className="px-4 py-3 text-gray-600">{optionName}</td>
                                                        <td className="px-4 py-3 text-gray-500">{new Date(record.created_at).toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            {record.is_valid ? (
                                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">유효함</span>
                                                            ) : (
                                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">무효처리됨</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => toggleValidity(record.id, record.is_valid)}
                                                                className={`px-3 py-1 rounded border text-xs font-bold transition mr-2
                                                            ${record.is_valid
                                                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                                        : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                            >
                                                                {record.is_valid ? '무효 처리' : '유효 복구'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRecord(record.id, () => fetchVoteDetails(detailsVote))}
                                                                className="px-2 py-1 rounded border border-gray-200 text-xs font-bold text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                                                            >
                                                                삭제
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {voteRecords.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">투표 기록이 없습니다.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t bg-gray-50 text-right">
                                    <p className="text-xs text-gray-500">무효 처리된 표는 집계에서 제외됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
