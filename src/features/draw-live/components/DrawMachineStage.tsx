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
    const isPaperVisible = phase === 'paper' || phase === 'reveal';
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

                <div className={`draw-picked-ball ${phase === 'ball' ? 'active' : ''}`} />

                <div className={`draw-paper-wrap ${isPaperVisible ? 'show' : ''}`}>
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
                    top: 38%;
                    width: 28px;
                    height: 28px;
                    margin-left: -14px;
                    border-radius: 9999px;
                    background: #fbbf24;
                    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
                    opacity: 0.15;
                    transform: translateY(20px) scale(0.8);
                }

                .draw-picked-ball.active {
                    opacity: 1;
                    animation: pickBall 1300ms ease-in-out infinite;
                }

                .draw-paper-wrap {
                    position: absolute;
                    left: 50%;
                    bottom: 36px;
                    transform: translate(-50%, 44px) scale(0.95);
                    opacity: 0;
                }

                .draw-paper-wrap.show {
                    opacity: 1;
                    animation: paperReveal 900ms cubic-bezier(0.2, 0.9, 0.25, 1);
                    transform: translate(-50%, 0) scale(1);
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
                    0% { transform: translateY(20px) scale(0.82); }
                    45% { transform: translateY(-64px) scale(1); }
                    70% { transform: translateY(-48px) scale(0.96); }
                    100% { transform: translateY(20px) scale(0.82); }
                }

                @keyframes paperReveal {
                    0% { opacity: 0; transform: translate(-50%, 42px) rotateX(65deg) scale(0.92); }
                    60% { opacity: 1; transform: translate(-50%, -2px) rotateX(0deg) scale(1.02); }
                    100% { opacity: 1; transform: translate(-50%, 0) rotateX(0deg) scale(1); }
                }
            `}</style>
        </section>
    );
}
