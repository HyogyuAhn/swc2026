'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchDrawSettings,
    fetchPublicRecentWinners,
    fetchStudentPool
} from '@/features/admin/draw/api';
import {
    DrawAnimationPhase,
    DrawLiveEventRecord,
    DrawLiveSettings,
    DrawRecentWinner
} from '@/features/draw-live/types';

const MAX_RECENT_WINNERS = 30;
const PRE_START_TIMEOUT_MS = 6000;
const DRAW_CHAIN_GAP_MS = 260;
const DRAW_LIVE_CONTROL_CHANNEL = 'draw-live-control';

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
    const [preStartItemName, setPreStartItemName] = useState<string | null>(null);
    const [phase, setPhase] = useState<DrawAnimationPhase>('idle');

    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const preStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const kickoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const queueRef = useRef<DrawLiveEventRecord[]>([]);
    const startNextQueuedEventRef = useRef<() => boolean>(() => false);
    const runTimelineRef = useRef<() => void>(() => { });
    const phaseRef = useRef<DrawAnimationPhase>('idle');
    const currentEventRef = useRef<DrawLiveEventRecord | null>(null);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(timerId => clearTimeout(timerId));
        timersRef.current = [];
    }, []);

    const clearPreStartTimer = useCallback(() => {
        if (preStartTimerRef.current) {
            clearTimeout(preStartTimerRef.current);
            preStartTimerRef.current = null;
        }
    }, []);

    const activatePreStart = useCallback((itemName: string) => {
        clearPreStartTimer();
        setPreStartItemName(itemName);
        preStartTimerRef.current = setTimeout(() => {
            setPreStartItemName(current => (current === itemName ? null : current));
            preStartTimerRef.current = null;
        }, PRE_START_TIMEOUT_MS);
    }, [clearPreStartTimer]);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        currentEventRef.current = currentEvent;
    }, [currentEvent]);

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

        timersRef.current.push(setTimeout(() => setPhase('mixing'), 1100));
        timersRef.current.push(setTimeout(() => setPhase('ball'), 3900));
        timersRef.current.push(setTimeout(() => setPhase('paper'), 6700));
        timersRef.current.push(setTimeout(() => setPhase('reveal'), 8600));
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
                        setPhase('idle');
                        return;
                    }

                    runTimelineRef.current();
                }, DRAW_CHAIN_GAP_MS));
                return;
            }

            setPhase('idle');
            setCurrentEvent(null);
        }, 15000));
    }, [clearTimers, loadRecentWinners, settings.show_recent_winners]);

    const startNextQueuedEventWithTimeline = useCallback(() => {
        const started = startNextQueuedEvent();
        if (!started) {
            return false;
        }

        scheduleCurrentAnimation();
        return true;
    }, [scheduleCurrentAnimation, startNextQueuedEvent]);

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
            const drawNumber = String(student.draw_number || '').replace(/\D/g, '').slice(0, 4);
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
            setSettings({
                live_page_enabled: settingsResult.data?.live_page_enabled ?? true,
                show_recent_winners: settingsResult.data?.show_recent_winners ?? true
            });
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
                const event = payload.new as DrawLiveEventRecord;

                if (settings.live_page_enabled && event?.is_public) {
                    setQueue(prev => {
                        const next = [...prev, event];
                        queueRef.current = next;
                        return next;
                    });

                    if (!kickoffTimerRef.current && phaseRef.current === 'idle' && !currentEventRef.current) {
                        kickoffTimerRef.current = setTimeout(() => {
                            kickoffTimerRef.current = null;
                            startNextQueuedEventWithTimeline();
                        }, 24);
                    }
                }
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
                    setSettings({
                        live_page_enabled: next.live_page_enabled,
                        show_recent_winners: typeof next.show_recent_winners === 'boolean' ? next.show_recent_winners : true
                    });
                    if (next.show_recent_winners === false) {
                        setRecentWinners([]);
                    } else {
                        loadRecentWinners();
                    }
                }
            })
            .subscribe();

        const controlChannel = supabase
            .channel(DRAW_LIVE_CONTROL_CHANNEL)
            .on('broadcast', { event: 'draw-start' }, payload => {
                const itemName = String(payload?.payload?.itemName || '');
                if (!itemName) {
                    return;
                }

                activatePreStart(itemName);
            })
            .on('broadcast', { event: 'draw-cancel' }, () => {
                clearPreStartTimer();
                setPreStartItemName(null);
            })
            .subscribe();

        return () => {
            clearTimers();
            clearPreStartTimer();
            if (kickoffTimerRef.current) {
                clearTimeout(kickoffTimerRef.current);
                kickoffTimerRef.current = null;
            }
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(controlChannel);
        };
    }, [activatePreStart, clearPreStartTimer, clearTimers, loadRecentWinners, loadStudentNumbers, settings.live_page_enabled, settings.show_recent_winners, startNextQueuedEventWithTimeline]);

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
        preStartItemName,
        phase,
        isAnimating,
        latestWinner
    };
}
