import { StopCircle, CheckCircle, Clock, BarChart2, AlertCircle } from 'lucide-react';

type AdminDashboardSectionProps = {
    votes: any[];
    dashboardFilter: string;
    setDashboardFilter: (filter: string) => void;
    counts: { upcoming: number; active: number; ended: number };
    voteStats: Record<string, any>;
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
    getRemainingTime: (endDate: string | Date) => string | null;
    handlePin: (voteId: string) => void;
    fetchVoteDetails: (vote: any) => void;
    startEdit: (vote: any) => void;
    handleEarlyEnd: (vote: any) => void;
};

export default function AdminDashboardSection({
    votes,
    dashboardFilter,
    setDashboardFilter,
    counts,
    voteStats,
    getStatus,
    getRemainingTime,
    handlePin,
    fetchVoteDetails,
    startEdit,
    handleEarlyEnd
}: AdminDashboardSectionProps) {
    return (
        <div className="mx-auto max-w-5xl px-10 pb-10 pt-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1"><AlertCircle size={16} /> 메인 고정 (Pin)</span>
                    <select
                        className="p-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
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

            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">진행 중</p>
                        <p className="text-4xl font-bold text-green-600">{counts.active}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><CheckCircle /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">시작 전</p>
                        <p className="text-4xl font-bold text-yellow-500">{counts.upcoming}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500"><Clock /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">종료됨</p>
                        <p className="text-4xl font-bold text-gray-500">{counts.ended}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><StopCircle /></div>
                </div>
            </div>

            <div className="flex justify-between items-end mb-4">
                <h3 className="font-bold text-lg text-gray-700">투표 관리 및 현황</h3>
                <div className="flex bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden mb-10">
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
                            <div key={vote.id} className="p-6 border-b border-gray-300 last:border-0 hover:bg-gray-50">
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
                                                <span className="text-sm font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-300">
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
                                        <button onClick={() => startEdit(vote)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                            설정
                                        </button>
                                        {getStatus(vote) === 'ACTIVE' && (
                                            <button onClick={() => handleEarlyEnd(vote)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                                종료
                                            </button>
                                        )}
                                    </div>
                                </div>

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
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
