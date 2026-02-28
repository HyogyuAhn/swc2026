export type DrawLiveEventRecord = {
    id: string;
    draw_item_id: string;
    draw_item_name: string;
    winner_student_id: string;
    draw_mode: 'RANDOM' | 'MANUAL';
    is_forced: boolean;
    is_public: boolean;
    created_at: string;
};

export type DrawRecentWinner = {
    id: string;
    draw_item_id: string;
    draw_item_name: string;
    student_id: string;
    selected_mode: string;
    is_forced: boolean;
    created_at: string;
};

export type DrawAnimationPhase = 'idle' | 'announce' | 'mixing' | 'ball' | 'paper' | 'reveal';

export type DrawLiveSettings = {
    live_page_enabled: boolean;
};
