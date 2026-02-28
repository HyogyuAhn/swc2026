import { BarChart2 } from 'lucide-react';
import { VoteStatus } from '@/features/vote/user/types';

type VoteCardResultsSectionProps = {
    vote: any;
    status: VoteStatus;
    isVoted: boolean;
    canChangeVoteWhileActive: boolean;
    visibleResults: boolean;
    totalConfig: boolean;
    turnoutConfig: boolean;
    totalVotes: number;
    totalStudents: number;
    voteCount: any;
};

export default function VoteCardResultsSection({
    vote,
    status,
    isVoted,
    canChangeVoteWhileActive,
    visibleResults,
    totalConfig,
    turnoutConfig,
    totalVotes,
    totalStudents,
    voteCount
}: VoteCardResultsSectionProps) {
    return (
        <>
            {(totalConfig || turnoutConfig) && (
                <div>
                    {totalConfig && (
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <BarChart2 size={18} /> 투표 현황
                            </h3>
                            <span className="text-sm text-gray-500 font-medium">총 {totalVotes}명 참여</span>
                        </div>
                    )}

                    {turnoutConfig && (
                        <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-bold text-blue-800">전체 투표율</span>
                                <span className="text-xs font-bold text-blue-600">
                                    {totalStudents > 0 ? Math.round((totalVotes / totalStudents) * 100) : 0}%
                                    {totalStudents === 0 && (
                                        <span className="ml-1 text-[10px] text-gray-400 font-normal">(학생 데이터 없음)</span>
                                    )}
                                </span>
                            </div>
                            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${totalStudents > 0 ? Math.min(100, (totalVotes / totalStudents) * 100) : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!visibleResults ? (
                ((status === 'ENDED') || (status === 'ACTIVE' && isVoted && !canChangeVoteWhileActive)) && (
                    <div className="bg-gray-50 rounded-xl p-5 text-center border border-gray-100">
                        <p className="font-bold text-gray-600">
                            {status === 'ENDED' ? '결과가 비공개 되어 있습니다!' : '투표가 완료되었습니다!'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {status === 'ENDED'
                                ? '투표 결과는 추후 공개될 예정입니다.'
                                : '투표가 종료된 후 결과가 공개됩니다.'}
                        </p>
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    {vote.vote_options.map(option => {
                        const count = voteCount?.[option.id] || 0;
                        const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

                        const type = status === 'ACTIVE'
                            ? (vote.live_result_type || 'ALL')
                            : (vote.final_result_type || 'ALL');

                        const showCount = type === 'ALL' || type === 'BOTH' || type.includes('COUNT');
                        const showPercent = type === 'ALL' || type === 'BOTH' || type.includes('PERCENT');
                        const showGauge = type === 'ALL' || type === 'BOTH' || type.includes('GAUGE');

                        return (
                            <div key={option.id} className="relative">
                                <div className="flex justify-between text-sm mb-1 px-1">
                                    <span className="font-medium text-gray-700">{option.name}</span>
                                    <span className="font-bold text-gray-900">
                                        {showPercent && showCount && `${percent}% (${count}표)`}
                                        {showPercent && !showCount && `${percent}%`}
                                        {!showPercent && showCount && `${count}표`}
                                    </span>
                                </div>
                                {showGauge && (
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                percent > 0 ? 'bg-blue-500' : 'bg-transparent'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
