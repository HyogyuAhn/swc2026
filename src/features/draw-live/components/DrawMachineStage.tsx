import { useEffect, useMemo, useState } from 'react';
import { DrawAnimationPhase, DrawLiveEventRecord } from '@/features/draw-live/types';

type DrawMachineStageProps = {
    phase: DrawAnimationPhase;
    currentEvent: DrawLiveEventRecord | null;
    preStartItemName: string | null;
    studentNumberById: Record<string, string>;
    soundEnabled: boolean;
    onToggleSound: () => void;
};

const floatingBallConfigs = [
    { delay: '0s', duration: '1.18s', orbitA: '24px', orbitB: '96px', orbitC: '52px', dir: '1', color: '#fde68a' },
    { delay: '0.12s', duration: '1.35s', orbitA: '20px', orbitB: '108px', orbitC: '62px', dir: '-1', color: '#fcd34d' },
    { delay: '0.24s', duration: '1.26s', orbitA: '28px', orbitB: '92px', orbitC: '58px', dir: '1', color: '#fbbf24' },
    { delay: '0.32s', duration: '1.47s', orbitA: '22px', orbitB: '102px', orbitC: '54px', dir: '-1', color: '#fef08a' },
    { delay: '0.46s', duration: '1.29s', orbitA: '26px', orbitB: '98px', orbitC: '60px', dir: '1', color: '#fde68a' },
    { delay: '0.6s', duration: '1.41s', orbitA: '18px', orbitB: '110px', orbitC: '56px', dir: '-1', color: '#facc15' },
    { delay: '0.76s', duration: '1.2s', orbitA: '25px', orbitB: '94px', orbitC: '50px', dir: '1', color: '#fbbf24' },
    { delay: '0.9s', duration: '1.36s', orbitA: '21px', orbitB: '106px', orbitC: '64px', dir: '-1', color: '#fef08a' }
];

const sparkConfigs = [
    { delay: '0s', duration: '0.95s', angle: '-18deg' },
    { delay: '0.12s', duration: '1.05s', angle: '14deg' },
    { delay: '0.2s', duration: '0.88s', angle: '-32deg' },
    { delay: '0.28s', duration: '1.1s', angle: '28deg' },
    { delay: '0.34s', duration: '0.92s', angle: '-46deg' },
    { delay: '0.44s', duration: '1.06s', angle: '44deg' }
];

const confettiConfigs = [
    { left: '18%', color: '#60a5fa', rotate: '-18deg', delay: '0s' },
    { left: '26%', color: '#fbbf24', rotate: '22deg', delay: '0.08s' },
    { left: '34%', color: '#34d399', rotate: '-28deg', delay: '0.16s' },
    { left: '42%', color: '#f472b6', rotate: '16deg', delay: '0.24s' },
    { left: '50%', color: '#f87171', rotate: '-24deg', delay: '0.32s' },
    { left: '58%', color: '#a78bfa', rotate: '24deg', delay: '0.4s' },
    { left: '66%', color: '#22d3ee', rotate: '-20deg', delay: '0.48s' },
    { left: '74%', color: '#facc15', rotate: '18deg', delay: '0.56s' },
    { left: '82%', color: '#fb7185', rotate: '-16deg', delay: '0.64s' }
];

const statusTextByPhase: Record<DrawAnimationPhase, string> = {
    idle: '추첨 대기 중',
    announce: '추첨 시작 안내',
    mixing: '머신 믹싱 중',
    ball: '당첨 공 추출 중',
    paper: '종이 펼치는 중',
    reveal: '당첨자 공개'
};
const LIVE_DRAW_DISPLAY_LENGTH = 4;
const normalizeLiveDrawNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
        return '';
    }

    return digits.padStart(LIVE_DRAW_DISPLAY_LENGTH, '0').slice(-LIVE_DRAW_DISPLAY_LENGTH);
};

export default function DrawMachineStage({
    phase,
    currentEvent,
    preStartItemName,
    studentNumberById,
    soundEnabled,
    onToggleSound
}: DrawMachineStageProps) {
    const [revealedDigitCount, setRevealedDigitCount] = useState(0);
    const isMixing = phase === 'mixing' || phase === 'ball';
    const isCinematic = phase === 'mixing' || phase === 'ball' || phase === 'paper';
    const isBallSequence = phase === 'ball' || phase === 'paper' || phase === 'reveal';
    const isBallOpening = phase === 'paper' || phase === 'reveal';
    const isPaperVisible = phase === 'paper' || phase === 'reveal';
    const isReveal = phase === 'reveal';
    const isStageActive = phase !== 'idle';
    const currentItemName = currentEvent?.draw_item_name || preStartItemName;
    const winnerDisplayNumber = useMemo(() => {
        if (!currentEvent) {
            return '';
        }

        return studentNumberById[currentEvent.winner_student_id] || '번호 미지정';
    }, [currentEvent, studentNumberById]);
    const winnerDisplayNumberPadded = useMemo(() => {
        if (!winnerDisplayNumber || winnerDisplayNumber === '번호 미지정') {
            return '';
        }

        return normalizeLiveDrawNumber(winnerDisplayNumber);
    }, [winnerDisplayNumber]);

    useEffect(() => {
        if (phase !== 'reveal' || !currentEvent || !winnerDisplayNumberPadded) {
            setRevealedDigitCount(0);
            return;
        }

        setRevealedDigitCount(0);
        const fullLength = winnerDisplayNumberPadded.length;
        const timer = setInterval(() => {
            setRevealedDigitCount(prev => {
                if (prev >= fullLength) {
                    return prev;
                }

                return prev + 1;
            });
        }, 260);

        return () => {
            clearInterval(timer);
        };
    }, [currentEvent, phase, winnerDisplayNumberPadded]);

    const stagedWinnerDisplay = useMemo(() => {
        if (!currentEvent || phase !== 'reveal') {
            return '-'.repeat(LIVE_DRAW_DISPLAY_LENGTH);
        }

        if (!winnerDisplayNumber) {
            return '-'.repeat(LIVE_DRAW_DISPLAY_LENGTH);
        }

        if (winnerDisplayNumber === '번호 미지정') {
            return winnerDisplayNumber;
        }

        if (!winnerDisplayNumberPadded) {
            return '-'.repeat(LIVE_DRAW_DISPLAY_LENGTH);
        }

        const visibleCount = Math.min(revealedDigitCount, winnerDisplayNumberPadded.length);
        const hiddenCount = Math.max(winnerDisplayNumberPadded.length - visibleCount, 0);
        const revealed = winnerDisplayNumberPadded.slice(0, visibleCount);
        const hidden = '•'.repeat(hiddenCount);

        return `${revealed}${hidden}`;
    }, [currentEvent, phase, revealedDigitCount, winnerDisplayNumber, winnerDisplayNumberPadded]);

    const statusText = phase === 'idle' && preStartItemName
        ? '추첨 시작 안내'
        : statusTextByPhase[phase];

    return (
        <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-blue-900">실시간 추첨</h2>
                    <p className="text-sm text-gray-500">{statusText}</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    onClick={onToggleSound}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                        soundEnabled
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600'
                    }`}
                >
                    효과음 {soundEnabled ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                {currentItemName ? (
                    <>
                        <p className="text-xs font-semibold text-blue-700">{phase === 'idle' ? '곧 시작할 항목' : '현재 진행 항목'}</p>
                        <p className="text-xl font-extrabold text-blue-900">{currentItemName}</p>
                    </>
                ) : (
                    <p className="text-sm font-medium text-gray-500">추첨 대기 중입니다.</p>
                )}
            </div>

            <div className={`draw-machine-stage relative mx-auto h-[440px] w-full max-w-4xl overflow-hidden rounded-2xl border border-blue-100 ${isCinematic ? 'cinematic' : ''}`}>
                <div className={`draw-stage-vignette ${isStageActive ? 'show' : ''}`} />
                <div className={`draw-stage-spotlight ${isCinematic ? 'show' : ''}`} />
                <div className={`draw-reveal-flash ${isReveal ? 'active' : ''}`} />
                {confettiConfigs.map((config, index) => (
                    <span
                        // eslint-disable-next-line react/no-array-index-key
                        key={`confetti-${index}`}
                        className={`draw-confetti ${isReveal ? 'active' : ''}`}
                        style={{
                            ['--left' as any]: config.left,
                            ['--confetti-color' as any]: config.color,
                            ['--rotate' as any]: config.rotate,
                            ['--delay' as any]: config.delay
                        }}
                    />
                ))}

                <div className={`draw-machine-shell ${isMixing ? 'mixing' : ''} ${isCinematic ? 'cinematic' : ''}`}>
                    <div className={`draw-machine-rotor ${isMixing ? 'spinning' : ''}`} />
                    <div className={`draw-machine-light ${isStageActive ? 'show' : ''}`} />
                    {floatingBallConfigs.map((config, index) => (
                        <span
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            className={`draw-floating-ball ${isMixing ? 'active' : ''}`}
                            style={{
                                ['--delay' as any]: config.delay,
                                ['--duration' as any]: config.duration,
                                ['--orbit-a' as any]: config.orbitA,
                                ['--orbit-b' as any]: config.orbitB,
                                ['--orbit-c' as any]: config.orbitC,
                                ['--dir' as any]: config.dir,
                                ['--ball-color' as any]: config.color
                            }}
                        />
                    ))}
                    {sparkConfigs.map((config, index) => (
                        <span
                            // eslint-disable-next-line react/no-array-index-key
                            key={`spark-${index}`}
                            className={`draw-spark ${isCinematic ? 'active' : ''}`}
                            style={{
                                ['--delay' as any]: config.delay,
                                ['--duration' as any]: config.duration,
                                ['--angle' as any]: config.angle
                            }}
                        />
                    ))}
                </div>

                <div className={`draw-picked-ball ${isBallSequence ? 'active' : ''} ${isBallOpening ? 'opening' : ''}`}>
                    <div className="draw-picked-ball-top" />
                    <div className="draw-picked-ball-bottom" />
                    <div className={`draw-picked-ball-core ${isBallOpening ? 'open' : ''}`} />
                    <div className={`draw-ticket-strip ${isPaperVisible ? 'show' : ''}`} />
                </div>

                <div className={`draw-paper-wrap ${isPaperVisible ? 'show' : ''} ${isReveal ? 'reveal' : ''}`}>
                    <div className="draw-paper-card">
                        <p className="text-xs font-semibold text-gray-500">당첨 번호</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold text-gray-900">
                            {stagedWinnerDisplay}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .draw-machine-stage {
                    background: radial-gradient(circle at 50% 20%, #ffffff 0%, #edf5ff 52%, #dfedff 100%);
                    transition: background 280ms ease;
                }

                .draw-machine-stage.cinematic {
                    background: radial-gradient(circle at 50% 16%, #f8fbff 0%, #dcecff 54%, #cfe3ff 100%);
                    animation: stageBreath 1800ms ease-in-out infinite;
                }

                .draw-stage-vignette {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background: radial-gradient(circle at center, rgba(8, 47, 110, 0) 38%, rgba(8, 47, 110, 0.26) 100%);
                    opacity: 0;
                    transition: opacity 260ms ease;
                    z-index: 1;
                }

                .draw-stage-vignette.show {
                    opacity: 1;
                }

                .draw-stage-spotlight {
                    position: absolute;
                    left: 50%;
                    top: -26px;
                    width: 240px;
                    height: 220px;
                    transform: translateX(-50%);
                    background: radial-gradient(ellipse at top, rgba(255, 233, 148, 0.62) 0%, rgba(255, 233, 148, 0.08) 52%, transparent 76%);
                    opacity: 0;
                    pointer-events: none;
                    z-index: 2;
                }

                .draw-stage-spotlight.show {
                    opacity: 1;
                    animation: spotlightPulse 900ms ease-in-out infinite;
                }

                .draw-reveal-flash {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background: radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 56%);
                    opacity: 0;
                    z-index: 20;
                }

                .draw-reveal-flash.active {
                    animation: revealFlash 700ms ease-out;
                }

                .draw-confetti {
                    position: absolute;
                    top: -18px;
                    left: var(--left);
                    width: 10px;
                    height: 20px;
                    background: var(--confetti-color);
                    border-radius: 2px;
                    opacity: 0;
                    transform: rotate(var(--rotate));
                    z-index: 19;
                    pointer-events: none;
                    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.15);
                }

                .draw-confetti.active {
                    animation: confettiDrop 980ms cubic-bezier(0.2, 0.84, 0.24, 1) forwards;
                    animation-delay: var(--delay);
                }

                .draw-machine-shell {
                    position: absolute;
                    left: 50%;
                    top: 54%;
                    transform: translate(-50%, -50%);
                    width: 290px;
                    height: 290px;
                    border-radius: 9999px;
                    border: 12px solid #7cb2f2;
                    background: linear-gradient(180deg, #ffffff 0%, #eaf4ff 100%);
                    box-shadow: 0 20px 35px rgba(31, 89, 165, 0.16);
                    overflow: hidden;
                    z-index: 3;
                }

                .draw-machine-shell.mixing {
                    animation: shellShake 420ms ease-in-out infinite;
                }

                .draw-machine-shell.cinematic {
                    box-shadow: 0 24px 46px rgba(31, 89, 165, 0.22);
                }

                .draw-machine-rotor {
                    position: absolute;
                    inset: 26px;
                    border-radius: 9999px;
                    border: 2px solid #c9defa;
                    background: repeating-conic-gradient(
                        from 0deg,
                        #dbeafe 0deg 20deg,
                        #eff6ff 20deg 40deg
                    );
                }

                .draw-machine-rotor.spinning {
                    animation: rotorSpin 0.95s linear infinite;
                }

                .draw-machine-light {
                    position: absolute;
                    left: 50%;
                    top: -24px;
                    width: 56px;
                    height: 56px;
                    transform: translateX(-50%);
                    border-radius: 9999px;
                    background: #fef08a;
                    box-shadow: 0 0 0 8px rgba(254, 240, 138, 0.28), 0 0 40px rgba(253, 224, 71, 0.6);
                    opacity: 0;
                }

                .draw-machine-light.show {
                    animation: topLightBlink 740ms ease-in-out infinite;
                }

                .draw-floating-ball {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 16px;
                    height: 16px;
                    margin-left: -8px;
                    margin-top: -8px;
                    border-radius: 9999px;
                    background: radial-gradient(circle at 32% 28%, #fff 0%, var(--ball-color, #fde68a) 65%, #f59e0b 100%);
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.45);
                    opacity: 0;
                }

                .draw-floating-ball.active {
                    opacity: 1;
                    animation: chaosOrbit var(--duration, 1.35s) cubic-bezier(0.25, 0.78, 0.26, 1) infinite;
                    animation-delay: var(--delay);
                }

                .draw-spark {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 4px;
                    height: 22px;
                    border-radius: 9999px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(251, 191, 36, 0.15) 100%);
                    opacity: 0;
                    transform: translate(-50%, -50%) rotate(var(--angle));
                    z-index: 4;
                    filter: blur(0.2px);
                }

                .draw-spark.active {
                    animation: sparkBurst var(--duration, 1s) ease-out infinite;
                    animation-delay: var(--delay);
                }

                .draw-picked-ball {
                    position: absolute;
                    left: 50%;
                    top: 37%;
                    width: 92px;
                    height: 92px;
                    margin-left: -46px;
                    opacity: 0;
                    transform: translateY(28px) scale(0.68);
                    z-index: 10;
                }

                .draw-picked-ball.active {
                    opacity: 1;
                    animation: pickBall 1400ms cubic-bezier(0.22, 0.9, 0.3, 1) forwards;
                }

                .draw-picked-ball-top,
                .draw-picked-ball-bottom {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%);
                    border: 2px solid #e59a08;
                    box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.45);
                }

                .draw-picked-ball-top {
                    top: 0;
                    border-top-left-radius: 9999px;
                    border-top-right-radius: 9999px;
                    border-bottom: 1px solid rgba(217, 119, 6, 0.7);
                    transform-origin: center bottom;
                    z-index: 5;
                }

                .draw-picked-ball-bottom {
                    bottom: 0;
                    border-bottom-left-radius: 9999px;
                    border-bottom-right-radius: 9999px;
                    border-top: 1px solid rgba(217, 119, 6, 0.7);
                    transform-origin: center top;
                    z-index: 4;
                }

                .draw-picked-ball-core {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 30px;
                    height: 30px;
                    transform: translate(-50%, -50%);
                    border-radius: 9999px;
                    background: radial-gradient(circle at 32% 28%, #ffffff 0%, #fff7d8 38%, #ffd56d 100%);
                    box-shadow: 0 0 0 2px rgba(255, 241, 204, 0.8), 0 4px 12px rgba(217, 119, 6, 0.32);
                    z-index: 6;
                    transition: opacity 320ms ease;
                }

                .draw-picked-ball-core.open {
                    opacity: 0;
                }

                .draw-picked-ball.opening .draw-picked-ball-top {
                    animation: ballOpenTop 560ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
                }

                .draw-picked-ball.opening .draw-picked-ball-bottom {
                    animation: ballOpenBottom 560ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
                }

                .draw-ticket-strip {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 20px;
                    height: 0;
                    transform: translate(-50%, -4px);
                    border-radius: 10px;
                    background: linear-gradient(180deg, #fff 0%, #eef2ff 100%);
                    border: 1px solid #dbe4ff;
                    z-index: 3;
                    opacity: 0;
                }

                .draw-ticket-strip.show {
                    opacity: 1;
                    animation: ticketEmerge 720ms cubic-bezier(0.18, 0.8, 0.24, 1) forwards;
                }

                .draw-paper-wrap {
                    position: absolute;
                    left: 50%;
                    bottom: 26px;
                    transform: translate(-50%, 58px) scale(0.92);
                    opacity: 0;
                    z-index: 12;
                }

                .draw-paper-wrap.show {
                    opacity: 1;
                    animation: paperReveal 980ms cubic-bezier(0.2, 0.9, 0.25, 1);
                    transform: translate(-50%, 0) scale(1);
                }

                .draw-paper-wrap.reveal .draw-paper-card {
                    animation: paperSettle 420ms ease-out forwards;
                }

                .draw-paper-card {
                    width: 320px;
                    border-radius: 14px;
                    border: 1px solid #d1d5db;
                    background: #ffffff;
                    padding: 18px 14px;
                    text-align: center;
                    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
                }

                @keyframes rotorSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes shellShake {
                    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
                    20% { transform: translate(calc(-50% - 3px), calc(-50% + 2px)) rotate(-2.1deg); }
                    40% { transform: translate(calc(-50% + 3px), calc(-50% - 2px)) rotate(1.6deg); }
                    60% { transform: translate(calc(-50% - 2px), calc(-50% + 1px)) rotate(-1.2deg); }
                    80% { transform: translate(calc(-50% + 2px), calc(-50% - 1px)) rotate(1.1deg); }
                }

                @keyframes chaosOrbit {
                    0% { transform: rotate(calc(var(--dir, 1) * 0deg)) translateX(var(--orbit-a, 22px)) translateY(-7px) scale(0.55); }
                    24% { transform: rotate(calc(var(--dir, 1) * 124deg)) translateX(var(--orbit-b, 98px)) translateY(10px) scale(1); }
                    51% { transform: rotate(calc(var(--dir, 1) * 236deg)) translateX(var(--orbit-c, 56px)) translateY(-15px) scale(0.8); }
                    78% { transform: rotate(calc(var(--dir, 1) * 318deg)) translateX(var(--orbit-b, 98px)) translateY(8px) scale(0.95); }
                    100% { transform: rotate(calc(var(--dir, 1) * 360deg)) translateX(var(--orbit-a, 22px)) translateY(-7px) scale(0.55); }
                }

                @keyframes sparkBurst {
                    0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0.5); }
                    20% { opacity: 0.95; }
                    70% { opacity: 0.45; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-62px) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-74px) scale(0.8); }
                }

                @keyframes pickBall {
                    0% { opacity: 0; transform: translateY(32px) scale(0.62); }
                    30% { opacity: 1; transform: translateY(-78px) scale(1.02); }
                    56% { transform: translateY(-66px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(-62px) scale(1); }
                }

                @keyframes ballOpenTop {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(-23px) rotate(-28deg); }
                }

                @keyframes ballOpenBottom {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(23px) rotate(28deg); }
                }

                @keyframes ticketEmerge {
                    0% { height: 0; transform: translate(-50%, 4px); }
                    60% { height: 110px; transform: translate(-50%, 6px); }
                    100% { height: 96px; transform: translate(-50%, 4px); }
                }

                @keyframes paperReveal {
                    0% { opacity: 0; transform: translate(-50%, 44px) rotateX(70deg) scale(0.9); }
                    58% { opacity: 1; transform: translate(-50%, -4px) rotateX(0deg) scale(1.025); }
                    100% { opacity: 1; transform: translate(-50%, 0) rotateX(0deg) scale(1); }
                }

                @keyframes paperSettle {
                    0% { transform: translateY(0) scale(1.02); }
                    100% { transform: translateY(0) scale(1); }
                }

                @keyframes topLightBlink {
                    0%, 100% { opacity: 0.75; transform: translateX(-50%) scale(0.96); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.04); }
                }

                @keyframes spotlightPulse {
                    0%, 100% { transform: translateX(-50%) scale(0.95); opacity: 0.65; }
                    50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
                }

                @keyframes stageBreath {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.004); }
                }

                @keyframes revealFlash {
                    0% { opacity: 0; }
                    24% { opacity: 1; }
                    100% { opacity: 0; }
                }

                @keyframes confettiDrop {
                    0% {
                        opacity: 0;
                        transform: translateY(-12px) rotate(var(--rotate)) scale(0.8);
                    }
                    20% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(250px) rotate(calc(var(--rotate) * 4)) scale(1);
                    }
                }
            `}</style>
        </section>
    );
}
