'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchDrawSettings,
    fetchRecentLiveEvents,
    fetchPublicRecentWinners,
    fetchStudentPool
} from '@/features/admin/draw/api';
import {
    DrawAnimationPhase,
    DrawBatchRevealStyle,
    DrawLiveEventRecord,
    DrawSequenceStatus,
    DrawLiveSettings,
    DrawRecentWinner
} from '@/features/draw-live/types';

const MAX_RECENT_WINNERS = 30;
const PRE_START_TIMEOUT_MS = 6000;
const DRAW_CHAIN_GAP_MS = 260;
const DRAW_LIVE_CONTROL_CHANNEL = 'draw-live-control';
const FAST_TIMELINE = {
    mixingAt: 760,
    ballAt: 2600,
    paperAt: 4300,
    revealAt: 6000,
    endAt: 9800
};
const NORMAL_TIMELINE = {
    mixingAt: 1100,
    ballAt: 3900,
    paperAt: 6700,
    revealAt: 8600,
    endAt: 15000
};

const toRecentWinner = (row: any): DrawRecentWinner | null => {
    const drawItem = Array.isArray(row.draw_items)
        ? row.draw_items[0]
        : row.draw_items;

    if (!drawItem || drawItem.show_recent_winners === false || row?.is_public === false) {
        return null;
    }

    return {
        id: String(row.id),
        draw_item_id: String(row.draw_item_id),
        draw_item_name: String(drawItem.name || '항목'),
        student_id: String(row.student_id),
        selected_mode: String(row.selected_mode || 'RANDOM'),
        is_forced: Boolean(row.is_forced),
        created_at: String(row.created_at)
    };
};

export default function useDrawLiveFeed() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<DrawLiveSettings>({
        live_page_enabled: true,
        show_recent_winners: true
    });
    const [recentWinners, setRecentWinners] = useState<DrawRecentWinner[]>([]);
    const [studentNumberById, setStudentNumberById] = useState<Record<string, string>>({});
    const [queue, setQueue] = useState<DrawLiveEventRecord[]>([]);
    const [currentEvent, setCurrentEvent] = useState<DrawLiveEventRecord | null>(null);
    const [batchRevealEvents, setBatchRevealEvents] = useState<DrawLiveEventRecord[] | null>(null);
    const [sequenceStatus, setSequenceStatus] = useState<DrawSequenceStatus>({
        active: false,
        revealMode: 'STEP',
        batchRevealStyle: 'ONE_BY_ONE',
        itemNames: [],
        currentIndex: -1
    });
    const [preStartItemName, setPreStartItemName] = useState<string | null>(null);
    const [phase, setPhase] = useState<DrawAnimationPhase>('idle');

    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const preStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const kickoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const queueRef = useRef<DrawLiveEventRecord[]>([]);
    const batchCaptureRef = useRef<{
        expectedCount: number;
        collected: DrawLiveEventRecord[];
        label: string;
        batchRevealStyle: DrawBatchRevealStyle;
        startedAt?: string;
        itemNames?: string[];
    } | null>(null);
    const pendingTimelineProfileByItemIdRef = useRef<Record<string, 'NORMAL' | 'FAST'>>({});
    const sequenceEndPendingRef = useRef(false);
    const startNextQueuedEventRef = useRef<() => boolean>(() => false);
    const runTimelineRef = useRef<() => void>(() => { });
    const phaseRef = useRef<DrawAnimationPhase>('idle');
    const currentEventRef = useRef<DrawLiveEventRecord | null>(null);
    const recentRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const settingsRef = useRef<DrawLiveSettings>({
        live_page_enabled: true,
        show_recent_winners: true
    });

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(timerId => clearTimeout(timerId));
        timersRef.current = [];
    }, []);

    const clearRecentRefreshTimer = useCallback(() => {
        if (recentRefreshTimerRef.current) {
            clearTimeout(recentRefreshTimerRef.current);
            recentRefreshTimerRef.current = null;
        }
    }, []);

    const clearPreStartTimer = useCallback(() => {
        if (preStartTimerRef.current) {
            clearTimeout(preStartTimerRef.current);
            preStartTimerRef.current = null;
        }
    }, []);

    const clearBatchCapture = useCallback(() => {
        batchCaptureRef.current = null;
    }, []);

    const activatePreStart = useCallback((itemName: string) => {
        clearPreStartTimer();
        setPreStartItemName(itemName);
        preStartTimerRef.current = setTimeout(() => {
            setPreStartItemName(current => (current === itemName ? null : current));
            preStartTimerRef.current = null;
        }, PRE_START_TIMEOUT_MS);
    }, [clearPreStartTimer]);

    const finalizeSequenceStatus = useCallback(() => {
        if (!sequenceEndPendingRef.current) {
            return;
        }

        sequenceEndPendingRef.current = false;
        setSequenceStatus(prev => ({
            ...prev,
            active: false,
            itemNames: [],
            currentIndex: -1
        }));
    }, []);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        currentEventRef.current = currentEvent;
    }, [currentEvent]);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const startNextQueuedEvent = useCallback(() => {
        const currentQueue = queueRef.current;
        if (!currentQueue.length) {
            return false;
        }

        const [next, ...rest] = currentQueue;
        queueRef.current = rest;
        setQueue(rest);
        clearPreStartTimer();
        setPreStartItemName(null);
        if (!next.id.startsWith('batch-seq-')) {
            setBatchRevealEvents(null);
        }
        setSequenceStatus(prev => {
            if (!prev.active || prev.itemNames.length === 0) {
                return prev;
            }

            if (next.id.startsWith('batch-seq-')) {
                return {
                    ...prev,
                    currentIndex: Math.max(prev.itemNames.length - 1, 0)
                };
            }

            const matchedIndex = prev.itemNames.findIndex(name => name === next.draw_item_name);
            if (matchedIndex < 0) {
                return prev;
            }

            return {
                ...prev,
                currentIndex: matchedIndex
            };
        });
        setCurrentEvent(next);
        setPhase('announce');
        return true;
    }, [clearPreStartTimer]);

    const loadRecentWinners = useCallback(async () => {
        const result = await fetchPublicRecentWinners(MAX_RECENT_WINNERS);
        if (result.error) {
            return;
        }

        const normalized = (result.data || [])
            .map(toRecentWinner)
            .filter(Boolean) as DrawRecentWinner[];

        setRecentWinners(normalized);
    }, []);

    const scheduleCurrentAnimation = useCallback(() => {
        clearTimers();
        const timelineProfile = currentEventRef.current?.timeline_profile || 'NORMAL';
        const timeline = timelineProfile === 'FAST' ? FAST_TIMELINE : NORMAL_TIMELINE;

        timersRef.current.push(setTimeout(() => setPhase('mixing'), timeline.mixingAt));
        timersRef.current.push(setTimeout(() => setPhase('ball'), timeline.ballAt));
        timersRef.current.push(setTimeout(() => setPhase('paper'), timeline.paperAt));
        timersRef.current.push(setTimeout(() => setPhase('reveal'), timeline.revealAt));
        timersRef.current.push(setTimeout(async () => {
            if (settings.show_recent_winners) {
                await loadRecentWinners();
            } else {
                setRecentWinners([]);
            }

            if (queueRef.current.length > 0) {
                setCurrentEvent(null);
                timersRef.current.push(setTimeout(() => {
                    const started = startNextQueuedEventRef.current();
                    if (!started) {
                        setBatchRevealEvents(null);
                        setPhase('idle');
                        return;
                    }

                    runTimelineRef.current();
                }, DRAW_CHAIN_GAP_MS));
                return;
            }

            setBatchRevealEvents(null);
            finalizeSequenceStatus();
            setPhase('idle');
            setCurrentEvent(null);
        }, timeline.endAt));
    }, [clearTimers, finalizeSequenceStatus, loadRecentWinners, settings.show_recent_winners]);

    const startNextQueuedEventWithTimeline = useCallback(() => {
        const started = startNextQueuedEvent();
        if (!started) {
            return false;
        }

        scheduleCurrentAnimation();
        return true;
    }, [scheduleCurrentAnimation, startNextQueuedEvent]);

    const ensureQueuePlayback = useCallback(() => {
        if (kickoffTimerRef.current || phaseRef.current !== 'idle' || currentEventRef.current) {
            return;
        }

        kickoffTimerRef.current = setTimeout(() => {
            kickoffTimerRef.current = null;
            startNextQueuedEventWithTimeline();
        }, 24);
    }, [startNextQueuedEventWithTimeline]);

    const enqueueLiveEvent = useCallback((event: DrawLiveEventRecord) => {
        setQueue(prev => {
            const next = [...prev, event];
            queueRef.current = next;
            return next;
        });
        ensureQueuePlayback();
    }, [ensureQueuePlayback]);

    const flushBatchCaptureIfReady = useCallback((capture: {
        expectedCount: number;
        collected: DrawLiveEventRecord[];
        label: string;
        batchRevealStyle: DrawBatchRevealStyle;
        startedAt?: string;
        itemNames?: string[];
    }) => {
        if (capture.collected.length < capture.expectedCount) {
            return false;
        }

        const collected = capture.collected.slice(0, capture.expectedCount);
        const syntheticBatchEvent: DrawLiveEventRecord = {
            ...collected[collected.length - 1],
            id: `batch-seq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            draw_item_name: capture.label || `연속 뽑기 (${collected.length}개)`,
            batch_reveal_style: capture.batchRevealStyle,
            batch_total_count: collected.length,
            timeline_profile: 'NORMAL'
        };

        clearBatchCapture();
        setBatchRevealEvents(collected);
        enqueueLiveEvent(syntheticBatchEvent);
        return true;
    }, [clearBatchCapture, enqueueLiveEvent]);

    const recoverBatchCaptureEvents = useCallback(async (capture: {
        expectedCount: number;
        collected: DrawLiveEventRecord[];
        label: string;
        batchRevealStyle: DrawBatchRevealStyle;
        startedAt?: string;
        itemNames?: string[];
    }) => {
        const recentResult = await fetchRecentLiveEvents(Math.max(capture.expectedCount * 12, 120));
        if (recentResult.error) {
            return capture.collected;
        }

        const startedAtMs = Date.parse(capture.startedAt || '');
        const allowedNames = new Set((capture.itemNames || []).filter(Boolean));

        const recovered = (recentResult.data || [])
            .map(row => row as DrawLiveEventRecord & { seq?: number })
            .filter(event => Boolean(event?.id))
            .filter(event => {
                if (allowedNames.size === 0) {
                    return true;
                }
                return allowedNames.has(event.draw_item_name);
            })
            .filter(event => {
                if (!Number.isFinite(startedAtMs)) {
                    return true;
                }
                const eventMs = Date.parse(event.created_at || '');
                if (!Number.isFinite(eventMs)) {
                    return true;
                }
                return eventMs >= startedAtMs - 1500;
            })
            .sort((a, b) => {
                const aSeq = Number(a.seq || 0);
                const bSeq = Number(b.seq || 0);
                if (aSeq > 0 && bSeq > 0) {
                    return aSeq - bSeq;
                }
                return Date.parse(a.created_at || '') - Date.parse(b.created_at || '');
            }) as DrawLiveEventRecord[];

        const mergedById = new Map<string, DrawLiveEventRecord>();
        [...capture.collected, ...recovered].forEach(event => {
            mergedById.set(event.id, event);
        });

        const mergedOrdered = Array.from(mergedById.values()).sort((a, b) => {
            return Date.parse(a.created_at || '') - Date.parse(b.created_at || '');
        });

        return mergedOrdered.slice(-capture.expectedCount);
    }, []);

    useEffect(() => {
        startNextQueuedEventRef.current = startNextQueuedEvent;
    }, [startNextQueuedEvent]);

    useEffect(() => {
        runTimelineRef.current = scheduleCurrentAnimation;
    }, [scheduleCurrentAnimation]);

    const loadStudentNumbers = useCallback(async () => {
        const result = await fetchStudentPool();
        if (result.error) {
            return;
        }

        const map: Record<string, string> = {};
        (result.data || []).forEach(student => {
            const drawNumber = String(student.draw_number || '').replace(/\D/g, '').slice(0, 3);
            if (!drawNumber) {
                return;
            }
            map[String(student.student_id)] = drawNumber;
        });
        setStudentNumberById(map);
    }, []);

    const loadInitial = useCallback(async () => {
        setLoading(true);

        const settingsResult = await fetchDrawSettings();
        if (!settingsResult.error) {
            const nextSettings = {
                live_page_enabled: settingsResult.data?.live_page_enabled ?? true,
                show_recent_winners: settingsResult.data?.show_recent_winners ?? true
            };
            setSettings(nextSettings);
            settingsRef.current = nextSettings;
        }

        await loadStudentNumbers();

        if ((settingsResult.data?.show_recent_winners ?? true) === true) {
            await loadRecentWinners();
        } else {
            setRecentWinners([]);
        }
        setLoading(false);
    }, [loadRecentWinners, loadStudentNumbers]);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    useEffect(() => {
        const dbChannel = supabase
            .channel('draw-live-feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'draw_live_events'
            }, payload => {
                const rawEvent = payload.new as DrawLiveEventRecord;
                const pendingTimelineProfile = pendingTimelineProfileByItemIdRef.current[String(rawEvent.draw_item_id)];
                const event: DrawLiveEventRecord = {
                    ...rawEvent,
                    timeline_profile: pendingTimelineProfile || 'NORMAL'
                };
                if (pendingTimelineProfileByItemIdRef.current[String(rawEvent.draw_item_id)]) {
                    delete pendingTimelineProfileByItemIdRef.current[String(rawEvent.draw_item_id)];
                }

                if (!settingsRef.current.live_page_enabled) {
                    return;
                }

                const activeBatchCapture = batchCaptureRef.current;
                if (activeBatchCapture && activeBatchCapture.expectedCount > 0) {
                    activeBatchCapture.collected = [...activeBatchCapture.collected, event];
                    flushBatchCaptureIfReady(activeBatchCapture);
                    return;
                }

                if (!event?.is_public) {
                    return;
                }

                enqueueLiveEvent(event);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'students'
            }, () => {
                loadStudentNumbers();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'draw_settings'
            }, payload => {
                const next = payload.new as any;
                if (next && typeof next.live_page_enabled === 'boolean') {
                    const nextSettings: DrawLiveSettings = {
                        live_page_enabled: next.live_page_enabled,
                        show_recent_winners: typeof next.show_recent_winners === 'boolean' ? next.show_recent_winners : true
                    };
                    settingsRef.current = nextSettings;
                    setSettings(nextSettings);
                    if (nextSettings.show_recent_winners === false) {
                        setRecentWinners([]);
                    } else {
                        loadRecentWinners();
                    }
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'draw_winners'
            }, () => {
                clearRecentRefreshTimer();
                recentRefreshTimerRef.current = setTimeout(() => {
                    if (settingsRef.current.show_recent_winners) {
                        loadRecentWinners();
                    } else {
                        setRecentWinners([]);
                    }
                    recentRefreshTimerRef.current = null;
                }, 120);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'draw_items'
            }, () => {
                clearRecentRefreshTimer();
                recentRefreshTimerRef.current = setTimeout(() => {
                    if (settingsRef.current.show_recent_winners) {
                        loadRecentWinners();
                    } else {
                        setRecentWinners([]);
                    }
                    recentRefreshTimerRef.current = null;
                }, 120);
            })
            .subscribe();

        const controlChannel = supabase
            .channel(DRAW_LIVE_CONTROL_CHANNEL)
            .on('broadcast', { event: 'draw-start' }, payload => {
                const itemId = String(payload?.payload?.itemId || '');
                const itemName = String(payload?.payload?.itemName || '');
                const timelineProfile = String(payload?.payload?.timelineProfile || 'NORMAL').toUpperCase();
                if (itemId) {
                    pendingTimelineProfileByItemIdRef.current[itemId] = timelineProfile === 'FAST' ? 'FAST' : 'NORMAL';
                }

                if (!itemName) {
                    return;
                }

                activatePreStart(itemName);
            })
            .on('broadcast', { event: 'draw-sequence-start' }, payload => {
                const revealMode = String(payload?.payload?.revealMode || 'STEP');
                const batchRevealStyle = String(payload?.payload?.batchRevealStyle || 'ONE_BY_ONE');
                const itemNamesRaw = payload?.payload?.itemNames;
                const itemNames = Array.isArray(itemNamesRaw)
                    ? itemNamesRaw.map((value: unknown) => String(value || '').trim()).filter(Boolean)
                    : [];
                const nextBatchStyle: DrawBatchRevealStyle = batchRevealStyle === 'AT_ONCE' ? 'AT_ONCE' : 'ONE_BY_ONE';

                setSequenceStatus({
                    active: true,
                    revealMode: revealMode === 'BATCH' ? 'BATCH' : 'STEP',
                    batchRevealStyle: nextBatchStyle,
                    itemNames,
                    currentIndex: -1
                });
                sequenceEndPendingRef.current = false;

                if (revealMode !== 'BATCH') {
                    clearBatchCapture();
                    setBatchRevealEvents(null);
                    return;
                }

                const expectedPublicCount = Number(payload?.payload?.expectedPublicCount || 0);
                if (!Number.isFinite(expectedPublicCount) || expectedPublicCount <= 0) {
                    clearBatchCapture();
                    setBatchRevealEvents(null);
                    return;
                }

                const label = String(payload?.payload?.label || `연속 뽑기 (${expectedPublicCount}개)`);
                const capture = {
                    expectedCount: expectedPublicCount,
                    collected: [],
                    label,
                    batchRevealStyle: nextBatchStyle,
                    startedAt: String(payload?.payload?.startedAt || ''),
                    itemNames
                };
                batchCaptureRef.current = capture;

                // draw-sequence-start 브로드캐스트보다 INSERT가 먼저 도착하는 경우를 흡수
                if (phaseRef.current === 'idle' && !currentEventRef.current && queueRef.current.length > 0) {
                    const queuedBeforeStart = [...queueRef.current];
                    const queuedCandidates = queuedBeforeStart.filter(event => (
                        !event.id.startsWith('batch-seq-')
                        && (itemNames.length === 0 || itemNames.includes(event.draw_item_name))
                    ));
                    if (queuedCandidates.length > 0) {
                        capture.collected = queuedCandidates.slice(0, expectedPublicCount);
                    }
                    queueRef.current = [];
                    setQueue([]);
                }

                setBatchRevealEvents(null);
                activatePreStart(`${label} 준비 중`);
                flushBatchCaptureIfReady(capture);
            })
            .on('broadcast', { event: 'draw-sequence-progress' }, () => {
                // 순서 강조는 실제 재생 중 이벤트 기준으로 반영 (startNextQueuedEvent)
            })
            .on('broadcast', { event: 'draw-sequence-end' }, () => {
                sequenceEndPendingRef.current = true;
                clearPreStartTimer();
                setPreStartItemName(null);
                const pendingCapture = batchCaptureRef.current;

                if (
                    pendingCapture
                    && pendingCapture.expectedCount > 0
                    && pendingCapture.collected.length < pendingCapture.expectedCount
                ) {
                    void (async () => {
                        const recovered = await recoverBatchCaptureEvents(pendingCapture);
                        pendingCapture.collected = recovered;
                        const completed = flushBatchCaptureIfReady(pendingCapture);
                        if (!completed) {
                            clearBatchCapture();
                        }

                        if (phaseRef.current === 'idle' && !currentEventRef.current && queueRef.current.length === 0) {
                            finalizeSequenceStatus();
                        }
                    })();
                    return;
                }

                clearBatchCapture();
                if (phaseRef.current === 'idle' && !currentEventRef.current && queueRef.current.length === 0) {
                    finalizeSequenceStatus();
                }
            })
            .on('broadcast', { event: 'draw-sequence-cancel' }, () => {
                sequenceEndPendingRef.current = false;
                clearBatchCapture();
                setBatchRevealEvents(null);
                setSequenceStatus(prev => ({
                    ...prev,
                    active: false,
                    itemNames: [],
                    currentIndex: -1
                }));
                clearPreStartTimer();
                setPreStartItemName(null);
            })
            .on('broadcast', { event: 'draw-cancel' }, () => {
                clearPreStartTimer();
                setPreStartItemName(null);
            })
            .subscribe();

        return () => {
            clearTimers();
            clearPreStartTimer();
            clearRecentRefreshTimer();
            clearBatchCapture();
            sequenceEndPendingRef.current = false;
            pendingTimelineProfileByItemIdRef.current = {};
            if (kickoffTimerRef.current) {
                clearTimeout(kickoffTimerRef.current);
                kickoffTimerRef.current = null;
            }
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(controlChannel);
        };
    }, [activatePreStart, clearBatchCapture, clearPreStartTimer, clearRecentRefreshTimer, clearTimers, enqueueLiveEvent, finalizeSequenceStatus, flushBatchCaptureIfReady, loadRecentWinners, loadStudentNumbers, recoverBatchCaptureEvents]);

    useEffect(() => {
        const poller = setInterval(async () => {
            const result = await fetchDrawSettings();
            if (result.error || !result.data) {
                return;
            }

            const nextSettings: DrawLiveSettings = {
                live_page_enabled: result.data.live_page_enabled ?? true,
                show_recent_winners: result.data.show_recent_winners ?? true
            };

            const prevSettings = settingsRef.current;
            const changed = prevSettings.live_page_enabled !== nextSettings.live_page_enabled
                || prevSettings.show_recent_winners !== nextSettings.show_recent_winners;

            if (!changed) {
                return;
            }

            settingsRef.current = nextSettings;
            setSettings(nextSettings);

            if (nextSettings.show_recent_winners) {
                await loadRecentWinners();
            } else {
                setRecentWinners([]);
            }
        }, 6000);

        return () => {
            clearInterval(poller);
        };
    }, [loadRecentWinners]);

    const isAnimating = phase !== 'idle' && Boolean(currentEvent);

    const latestWinner = useMemo(() => {
        if (phase === 'reveal' && currentEvent) {
            return studentNumberById[currentEvent.winner_student_id] || '번호 미지정';
        }

        return null;
    }, [currentEvent, phase, studentNumberById]);

    return {
        loading,
        settings,
        recentWinners,
        studentNumberById,
        currentEvent,
        batchRevealEvents,
        sequenceStatus,
        preStartItemName,
        phase,
        isAnimating,
        latestWinner
    };
}
