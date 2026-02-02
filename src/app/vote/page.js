'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function VotePage() {
    const [votes, setVotes] = useState([]);
    const [filteredVotes, setFilteredVotes] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [studentId, setStudentId] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveVotes();
    }, []);

    useEffect(() => {
        filterAndSortVotes();
    }, [votes, filter]);

    const fetchActiveVotes = async () => {
        const { data } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('start_at', { ascending: false });

        if (data) setVotes(data);
        setLoading(false);
    };

    const getVoteStatus = (vote) => {
        const now = new Date();
        const start = new Date(vote.start_at);
        const end = new Date(vote.end_at);

        if (now < start) return 'UPCOMING';
        if (now >= start && now <= end) return 'ACTIVE';
        return 'ENDED';
    };

    const filterAndSortVotes = () => {
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
    };

    const handleVote = async (voteId) => {
        if (!studentId || !selectedOption) {
            alert('학번과 투표 항목을 선택해주세요.');
            return;
        }

        const { data: existing } = await supabase
            .from('vote_records')
            .select('*')
            .eq('vote_id', voteId)
            .eq('student_id', studentId)
            .single();

        if (existing) {
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
            alert('투표 실패: ' + error.message);
        } else {
            alert('투표가 완료되었습니다!');
            setStudentId('');
            setSelectedOption(null);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">로딩중...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-900">투표 목록</h1>

            {/* Category Tabs */}
            <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
                {['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap
                      ${filter === cat
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {cat === 'ALL' ? '전체' : cat === 'ACTIVE' ? '진행 중' : cat === 'UPCOMING' ? '시작 전' : '종료'}
                    </button>
                ))}
            </div>

            <div className="grid gap-8">
                {filteredVotes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-xl text-gray-400 font-medium">등록된 투표가 없습니다.</p>
                        {filter !== 'ALL' && <p className="text-sm text-gray-400 mt-2">다른 카테고리를 선택해보세요.</p>}
                    </div>
                ) : (
                    filteredVotes.map(vote => {
                        const status = getVoteStatus(vote);

                        return (
                            <div key={vote.id} className={`bg-white p-6 rounded-xl shadow-md border ${status === 'ACTIVE' ? 'border-blue-200 ring-4 ring-blue-50/50' : 'border-gray-100'} transition-all hover:shadow-lg`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">{vote.title}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm text-white font-bold shadow-sm
                                ${status === 'ACTIVE' ? 'bg-green-500' : status === 'UPCOMING' ? 'bg-yellow-400' : 'bg-gray-400'}`}>
                                        {status === 'ACTIVE' ? '진행중' : status === 'UPCOMING' ? '시작 전' : '종료됨'}
                                    </span>
                                </div>

                                <div className="mb-6 flex items-center gap-2 text-gray-500 text-sm bg-gray-50 p-3 rounded-lg w-fit">
                                    <span className="font-medium">기간:</span>
                                    {new Date(vote.start_at).toLocaleString()} ~ {new Date(vote.end_at).toLocaleString()}
                                </div>

                                {status === 'ACTIVE' && (
                                    <div className="space-y-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">학번 입력</label>
                                            <input
                                                type="text"
                                                placeholder="학번 8자리"
                                                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={studentId}
                                                onChange={e => setStudentId(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700">항목 선택</label>
                                            {vote.vote_options.map(opt => (
                                                <label key={opt.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition
                                            ${selectedOption === opt.id ? 'border-blue-500 bg-white ring-2 ring-blue-200 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                                    <input
                                                        type="radio"
                                                        name={`vote-${vote.id}`}
                                                        className="w-4 h-4 text-blue-600 mr-3"
                                                        onChange={() => setSelectedOption(opt.id)}
                                                        checked={selectedOption === opt.id}
                                                    />
                                                    {opt.name}
                                                </label>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleVote(vote.id)}
                                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                                        >
                                            투표하기
                                        </button>
                                    </div>
                                )}

                                {status === 'UPCOMING' && (
                                    <div className="p-6 bg-yellow-50 rounded-xl text-center border border-yellow-100">
                                        <p className="mb-3 font-bold text-yellow-700">후보 / 항목 미리보기</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {vote.vote_options.map(opt => (
                                                <span key={opt.id} className="px-4 py-2 bg-white border border-yellow-200 rounded-full text-sm text-gray-700 shadow-sm">{opt.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {status === 'ENDED' && (
                                    <div className="p-6 bg-gray-100 rounded-xl text-center border border-gray-200">
                                        <p className="text-gray-500 font-medium">투표가 종료되었습니다.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
