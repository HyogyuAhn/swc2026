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

    const playDrumHit = useCallback((engine: AudioEngine, options?: {
        intensity?: number;
        pitch?: number;
        target?: 'tension' | 'master';
    }) => {
        const intensity = options?.intensity ?? 1;
        const pitch = options?.pitch ?? 1;
        const target = options?.target ?? 'tension';
        const targetBus = target === 'master' ? engine.masterGain : engine.tensionBus;
        const now = engine.context.currentTime;
        const body = engine.context.createOscillator();
        const bodyGain = engine.context.createGain();

        body.type = 'triangle';
        body.frequency.setValueAtTime(190 * pitch, now);
        body.frequency.exponentialRampToValueAtTime(58 * pitch, now + 0.22);
        bodyGain.gain.setValueAtTime(0.0001, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.16 * intensity, now + 0.01);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.23);
        body.connect(bodyGain);
        bodyGain.connect(targetBus);
        body.start(now);
        body.stop(now + 0.24);

        const sub = engine.context.createOscillator();
        const subGain = engine.context.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(94 * pitch, now);
        sub.frequency.exponentialRampToValueAtTime(42 * pitch, now + 0.24);
        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.exponentialRampToValueAtTime(0.1 * intensity, now + 0.015);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        sub.connect(subGain);
        subGain.connect(targetBus);
        sub.start(now);
        sub.stop(now + 0.28);

        const noise = engine.context.createBufferSource();
        noise.buffer = engine.noiseBuffer;
        const noiseFilter = engine.context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(880 * pitch, now);
        noiseFilter.Q.setValueAtTime(0.8, now);
        const noiseGain = engine.context.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.03 * intensity, now + 0.008);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(targetBus);
        noise.start(now);
        noise.stop(now + 0.1);
    }, []);

    const playRumbleSweep = useCallback((engine: AudioEngine) => {
        const now = engine.context.currentTime;
        const osc = engine.context.createOscillator();
        const gain = engine.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(84, now);
        osc.frequency.exponentialRampToValueAtTime(132, now + 0.22);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.018, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

        osc.connect(gain);
        gain.connect(engine.tensionBus);
        osc.start(now);
        osc.stop(now + 0.26);
    }, []);

    const startRhythm = useCallback((engine: AudioEngine) => {
        if (rhythmTimerRef.current) {
            return;
        }

        const runPattern = () => {
            const pattern = [
                { at: 0, intensity: 0.92, pitch: 1.08 },
                { at: 116, intensity: 0.72, pitch: 0.94 },
                { at: 244, intensity: 1.0, pitch: 1.05 },
                { at: 378, intensity: 0.78, pitch: 0.9 }
            ];

            pattern.forEach(step => {
                const timer = setTimeout(() => {
                    playDrumHit(engine, { intensity: step.intensity, pitch: step.pitch });
                }, step.at);
                rhythmTimeoutsRef.current.push(timer);
            });

            const sweepTimer = setTimeout(() => {
                playRumbleSweep(engine);
            }, 162);
            rhythmTimeoutsRef.current.push(sweepTimer);
        };

        runPattern();
        rhythmTimerRef.current = setInterval(runPattern, 980);
    }, [playDrumHit, playRumbleSweep]);

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

        const now = engine.context.currentTime + 0.02;
        playDrumHit(engine, { intensity: 1.08, pitch: 1.08, target: 'master' });

        const notes = [784, 1046, 1318, 1760];
        notes.forEach((frequency, index) => {
            const startAt = now + index * 0.11;
            const osc = engine.context.createOscillator();
            const gain = engine.context.createGain();
            osc.type = index % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(frequency, startAt);

            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.055, startAt + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.42);

            osc.connect(gain);
            gain.connect(engine.masterGain);
            osc.start(startAt);
            osc.stop(startAt + 0.46);
        });

        const sparkle = engine.context.createBufferSource();
        sparkle.buffer = engine.noiseBuffer;
        const sparkleFilter = engine.context.createBiquadFilter();
        sparkleFilter.type = 'highpass';
        sparkleFilter.frequency.setValueAtTime(2200, now);
        const sparkleGain = engine.context.createGain();
        sparkleGain.gain.setValueAtTime(0.0001, now);
        sparkleGain.gain.exponentialRampToValueAtTime(0.032, now + 0.02);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        sparkle.connect(sparkleFilter);
        sparkleFilter.connect(sparkleGain);
        sparkleGain.connect(engine.masterGain);
        sparkle.start(now);
        sparkle.stop(now + 0.34);
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
