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
    droneOsc: OscillatorNode;
    pulseOsc: OscillatorNode;
    wobbleOsc: OscillatorNode;
    wobbleGain: GainNode;
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

    const droneOsc = context.createOscillator();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.value = 86;
    const droneGain = context.createGain();
    droneGain.gain.value = 0.026;
    droneOsc.connect(droneGain);
    droneGain.connect(tensionBus);
    droneOsc.start();

    const pulseOsc = context.createOscillator();
    pulseOsc.type = 'triangle';
    pulseOsc.frequency.value = 45;
    const pulseGain = context.createGain();
    pulseGain.gain.value = 0.018;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(tensionBus);
    pulseOsc.start();

    const wobbleOsc = context.createOscillator();
    wobbleOsc.type = 'sine';
    wobbleOsc.frequency.value = 2.1;
    const wobbleGain = context.createGain();
    wobbleGain.gain.value = 0.01;
    wobbleOsc.connect(wobbleGain);
    wobbleGain.connect(pulseGain.gain);
    wobbleOsc.start();

    return {
        context,
        masterGain,
        tensionBus,
        droneOsc,
        pulseOsc,
        wobbleOsc,
        wobbleGain
    };
};

const safeStopOscillator = (oscillator: OscillatorNode) => {
    try {
        oscillator.stop();
    } catch {
        // Already stopped.
    }
    oscillator.disconnect();
};

export default function useDrawLiveSound({ phase, eventId }: UseDrawLiveSoundParams) {
    const [soundEnabled, setSoundEnabled] = useState(false);
    const engineRef = useRef<AudioEngine | null>(null);
    const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const stingerPlayedForRef = useRef<string | null>(null);

    const stopTick = useCallback(() => {
        if (!tickTimerRef.current) {
            return;
        }

        clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
    }, []);

    const playTick = useCallback((engine: AudioEngine) => {
        const now = engine.context.currentTime;
        const osc = engine.context.createOscillator();
        const gain = engine.context.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620 + Math.random() * 260, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.016, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

        osc.connect(gain);
        gain.connect(engine.tensionBus);
        osc.start(now);
        osc.stop(now + 0.12);
    }, []);

    const startTick = useCallback((engine: AudioEngine) => {
        if (tickTimerRef.current) {
            return;
        }

        playTick(engine);
        tickTimerRef.current = setInterval(() => {
            playTick(engine);
        }, 420);
    }, [playTick]);

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
            stopTick();
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
        runningEngine.tensionBus.gain.setTargetAtTime(1, now, 0.1);
        startTick(runningEngine);
    }, [ensureEngine, startTick, stopTick]);

    const playRevealStinger = useCallback(async () => {
        const engine = await ensureEngine();
        if (!engine) {
            return;
        }
        const now = engine.context.currentTime;

        const osc = engine.context.createOscillator();
        const gain = engine.context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.56);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.56);

        osc.connect(gain);
        gain.connect(engine.masterGain);
        osc.start(now);
        osc.stop(now + 0.58);
    }, [ensureEngine]);

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
            stopTick();

            const engine = engineRef.current;
            if (!engine) {
                return;
            }

            safeStopOscillator(engine.droneOsc);
            safeStopOscillator(engine.pulseOsc);
            safeStopOscillator(engine.wobbleOsc);
            engine.wobbleGain.disconnect();
            engine.tensionBus.disconnect();
            engine.masterGain.disconnect();
            void engine.context.close();
            engineRef.current = null;
        };
    }, [stopTick]);

    return {
        soundEnabled,
        toggleSoundEnabled
    };
}
