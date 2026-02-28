'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    fetchDrawSettings,
    fetchPublicRecentWinners
} from '@/features/admin/draw/api';
import {
    DrawAnimationPhase,
    DrawLiveEventRecord,
    DrawLiveSettings,
    DrawRecentWinner
} from '@/features/draw-live/types';

const MAX_RECENT_WINNERS = 30;
const PRE_START_TIMEOUT_MS = 6000;
const DRAW_LIVE_CONTROL_CHANNEL = 'draw-live-control';

const toRecentWinner = (row: any): DrawRecentWinner | null => {
    const drawItem = Array.isArray(row.draw_items)
        ? row.draw_items[0]
        : row.draw_items;

    if (!drawItem || drawItem.is_public !== true) {
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
    const [queue, setQueue] = useState<DrawLiveEventRecord[]>([]);
    const [currentEvent, setCurrentEvent] = useState<DrawLiveEventRecord | null>(null);
    const [preStartItemName, setPreStartItemName] = useState<string | null>(null);
    const [phase, setPhase] = useState<DrawAnimationPhase>('idle');

    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const preStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const loadInitial = useCallback(async () => {
        setLoading(true);

        const settingsResult = await fetchDrawSettings();
        if (!settingsResult.error) {
            setSettings({
                live_page_enabled: settingsResult.data?.live_page_enabled ?? true,
                show_recent_winners: settingsResult.data?.show_recent_winners ?? true
            });
        }

        await loadRecentWinners();
        setLoading(false);
    }, [loadRecentWinners]);

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
                    setQueue(prev => [...prev, event]);
                }

                if (settings.show_recent_winners) {
                    loadRecentWinners();
                }
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
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(controlChannel);
        };
    }, [activatePreStart, clearPreStartTimer, clearTimers, loadRecentWinners, settings.live_page_enabled, settings.show_recent_winners]);

    useEffect(() => {
        if (!settings.live_page_enabled) {
            return;
        }

        if (phase !== 'idle' || currentEvent || queue.length === 0) {
            return;
        }

        const [next, ...rest] = queue;
        clearPreStartTimer();
        setPreStartItemName(null);
        setQueue(rest);
        setCurrentEvent(next);
        setPhase('announce');

        clearTimers();

        timersRef.current.push(setTimeout(() => setPhase('mixing'), 300));
        timersRef.current.push(setTimeout(() => setPhase('ball'), 1200));
        timersRef.current.push(setTimeout(() => setPhase('paper'), 2200));
        timersRef.current.push(setTimeout(() => setPhase('reveal'), 3000));
        timersRef.current.push(setTimeout(async () => {
            setPhase('idle');
            setCurrentEvent(null);
            await loadRecentWinners();
        }, 5000));
    }, [clearPreStartTimer, clearTimers, currentEvent, loadRecentWinners, phase, queue, settings.live_page_enabled]);

    const isAnimating = phase !== 'idle' && Boolean(currentEvent);

    const latestWinner = useMemo(() => {
        if (phase === 'reveal' && currentEvent) {
            return currentEvent.winner_student_id;
        }

        return null;
    }, [currentEvent, phase]);

    return {
        loading,
        settings,
        recentWinners,
        currentEvent,
        preStartItemName,
        phase,
        isAnimating,
        latestWinner
    };
}
