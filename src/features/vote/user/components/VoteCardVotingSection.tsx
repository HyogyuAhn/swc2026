type VoteCardVotingSectionProps = {
    vote: any;
    isVoted: boolean;
    canChangeVoteWhileActive: boolean;
    canSubmitVote: boolean;
    selectedOption: string;
    onSelectOption: (voteId: string, optionId: string) => void;
    onVote: (vote: any) => void;
};

export default function VoteCardVotingSection({
    vote,
    isVoted,
    canChangeVoteWhileActive,
    canSubmitVote,
    selectedOption,
    onSelectOption,
    onVote
}: VoteCardVotingSectionProps) {
    if (!canSubmitVote) {
        return null;
    }

    return (
        <div className="pt-4 border-t border-gray-100">
            <p className="font-bold text-gray-800 mb-3">투표하기</p>
            <div className="grid gap-3">
                {vote.vote_options.map(option => (
                    <label
                        key={option.id}
                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all group ${
                            selectedOption === option.id
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                selectedOption === option.id
                                    ? 'border-blue-600'
                                    : 'border-gray-300 group-hover:border-blue-400'
                            }`}
                        >
                            {selectedOption === option.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                        </div>
                        <input
                            type="radio"
                            name={`vote-${vote.id}`}
                            className="hidden"
                            onChange={() => onSelectOption(vote.id, option.id)}
                            checked={selectedOption === option.id}
                        />
                        <span className={`font-medium ${selectedOption === option.id ? 'text-blue-900' : 'text-gray-700'}`}>
                            {option.name}
                        </span>
                    </label>
                ))}
            </div>
            <button
                onClick={() => onVote(vote)}
                disabled={!selectedOption}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all ${
                    selectedOption
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
                {isVoted && canChangeVoteWhileActive ? '투표 수정' : '투표 완료'}
            </button>
        </div>
    );
}
