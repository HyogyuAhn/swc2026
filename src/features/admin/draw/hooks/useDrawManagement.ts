'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    createDrawItem,
    createDrawLiveEvent,
    deleteDrawWinner,
    fetchDrawItems,
    fetchDrawSettings,
    fetchStudentPool,
    insertDrawWinnerDirect,
    normalizeDrawItems,
    normalizeStudentPool,
    pickWinnerWithRpc,
    StudentPoolRecord,
    updateDrawItem,
    updateDrawWinnerPublic,
    updateWinnerDirect,
    updateWinnerWithRpc,
    upsertDrawSettings
} from '@/features/admin/draw/api';
import {
    DrawItemWithComputed,
    DrawMode,
    DrawPendingAction,
    DrawSettings,
    DrawWarningCheck,
    DrawWinner
} from '@/features/admin/draw/types';

const isRpcMissingError = (message?: string) => {
    const text = (message || '').toLowerCase();
    return text.includes('could not find') || text.includes('does not exist') || text.includes('draw_pick_winner') || text.includes('draw_update_winner');
};

type ShowToast = (message: string, kind?: 'error' | 'info' | 'success') => void;
const DRAW_LIVE_CONTROL_CHANNEL = 'draw-live-control';
const DRAW_BUSY_MS = 12000;
const DRAW_PRE_START_DELAY_MS = 1100;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function useDrawManagement(showToast: ShowToast, enabled = true) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [settings, setSettings] = useState<DrawSettings>({
        live_page_enabled: true,
        show_recent_winners: true
    });
    const [items, setItems] = useState<DrawItemWithComputed[]>([]);
    const [studentPool, setStudentPool] = useState<StudentPoolRecord[]>([]);

    const [newItemName, setNewItemName] = useState('');
    const [newItemQuota, setNewItemQuota] = useState('1');
    const [newItemAllowDuplicate, setNewItemAllowDuplicate] = useState(false);
    const [newItemPublic, setNewItemPublic] = useState(true);
    const [newItemShowRecentWinners, setNewItemShowRecentWinners] = useState(true);

    const [drawModeByItem, setDrawModeByItem] = useState<Record<string, DrawMode>>({});
    const [manualStudentByItem, setManualStudentByItem] = useState<Record<string, string>>({});
    const [forceStudentByItem, setForceStudentByItem] = useState<Record<string, string>>({});

    const [editingWinnerById, setEditingWinnerById] = useState<Record<string, boolean>>({});
    const [editingStudentByWinnerId, setEditingStudentByWinnerId] = useState<Record<string, string>>({});

    const [pendingAction, setPendingAction] = useState<DrawPendingAction>(null);
    const [drawInProgressItemId, setDrawInProgressItemId] = useState<string | null>(null);

    const drawBusyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const liveControlChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const pool = useMemo(() => normalizeStudentPool(studentPool), [studentPool]);

    const refresh = useCallback(async () => {
        const [settingsResult, itemsResult, studentsResult] = await Promise.all([
            fetchDrawSettings(),
            fetchDrawItems(),
            fetchStudentPool()
        ]);

        if (settingsResult.error) {
            showToast(`추첨 설정 조회 실패: ${settingsResult.error.message}`);
        } else {
            setSettings({
                live_page_enabled: settingsResult.data?.live_page_enabled ?? true,
                show_recent_winners: settingsResult.data?.show_recent_winners ?? true
            });
        }

        if (itemsResult.error) {
            showToast(`추첨 항목 조회 실패: ${itemsResult.error.message}`);
        } else {
            setItems(normalizeDrawItems(itemsResult.data));
        }

        if (studentsResult.error) {
            showToast(`학번 조회 실패: ${studentsResult.error.message}`);
        } else {
            setStudentPool(studentsResult.data || []);
        }
    }, [showToast]);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const load = async () => {
            setLoading(true);
            await refresh();
            if (mounted) {
                setLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [enabled, refresh]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const channel = supabase
            .channel('admin-draw-management')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'draw_items' }, () => refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'draw_winners' }, () => refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'draw_settings' }, () => refresh())
            .subscribe();

        const poller = setInterval(() => {
            refresh();
        }, 10000);

        return () => {
            clearInterval(poller);
            supabase.removeChannel(channel);
        };
    }, [enabled, refresh]);

    useEffect(() => {
        return () => {
            if (drawBusyTimerRef.current) {
                clearTimeout(drawBusyTimerRef.current);
                drawBusyTimerRef.current = null;
            }
        };
    }, []);

    const clearDrawBusy = useCallback(() => {
        if (drawBusyTimerRef.current) {
            clearTimeout(drawBusyTimerRef.current);
            drawBusyTimerRef.current = null;
        }

        setDrawInProgressItemId(null);
    }, []);

    const clearDrawBusyForItem = useCallback((itemId: string) => {
        setDrawInProgressItemId(current => {
            if (current !== itemId) {
                return current;
            }

            if (drawBusyTimerRef.current) {
                clearTimeout(drawBusyTimerRef.current);
                drawBusyTimerRef.current = null;
            }

            return null;
        });
    }, []);

    const markDrawBusy = useCallback((itemId: string, durationMs = DRAW_BUSY_MS) => {
        if (drawBusyTimerRef.current) {
            clearTimeout(drawBusyTimerRef.current);
            drawBusyTimerRef.current = null;
        }

        setDrawInProgressItemId(itemId);

        drawBusyTimerRef.current = setTimeout(() => {
            setDrawInProgressItemId(current => (current === itemId ? null : current));
            drawBusyTimerRef.current = null;
        }, durationMs);
    }, []);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const channel = supabase
            .channel(DRAW_LIVE_CONTROL_CHANNEL)
            .on('broadcast', { event: 'draw-start' }, payload => {
                const itemId = String(payload?.payload?.itemId || '');
                if (!itemId) {
                    return;
                }

                markDrawBusy(itemId);
            })
            .on('broadcast', { event: 'draw-cancel' }, payload => {
                const itemId = String(payload?.payload?.itemId || '');
                if (!itemId) {
                    clearDrawBusy();
                    return;
                }

                clearDrawBusyForItem(itemId);
            });
        liveControlChannelRef.current = channel;
        channel.subscribe();

        return () => {
            liveControlChannelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [clearDrawBusy, clearDrawBusyForItem, enabled, markDrawBusy]);

    const announceDrawStart = useCallback(async (item: DrawItemWithComputed, mode: DrawMode) => {
        const channel = liveControlChannelRef.current;
        if (!channel) {
            return;
        }

        await channel.send({
            type: 'broadcast',
            event: 'draw-start',
            payload: {
                itemId: item.id,
                itemName: item.name,
                mode,
                startedAt: new Date().toISOString()
            }
        });
    }, []);

    const announceDrawCancel = useCallback(async (item: DrawItemWithComputed, reason: string) => {
        const channel = liveControlChannelRef.current;
        if (!channel) {
            return;
        }

        await channel.send({
            type: 'broadcast',
            event: 'draw-cancel',
            payload: {
                itemId: item.id,
                itemName: item.name,
                reason
            }
        });
    }, []);

    const getAllWinnerStudentIds = useCallback(() => {
        const ids = new Set<string>();
        items.forEach(item => {
            item.winners.forEach(winner => {
                ids.add(winner.student_id);
            });
        });
        return ids;
    }, [items]);

    const getWarningCheck = useCallback((params: {
        item: DrawItemWithComputed;
        targetStudentId: string;
        mode: 'MANUAL_PICK' | 'FORCED_ADD' | 'UPDATE_WINNER';
        currentWinnerId?: string;
    }): DrawWarningCheck => {
        const { item, targetStudentId, currentWinnerId } = params;

        if (!targetStudentId) {
            return { blockingReason: '학번을 입력해주세요.', warnings: [] };
        }

        const student = pool.byId[targetStudentId];
        if (!student) {
            return { blockingReason: '등록된 학번이 아닙니다.', warnings: [] };
        }

        const sameItemDuplicate = item.winners.some(winner => winner.student_id === targetStudentId && winner.id !== currentWinnerId);
        if (sameItemDuplicate) {
            return { blockingReason: '같은 항목에서 동일 학번은 중복 당첨될 수 없습니다.', warnings: [] };
        }

        const warnings: string[] = [];

        if (student.is_suspended) {
            warnings.push('정지된 학번입니다.');
        }

        if (!item.allow_duplicate_winners) {
            const wonElsewhere = items.some(other => (
                other.id !== item.id &&
                other.winners.some(winner => winner.student_id === targetStudentId)
            ));

            if (wonElsewhere) {
                warnings.push('해당 학번은 이미 다른 항목에서 당첨된 상태입니다.');
            }
        }

        return { blockingReason: null, warnings };
    }, [items, pool.byId]);

    const pickRandomCandidate = useCallback((item: DrawItemWithComputed) => {
        const itemWinnerSet = new Set(item.winners.map(w => w.student_id));
        const allWinnerSet = getAllWinnerStudentIds();

        const candidates = pool.activeIds.filter(studentId => {
            if (itemWinnerSet.has(studentId)) {
                return false;
            }

            if (!item.allow_duplicate_winners && allWinnerSet.has(studentId)) {
                return false;
            }

            return true;
        });

        if (candidates.length === 0) {
            return null;
        }

        const index = Math.floor(Math.random() * candidates.length);
        return candidates[index];
    }, [getAllWinnerStudentIds, pool.activeIds]);

    const startRandomDrawFallback = useCallback(async (item: DrawItemWithComputed) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return false;
        }

        const winnerStudentId = pickRandomCandidate(item);
        if (!winnerStudentId) {
            showToast('조건에 맞는 추첨 대상이 없습니다.');
            return false;
        }

        const insertResult = await insertDrawWinnerDirect({
            drawItemId: item.id,
            studentId: winnerStudentId,
            selectedMode: 'RANDOM',
            isForced: false
        });

        if (insertResult.error) {
            showToast(`추첨 실패: ${insertResult.error.message}`);
            return false;
        }

        await createDrawLiveEvent({
            itemId: item.id,
            itemName: item.name,
            studentId: winnerStudentId,
            drawMode: 'RANDOM',
            isForced: false,
            isPublic: item.is_public
        });

        showToast(`${winnerStudentId} 학번이 당첨되었습니다.`, 'success');
        await refresh();
        return true;
    }, [pickRandomCandidate, refresh, showToast]);

    const startManualDrawFallback = useCallback(async (item: DrawItemWithComputed, targetStudentId: string, forceOverride: boolean) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return false;
        }

        const check = getWarningCheck({ item, targetStudentId, mode: 'MANUAL_PICK' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return false;
        }

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'MANUAL_PICK',
                item,
                targetStudentId,
                warnings: check.warnings
            });
            return false;
        }

        const insertResult = await insertDrawWinnerDirect({
            drawItemId: item.id,
            studentId: targetStudentId,
            selectedMode: 'MANUAL',
            isForced: forceOverride
        });

        if (insertResult.error) {
            showToast(`추첨 실패: ${insertResult.error.message}`);
            return false;
        }

        await createDrawLiveEvent({
            itemId: item.id,
            itemName: item.name,
            studentId: targetStudentId,
            drawMode: 'MANUAL',
            isForced: forceOverride,
            isPublic: item.is_public
        });

        showToast(`${targetStudentId} 학번이 당첨되었습니다.`, 'success');
        await refresh();
        return true;
    }, [getWarningCheck, refresh, showToast]);

    const executeRandomDraw = useCallback(async (item: DrawItemWithComputed) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return;
        }

        markDrawBusy(item.id);
        setSubmitting(true);
        await announceDrawStart(item, 'RANDOM');
        await wait(DRAW_PRE_START_DELAY_MS);

        const rpcResult = await pickWinnerWithRpc({
            itemId: item.id,
            mode: 'RANDOM',
            targetStudentId: null,
            forceOverride: false
        });

        if (rpcResult.error) {
            if (isRpcMissingError(rpcResult.error.message)) {
                const fallbackSuccess = await startRandomDrawFallback(item);
                if (!fallbackSuccess) {
                    await announceDrawCancel(item, '추첨 실패');
                    clearDrawBusyForItem(item.id);
                }
                setSubmitting(false);
                return;
            }

            showToast(`추첨 실패: ${rpcResult.error.message}`);
            await announceDrawCancel(item, rpcResult.error.message);
            clearDrawBusy();
            setSubmitting(false);
            return;
        }

        if (!rpcResult.parsed.ok) {
            showToast(rpcResult.parsed.message || '추첨 실패');
            await announceDrawCancel(item, rpcResult.parsed.message || '추첨 실패');
            clearDrawBusy();
            setSubmitting(false);
            return;
        }

        showToast(`${rpcResult.parsed.winner_student_id} 학번이 당첨되었습니다.`, 'success');
        await refresh();
        setSubmitting(false);
    }, [announceDrawCancel, announceDrawStart, clearDrawBusy, clearDrawBusyForItem, markDrawBusy, refresh, showToast, startRandomDrawFallback]);

    const executeManualDraw = useCallback(async (item: DrawItemWithComputed, targetStudentId: string, forceOverride: boolean) => {
        const check = getWarningCheck({ item, targetStudentId, mode: 'MANUAL_PICK' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'MANUAL_PICK',
                item,
                targetStudentId,
                warnings: check.warnings
            });
            return;
        }

        markDrawBusy(item.id);
        setSubmitting(true);
        await announceDrawStart(item, 'MANUAL');
        await wait(DRAW_PRE_START_DELAY_MS);

        const rpcResult = await pickWinnerWithRpc({
            itemId: item.id,
            mode: 'MANUAL',
            targetStudentId,
            forceOverride
        });

        if (rpcResult.error) {
            if (isRpcMissingError(rpcResult.error.message)) {
                const fallbackSuccess = await startManualDrawFallback(item, targetStudentId, forceOverride);
                if (!fallbackSuccess) {
                    await announceDrawCancel(item, '추첨 실패');
                    clearDrawBusyForItem(item.id);
                }
                setSubmitting(false);
                return;
            }

            showToast(`추첨 실패: ${rpcResult.error.message}`);
            await announceDrawCancel(item, rpcResult.error.message);
            clearDrawBusy();
            setSubmitting(false);
            return;
        }

        if (!rpcResult.parsed.ok) {
            showToast(rpcResult.parsed.message || '추첨 실패');
            await announceDrawCancel(item, rpcResult.parsed.message || '추첨 실패');
            clearDrawBusy();
            setSubmitting(false);
            return;
        }

        showToast(`${rpcResult.parsed.winner_student_id} 학번이 당첨되었습니다.`, 'success');
        await refresh();
        setSubmitting(false);
    }, [announceDrawCancel, announceDrawStart, clearDrawBusy, clearDrawBusyForItem, getWarningCheck, markDrawBusy, refresh, showToast, startManualDrawFallback]);

    const handleStartDraw = useCallback(async (
        item: DrawItemWithComputed,
        options?: { mode: DrawMode; targetStudentId?: string }
    ) => {
        if (drawInProgressItemId) {
            showToast('현재 다른 항목 추첨이 진행 중입니다.');
            return;
        }

        const mode = options?.mode || drawModeByItem[item.id] || 'RANDOM';

        if (mode === 'RANDOM') {
            await executeRandomDraw(item);
            return;
        }

        const targetStudentId = (options?.targetStudentId || manualStudentByItem[item.id] || '').trim();
        if (!targetStudentId) {
            showToast('학번 뽑기 모드에서는 대상 학번을 선택해야 합니다.');
            return;
        }

        await executeManualDraw(item, targetStudentId, false);
    }, [drawInProgressItemId, drawModeByItem, executeManualDraw, executeRandomDraw, manualStudentByItem, showToast]);

    const handleForceAdd = useCallback(async (item: DrawItemWithComputed) => {
        const targetStudentId = (forceStudentByItem[item.id] || '').trim();
        if (!targetStudentId) {
            showToast('강제 추가할 학번을 선택해주세요.');
            return;
        }

        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return;
        }

        const check = getWarningCheck({ item, targetStudentId, mode: 'FORCED_ADD' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }

        if (check.warnings.length > 0) {
            setPendingAction({
                type: 'FORCED_ADD',
                item,
                targetStudentId,
                warnings: check.warnings
            });
            return;
        }

        const result = await insertDrawWinnerDirect({
            drawItemId: item.id,
            studentId: targetStudentId,
            selectedMode: 'FORCED',
            isForced: true
        });

        if (result.error) {
            showToast(`강제 추가 실패: ${result.error.message}`);
            return;
        }

        showToast('강제 추가가 완료되었습니다.', 'success');
        await refresh();
    }, [forceStudentByItem, getWarningCheck, refresh, showToast]);

    const handleDeleteWinner = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner) => {
        if (!confirm(`${winner.student_id} 학번 당첨을 제거하시겠습니까?`)) {
            return;
        }

        const result = await deleteDrawWinner(winner.id);
        if (result.error) {
            showToast(`당첨자 제거 실패: ${result.error.message}`);
            return;
        }

        showToast('당첨자가 제거되었습니다.', 'success');
        await refresh();
    }, [refresh, showToast]);

    const executeWinnerUpdateFallback = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner, targetStudentId: string, forceOverride: boolean) => {
        const check = getWarningCheck({
            item,
            targetStudentId,
            mode: 'UPDATE_WINNER',
            currentWinnerId: winner.id
        });

        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'UPDATE_WINNER',
                item,
                winner,
                targetStudentId,
                warnings: check.warnings
            });
            return;
        }

        const updateResult = await updateWinnerDirect({
            winnerId: winner.id,
            studentId: targetStudentId,
            isForced: forceOverride
        });

        if (updateResult.error) {
            showToast(`당첨자 수정 실패: ${updateResult.error.message}`);
            return;
        }

        showToast('당첨자 수정이 완료되었습니다.', 'success');
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
        await refresh();
    }, [getWarningCheck, refresh, showToast]);

    const handleUpdateWinner = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner) => {
        const targetStudentId = (editingStudentByWinnerId[winner.id] || '').trim();
        if (!targetStudentId) {
            showToast('수정할 학번을 입력해주세요.');
            return;
        }

        if (targetStudentId === winner.student_id) {
            setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
            return;
        }

        const check = getWarningCheck({
            item,
            targetStudentId,
            mode: 'UPDATE_WINNER',
            currentWinnerId: winner.id
        });

        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }

        if (check.warnings.length > 0) {
            setPendingAction({
                type: 'UPDATE_WINNER',
                item,
                winner,
                targetStudentId,
                warnings: check.warnings
            });
            return;
        }

        const rpcResult = await updateWinnerWithRpc({
            winnerId: winner.id,
            newStudentId: targetStudentId,
            forceOverride: false
        });

        if (rpcResult.error) {
            if (isRpcMissingError(rpcResult.error.message)) {
                await executeWinnerUpdateFallback(item, winner, targetStudentId, false);
                return;
            }

            showToast(`당첨자 수정 실패: ${rpcResult.error.message}`);
            return;
        }

        if (!rpcResult.parsed.ok) {
            showToast(rpcResult.parsed.message || '당첨자 수정 실패');
            return;
        }

        showToast('당첨자 수정이 완료되었습니다.', 'success');
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
        await refresh();
    }, [editingStudentByWinnerId, executeWinnerUpdateFallback, getWarningCheck, refresh, showToast]);

    const confirmPendingAction = useCallback(async () => {
        if (!pendingAction) {
            return;
        }

        const action = pendingAction;
        setPendingAction(null);

        if (action.type === 'MANUAL_PICK') {
            await executeManualDraw(action.item, action.targetStudentId, true);
            return;
        }

        if (action.type === 'FORCED_ADD') {
            const result = await insertDrawWinnerDirect({
                drawItemId: action.item.id,
                studentId: action.targetStudentId,
                selectedMode: 'FORCED',
                isForced: true
            });

            if (result.error) {
                showToast(`강제 추가 실패: ${result.error.message}`);
                return;
            }

            showToast('강제 추가가 완료되었습니다.', 'success');
            await refresh();
            return;
        }

        if (action.type === 'UPDATE_WINNER') {
            const rpcResult = await updateWinnerWithRpc({
                winnerId: action.winner.id,
                newStudentId: action.targetStudentId,
                forceOverride: true
            });

            if (rpcResult.error) {
                if (isRpcMissingError(rpcResult.error.message)) {
                    await executeWinnerUpdateFallback(action.item, action.winner, action.targetStudentId, true);
                    return;
                }

                showToast(`당첨자 수정 실패: ${rpcResult.error.message}`);
                return;
            }

            if (!rpcResult.parsed.ok) {
                showToast(rpcResult.parsed.message || '당첨자 수정 실패');
                return;
            }

            showToast('당첨자 수정이 완료되었습니다.', 'success');
            setEditingWinnerById(prev => ({ ...prev, [action.winner.id]: false }));
            await refresh();
        }
    }, [executeManualDraw, executeWinnerUpdateFallback, pendingAction, refresh, showToast]);

    const cancelPendingAction = useCallback(() => {
        setPendingAction(null);
    }, []);

    const handleCreateItem = useCallback(async () => {
        const name = newItemName.trim();
        const quota = Number(newItemQuota);

        if (!name) {
            showToast('당첨 항목 이름을 입력해주세요.');
            return false;
        }

        if (!Number.isFinite(quota) || quota < 1) {
            showToast('당첨 개수는 1 이상이어야 합니다.');
            return false;
        }

        const nextSortOrder = items.length === 0
            ? 0
            : Math.max(...items.map(item => Number(item.sort_order || 0))) + 1;

        const result = await createDrawItem({
            name,
            winner_quota: quota,
            allow_duplicate_winners: newItemAllowDuplicate,
            is_public: newItemPublic,
            show_recent_winners: newItemShowRecentWinners,
            sort_order: nextSortOrder
        });

        if (result.error) {
            const lowerMessage = (result.error.message || '').toLowerCase();
            if (lowerMessage.includes('show_recent_winners') && lowerMessage.includes('column')) {
                showToast('draw_items.show_recent_winners 컬럼이 없습니다. SQL 마이그레이션을 먼저 적용해주세요.');
                return false;
            }
            showToast(`추첨 항목 생성 실패: ${result.error.message}`);
            return false;
        }

        setNewItemName('');
        setNewItemQuota('1');
        setNewItemAllowDuplicate(false);
        setNewItemPublic(true);
        setNewItemShowRecentWinners(true);

        showToast('추첨 항목이 생성되었습니다.', 'success');
        await refresh();
        return true;
    }, [items, newItemAllowDuplicate, newItemName, newItemPublic, newItemQuota, newItemShowRecentWinners, refresh, showToast]);

    const setModeForItem = useCallback((itemId: string, mode: DrawMode) => {
        setDrawModeByItem(prev => ({ ...prev, [itemId]: mode }));
    }, []);

    const setManualStudentForItem = useCallback((itemId: string, studentId: string) => {
        setManualStudentByItem(prev => ({ ...prev, [itemId]: studentId.trim() }));
    }, []);

    const setForceStudentForItem = useCallback((itemId: string, studentId: string) => {
        setForceStudentByItem(prev => ({ ...prev, [itemId]: studentId.trim() }));
    }, []);

    const startEditWinner = useCallback((winner: DrawWinner) => {
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: true }));
        setEditingStudentByWinnerId(prev => ({ ...prev, [winner.id]: winner.student_id }));
    }, []);

    const cancelEditWinner = useCallback((winner: DrawWinner) => {
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
        setEditingStudentByWinnerId(prev => ({ ...prev, [winner.id]: winner.student_id }));
    }, []);

    const changeEditWinnerStudent = useCallback((winnerId: string, studentId: string) => {
        setEditingStudentByWinnerId(prev => ({ ...prev, [winnerId]: studentId.trim() }));
    }, []);

    const toggleDrawLiveEnabled = useCallback(async () => {
        const nextEnabled = !settings.live_page_enabled;

        const result = await upsertDrawSettings({ live_page_enabled: nextEnabled });
        if (result.error) {
            if ((result.error.message || '').toLowerCase().includes('row-level security policy')) {
                showToast('라이브 설정 변경 권한이 없습니다. draw_settings UPDATE 정책을 확인해주세요.');
                return;
            }

            showToast(`라이브 설정 변경 실패: ${result.error.message}`);
            return;
        }

        await refresh();
        showToast(nextEnabled ? '라이브 페이지가 활성화되었습니다.' : '라이브 페이지가 비활성화되었습니다.', 'success');
    }, [refresh, settings.live_page_enabled, showToast]);

    const toggleRecentWinnersEnabled = useCallback(async () => {
        const nextEnabled = !settings.show_recent_winners;

        const result = await upsertDrawSettings({ show_recent_winners: nextEnabled });
        if (result.error) {
            const lowerMessage = (result.error.message || '').toLowerCase();
            if (lowerMessage.includes('row-level security policy')) {
                showToast('최근 당첨 결과 설정 변경 권한이 없습니다. draw_settings UPDATE 정책을 확인해주세요.');
                return;
            }

            if (lowerMessage.includes('show_recent_winners') && lowerMessage.includes('column')) {
                showToast('draw_settings.show_recent_winners 컬럼이 없습니다. SQL 마이그레이션을 먼저 적용해주세요.');
                return;
            }

            showToast(`최근 당첨 결과 설정 변경 실패: ${result.error.message}`);
            return;
        }

        await refresh();
        showToast(nextEnabled ? '최근 당첨 결과를 공개합니다.' : '최근 당첨 결과를 비공개합니다.', 'success');
    }, [refresh, settings.show_recent_winners, showToast]);

    const toggleItemPublic = useCallback(async (item: DrawItemWithComputed) => {
        const result = await updateDrawItem(item.id, { is_public: !item.is_public });

        if (result.error) {
            showToast(`공개 설정 변경 실패: ${result.error.message}`);
            return;
        }

        showToast(!item.is_public ? '해당 항목을 라이브에 공개합니다.' : '해당 항목을 라이브에서 숨깁니다.', 'success');
        await refresh();
    }, [refresh, showToast]);

    const toggleItemAllowDuplicate = useCallback(async (item: DrawItemWithComputed) => {
        const result = await updateDrawItem(item.id, { allow_duplicate_winners: !item.allow_duplicate_winners });

        if (result.error) {
            showToast(`중복 설정 변경 실패: ${result.error.message}`);
            return;
        }

        showToast(!item.allow_duplicate_winners ? '다른 항목 중복 당첨을 허용합니다.' : '다른 항목 중복 당첨을 제한합니다.', 'success');
        await refresh();
    }, [refresh, showToast]);

    const saveItemSettings = useCallback(async (
        item: DrawItemWithComputed,
        patch: {
            name: string;
            winner_quota: number;
            allow_duplicate_winners: boolean;
            is_public: boolean;
            show_recent_winners: boolean;
        }
    ) => {
        const normalizedName = patch.name.trim();
        if (!normalizedName) {
            showToast('항목 이름을 입력해주세요.');
            return false;
        }

        if (!Number.isFinite(patch.winner_quota) || patch.winner_quota < 1) {
            showToast('당첨 개수는 1 이상이어야 합니다.');
            return false;
        }

        if (patch.winner_quota < item.winnerCount) {
            showToast(`현재 당첨자(${item.winnerCount}명)보다 작은 개수로는 변경할 수 없습니다.`);
            return false;
        }

        const result = await updateDrawItem(item.id, {
            name: normalizedName,
            winner_quota: patch.winner_quota,
            allow_duplicate_winners: patch.allow_duplicate_winners,
            is_public: patch.is_public,
            show_recent_winners: patch.show_recent_winners
        });

        if (result.error) {
            const lowerMessage = (result.error.message || '').toLowerCase();
            if (lowerMessage.includes('show_recent_winners') && lowerMessage.includes('column')) {
                showToast('draw_items.show_recent_winners 컬럼이 없습니다. SQL 마이그레이션을 먼저 적용해주세요.');
                return false;
            }

            showToast(`항목 설정 저장 실패: ${result.error.message}`);
            return false;
        }

        showToast('항목 설정이 저장되었습니다.', 'success');
        await refresh();
        return true;
    }, [refresh, showToast]);

    const toggleWinnerPublic = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner) => {
        if (!item.is_public) {
            showToast('항목이 비공개 상태라 당첨자 공개 전환을 할 수 없습니다.');
            return;
        }

        const nextPublic = !(winner.is_public ?? true);
        const result = await updateDrawWinnerPublic({
            winnerId: winner.id,
            isPublic: nextPublic
        });

        if (result.error) {
            const lowerMessage = (result.error.message || '').toLowerCase();
            if (lowerMessage.includes('is_public') && lowerMessage.includes('column')) {
                showToast('draw_winners.is_public 컬럼이 없습니다. SQL 마이그레이션을 먼저 적용해주세요.');
                return;
            }

            showToast(`당첨자 공개 설정 변경 실패: ${result.error.message}`);
            return;
        }

        const appliedPublic = result.data?.is_public ?? nextPublic;

        // 즉시 화면 반영(새로고침 없이 토글 상태 확인 가능)
        setItems(prev => prev.map(currentItem => {
            if (currentItem.id !== item.id) {
                return currentItem;
            }

            return {
                ...currentItem,
                winners: currentItem.winners.map(currentWinner => (
                    currentWinner.id === winner.id
                        ? { ...currentWinner, is_public: appliedPublic }
                        : currentWinner
                ))
            };
        }));

        showToast(appliedPublic ? '당첨자를 라이브에 공개합니다.' : '당첨자를 라이브에서 숨깁니다.', 'success');
    }, [showToast]);

    return {
        loading,
        submitting,
        drawInProgressItemId,
        settings,
        items,
        activeStudentIds: pool.activeIds,
        allStudentIds: pool.allIds,
        newItemName,
        setNewItemName,
        newItemQuota,
        setNewItemQuota,
        newItemAllowDuplicate,
        setNewItemAllowDuplicate,
        newItemPublic,
        setNewItemPublic,
        newItemShowRecentWinners,
        setNewItemShowRecentWinners,
        drawModeByItem,
        manualStudentByItem,
        forceStudentByItem,
        editingWinnerById,
        editingStudentByWinnerId,
        pendingAction,
        refresh,
        handleCreateItem,
        setModeForItem,
        setManualStudentForItem,
        setForceStudentForItem,
        handleStartDraw,
        handleForceAdd,
        handleDeleteWinner,
        startEditWinner,
        cancelEditWinner,
        changeEditWinnerStudent,
        handleUpdateWinner,
        toggleDrawLiveEnabled,
        toggleRecentWinnersEnabled,
        toggleItemPublic,
        toggleItemAllowDuplicate,
        saveItemSettings,
        toggleWinnerPublic,
        confirmPendingAction,
        cancelPendingAction
    };
}
