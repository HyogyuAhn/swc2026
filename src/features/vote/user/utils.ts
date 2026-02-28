import { VoteStatus } from './types';

export const getVoteStatus = (vote: any, now: Date = new Date()): VoteStatus => {
    const start = new Date(vote.start_at);
    const end = new Date(vote.end_at);

    if (now < start) {
        return 'UPCOMING';
    }

    if (now <= end) {
        return 'ACTIVE';
    }

    return 'ENDED';
};

export const getRemainingTime = (endDate: string | Date) => {
    const total = new Date(endDate).getTime() - Date.now();
    if (total <= 0) {
        return null;
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) {
        return `${days}일 ${hours}시간 남음`;
    }

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')} 남음`;
};

export const getVisibleVotesByFilter = (votes: any[], filter: string, now: Date) => {
    const priority: Record<VoteStatus, number> = {
        ACTIVE: 1,
        UPCOMING: 2,
        ENDED: 3
    };

    const visibleVotes = votes.filter(vote => {
        const status = getVoteStatus(vote, now);

        if (status === 'ENDED' && vote.show_after_end === false) {
            return false;
        }

        if (filter === 'ALL') {
            return true;
        }

        return status === filter;
    });

    visibleVotes.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) {
            return -1;
        }

        if (!a.is_pinned && b.is_pinned) {
            return 1;
        }

        const statusA = getVoteStatus(a, now);
        const statusB = getVoteStatus(b, now);

        if (priority[statusA] !== priority[statusB]) {
            return priority[statusA] - priority[statusB];
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return visibleVotes;
};
