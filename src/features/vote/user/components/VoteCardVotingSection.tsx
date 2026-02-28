import { useMemo, useState } from 'react';
import VoteActionModal from './VoteActionModal';

type VoteCardVotingSectionProps = {
    vote: any;
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
    isVoted: boolean;
    canChangeVoteWhileActive: boolean;
    isCooldownActive: boolean;
    cooldownRemainingSeconds: number;
    selectedOption: string;
    onSelectOption: (voteId: string, optionId: string) => void;
    onVote: (vote: any) => void;
    onCancelVote: (vote: any) => void;
};

export default function VoteCardVotingSection({
    vote,
    status,
    isVoted,
    canChangeVoteWhileActive,
    isCooldownActive,
    cooldownRemainingSeconds,
    selectedOption,
    onSelectOption,
    onVote,
    onCancelVote
}: VoteCardVotingSectionProps) {
    const [confirmAction, setConfirmAction] = useState<'modify' | 'cancel' | null>(null);

    if (status !== 'ACTIVE') {
        return null;
    }

    const isReadonlyAfterVote = isVoted && !canChangeVoteWhileActive;
    const isOptionsDisabled = isReadonlyAfterVote || isCooldownActive;
    const selectedOptionName = useMemo(() => {
        if (!selectedOption) {
            return '';
        }
        return vote.vote_options.find(option => String(option.id) === selectedOption)?.name || '';
    }, [selectedOption, vote.vote_options]);

    const confirmDialogTitle = confirmAction === 'modify' ? '투표 항목 수정' : '투표 취소';
    const confirmDialogMessage = confirmAction === 'modify'
        ? `정말 수정하시겠습니까?\n선택 항목: ${selectedOptionName || '선택 안 됨'}`
        : '정말 투표를 취소하시겠습니까?\n취소 후 30초 뒤에 재투표할 수 있습니다.';

    const handleConfirmAction = () => {
        if (confirmAction === 'modify') {
            onVote(vote);
        }

        if (confirmAction === 'cancel') {
            onCancelVote(vote);
        }

        setConfirmAction(null);
    };

    return (
        <div className="pt-4 border-t border-gray-100">
            <p className="font-bold text-gray-800 mb-3">투표하기</p>
            {isReadonlyAfterVote && (
                <p className="mb-3 text-sm font-medium text-gray-500">
                    이미 참여한 투표입니다. 아래에서 선택한 항목을 확인할 수 있습니다.
                </p>
            )}
            {!isVoted && isCooldownActive && (
                <p className="mb-3 text-sm font-medium text-gray-500">
                    방금 투표를 취소했습니다. {cooldownRemainingSeconds}초 뒤에 재투표할 수 있습니다.
                </p>
            )}
            <div className="grid gap-3">
                {vote.vote_options.map(option => (
                    <label
                        key={option.id}
                        className={`flex items-center p-4 rounded-xl border transition-all group ${
                            selectedOption === String(option.id)
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                : 'border-gray-200'
                        } ${
                            isOptionsDisabled
                                ? 'cursor-not-allowed opacity-80'
                                : 'cursor-pointer hover:border-blue-300 hover:bg-gray-50'
                        }`}
                    >
                        <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                selectedOption === String(option.id)
                                    ? 'border-blue-600'
                                    : isOptionsDisabled
                                        ? 'border-gray-300'
                                        : 'border-gray-300 group-hover:border-blue-400'
                            }`}
                        >
                            {selectedOption === String(option.id) && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                        </div>
                        <input
                            type="radio"
                            name={`vote-${vote.id}`}
                            className="hidden"
                            disabled={isOptionsDisabled}
                            onChange={() => onSelectOption(String(vote.id), String(option.id))}
                            checked={selectedOption === String(option.id)}
                        />
                        <span className={`font-medium ${selectedOption === String(option.id) ? 'text-blue-900' : 'text-gray-700'}`}>
                            {option.name}
                        </span>
                    </label>
                ))}
            </div>

            {!isVoted && (
                <button
                    onClick={() => onVote(vote)}
                    disabled={!selectedOption || isCooldownActive}
                    className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all ${
                        selectedOption && !isCooldownActive
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {isCooldownActive ? `${cooldownRemainingSeconds}초 뒤 투표 가능` : '투표'}
                </button>
            )}

            {isVoted && canChangeVoteWhileActive && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            if (!selectedOption || isCooldownActive) {
                                return;
                            }
                            setConfirmAction('modify');
                        }}
                        disabled={!selectedOption || isCooldownActive}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                            !selectedOption || isCooldownActive
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                        }`}
                    >
                        {isCooldownActive ? `${cooldownRemainingSeconds}초 뒤 수정 가능` : '수정하기'}
                    </button>
                    <button
                        onClick={() => setConfirmAction('cancel')}
                        className="py-3 rounded-xl font-bold text-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                    >
                        투표 취소
                    </button>
                </div>
            )}

            <VoteActionModal
                isOpen={confirmAction !== null}
                title={confirmDialogTitle}
                message={confirmDialogMessage}
                confirmLabel={confirmAction === 'modify' ? '수정하기' : '취소하기'}
                cancelLabel="닫기"
                confirmTone={confirmAction === 'cancel' ? 'danger' : 'primary'}
                onConfirm={handleConfirmAction}
                onClose={() => setConfirmAction(null)}
            />
        </div>
    );
}
