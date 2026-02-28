import { CheckCircle, Pin, X } from 'lucide-react';
import Image from 'next/image';
import { STATUS_CHARACTER_CONFIG } from '@/features/vote/user/constants';
import { VoteStatus } from '@/features/vote/user/types';

type VoteCardHeaderProps = {
    vote: any;
    status: VoteStatus;
    isVoted: boolean;
    canChangeVoteWhileActive: boolean;
    remainingTime: string | null;
};

export default function VoteCardHeader({
    vote,
    status,
    isVoted,
    canChangeVoteWhileActive,
    remainingTime
}: VoteCardHeaderProps) {
    const characterConfig = STATUS_CHARACTER_CONFIG[status];
    const characterVisualClass = status === 'ACTIVE'
        ? 'scale-[1.24] -translate-y-[2px] sm:scale-[1.28]'
        : status === 'UPCOMING'
            ? 'scale-[1.36] -translate-y-[1px] sm:scale-[1.42]'
            : 'scale-[1.42] -translate-y-[8px] sm:scale-[1.5] sm:-translate-y-[10px]';

    const statusBadgeClass = status === 'ACTIVE'
        ? 'bg-green-100 text-green-700'
        : status === 'UPCOMING'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-600';

    const statusLabel = status === 'ACTIVE'
        ? '진행중'
        : status === 'UPCOMING'
            ? '시작 전'
            : '종료됨';

    const badges = (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
            {!!vote.is_pinned && (
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full ring-1 ring-indigo-200">
                    <Pin size={14} className="fill-current" /> 고정됨
                </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass}`}>
                {statusLabel}
            </span>
            {isVoted && (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} /> 참여완료
                </span>
            )}
            {isVoted && canChangeVoteWhileActive && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">수정 가능</span>
            )}
            {status === 'ENDED' && !isVoted && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    <X size={10} /> 미참여
                </span>
            )}
        </div>
    );

    const character = (
        <div
            className={`relative overflow-hidden ${
                status === 'ACTIVE'
                    ? 'h-[92px] w-[124px] sm:h-[126px] sm:w-[176px]'
                    : 'h-[92px] w-[124px] sm:h-[124px] sm:w-[168px]'
            }`}
        >
            <Image
                src={characterConfig.src}
                alt={characterConfig.alt}
                fill
                sizes={status === 'ACTIVE' ? '(max-width: 640px) 124px, 176px' : '(max-width: 640px) 124px, 168px'}
                className={`object-contain select-none ${characterVisualClass}`}
                style={{ objectPosition: characterConfig.objectPosition }}
            />
        </div>
    );

    return (
        <div className="p-5 sm:p-6 border-b border-gray-100">
            {status === 'ACTIVE' ? (
                <div className="grid grid-cols-[minmax(0,1fr)_124px_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_176px_auto] sm:gap-4">
                    <div className="min-w-0">
                        {badges}
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                    </div>

                    {remainingTime && (
                        <div className="text-right shrink-0 justify-self-end">
                            <div className="text-xs text-blue-600 font-bold mb-1">남은 시간</div>
                            <div className="text-lg font-mono font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">
                                {remainingTime}
                            </div>
                        </div>
                    )}

                    <div className="col-start-2 row-start-1 flex justify-center self-start">
                        {character}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
                    <div className="min-w-0">
                        {badges}
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                    </div>

                    <div className="justify-self-end self-start">
                        {character}
                    </div>
                </div>
            )}
        </div>
    );
}
