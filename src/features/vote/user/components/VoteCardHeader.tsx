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

    return (
        <div className="p-6 border-b border-gray-100">
            {status === 'ACTIVE' ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(108px,148px)_auto] sm:gap-4">
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

                    <div className="col-span-2 flex justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:self-start">
                        <div className="relative h-[72px] w-[104px] sm:h-[88px] sm:w-[128px]">
                            <Image
                                src={characterConfig.src}
                                alt={characterConfig.alt}
                                fill
                                sizes="(max-width: 640px) 104px, 128px"
                                className="object-contain select-none"
                                style={{ objectPosition: characterConfig.objectPosition }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
                    <div className="min-w-0">
                        {badges}
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                    </div>

                    <div className="justify-self-end self-start">
                        <div className="relative h-[72px] w-[104px] sm:h-[88px] sm:w-[128px]">
                            <Image
                                src={characterConfig.src}
                                alt={characterConfig.alt}
                                fill
                                sizes="(max-width: 640px) 104px, 128px"
                                className="object-contain select-none"
                                style={{ objectPosition: characterConfig.objectPosition }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
