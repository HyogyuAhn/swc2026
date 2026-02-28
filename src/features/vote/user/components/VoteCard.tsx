import VoteCardHeader from './VoteCardHeader';
import VoteCardResultsSection from './VoteCardResultsSection';
import VoteCardUpcomingNotice from './VoteCardUpcomingNotice';
import VoteCardVotingSection from './VoteCardVotingSection';
import { VoteStatus } from '@/features/vote/user/types';

type VoteCardProps = {
    vote: any;
    isVoted: boolean;
    selectedOption: string;
    voteCount: any;
    totalStudents: number;
    onSelectOption: (voteId: string, optionId: string) => void;
    onVote: (vote: any) => void;
    onCancelVote: (vote: any) => void;
    cooldownRemainingSeconds: number;
    getVoteStatus: (vote: any) => VoteStatus;
    getRemainingTime: (endDate: string | Date) => string | null;
};

export default function VoteCard({
    vote,
    isVoted,
    selectedOption,
    voteCount,
    totalStudents,
    onSelectOption,
    onVote,
    onCancelVote,
    cooldownRemainingSeconds,
    getVoteStatus,
    getRemainingTime
}: VoteCardProps) {
    const status = getVoteStatus(vote);
    const remainingTime = status === 'ACTIVE' ? getRemainingTime(vote.end_at) : null;

    const showOptionsBeforeStart = vote.show_before_start_options ?? true;
    const canChangeVoteWhileActive = status === 'ACTIVE' && (vote.allow_vote_change_while_active ?? false);
    const isCooldownActive = canChangeVoteWhileActive && cooldownRemainingSeconds > 0;
    const canSubmitVote = status === 'ACTIVE' && (!isVoted || (canChangeVoteWhileActive && !isCooldownActive));

    const visibleResults =
        (status === 'ACTIVE' && vote.show_live_results) ||
        (status === 'ENDED' && vote.show_final_results);

    const isLive = status === 'ACTIVE';
    const totalConfig = isLive
        ? (vote.live_result_show_total ?? true)
        : (vote.final_result_show_total ?? true);
    const turnoutConfig = isLive
        ? (vote.live_result_show_turnout ?? true)
        : (vote.final_result_show_turnout ?? true);

    const totalVotes = voteCount?.total || 0;

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                status === 'ACTIVE'
                    ? 'border-blue-200 ring-1 ring-blue-100'
                    : 'border-gray-200 opacity-90 hover:opacity-100'
            }`}
        >
            <VoteCardHeader
                vote={vote}
                status={status}
                isVoted={isVoted}
                canChangeVoteWhileActive={canChangeVoteWhileActive}
                remainingTime={remainingTime}
            />

            <div className="p-6">
                {status === 'UPCOMING' ? (
                    <VoteCardUpcomingNotice
                        vote={vote}
                        showOptionsBeforeStart={showOptionsBeforeStart}
                    />
                ) : (
                    <div className="space-y-6">
                        <VoteCardResultsSection
                            vote={vote}
                            status={status}
                            isVoted={isVoted}
                            canChangeVoteWhileActive={canChangeVoteWhileActive}
                            visibleResults={visibleResults}
                            totalConfig={totalConfig}
                            turnoutConfig={turnoutConfig}
                            totalVotes={totalVotes}
                            totalStudents={totalStudents}
                            voteCount={voteCount}
                        />

                        <VoteCardVotingSection
                            vote={vote}
                            status={status}
                            isVoted={isVoted}
                            canChangeVoteWhileActive={canChangeVoteWhileActive}
                            canSubmitVote={canSubmitVote}
                            isCooldownActive={isCooldownActive}
                            cooldownRemainingSeconds={cooldownRemainingSeconds}
                            selectedOption={selectedOption}
                            onSelectOption={onSelectOption}
                            onVote={onVote}
                            onCancelVote={onCancelVote}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
