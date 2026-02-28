import { DrawAnimationPhase, DrawLiveEventRecord } from '@/features/draw-live/types';

type DrawMachineStageProps = {
    phase: DrawAnimationPhase;
    currentEvent: DrawLiveEventRecord | null;
    preStartItemName: string | null;
};

const statusTextByPhase: Record<DrawAnimationPhase, string> = {
    idle: '추첨 대기 중',
    announce: '추첨 시작 안내',
    mixing: '머신 믹싱 중',
    ball: '당첨 공 추출 중',
    paper: '종이 펼치는 중',
    reveal: '당첨자 공개'
};

export default function DrawMachineStage({ phase, currentEvent, preStartItemName }: DrawMachineStageProps) {
    const isMixing = phase === 'mixing' || phase === 'ball';
    const isBallSequence = phase === 'ball' || phase === 'paper' || phase === 'reveal';
    const isBallOpening = phase === 'paper' || phase === 'reveal';
    const isPaperVisible = phase === 'paper' || phase === 'reveal';
    const isReveal = phase === 'reveal';
    const currentItemName = currentEvent?.draw_item_name || preStartItemName;
    const statusText = phase === 'idle' && preStartItemName
        ? '추첨 시작 안내'
        : statusTextByPhase[phase];

    return (
        <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-2xl font-bold text-blue-900">실시간 추첨</h2>
                <p className="text-sm text-gray-500">{statusText}</p>
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

            <div className="draw-machine-stage relative mx-auto h-[440px] w-full max-w-4xl overflow-hidden rounded-2xl border border-blue-100">
                <div className={`draw-machine-shell ${isMixing ? 'mixing' : ''}`}>
                    <div className={`draw-machine-rotor ${isMixing ? 'spinning' : ''}`} />
                    <div className="draw-machine-light" />
                    {[0, 1, 2, 3, 4, 5].map(index => (
                        <span
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            className={`draw-floating-ball ${isMixing ? 'active' : ''}`}
                            style={{ ['--delay' as any]: `${index * 0.22}s` }}
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
                        <p className="text-xs font-semibold text-gray-500">당첨 학번</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold text-gray-900">
                            {phase === 'reveal' && currentEvent ? currentEvent.winner_student_id : '--------'}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .draw-machine-stage {
                    background: radial-gradient(circle at 50% 20%, #ffffff 0%, #edf5ff 52%, #dfedff 100%);
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
                }

                .draw-machine-shell.mixing {
                    animation: shellShake 520ms ease-in-out infinite;
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
                    background: #fde68a;
                    opacity: 0;
                }

                .draw-floating-ball.active {
                    opacity: 1;
                    animation: floatBall 1.8s ease-in-out infinite;
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
                    25% { transform: translate(calc(-50% - 2px), calc(-50% + 1px)) rotate(-1.6deg); }
                    50% { transform: translate(calc(-50% + 2px), calc(-50% - 1px)) rotate(1.2deg); }
                    75% { transform: translate(calc(-50% - 1px), calc(-50% + 1px)) rotate(-0.8deg); }
                }

                @keyframes floatBall {
                    0% { transform: rotate(0deg) translateX(14px) scale(0.6); }
                    50% { transform: rotate(180deg) translateX(98px) scale(1); }
                    100% { transform: rotate(360deg) translateX(14px) scale(0.6); }
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
            `}</style>
        </section>
    );
}
