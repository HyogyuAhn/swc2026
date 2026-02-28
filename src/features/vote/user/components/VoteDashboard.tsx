import ToastBanner from '@/features/vote/common/ToastBanner';
import { ToastState } from '@/features/vote/common/types';
import VoteCard from './VoteCard';
import VoteFilterTabs from './VoteFilterTabs';
import VotePageHeader from './VotePageHeader';
import { VoteStatus } from '@/features/vote/user/types';

type VoteDashboardProps = {
    studentId: string;
    filter: string;
    setFilter: (filter: string) => void;
    loading: boolean;
    filteredVotes: any[];
    userVotes: Set<string>;
    selectedOptions: Record<string, string>;
    voteCounts: Record<string, any>;
    totalStudents: number;
    toast: ToastState;
    handleLogout: () => void;
    handleVote: (vote: any) => void;
    handleCancelVote: (vote: any) => void;
    getVoteEditCooldownRemaining: (voteId: string) => number;
    setSelectedOptionForVote: (voteId: string, optionId: string) => void;
    getVoteStatus: (vote: any) => VoteStatus;
    getRemainingTime: (endDate: string | Date) => string | null;
};

export default function VoteDashboard({
    studentId,
    filter,
    setFilter,
    loading,
    filteredVotes,
    userVotes,
    selectedOptions,
    voteCounts,
    totalStudents,
    toast,
    handleLogout,
    handleVote,
    handleCancelVote,
    getVoteEditCooldownRemaining,
    setSelectedOptionForVote,
    getVoteStatus,
    getRemainingTime
}: VoteDashboardProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <VotePageHeader studentId={studentId} onLogout={handleLogout} />

            <main className="max-w-4xl mx-auto p-6">
                <VoteFilterTabs filter={filter} onFilterChange={setFilter} />

                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">데이터를 불러오는 중입니다...</div>
                ) : filteredVotes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-xl text-gray-400 font-medium">해당하는 투표가 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-2">다른 카테고리를 확인해보세요.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredVotes.map(vote => (
                            <VoteCard
                                key={vote.id}
                                vote={vote}
                                isVoted={userVotes.has(String(vote.id))}
                                selectedOption={selectedOptions[String(vote.id)] || ''}
                                voteCount={voteCounts[vote.id]}
                                totalStudents={totalStudents}
                                onSelectOption={setSelectedOptionForVote}
                                onVote={handleVote}
                                onCancelVote={handleCancelVote}
                                cooldownRemainingSeconds={getVoteEditCooldownRemaining(String(vote.id))}
                                getVoteStatus={getVoteStatus}
                                getRemainingTime={getRemainingTime}
                            />
                        ))}
                    </div>
                )}
            </main>

            <ToastBanner
                toast={toast}
                positionClassName="fixed left-1/2 top-4 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-6 sm:top-6 sm:w-auto sm:min-w-[360px] sm:max-w-[460px] sm:translate-x-0"
            />
        </div>
    );
}
