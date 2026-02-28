import { Clock } from 'lucide-react';

type VoteCardUpcomingNoticeProps = {
    vote: any;
    showOptionsBeforeStart: boolean;
};

export default function VoteCardUpcomingNotice({
    vote,
    showOptionsBeforeStart
}: VoteCardUpcomingNoticeProps) {
    return (
        <div className="bg-yellow-50 rounded-xl p-5 text-center border border-yellow-100">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-bold text-yellow-800">투표 시작 전입니다.</p>
            <p className="text-sm text-yellow-600 mt-1">{new Date(vote.start_at).toLocaleString()} 에 시작됩니다.</p>
            {showOptionsBeforeStart ? (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {vote.vote_options.map(option => (
                        <span
                            key={option.id}
                            className="px-3 py-1 bg-white/60 border border-yellow-200 rounded-lg text-sm text-yellow-800"
                        >
                            {option.name}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="mt-4 text-sm font-medium text-yellow-700">투표 시작 후 항목이 공개됩니다.</p>
            )}
        </div>
    );
}
