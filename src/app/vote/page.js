'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LogOut, User, Clock, CheckCircle, BarChart2 } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function VotePage() {
    const [studentId, setStudentId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [votes, setVotes] = useState([]);
    const [filteredVotes, setFilteredVotes] = useState([]);
    const [userVotes, setUserVotes] = useState(new Set());
    const [voteCounts, setVoteCounts] = useState({});

    const [filter, setFilter] = useState('ACTIVE');
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const storedId = localStorage.getItem('swc_vote_student_id');
        if (storedId) {
            setStudentId(storedId);
            setIsLoggedIn(true);
        }

        fetchVotesData(storedId);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const poller = setInterval(() => {
            fetchVotesData(localStorage.getItem('swc_vote_student_id'));
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(poller);
        };
    }, []);

    useEffect(() => {
        let result = [...votes];

        if (filter !== 'ALL') {
            result = result.filter(vote => getVoteStatus(vote) === filter);
        }

        result.sort((a, b) => {
            const statusA = getVoteStatus(a);
            const statusB = getVoteStatus(b);

            const priority = { 'ACTIVE': 1, 'UPCOMING': 2, 'ENDED': 3 };

            if (priority[statusA] !== priority[statusB]) {
                return priority[statusA] - priority[statusB];
            }

            return new Date(b.created_at) - new Date(a.created_at);
        });

        setFilteredVotes(result);
    }, [votes, filter, currentTime]);

    const fetchVotesData = async (currentId) => {
        const { data: votesData } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('start_at', { ascending: false });

        if (votesData) {
            setVotes(votesData);

            const { data: records } = await supabase.from('vote_records').select('vote_id, option_id');

            if (records) {
                const counts = {};
                records.forEach(r => {
                    if (!counts[r.vote_id]) counts[r.vote_id] = { total: 0 };
                    if (!counts[r.vote_id][r.option_id]) counts[r.vote_id][r.option_id] = 0;

                    counts[r.vote_id][r.option_id]++;
                    counts[r.vote_id].total++;
                });
                setVoteCounts(counts);
            }
        }

        const idToCheck = currentId || studentId || localStorage.getItem('swc_vote_student_id');
        if (idToCheck) {
            const { data: myVotes } = await supabase
                .from('vote_records')
                .select('vote_id')
                .eq('student_id', idToCheck);

            if (myVotes) {
                setUserVotes(new Set(myVotes.map(v => v.vote_id)));
            }
        }

        setLoading(false);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (!studentId.trim()) return;
        localStorage.setItem('swc_vote_student_id', studentId);
        setIsLoggedIn(true);
        fetchVotesData(studentId);
    };

    const handleLogout = () => {
        localStorage.removeItem('swc_vote_student_id');
        setStudentId('');
        setIsLoggedIn(false);
        setUserVotes(new Set());
    };

    const getVoteStatus = (vote) => {
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

    const handleVote = async (voteId) => {
        if (!selectedOption) {
            alert('투표 항목을 선택해주세요.');
            return;
        }

        if (userVotes.has(voteId)) {
            alert('이미 참여한 투표입니다.');
            return;
        }

        const { error } = await supabase
            .from('vote_records')
            .insert({
                vote_id: voteId,
                student_id: studentId,
                option_id: selectedOption
            });

        if (error) {
            alert(error.message.includes('unique') ? '이미 참여하셨습니다.' : '투표 실패: ' + error.message);
        } else {
            alert('투표완료!');
            setSelectedOption(null);
            fetchVotesData(studentId);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-blue-50">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-blue-900 mb-2">SW융합대학 투표시스템</h1>
                        <p className="text-gray-500">2026 새내기배움터</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">학번 입력</label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-lg"
                                placeholder="학번 8자리를 입력하세요"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            입장하기
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="font-bold text-xl text-blue-900">INHA SW VOTE</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                            <User size={16} />
                            <span className="font-medium">{studentId}</span>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {/* Category Tabs */}
                <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
                    {['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap shadow-sm
                        ${filter === cat
                                    ? 'bg-blue-600 text-white shadow-blue-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            {cat === 'ALL' ? '전체' : cat === 'ACTIVE' ? '진행 중' : cat === 'UPCOMING' ? '시작 전' : '종료됨'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">데이터를 불러오는 중입니다...</div>
                ) : filteredVotes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-xl text-gray-400 font-medium">해당하는 투표가 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-2">다른 카테고리를 확인해보세요.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredVotes.map(vote => {
                            const status = getVoteStatus(vote);
                            const isVoted = userVotes.has(vote.id);
                            const remainingTime = status === 'ACTIVE' ? getRemainingTime(vote.end_at) : null;

                            const showResults = (status === 'ACTIVE' && vote.show_live_results) ||
                                (status === 'ENDED' && vote.show_final_results) ||
                                isVoted;
                            const visibleResults = (status === 'ACTIVE' && vote.show_live_results) ||
                                (status === 'ENDED' && vote.show_final_results);

                            const totalVotes = voteCounts[vote.id]?.total || 0;

                            return (
                                <div key={vote.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all
                        ${status === 'ACTIVE' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 opacity-90 hover:opacity-100'}`}>

                                    {/* Card Header */}
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold
                                        ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {status === 'ACTIVE' ? '진행중' : status === 'UPCOMING' ? '시작 전' : '종료됨'}
                                                </span>
                                                {isVoted && <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> 참여완료</span>}
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                                        </div>
                                        {remainingTime && (
                                            <div className="text-right shrink-0">
                                                <div className="text-xs text-blue-600 font-bold mb-1">남은 시간</div>
                                                <div className="text-lg font-mono font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">
                                                    {remainingTime}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        {/* Voting Area or Results Area */}
                                        {status === 'UPCOMING' ? (
                                            <div className="bg-yellow-50 rounded-xl p-5 text-center border border-yellow-100">
                                                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                                                <p className="font-bold text-yellow-800">투표 시작 전입니다.</p>
                                                <p className="text-sm text-yellow-600 mt-1">
                                                    {new Date(vote.start_at).toLocaleString()} 에 시작됩니다.
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                    {vote.vote_options.map(opt => (
                                                        <span key={opt.id} className="px-3 py-1 bg-white/60 border border-yellow-200 rounded-lg text-sm text-yellow-800">{opt.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {visibleResults && (
                                                    <div className="mb-6">
                                                        <div className="flex justify-between items-end mb-3">
                                                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                                <BarChart2 size={18} /> 투표 현황
                                                            </h3>
                                                            <span className="text-sm text-gray-500 font-medium">총 {totalVotes}명 참여</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {vote.vote_options.map(opt => {
                                                                const count = voteCounts[vote.id]?.[opt.id] || 0;
                                                                const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                                                                return (
                                                                    <div key={opt.id} className="relative">
                                                                        <div className="flex justify-between text-sm mb-1 px-1">
                                                                            <span className="font-medium text-gray-700">{opt.name}</span>
                                                                            <span className="font-bold text-gray-900">{percent}% ({count}표)</span>
                                                                        </div>
                                                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-1000 ${percent > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                                style={{ width: `${percent}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Voting Inputs */}
                                                {status === 'ACTIVE' && !isVoted ? (
                                                    <div className="pt-4 border-t border-gray-100">
                                                        <p className="font-bold text-gray-800 mb-3">투표하기</p>
                                                        <div className="grid gap-3">
                                                            {vote.vote_options.map(opt => (
                                                                <label key={opt.id} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all group
                                                        ${selectedOption === opt.id
                                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                                                            ${selectedOption === opt.id ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                                        {selectedOption === opt.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                                                                    </div>
                                                                    <input
                                                                        type="radio"
                                                                        name={`vote-${vote.id}`}
                                                                        className="hidden"
                                                                        onChange={() => setSelectedOption(opt.id)}
                                                                        checked={selectedOption === opt.id}
                                                                    />
                                                                    <span className={`font-medium ${selectedOption === opt.id ? 'text-blue-900' : 'text-gray-700'}`}>{opt.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => handleVote(vote.id)}
                                                            disabled={!selectedOption}
                                                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all
                                                    ${selectedOption
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                                                        >
                                                            투표 완료
                                                        </button>
                                                    </div>
                                                ) : status === 'ACTIVE' && isVoted ? (
                                                    <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                                        <p className="font-bold text-gray-600">이미 투표에 참여하셨습니다.</p>
                                                        <p className="text-sm text-gray-400">결과가 공개되면 확인하실 수 있습니다.</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
