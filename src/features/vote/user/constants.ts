import { VoteStatus } from './types';

export const STATUS_CHARACTER_CONFIG: Record<
    VoteStatus,
    { src: string; objectPosition: string; alt: string }
> = {
    UPCOMING: {
        src: '/images/character1.png',
        objectPosition: '50% 51%',
        alt: '시작 전 캐릭터'
    },
    ACTIVE: {
        src: '/images/character2.png',
        objectPosition: '50% 53%',
        alt: '진행 중 캐릭터'
    },
    ENDED: {
        src: '/images/character3.png',
        objectPosition: '48% 49%',
        alt: '종료됨 캐릭터'
    }
};
