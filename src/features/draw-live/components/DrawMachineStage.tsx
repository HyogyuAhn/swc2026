import { DrawAnimationPhase, DrawLiveEventRecord } from '@/features/draw-live/types';

type DrawMachineStageProps = {
    phase: DrawAnimationPhase;
    currentEvent: DrawLiveEventRecord | null;
    preStartItemName: string | null;
    connectionStatus: string;
};

const statusTextByPhase: Record<DrawAnimationPhase, string> = {
    idle: '다음 추첨을 기다리는 중',
    announce: '추첨 시작 안내',
    mixing: '머신 믹싱 중',
    ball: '당첨 공 추출 중',
    paper: '종이 펼치는 중',
    reveal: '당첨자 공개'
};

export default function DrawMachineStage({ phase, currentEvent, preStartItemName, connectionStatus }: DrawMachineStageProps) {
    const isSpinning = phase === 'mixing' || phase === 'ball';
    const isPaperVisible = phase === 'paper' || phase === 'reveal';
    const currentItemName = currentEvent?.draw_item_name || preStartItemName;
    const statusText = phase === 'idle' && preStartItemName
        ? '추첨 시작 안내'
        : statusTextByPhase[phase];

    return (
        <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-blue-900">실시간 추첨</h2>
                    <p className="text-sm text-gray-500">{statusText}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    Realtime: {connectionStatus}
                </span>
            </div>

            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                {currentItemName ? (
                    <>
                        <p className="text-xs font-semibold text-blue-700">{phase === 'idle' ? '곧 시작할 항목' : '현재 진행 항목'}</p>
                        <p className="text-xl font-extrabold text-blue-900">{currentItemName}</p>
                    </>
                ) : (
                    <p className="text-sm font-medium text-gray-500">관리자가 추첨을 시작하면 여기서 실시간 연출이 재생됩니다.</p>
                )}
            </div>

            <div className="relative mx-auto flex h-72 w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-blue-50 via-white to-blue-50">
                <div className={`relative h-40 w-40 rounded-full border-8 border-blue-300 bg-white ${isSpinning ? 'animate-spin' : ''}`}>
                    <div className="absolute inset-3 rounded-full border border-blue-100 bg-blue-50" />
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
                </div>

                <div className={`absolute top-8 h-6 w-6 rounded-full bg-yellow-400 ${phase === 'ball' ? 'animate-bounce' : 'opacity-30'}`} />

                <div className={`absolute bottom-8 transition-all duration-500 ${isPaperVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="w-64 rounded-xl border border-gray-300 bg-white px-4 py-5 text-center shadow-lg">
                        <p className="text-xs font-semibold text-gray-500">당첨 학번</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold text-gray-900">
                            {phase === 'reveal' && currentEvent ? currentEvent.winner_student_id : '--------'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
