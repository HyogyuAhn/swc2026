'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DrawAnimationPhase } from '@/features/draw-live/types';

const LIVE_SOUND_STORAGE_KEY = 'draw_live_tension_sound_enabled';
const TRACK_TOTAL_MS = 15000;

type UseDrawLiveSoundParams = {
    phase: DrawAnimationPhase;
    eventId?: string | null;
};

type AudioEngine = {
    context: AudioContext;
    masterGain: GainNode;
    musicBus: GainNode;
    sfxBus: GainNode;
    noiseBuffer: AudioBuffer;
};

const createAudioEngine = (): AudioEngine => {
    const ContextClass = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!ContextClass) {
        throw new Error('AudioContext is not supported in this browser.');
    }

    const context = new ContextClass();

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 20;
    compressor.ratio.value = 4.2;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.24;
    compressor.connect(context.destination);

    const masterGain = context.createGain();
    masterGain.gain.value = 0.42;
    masterGain.connect(compressor);

    const musicBus = context.createGain();
    musicBus.gain.value = 0.18;
    musicBus.connect(masterGain);

    const sfxBus = context.createGain();
    sfxBus.gain.value = 0.52;
    sfxBus.connect(masterGain);

    const noiseLength = Math.floor(context.sampleRate * 2.2);
    const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    return {
        context,
        masterGain,
        musicBus,
        sfxBus,
        noiseBuffer
    };
};

type TrackedNode = {
    stop: () => void;
};

const stopTrackedNode = (tracked: TrackedNode) => {
    try {
        tracked.stop();
    } catch {
        // no-op
    }
};

export default function useDrawLiveSound({ phase, eventId }: UseDrawLiveSoundParams) {
    const [soundEnabled, setSoundEnabled] = useState(false);
    const engineRef = useRef<AudioEngine | null>(null);
    const activeNodesRef = useRef<TrackedNode[]>([]);
    const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const playingEventIdRef = useRef<string | null>(null);

    const clearScheduledTimers = useCallback(() => {
        activeTimersRef.current.forEach(timer => clearTimeout(timer));
        activeTimersRef.current = [];
    }, []);

    const stopCurrentTrack = useCallback(() => {
        clearScheduledTimers();
        activeNodesRef.current.forEach(stopTrackedNode);
        activeNodesRef.current = [];
        playingEventIdRef.current = null;

        const engine = engineRef.current;
        if (!engine) {
            return;
        }

        const now = engine.context.currentTime;
        engine.musicBus.gain.cancelScheduledValues(now);
        engine.sfxBus.gain.cancelScheduledValues(now);
        engine.masterGain.gain.cancelScheduledValues(now);
        engine.musicBus.gain.setValueAtTime(0, now);
        engine.sfxBus.gain.setValueAtTime(0, now);
    }, [clearScheduledTimers]);

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
                // blocked by browser policy
            }
        }

        return engineRef.current;
    }, []);

    const trackOscillator = useCallback((
        engine: AudioEngine,
        bus: GainNode,
        type: OscillatorType,
        freqStart: number,
        startAt: number,
        duration: number,
        opts?: {
            freqEnd?: number;
            peakGain?: number;
            attack?: number;
            release?: number;
            qFilter?: { type: BiquadFilterType; freq: number; q?: number };
        }
    ) => {
        const osc = engine.context.createOscillator();
        const gain = engine.context.createGain();
        let targetBus: AudioNode = bus;

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, startAt);
        if (opts?.freqEnd && opts.freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), startAt + duration);
        }

        if (opts?.qFilter) {
            const filter = engine.context.createBiquadFilter();
            filter.type = opts.qFilter.type;
            filter.frequency.setValueAtTime(opts.qFilter.freq, startAt);
            filter.Q.setValueAtTime(opts.qFilter.q ?? 0.8, startAt);
            gain.connect(filter);
            filter.connect(bus);
            targetBus = filter;
        }

        const attack = opts?.attack ?? 0.02;
        const release = opts?.release ?? Math.min(0.18, duration * 0.6);
        const peak = opts?.peakGain ?? 0.1;

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), startAt + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(attack + 0.01, duration - release));
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        osc.connect(gain);
        if (targetBus === bus) {
            gain.connect(bus);
        }

        osc.start(startAt);
        osc.stop(startAt + duration + 0.02);

        activeNodesRef.current.push({
            stop: () => {
                osc.stop();
                osc.disconnect();
                gain.disconnect();
            }
        });
    }, []);

    const trackNoise = useCallback((
        engine: AudioEngine,
        bus: GainNode,
        startAt: number,
        duration: number,
        opts?: {
            filterType?: BiquadFilterType;
            freq?: number;
            q?: number;
            peakGain?: number;
            attack?: number;
            release?: number;
            playbackRate?: number;
            freqSweepTo?: number;
        }
    ) => {
        const source = engine.context.createBufferSource();
        source.buffer = engine.noiseBuffer;
        source.playbackRate.setValueAtTime(opts?.playbackRate ?? 1, startAt);

        const filter = engine.context.createBiquadFilter();
        filter.type = opts?.filterType ?? 'bandpass';
        filter.frequency.setValueAtTime(opts?.freq ?? 900, startAt);
        filter.Q.setValueAtTime(opts?.q ?? 1, startAt);
        if (opts?.freqSweepTo) {
            filter.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqSweepTo), startAt + duration);
        }

        const gain = engine.context.createGain();
        const attack = opts?.attack ?? 0.01;
        const release = opts?.release ?? Math.min(0.12, duration * 0.7);
        const peak = opts?.peakGain ?? 0.09;

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), startAt + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(attack + 0.01, duration - release));
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(bus);

        source.start(startAt);
        source.stop(startAt + duration + 0.02);

        activeNodesRef.current.push({
            stop: () => {
                source.stop();
                source.disconnect();
                filter.disconnect();
                gain.disconnect();
            }
        });
    }, []);

    const scheduleImpact = useCallback((engine: AudioEngine, at: number, pitch = 1, power = 1) => {
        trackOscillator(engine, engine.sfxBus, 'triangle', 130 * pitch, at, 0.52, {
            freqEnd: 42 * pitch,
            peakGain: 0.28 * power,
            attack: 0.008,
            release: 0.34
        });
        trackOscillator(engine, engine.sfxBus, 'sine', 82 * pitch, at, 0.58, {
            freqEnd: 30 * pitch,
            peakGain: 0.22 * power,
            attack: 0.01,
            release: 0.38
        });
        trackNoise(engine, engine.sfxBus, at, 0.16, {
            filterType: 'bandpass',
            freq: 1200 * pitch,
            q: 0.75,
            peakGain: 0.14 * power
        });
    }, [trackNoise, trackOscillator]);

    const playPromptTimelineTrack = useCallback(async (eventIdToPlay: string) => {
        const engine = await ensureEngine();
        if (!engine) {
            return;
        }

        stopCurrentTrack();
        playingEventIdRef.current = eventIdToPlay;

        const now = engine.context.currentTime + 0.02;
        const introEnd = now + 1.1;
        const mixingEnd = now + 3.9;
        const extractionEnd = now + 6.7;
        const silenceEnd = now + 8.6;
        const numbersEnd = now + 12.6;
        const finaleEnd = now + 15.0;

        engine.musicBus.gain.setValueAtTime(0.0001, now);
        engine.musicBus.gain.exponentialRampToValueAtTime(0.22, introEnd - 0.08);
        engine.musicBus.gain.exponentialRampToValueAtTime(0.32, extractionEnd - 0.05);
        engine.musicBus.gain.exponentialRampToValueAtTime(0.0001, extractionEnd + 0.18);
        engine.musicBus.gain.setValueAtTime(0.0001, silenceEnd);
        engine.musicBus.gain.exponentialRampToValueAtTime(0.34, numbersEnd + 0.2);
        engine.musicBus.gain.exponentialRampToValueAtTime(0.0001, finaleEnd);

        engine.sfxBus.gain.setValueAtTime(0.0001, now);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.62, introEnd + 0.1);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.74, extractionEnd);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.06, extractionEnd + 0.2);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.66, silenceEnd + 0.04);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.78, numbersEnd);
        engine.sfxBus.gain.exponentialRampToValueAtTime(0.08, finaleEnd);

        // [0.0 - 1.1] Intro
        trackOscillator(engine, engine.musicBus, 'sawtooth', 52, now, 1.1, {
            freqEnd: 110,
            peakGain: 0.16,
            attack: 0.05,
            release: 0.32
        });
        trackOscillator(engine, engine.musicBus, 'triangle', 78, now + 0.1, 0.96, {
            freqEnd: 166,
            peakGain: 0.1,
            attack: 0.06,
            release: 0.2
        });
        for (let i = 0; i < 4; i += 1) {
            scheduleImpact(engine, now + i * 0.24, 0.74 + i * 0.04, 0.5 + i * 0.08);
        }

        // [1.1 - 3.9] Mixing & Tension (du-gu-du-gu + machine)
        const beatBase = introEnd;
        for (let t = beatBase; t < mixingEnd; t += 0.56) {
            scheduleImpact(engine, t, 0.94, 0.88);
            scheduleImpact(engine, t + 0.17, 1.0, 0.74);
        }
        trackNoise(engine, engine.sfxBus, introEnd, 2.8, {
            filterType: 'bandpass',
            freq: 720,
            freqSweepTo: 1460,
            q: 0.7,
            peakGain: 0.13,
            attack: 0.05,
            release: 0.18,
            playbackRate: 1.08
        });
        for (let t = introEnd + 0.08; t < mixingEnd; t += 0.22) {
            trackNoise(engine, engine.sfxBus, t, 0.08, {
                filterType: 'bandpass',
                freq: 1100 + (Math.random() * 420),
                q: 1.2,
                peakGain: 0.1
            });
        }
        trackOscillator(engine, engine.musicBus, 'sawtooth', 140, introEnd, 2.8, {
            freqEnd: 250,
            peakGain: 0.13,
            attack: 0.06,
            release: 0.3
        });

        // [3.9 - 6.7] Extraction peak
        trackOscillator(engine, engine.musicBus, 'sawtooth', 210, mixingEnd, 2.8, {
            freqEnd: 1640,
            peakGain: 0.18,
            attack: 0.03,
            release: 0.16,
            qFilter: { type: 'highpass', freq: 170, q: 0.7 }
        });
        trackNoise(engine, engine.musicBus, mixingEnd + 0.02, 2.6, {
            filterType: 'bandpass',
            freq: 860,
            freqSweepTo: 3200,
            q: 0.8,
            peakGain: 0.11,
            attack: 0.06,
            release: 0.1
        });
        scheduleImpact(engine, mixingEnd + 1.54, 1.08, 1.0); // clonk
        trackNoise(engine, engine.sfxBus, mixingEnd + 1.6, 0.58, {
            filterType: 'bandpass',
            freq: 420,
            freqSweepTo: 2200,
            q: 0.9,
            peakGain: 0.2,
            attack: 0.02,
            release: 0.32,
            playbackRate: 1.24
        }); // whoosh through tube

        // [6.7 - 8.6] Click + paper + dramatic silence
        trackNoise(engine, engine.sfxBus, extractionEnd, 0.055, {
            filterType: 'highpass',
            freq: 2400,
            q: 1.1,
            peakGain: 0.24,
            attack: 0.002,
            release: 0.02
        }); // plastic click
        trackNoise(engine, engine.sfxBus, extractionEnd + 0.08, 0.44, {
            filterType: 'bandpass',
            freq: 1600,
            freqSweepTo: 780,
            q: 0.65,
            peakGain: 0.22,
            attack: 0.02,
            release: 0.28,
            playbackRate: 0.88
        }); // paper tear/unfold
        trackOscillator(engine, engine.musicBus, 'sine', 420, extractionEnd + 0.14, 0.9, {
            freqEnd: 300,
            peakGain: 0.024,
            attack: 0.18,
            release: 0.5
        }); // faint eerie tail

        // [8.6 - 12.6] Numbers (three impacts + snare roll)
        scheduleImpact(engine, silenceEnd, 0.98, 1.18);
        scheduleImpact(engine, silenceEnd + 1.0, 1.09, 1.2);
        scheduleImpact(engine, silenceEnd + 2.0, 1.21, 1.3);

        let snareAt = silenceEnd + 2.0;
        let interval = 0.24;
        while (snareAt < numbersEnd) {
            trackNoise(engine, engine.sfxBus, snareAt, 0.055, {
                filterType: 'highpass',
                freq: 2600,
                q: 0.8,
                peakGain: 0.17,
                attack: 0.004,
                release: 0.03
            });
            snareAt += interval;
            interval = Math.max(0.055, interval * 0.9);
        }

        // [12.6 - 15.0] Grand finale
        const fanfareStart = numbersEnd;
        const fanfareNotes: Array<{ freq: number; dur: number; at: number; gain: number }> = [
            { freq: 392, dur: 1.2, at: 0, gain: 0.09 },
            { freq: 494, dur: 1.2, at: 0, gain: 0.08 },
            { freq: 587, dur: 1.2, at: 0, gain: 0.075 },
            { freq: 523, dur: 1.15, at: 0.46, gain: 0.085 },
            { freq: 659, dur: 1.15, at: 0.46, gain: 0.078 },
            { freq: 784, dur: 1.15, at: 0.46, gain: 0.074 }
        ];
        fanfareNotes.forEach(note => {
            trackOscillator(engine, engine.musicBus, 'sawtooth', note.freq, fanfareStart + note.at, note.dur, {
                freqEnd: note.freq * 1.01,
                peakGain: note.gain,
                attack: 0.02,
                release: 0.32,
                qFilter: { type: 'bandpass', freq: 950, q: 0.7 }
            });
        });

        for (let t = fanfareStart + 0.12; t < finaleEnd - 0.2; t += 0.2) {
            trackNoise(engine, engine.sfxBus, t, 0.07, {
                filterType: 'highpass',
                freq: 1800 + Math.random() * 1200,
                q: 0.7,
                peakGain: 0.14,
                attack: 0.003,
                release: 0.04
            }); // confetti pops
        }

        // crowd cheer/applause (noise shaped)
        trackNoise(engine, engine.sfxBus, fanfareStart + 0.04, 2.2, {
            filterType: 'bandpass',
            freq: 780,
            freqSweepTo: 420,
            q: 0.5,
            peakGain: 0.3,
            attack: 0.06,
            release: 0.5,
            playbackRate: 0.62
        });
        for (let t = fanfareStart + 0.2; t < finaleEnd - 0.1; t += 0.18) {
            trackNoise(engine, engine.sfxBus, t, 0.09, {
                filterType: 'highpass',
                freq: 1400,
                q: 0.65,
                peakGain: 0.08,
                attack: 0.004,
                release: 0.05
            }); // applause claps
        }

        const endTimer = setTimeout(() => {
            if (playingEventIdRef.current === eventIdToPlay) {
                stopCurrentTrack();
            }
        }, TRACK_TOTAL_MS + 120);
        activeTimersRef.current.push(endTimer);
    }, [ensureEngine, scheduleImpact, stopCurrentTrack, trackNoise, trackOscillator]);

    const toggleSoundEnabled = useCallback(() => {
        setSoundEnabled(prev => {
            const next = !prev;
            try {
                window.localStorage.setItem(LIVE_SOUND_STORAGE_KEY, next ? '1' : '0');
            } catch {
                // ignore
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
            stopCurrentTrack();
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
    }, [ensureEngine, soundEnabled, stopCurrentTrack]);

    useEffect(() => {
        if (!soundEnabled || !eventId) {
            return;
        }

        if (phase !== 'announce') {
            return;
        }

        if (playingEventIdRef.current === eventId) {
            return;
        }

        void playPromptTimelineTrack(eventId);
    }, [eventId, phase, playPromptTimelineTrack, soundEnabled]);

    useEffect(() => {
        if (!soundEnabled) {
            return;
        }

        if (phase === 'idle' && !eventId) {
            stopCurrentTrack();
        }
    }, [eventId, phase, soundEnabled, stopCurrentTrack]);

    useEffect(() => {
        return () => {
            stopCurrentTrack();

            const engine = engineRef.current;
            if (!engine) {
                return;
            }

            engine.musicBus.disconnect();
            engine.sfxBus.disconnect();
            engine.masterGain.disconnect();
            void engine.context.close();
            engineRef.current = null;
        };
    }, [stopCurrentTrack]);

    return {
        soundEnabled,
        toggleSoundEnabled
    };
}
