import { supabase } from '@/lib/supabase';
import {
    DrawItem,
    DrawPickResult,
    DrawSettings,
    DrawWinner
} from '@/features/admin/draw/types';

export type StudentPoolRecord = {
    student_id: string;
    is_suspended: boolean;
    name?: string | null;
    gender?: string | null;
    department?: string | null;
    student_role?: string | null;
    draw_number?: string | null;
};

const parseRpcResult = (raw: any): DrawPickResult => {
    if (Array.isArray(raw) && raw.length > 0) {
        return parseRpcResult(raw[0]);
    }

    if (!raw || typeof raw !== 'object') {
        return {
            ok: false,
            message: 'RPC 응답 형식이 올바르지 않습니다.',
            winner_student_id: null,
            remaining_after: null,
            forced: false
        };
    }

    return {
        ok: Boolean(raw.ok),
        message: String(raw.message ?? (raw.ok ? '성공' : '실패')),
        winner_student_id: raw.winner_student_id ? String(raw.winner_student_id) : null,
        remaining_after: raw.remaining_after == null ? null : Number(raw.remaining_after),
        forced: Boolean(raw.forced)
    };
};

export async function fetchDrawSettings() {
    return supabase
        .from('draw_settings')
        .select('*')
        .eq('singleton', true)
        .maybeSingle();
}

export async function upsertDrawSettings(nextSettings: Partial<Pick<DrawSettings, 'live_page_enabled' | 'show_recent_winners'>>) {
    return supabase
        .from('draw_settings')
        .update({
            ...nextSettings,
            updated_at: new Date().toISOString()
        })
        .eq('singleton', true);
}

export async function fetchDrawItems() {
    return supabase
        .from('draw_items')
        .select('*, draw_winners(*)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
}

export async function fetchStudentPool() {
    return supabase
        .from('students')
        .select('student_id, is_suspended, name, gender, department, student_role, draw_number')
        .order('student_id', { ascending: true });
}

export async function createDrawItem(params: {
    name: string;
    winner_quota: number;
    allow_duplicate_winners: boolean;
    is_public: boolean;
    show_recent_winners: boolean;
    sort_order: number;
}) {
    return supabase
        .from('draw_items')
        .insert({
            name: params.name,
            winner_quota: params.winner_quota,
            allow_duplicate_winners: params.allow_duplicate_winners,
            is_public: params.is_public,
            show_recent_winners: params.show_recent_winners,
            sort_order: params.sort_order
        });
}

export async function updateDrawItem(
    itemId: string,
    patch: Partial<Pick<DrawItem, 'name' | 'winner_quota' | 'allow_duplicate_winners' | 'is_public' | 'show_recent_winners' | 'sort_order'>>
) {
    return supabase
        .from('draw_items')
        .update({
            ...patch,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
}

export async function pickWinnerWithRpc(params: {
    itemId: string;
    mode: 'RANDOM' | 'MANUAL';
    targetStudentId?: string | null;
    forceOverride?: boolean;
}) {
    const response = await supabase.rpc('draw_pick_winner', {
        p_item_id: params.itemId,
        p_mode: params.mode,
        p_target_student_id: params.targetStudentId ?? null,
        p_force_override: Boolean(params.forceOverride)
    });

    return {
        ...response,
        parsed: parseRpcResult(response.data)
    };
}

export async function updateWinnerWithRpc(params: {
    winnerId: string;
    newStudentId: string;
    forceOverride?: boolean;
}) {
    const response = await supabase.rpc('draw_update_winner', {
        p_winner_id: params.winnerId,
        p_new_student_id: params.newStudentId,
        p_force_override: Boolean(params.forceOverride)
    });

    return {
        ...response,
        parsed: parseRpcResult(response.data)
    };
}

export async function insertDrawWinnerDirect(params: {
    drawItemId: string;
    studentId: string;
    selectedMode: 'RANDOM' | 'MANUAL' | 'FORCED';
    isForced: boolean;
}) {
    return supabase
        .from('draw_winners')
        .insert({
            draw_item_id: params.drawItemId,
            student_id: params.studentId,
            selected_mode: params.selectedMode,
            is_forced: params.isForced
        })
        .select('*')
        .single();
}

export async function deleteDrawWinner(winnerId: string) {
    return supabase
        .from('draw_winners')
        .delete()
        .eq('id', winnerId);
}

export async function updateDrawWinnerPublic(params: {
    winnerId: string;
    isPublic: boolean;
}) {
    return supabase
        .from('draw_winners')
        .update({
            is_public: params.isPublic,
            updated_at: new Date().toISOString()
        })
        .eq('id', params.winnerId);
}

export async function updateWinnerDirect(params: {
    winnerId: string;
    studentId: string;
    isForced: boolean;
}) {
    return supabase
        .from('draw_winners')
        .update({
            student_id: params.studentId,
            selected_mode: params.isForced ? 'FORCED' : 'MANUAL',
            is_forced: params.isForced,
            updated_at: new Date().toISOString()
        })
        .eq('id', params.winnerId);
}

export async function createDrawLiveEvent(params: {
    itemId: string;
    itemName: string;
    studentId: string;
    drawMode: 'RANDOM' | 'MANUAL';
    isForced: boolean;
    isPublic: boolean;
}) {
    return supabase
        .from('draw_live_events')
        .insert({
            draw_item_id: params.itemId,
            draw_item_name: params.itemName,
            winner_student_id: params.studentId,
            draw_mode: params.drawMode,
            is_forced: params.isForced,
            is_public: params.isPublic
        });
}

export async function fetchPublicRecentWinners(limit = 20) {
    return supabase
        .from('draw_winners')
        .select('*, draw_items(id, name, is_public, show_recent_winners)')
        .order('created_at', { ascending: false })
        .limit(limit);
}

export async function fetchRecentLiveEvents(limit = 10) {
    return supabase
        .from('draw_live_events')
        .select('*')
        .order('seq', { ascending: false })
        .limit(limit);
}

export function normalizeStudentPool(records: StudentPoolRecord[] | null | undefined) {
    if (!records) {
        return {
            allIds: [] as string[],
            activeIds: [] as string[],
            allDrawNumbers: [] as string[],
            activeDrawNumbers: [] as string[],
            byId: {} as Record<string, StudentPoolRecord>,
            studentIdByDrawNumber: {} as Record<string, string>,
            drawNumberByStudentId: {} as Record<string, string>
        };
    }

    const byId: Record<string, StudentPoolRecord> = {};
    const allIds: string[] = [];
    const activeIds: string[] = [];
    const allDrawNumbers: string[] = [];
    const activeDrawNumbers: string[] = [];
    const studentIdByDrawNumber: Record<string, string> = {};
    const drawNumberByStudentId: Record<string, string> = {};

    records.forEach(record => {
        byId[record.student_id] = record;
        allIds.push(record.student_id);

        const drawNumber = String(record.draw_number || '').replace(/\D/g, '').slice(0, 3);
        if (drawNumber) {
            drawNumberByStudentId[record.student_id] = drawNumber;
            studentIdByDrawNumber[drawNumber] = record.student_id;
            allDrawNumbers.push(drawNumber);
        }

        if (!record.is_suspended && drawNumber) {
            activeIds.push(record.student_id);
            activeDrawNumbers.push(drawNumber);
        }
    });

    return {
        byId,
        allIds,
        activeIds,
        allDrawNumbers,
        activeDrawNumbers,
        studentIdByDrawNumber,
        drawNumberByStudentId
    };
}

export function normalizeDrawItems(items: DrawItem[] | null | undefined) {
    if (!items) {
        return [];
    }

    return items.map(item => {
        const winners = ((item.draw_winners || []) as DrawWinner[])
            .slice()
            .map(winner => ({
                ...winner,
                is_public: winner.is_public ?? true
            }))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const winnerCount = winners.length;

        return {
            ...item,
            show_recent_winners: item.show_recent_winners ?? true,
            winners,
            winnerCount,
            remainingCount: Math.max(0, Number(item.winner_quota || 0) - winnerCount)
        };
    });
}
