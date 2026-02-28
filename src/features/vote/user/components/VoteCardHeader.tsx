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
        ? 'scale-[1.12] sm:scale-[1.22]'
        : status === 'UPCOMING'
            ? 'scale-[1.18] sm:scale-[1.32]'
            : 'scale-[1.16] sm:scale-[1.28]';

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
        <div className="mb-2">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {!!vote.is_pinned && (
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                        <Pin size={14} className="fill-current" /> 고정됨
                    </span>
                )}
                <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass}`}>
                    {statusLabel}
                </span>
                {status === 'ENDED' && !isVoted && (
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-500">
                        <X size={10} /> 미참여
                    </span>
                )}
                {isVoted && (
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                        <CheckCircle size={10} /> 참여완료
                    </span>
                )}
                {status === 'ACTIVE' && isVoted && (
                    <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${
                            canChangeVoteWhileActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {canChangeVoteWhileActive ? '수정 가능' : '수정 불가'}
                    </span>
                )}
            </div>
        </div>
    );

    const activeCharacterMobile = (
        <div className="relative h-[84px] w-[118px] overflow-visible">
            <Image
                src={characterConfig.src}
                alt={characterConfig.alt}
                fill
                sizes="118px"
                className={`object-contain select-none ${characterVisualClass}`}
                style={{ objectPosition: characterConfig.objectPosition }}
            />
        </div>
    );

    const activeCharacterDesktop = (
        <div className="relative h-[122px] w-[176px] overflow-visible">
            <Image
                src={characterConfig.src}
                alt={characterConfig.alt}
                fill
                sizes="176px"
                className={`object-contain select-none ${characterVisualClass}`}
                style={{ objectPosition: characterConfig.objectPosition }}
            />
        </div>
    );

    const inactiveCharacter = (
        <div className="relative h-[96px] w-[126px] sm:h-[146px] sm:w-[194px] overflow-visible">
            <Image
                src={characterConfig.src}
                alt={characterConfig.alt}
                fill
                sizes="(max-width: 640px) 126px, 194px"
                className={`object-contain select-none ${characterVisualClass}`}
                style={{ objectPosition: characterConfig.objectPosition }}
            />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 border-b border-gray-100">
            {status === 'ACTIVE' ? (
                <>
                    <div className="sm:hidden">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
                            <div className="min-w-0">
                                {badges}
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                {remainingTime && (
                                    <div className="text-right">
                                        <div className="text-xs text-blue-600 font-bold mb-1">남은 시간</div>
                                        <div className="text-lg font-mono font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">
                                            {remainingTime}
                                        </div>
                                    </div>
                                )}
                                <div className="pr-1">
                                    {activeCharacterMobile}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_176px_auto] items-start gap-4">
                        <div className="min-w-0">
                            {badges}
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                        </div>

                        <div className="flex justify-center self-start">
                            {activeCharacterDesktop}
                        </div>

                        {remainingTime && (
                            <div className="text-right shrink-0 justify-self-end">
                                <div className="text-xs text-blue-600 font-bold mb-1">남은 시간</div>
                                <div className="text-lg font-mono font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">
                                    {remainingTime}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex items-start justify-between gap-3 sm:gap-5">
                    <div className="min-w-0">
                        {badges}
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{vote.title}</h2>
                    </div>

                    <div className="shrink-0">
                        {inactiveCharacter}
                    </div>
                </div>
            )}
        </div>
    );
}
