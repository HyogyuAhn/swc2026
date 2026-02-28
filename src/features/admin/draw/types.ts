export type DrawMode = 'RANDOM' | 'MANUAL';
export type DrawWinnerMode = DrawMode | 'FORCED';

export type DrawItem = {
    id: string;
    name: string;
    winner_quota: number;
    allow_duplicate_winners: boolean;
    is_public: boolean;
    sort_order: number;
    created_at: string;
    updated_at?: string;
    draw_winners?: DrawWinner[];
};

export type DrawWinner = {
    id: string;
    draw_item_id: string;
    student_id: string;
    selected_mode: DrawWinnerMode;
    is_forced: boolean;
    created_at: string;
    updated_at?: string;
};

export type DrawLiveEvent = {
    id: string;
    draw_item_id: string;
    draw_item_name: string;
    winner_student_id: string;
    draw_mode: DrawMode;
    is_forced: boolean;
    is_public: boolean;
    created_at: string;
};

export type DrawSettings = {
    singleton?: boolean;
    live_page_enabled: boolean;
    updated_at?: string;
};

export type DrawItemWithComputed = DrawItem & {
    winners: DrawWinner[];
    winnerCount: number;
    remainingCount: number;
};

export type DrawPickResult = {
    ok: boolean;
    message: string;
    winner_student_id: string | null;
    remaining_after: number | null;
    forced: boolean;
};

export type DrawWarningCheck = {
    blockingReason: string | null;
    warnings: string[];
};

export type DrawPendingAction =
    | {
        type: 'MANUAL_PICK';
        item: DrawItemWithComputed;
        targetStudentId: string;
        warnings: string[];
    }
    | {
        type: 'FORCED_ADD';
        item: DrawItemWithComputed;
        targetStudentId: string;
        warnings: string[];
    }
    | {
        type: 'UPDATE_WINNER';
        item: DrawItemWithComputed;
        winner: DrawWinner;
        targetStudentId: string;
        warnings: string[];
    }
    | null;
