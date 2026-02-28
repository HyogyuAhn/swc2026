'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DrawAnimationPhase } from '@/features/draw-live/types';

const LIVE_SOUND_STORAGE_KEY = 'draw_live_tension_sound_enabled';
const ACTIVE_PHASES: DrawAnimationPhase[] = ['announce', 'mixing', 'ball', 'paper'];

type UseDrawLiveSoundParams = {
    phase: DrawAnimationPhase;
    eventId?: string | null;
};

type AudioEngine = {
    context: AudioContext;
    masterGain: GainNode;
    tensionBus: GainNode;
    noiseBuffer: AudioBuffer;
};

const createAudioEngine = (): AudioEngine => {
    const ContextClass = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!ContextClass) {
        throw new Error('AudioContext is not supported in this browser.');
    }

    const context = new ContextClass();
    const masterGain = context.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(context.destination);

    const tensionBus = context.createGain();
    tensionBus.gain.value = 0;
    tensionBus.connect(masterGain);
    const noiseLength = Math.floor(context.sampleRate * 0.16);
    const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) {
        const decay = 1 - i / noiseLength;
        noiseData[i] = (Math.random() * 2 - 1) * decay;
    }

    return {
        context,
        masterGain,
        tensionBus,
        noiseBuffer
    };
};

export default function useDrawLiveSound({ phase, eventId }: UseDrawLiveSoundParams) {
    const [soundEnabled, setSoundEnabled] = useState(false);
    const engineRef = useRef<AudioEngine | null>(null);
    const rhythmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const rhythmTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const stingerPlayedForRef = useRef<string | null>(null);

    const clearRhythmTimers = useCallback(() => {
        if (rhythmTimerRef.current) {
            clearInterval(rhythmTimerRef.current);
            rhythmTimerRef.current = null;
        }

        rhythmTimeoutsRef.current.forEach(timer => clearTimeout(timer));
        rhythmTimeoutsRef.current = [];
    }, []);

    const playDrumHit = useCallback((engine: AudioEngine, intensity = 1) => {
        const now = engine.context.currentTime;
        const body = engine.context.createOscillator();
        const bodyGain = engine.context.createGain();

        body.type = 'triangle';
        body.frequency.setValueAtTime(160, now);
        body.frequency.exponentialRampToValueAtTime(52, now + 0.24);
        bodyGain.gain.setValueAtTime(0.0001, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.18 * intensity, now + 0.015);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        body.connect(bodyGain);
        bodyGain.connect(engine.tensionBus);
        body.start(now);
        body.stop(now + 0.28);

        const sub = engine.context.createOscillator();
        const subGain = engine.context.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(82, now);
        sub.frequency.exponentialRampToValueAtTime(38, now + 0.28);
        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.exponentialRampToValueAtTime(0.12 * intensity, now + 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        sub.connect(subGain);
        subGain.connect(engine.tensionBus);
        sub.start(now);
        sub.stop(now + 0.32);

        const noise = engine.context.createBufferSource();
        noise.buffer = engine.noiseBuffer;
        const noiseFilter = engine.context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(440, now);
        noiseFilter.Q.setValueAtTime(0.8, now);
        const noiseGain = engine.context.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.05 * intensity, now + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(engine.tensionBus);
        noise.start(now);
        noise.stop(now + 0.14);
    }, []);

    const startRhythm = useCallback((engine: AudioEngine) => {
        if (rhythmTimerRef.current) {
            return;
        }

        const runPattern = () => {
            playDrumHit(engine, 1);
            const timer = setTimeout(() => {
                playDrumHit(engine, 0.75);
            }, 170);
            rhythmTimeoutsRef.current.push(timer);
        };

        runPattern();
        rhythmTimerRef.current = setInterval(runPattern, 760);
    }, [playDrumHit]);

    const ensureEngine = useCallback(async () => {
        if (!engineRef.current) {
            try {
                engineRef.current = createAudioEngine();
            } catch {
                engineRef.current = null;
            }
        }

        if (!engineRef.current) {
            return null;
        }

        if (engineRef.current.context.state === 'suspended') {
            try {
                await engineRef.current.context.resume();
            } catch {
                // Browser blocked resume without interaction.
            }
        }

        return engineRef.current;
    }, []);

    const setTensionActive = useCallback(async (active: boolean) => {
        const engine = engineRef.current;
        if (!active) {
            clearRhythmTimers();
            if (!engine) {
                return;
            }

            const now = engine.context.currentTime;
            engine.tensionBus.gain.cancelScheduledValues(now);
            engine.tensionBus.gain.setTargetAtTime(0, now, 0.08);
            return;
        }

        const runningEngine = await ensureEngine();
        if (!runningEngine) {
            return;
        }
        const now = runningEngine.context.currentTime;
        runningEngine.tensionBus.gain.cancelScheduledValues(now);
        runningEngine.tensionBus.gain.setTargetAtTime(1, now, 0.06);
        startRhythm(runningEngine);
    }, [clearRhythmTimers, ensureEngine, startRhythm]);

    const playRevealStinger = useCallback(async () => {
        const engine = await ensureEngine();
        if (!engine) {
            return;
        }
        playDrumHit(engine, 1.2);
        const timer = setTimeout(() => {
            playDrumHit(engine, 0.95);
        }, 200);
        rhythmTimeoutsRef.current.push(timer);
    }, [ensureEngine, playDrumHit]);

    const toggleSoundEnabled = useCallback(() => {
        setSoundEnabled(prev => {
            const next = !prev;
            try {
                window.localStorage.setItem(LIVE_SOUND_STORAGE_KEY, next ? '1' : '0');
            } catch {
                // Ignore storage errors.
            }
            return next;
        });
    }, []);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(LIVE_SOUND_STORAGE_KEY);
            setSoundEnabled(saved === '1');
        } catch {
            setSoundEnabled(false);
        }
    }, []);

    useEffect(() => {
        if (!soundEnabled) {
            setTensionActive(false);
            return;
        }

        if (ACTIVE_PHASES.includes(phase)) {
            void setTensionActive(true);
            return;
        }

        void setTensionActive(false);
    }, [phase, setTensionActive, soundEnabled]);

    useEffect(() => {
        if (!soundEnabled) {
            return;
        }

        const unlock = () => {
            void ensureEngine();
        };

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, [ensureEngine, soundEnabled]);

    useEffect(() => {
        if (!soundEnabled || phase !== 'reveal' || !eventId) {
            return;
        }

        if (stingerPlayedForRef.current === eventId) {
            return;
        }

        stingerPlayedForRef.current = eventId;
        void playRevealStinger();
    }, [eventId, phase, playRevealStinger, soundEnabled]);

    useEffect(() => {
        return () => {
            clearRhythmTimers();

            const engine = engineRef.current;
            if (!engine) {
                return;
            }

            engine.tensionBus.disconnect();
            engine.masterGain.disconnect();
            void engine.context.close();
            engineRef.current = null;
        };
    }, [clearRhythmTimers]);

    return {
        soundEnabled,
        toggleSoundEnabled
    };
}
