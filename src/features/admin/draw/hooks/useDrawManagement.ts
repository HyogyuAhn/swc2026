'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    createDrawItem,
    createDrawLiveEvent,
    deleteDrawItem,
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
    DrawRandomFilter,
    DrawSequenceStep,
    DrawSettings,
    DrawWarningCheck,
    DrawWinner
} from '@/features/admin/draw/types';
import {
    DEFAULT_DRAW_RANDOM_ROLES,
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_ROLE_OPTIONS
} from '@/features/admin/student/constants';

const isRpcMissingError = (message?: string) => {
    const text = (message || '').toLowerCase();
    return text.includes('could not find') || text.includes('does not exist') || text.includes('draw_pick_winner') || text.includes('draw_update_winner');
};

type ShowToast = (message: string, kind?: 'error' | 'info' | 'success') => void;
const DRAW_LIVE_CONTROL_CHANNEL = 'draw-live-control';
const DRAW_BUSY_MS = 14500;
const DRAW_PRE_START_DELAY_MS = 1100;
const DRAW_SEQUENCE_STEP_GAP_MS = 500;
const DRAW_SEQUENCE_PRE_DELAY_MS = 120;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeDrawNumberInput = (value: string) => value.replace(/\D/g, '').slice(0, 3);
const getDefaultRandomFilter = (): DrawRandomFilter => ({
    gender: 'ALL',
    departments: [...STUDENT_DEPARTMENT_OPTIONS],
    roles: [...DEFAULT_DRAW_RANDOM_ROLES]
});

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeGender = (value: unknown): '남' | '여' | '' => {
    const text = normalizeText(value);
    if (!text) {
        return '';
    }

    if (text === '남' || text === '남자' || text.toLowerCase() === 'male' || text.toLowerCase() === 'm') {
        return '남';
    }

    if (text === '여' || text === '여자' || text.toLowerCase() === 'female' || text.toLowerCase() === 'f') {
        return '여';
    }

    return '';
};

const normalizeDepartment = (value: unknown): string => {
    const text = normalizeText(value);
    if (!text) {
        return '';
    }

    const upper = text.toUpperCase();
    if (upper === 'CS') {
        return '컴퓨터공학과';
    }
    if (upper === 'AI') {
        return '인공지능공학과';
    }
    if (upper === 'DT') {
        return '디자인테크놀로지학과';
    }
    if (upper === 'DS') {
        return '데이터사이언스학과';
    }
    if (upper === 'SM' || upper === 'ME') {
        return '스마트모빌리티공학과';
    }

    if ((STUDENT_DEPARTMENT_OPTIONS as readonly string[]).includes(text)) {
        return text;
    }

    if (text.includes('컴공')) {
        return '컴퓨터공학과';
    }

    if (text.includes('컴퓨터') && text.includes('공학')) {
        return '컴퓨터공학과';
    }

    if (text.includes('인공지능')) {
        return '인공지능공학과';
    }

    if (text.includes('디자인')) {
        return '디자인테크놀로지학과';
    }

    if (text.includes('데이터')) {
        return '데이터사이언스학과';
    }

    if (text.includes('모빌리티')) {
        return '스마트모빌리티공학과';
    }

    return text;
};

const normalizeStudentRole = (value: unknown): string => {
    const text = normalizeText(value);
    if (!text) {
        return '';
    }

    if ((STUDENT_ROLE_OPTIONS as readonly string[]).includes(text)) {
        return text;
    }

    const lower = text.toLowerCase();
    if (lower === 'undergrad' || lower === 'undergraduate') {
        return '재학생';
    }

    if (text.includes('재학')) {
        return '재학생';
    }

    if (text.includes('신입')) {
        return '신입생';
    }

    if (text.includes('새내') || text.includes('새준')) {
        return '새준위';
    }

    return text;
};

type DrawExecuteOptions = {
    preDelayMs?: number;
    releaseBusyImmediately?: boolean;
    suppressSuccessToast?: boolean;
};

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
    const resolveStudentIdByDrawNumber = useCallback((drawNumber: string) => {
        const normalized = normalizeDrawNumberInput(drawNumber.trim());
        if (!normalized) {
            return null;
        }

        return pool.studentIdByDrawNumber[normalized] || null;
    }, [pool.studentIdByDrawNumber]);

    const getDrawNumberByStudentId = useCallback((studentId: string) => {
        return pool.drawNumberByStudentId[studentId] || '';
    }, [pool.drawNumberByStudentId]);

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
            showToast(`번호 목록 조회 실패: ${studentsResult.error.message}`);
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
        targetDrawNumber: string;
        mode: 'MANUAL_PICK' | 'FORCED_ADD' | 'UPDATE_WINNER';
        currentWinnerId?: string;
    }): DrawWarningCheck => {
        const { item, targetDrawNumber, currentWinnerId } = params;

        if (!targetDrawNumber) {
            return { blockingReason: '번호를 입력해주세요.', warnings: [], resolvedStudentId: null };
        }

        const resolvedStudentId = resolveStudentIdByDrawNumber(targetDrawNumber);
        if (!resolvedStudentId) {
            return { blockingReason: '등록된 번호가 아닙니다.', warnings: [], resolvedStudentId: null };
        }

        const student = pool.byId[resolvedStudentId];
        if (!student) {
            return { blockingReason: '등록된 번호가 아닙니다.', warnings: [], resolvedStudentId: null };
        }

        const sameItemDuplicate = item.winners.some(winner => winner.student_id === resolvedStudentId && winner.id !== currentWinnerId);
        if (sameItemDuplicate) {
            return { blockingReason: '같은 항목에서 동일 번호는 중복 당첨될 수 없습니다.', warnings: [], resolvedStudentId };
        }

        const warnings: string[] = [];

        if (student.is_suspended) {
            warnings.push('정지된 번호입니다.');
        }

        if (!item.allow_duplicate_winners) {
            const wonElsewhere = items.some(other => (
                other.id !== item.id &&
                other.winners.some(winner => winner.student_id === resolvedStudentId)
            ));

            if (wonElsewhere) {
                warnings.push('해당 번호는 이미 다른 항목에서 당첨된 상태입니다.');
            }
        }

        return { blockingReason: null, warnings, resolvedStudentId };
    }, [items, pool.byId, resolveStudentIdByDrawNumber]);

    const getRandomCandidates = useCallback((item: DrawItemWithComputed, randomFilter?: DrawRandomFilter) => {
        const itemWinnerSet = new Set(item.winners.map(w => w.student_id));
        const allWinnerSet = getAllWinnerStudentIds();
        const nextFilter = randomFilter || getDefaultRandomFilter();
        const normalizedFilterDepartments = (nextFilter.departments || [])
            .map(department => normalizeDepartment(department))
            .filter(Boolean);
        const departmentSet = new Set(normalizedFilterDepartments);
        const roleSet = new Set((nextFilter.roles || []).map(role => normalizeStudentRole(role)).filter(Boolean));
        const targetGender = normalizeGender(nextFilter.gender);

        const afterSameItem = pool.activeIds.filter(studentId => !itemWinnerSet.has(studentId));

        const afterCrossItem = afterSameItem.filter(studentId => {
            if (item.allow_duplicate_winners) {
                return true;
            }
            return !allWinnerSet.has(studentId);
        });

        const afterGender = afterCrossItem.filter(studentId => {
            const student = pool.byId[studentId];
            if (!student) {
                return false;
            }

            if (!targetGender) {
                return true;
            }

            return normalizeGender(student.gender) === targetGender;
        });

        const afterDepartment = afterGender.filter(studentId => {
            const student = pool.byId[studentId];
            if (!student) {
                return false;
            }

            const studentDepartment = normalizeDepartment(student.department);
            if (departmentSet.size > 0 && !departmentSet.has(studentDepartment)) {
                return false;
            }

            return true;
        });

        const candidates = afterDepartment.filter(studentId => {
            const student = pool.byId[studentId];
            if (!student) {
                return false;
            }

            const roleValue = normalizeStudentRole(student.student_role || '재학생');
            if (roleSet.size > 0 && !roleSet.has(roleValue)) {
                return false;
            }

            return true;
        });

        return {
            candidates,
            stats: {
                totalActive: pool.activeIds.length,
                afterSameItem: afterSameItem.length,
                afterCrossItem: afterCrossItem.length,
                afterGender: afterGender.length,
                afterDepartment: afterDepartment.length,
                final: candidates.length
            }
        };
    }, [getAllWinnerStudentIds, pool.activeIds, pool.byId]);

    const pickRandomCandidate = useCallback((item: DrawItemWithComputed, randomFilter?: DrawRandomFilter) => {
        const result = getRandomCandidates(item, randomFilter);
        if (result.candidates.length === 0) {
            return null;
        }

        const index = Math.floor(Math.random() * result.candidates.length);
        return result.candidates[index];
    }, [getRandomCandidates]);

    const startRandomDrawFallback = useCallback(async (
        item: DrawItemWithComputed,
        options?: DrawExecuteOptions,
        randomFilter?: DrawRandomFilter
    ) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return false;
        }

        const candidateResult = getRandomCandidates(item, randomFilter);
        const winnerStudentId = pickRandomCandidate(item, randomFilter);
        if (!winnerStudentId) {
            if (candidateResult.stats.totalActive === 0) {
                showToast('추첨 번호가 등록된 활성 학생이 없습니다. 학생 관리에서 번호를 먼저 등록해주세요.');
            } else if (candidateResult.stats.afterSameItem === 0) {
                showToast('해당 항목에서 뽑을 수 있는 남은 번호가 없습니다.');
            } else if (!item.allow_duplicate_winners && candidateResult.stats.afterCrossItem === 0) {
                showToast('이미 다른 항목 당첨자만 남았습니다. 항목 설정에서 중복 당첨 허용을 켜거나 당첨자를 조정해주세요.');
            } else if (candidateResult.stats.afterGender === 0) {
                showToast('선택한 성별 조건에 맞는 후보가 없습니다.');
            } else if (candidateResult.stats.afterDepartment === 0) {
                showToast('선택한 학과 조건에 맞는 후보가 없습니다.');
            } else {
                showToast('선택한 역할 조건에 맞는 후보가 없습니다.');
            }
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

        if (!options?.suppressSuccessToast) {
            const winnerNumber = getDrawNumberByStudentId(winnerStudentId) || '번호 미지정';
            showToast(`${winnerNumber} 번호가 당첨되었습니다.`, 'success');
        }
        await refresh();

        if (options?.releaseBusyImmediately) {
            clearDrawBusyForItem(item.id);
        }

        return true;
    }, [clearDrawBusyForItem, getDrawNumberByStudentId, getRandomCandidates, pickRandomCandidate, refresh, showToast]);

    const startManualDrawFallback = useCallback(async (
        item: DrawItemWithComputed,
        targetDrawNumber: string,
        forceOverride: boolean,
        options?: DrawExecuteOptions
    ) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return false;
        }

        const check = getWarningCheck({ item, targetDrawNumber, mode: 'MANUAL_PICK' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return false;
        }
        const targetStudentId = check.resolvedStudentId!;

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'MANUAL_PICK',
                item,
                targetStudentId: targetDrawNumber,
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

        if (!options?.suppressSuccessToast) {
            showToast(`${targetDrawNumber} 번호가 당첨되었습니다.`, 'success');
        }
        await refresh();

        if (options?.releaseBusyImmediately) {
            clearDrawBusyForItem(item.id);
        }

        return true;
    }, [clearDrawBusyForItem, getWarningCheck, refresh, showToast]);

    const executeRandomDraw = useCallback(async (
        item: DrawItemWithComputed,
        options?: DrawExecuteOptions,
        randomFilter?: DrawRandomFilter
    ) => {
        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return false;
        }

        const nextFilter = randomFilter || getDefaultRandomFilter();
        if ((nextFilter.departments || []).length === 0) {
            showToast('랜덤 뽑기 학과를 1개 이상 선택해주세요.');
            return false;
        }
        if ((nextFilter.roles || []).length === 0) {
            showToast('랜덤 뽑기 역할을 1개 이상 선택해주세요.');
            return false;
        }

        const preDelayMs = options?.preDelayMs ?? DRAW_PRE_START_DELAY_MS;
        markDrawBusy(item.id);
        setSubmitting(true);
        await announceDrawStart(item, 'RANDOM');
        await wait(preDelayMs);

        const success = await startRandomDrawFallback(item, options, nextFilter);
        if (!success) {
            await announceDrawCancel(item, '추첨 실패');
            clearDrawBusy();
            setSubmitting(false);
            return false;
        }

        if (options?.releaseBusyImmediately) {
            clearDrawBusyForItem(item.id);
        }
        setSubmitting(false);
        return true;
    }, [announceDrawCancel, announceDrawStart, clearDrawBusy, clearDrawBusyForItem, markDrawBusy, showToast, startRandomDrawFallback]);

    const executeManualDraw = useCallback(async (
        item: DrawItemWithComputed,
        targetDrawNumber: string,
        forceOverride: boolean,
        options?: DrawExecuteOptions
    ) => {
        const check = getWarningCheck({ item, targetDrawNumber, mode: 'MANUAL_PICK' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return false;
        }
        const targetStudentId = check.resolvedStudentId!;

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'MANUAL_PICK',
                item,
                targetStudentId: targetDrawNumber,
                warnings: check.warnings
            });
            return false;
        }

        const preDelayMs = options?.preDelayMs ?? DRAW_PRE_START_DELAY_MS;
        markDrawBusy(item.id);
        setSubmitting(true);
        await announceDrawStart(item, 'MANUAL');
        await wait(preDelayMs);

        const rpcResult = await pickWinnerWithRpc({
            itemId: item.id,
            mode: 'MANUAL',
            targetStudentId,
            forceOverride
        });

        if (rpcResult.error) {
            if (isRpcMissingError(rpcResult.error.message)) {
                const fallbackSuccess = await startManualDrawFallback(item, targetDrawNumber, forceOverride, options);
                if (!fallbackSuccess) {
                    await announceDrawCancel(item, '추첨 실패');
                    clearDrawBusyForItem(item.id);
                }
                setSubmitting(false);
                return fallbackSuccess;
            }

            showToast(`추첨 실패: ${rpcResult.error.message}`);
            await announceDrawCancel(item, rpcResult.error.message);
            clearDrawBusy();
            setSubmitting(false);
            return false;
        }

        if (!rpcResult.parsed.ok) {
            showToast(rpcResult.parsed.message || '추첨 실패');
            await announceDrawCancel(item, rpcResult.parsed.message || '추첨 실패');
            clearDrawBusy();
            setSubmitting(false);
            return false;
        }

        if (!options?.suppressSuccessToast) {
            showToast(`${targetDrawNumber} 번호가 당첨되었습니다.`, 'success');
        }
        await refresh();
        if (options?.releaseBusyImmediately) {
            clearDrawBusyForItem(item.id);
        }
        setSubmitting(false);
        return true;
    }, [announceDrawCancel, announceDrawStart, clearDrawBusy, clearDrawBusyForItem, getWarningCheck, markDrawBusy, refresh, showToast, startManualDrawFallback]);

    const handleStartDraw = useCallback(async (
        item: DrawItemWithComputed,
        options?: { mode: DrawMode; targetStudentId?: string; randomFilter?: DrawRandomFilter }
    ) => {
        if (drawInProgressItemId) {
            showToast('현재 다른 항목 추첨이 진행 중입니다.');
            return false;
        }

        const mode = options?.mode || drawModeByItem[item.id] || 'RANDOM';

        if (mode === 'RANDOM') {
            return await executeRandomDraw(item, undefined, options?.randomFilter);
        }

        const targetStudentId = (options?.targetStudentId || manualStudentByItem[item.id] || '').trim();
        if (!targetStudentId) {
            showToast('번호 뽑기 모드에서는 대상 번호를 선택해야 합니다.');
            return false;
        }

        return await executeManualDraw(item, targetStudentId, false);
    }, [drawInProgressItemId, drawModeByItem, executeManualDraw, executeRandomDraw, manualStudentByItem, showToast]);

    const handleStartSequence = useCallback(async (steps: DrawSequenceStep[]) => {
        if (!steps.length) {
            showToast('연속 뽑기 순서를 1개 이상 설정해주세요.');
            return false;
        }

        if (drawInProgressItemId) {
            showToast('현재 다른 항목 추첨이 진행 중입니다.');
            return false;
        }

        for (let index = 0; index < steps.length; index += 1) {
            const step = steps[index];
            const stepItem = items.find(item => item.id === step.itemId);
            if (!stepItem) {
                showToast(`${index + 1}번 순서의 항목을 찾을 수 없습니다.`);
                return false;
            }

            if (stepItem.remainingCount <= 0) {
                showToast(`${index + 1}번 순서(${stepItem.name})의 남은 수량이 없습니다.`);
                return false;
            }

            let ok = false;

            if (step.mode === 'RANDOM') {
                ok = await executeRandomDraw(stepItem, {
                    preDelayMs: DRAW_SEQUENCE_PRE_DELAY_MS,
                    releaseBusyImmediately: true,
                    suppressSuccessToast: true
                }, getDefaultRandomFilter());
            } else {
                const targetDrawNumber = (step.targetDrawNumber || '').trim();
                if (!targetDrawNumber) {
                    showToast(`${index + 1}번 순서의 대상 번호를 입력해주세요.`);
                    return false;
                }

                ok = await executeManualDraw(stepItem, targetDrawNumber, false, {
                    preDelayMs: DRAW_SEQUENCE_PRE_DELAY_MS,
                    releaseBusyImmediately: true,
                    suppressSuccessToast: true
                });
            }

            if (!ok) {
                showToast(`${index + 1}번 순서에서 연속 뽑기를 중단했습니다.`);
                return false;
            }

            if (index < steps.length - 1) {
                await wait(DRAW_SEQUENCE_STEP_GAP_MS);
            }
        }

        await refresh();
        showToast('연속 뽑기가 완료되었습니다.', 'success');
        return true;
    }, [drawInProgressItemId, executeManualDraw, executeRandomDraw, items, refresh, showToast]);

    const handleForceAdd = useCallback(async (item: DrawItemWithComputed) => {
        const targetDrawNumber = normalizeDrawNumberInput((forceStudentByItem[item.id] || '').trim());
        if (!targetDrawNumber) {
            showToast('강제 추가할 번호를 선택해주세요.');
            return;
        }

        if (item.remainingCount <= 0) {
            showToast('남은 당첨 자리가 없습니다.');
            return;
        }

        const check = getWarningCheck({ item, targetDrawNumber, mode: 'FORCED_ADD' });
        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }
        const targetStudentId = check.resolvedStudentId!;

        if (check.warnings.length > 0) {
            setPendingAction({
                type: 'FORCED_ADD',
                item,
                targetStudentId: targetDrawNumber,
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
        const winnerNumber = getDrawNumberByStudentId(winner.student_id) || '번호 미지정';
        if (!confirm(`${winnerNumber} 번호 당첨을 제거하시겠습니까?`)) {
            return;
        }

        const result = await deleteDrawWinner(winner.id);
        if (result.error) {
            showToast(`당첨자 제거 실패: ${result.error.message}`);
            return;
        }

        showToast('당첨자가 제거되었습니다.', 'success');
        await refresh();
    }, [getDrawNumberByStudentId, refresh, showToast]);

    const executeWinnerUpdateFallback = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner, targetDrawNumber: string, forceOverride: boolean) => {
        const check = getWarningCheck({
            item,
            targetDrawNumber,
            mode: 'UPDATE_WINNER',
            currentWinnerId: winner.id
        });

        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }
        const targetStudentId = check.resolvedStudentId!;

        if (check.warnings.length > 0 && !forceOverride) {
            setPendingAction({
                type: 'UPDATE_WINNER',
                item,
                winner,
                targetStudentId: targetDrawNumber,
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
        const targetDrawNumber = normalizeDrawNumberInput((editingStudentByWinnerId[winner.id] || '').trim());
        if (!targetDrawNumber) {
            showToast('수정할 번호를 입력해주세요.');
            return;
        }

        const currentDrawNumber = getDrawNumberByStudentId(winner.student_id);
        if (targetDrawNumber === currentDrawNumber) {
            setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
            return;
        }

        const check = getWarningCheck({
            item,
            targetDrawNumber,
            mode: 'UPDATE_WINNER',
            currentWinnerId: winner.id
        });

        if (check.blockingReason) {
            showToast(check.blockingReason);
            return;
        }
        const targetStudentId = check.resolvedStudentId!;

        if (check.warnings.length > 0) {
            setPendingAction({
                type: 'UPDATE_WINNER',
                item,
                winner,
                targetStudentId: targetDrawNumber,
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
                await executeWinnerUpdateFallback(item, winner, targetDrawNumber, false);
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
    }, [editingStudentByWinnerId, executeWinnerUpdateFallback, getDrawNumberByStudentId, getWarningCheck, refresh, showToast]);

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
            const targetStudentId = resolveStudentIdByDrawNumber(action.targetStudentId);
            if (!targetStudentId) {
                showToast('등록된 번호를 찾을 수 없습니다.');
                return;
            }

            const result = await insertDrawWinnerDirect({
                drawItemId: action.item.id,
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
            return;
        }

        if (action.type === 'UPDATE_WINNER') {
            const targetStudentId = resolveStudentIdByDrawNumber(action.targetStudentId);
            if (!targetStudentId) {
                showToast('등록된 번호를 찾을 수 없습니다.');
                return;
            }

            const rpcResult = await updateWinnerWithRpc({
                winnerId: action.winner.id,
                newStudentId: targetStudentId,
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
    }, [executeManualDraw, executeWinnerUpdateFallback, pendingAction, refresh, resolveStudentIdByDrawNumber, showToast]);

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
        setManualStudentByItem(prev => ({ ...prev, [itemId]: normalizeDrawNumberInput(studentId.trim()) }));
    }, []);

    const setForceStudentForItem = useCallback((itemId: string, studentId: string) => {
        setForceStudentByItem(prev => ({ ...prev, [itemId]: normalizeDrawNumberInput(studentId.trim()) }));
    }, []);

    const startEditWinner = useCallback((winner: DrawWinner) => {
        const drawNumber = getDrawNumberByStudentId(winner.student_id) || '';
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: true }));
        setEditingStudentByWinnerId(prev => ({ ...prev, [winner.id]: drawNumber }));
    }, [getDrawNumberByStudentId]);

    const cancelEditWinner = useCallback((winner: DrawWinner) => {
        const drawNumber = getDrawNumberByStudentId(winner.student_id) || '';
        setEditingWinnerById(prev => ({ ...prev, [winner.id]: false }));
        setEditingStudentByWinnerId(prev => ({ ...prev, [winner.id]: drawNumber }));
    }, [getDrawNumberByStudentId]);

    const changeEditWinnerStudent = useCallback((winnerId: string, studentId: string) => {
        setEditingStudentByWinnerId(prev => ({ ...prev, [winnerId]: normalizeDrawNumberInput(studentId.trim()) }));
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

    const handleDeleteItem = useCallback(async (item: DrawItemWithComputed) => {
        if (drawInProgressItemId === item.id) {
            showToast('추첨이 진행 중인 항목은 삭제할 수 없습니다.');
            return false;
        }

        const hasWinners = item.winnerCount > 0;
        const warningMessage = hasWinners
            ? `당첨자 ${item.winnerCount}명 기록도 함께 삭제됩니다.\n정말 "${item.name}" 항목을 제거하시겠습니까?`
            : `정말 "${item.name}" 항목을 제거하시겠습니까?`;

        if (!confirm(warningMessage)) {
            return false;
        }

        const result = await deleteDrawItem(item.id);
        if (result.error) {
            showToast(`항목 제거 실패: ${result.error.message}`);
            return false;
        }

        showToast('추첨 항목이 제거되었습니다.', 'success');
        await refresh();
        return true;
    }, [drawInProgressItemId, refresh, showToast]);

    const toggleWinnerPublic = useCallback(async (item: DrawItemWithComputed, winner: DrawWinner) => {
        if (!item.is_public) {
            showToast('항목이 비공개 상태라 당첨자 공개 전환을 할 수 없습니다.');
            return;
        }

        const prevPublic = winner.is_public ?? true;
        const nextPublic = !(winner.is_public ?? true);
        // 즉시 화면 반영
        setItems(prev => prev.map(currentItem => {
            if (currentItem.id !== item.id) {
                return currentItem;
            }

            return {
                ...currentItem,
                winners: currentItem.winners.map(currentWinner => (
                    currentWinner.id === winner.id
                        ? { ...currentWinner, is_public: nextPublic }
                        : currentWinner
                ))
            };
        }));

        const result = await updateDrawWinnerPublic({
            winnerId: winner.id,
            isPublic: nextPublic
        });

        if (result.error) {
            const lowerMessage = (result.error.message || '').toLowerCase();
            if (lowerMessage.includes('is_public') && lowerMessage.includes('column')) {
                showToast('draw_winners.is_public 컬럼이 없습니다. SQL 마이그레이션을 먼저 적용해주세요.');
            } else {
                showToast(`당첨자 공개 설정 변경 실패: ${result.error.message}`);
            }

            // 실패 시 롤백
            setItems(prev => prev.map(currentItem => {
                if (currentItem.id !== item.id) {
                    return currentItem;
                }

                return {
                    ...currentItem,
                    winners: currentItem.winners.map(currentWinner => (
                        currentWinner.id === winner.id
                            ? { ...currentWinner, is_public: prevPublic }
                            : currentWinner
                    ))
                };
            }));
            return;
        }

        showToast(nextPublic ? '당첨자를 라이브에 공개합니다.' : '당첨자를 라이브에서 숨깁니다.', 'success');
    }, [showToast]);

    return {
        loading,
        submitting,
        drawInProgressItemId,
        settings,
        items,
        activeStudentIds: pool.activeDrawNumbers,
        allStudentIds: pool.allIds,
        studentIdByDrawNumber: pool.studentIdByDrawNumber,
        drawNumberByStudentId: pool.drawNumberByStudentId,
        studentInfoById: pool.byId,
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
        handleStartSequence,
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
        handleDeleteItem,
        toggleWinnerPublic,
        confirmPendingAction,
        cancelPendingAction
    };
}
