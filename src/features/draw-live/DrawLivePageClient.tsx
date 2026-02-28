'use client';

import DrawMachineStage from '@/features/draw-live/components/DrawMachineStage';
import DrawRecentWinners from '@/features/draw-live/components/DrawRecentWinners';
import useDrawLiveFeed from '@/features/draw-live/hooks/useDrawLiveFeed';
import useDrawLiveSound from '@/features/draw-live/hooks/useDrawLiveSound';

export default function DrawLivePageClient() {
    const {
        loading,
        settings,
        recentWinners,
        studentNumberById,
        currentEvent,
        preStartItemName,
        phase
    } = useDrawLiveFeed();
    const { soundEnabled, toggleSoundEnabled } = useDrawLiveSound({
        phase,
        eventId: currentEvent?.id ?? null
    });

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto max-w-5xl space-y-5">
                <section className="flex items-center justify-end">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={soundEnabled}
                        onClick={toggleSoundEnabled}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                            soundEnabled
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                        긴장 효과음 {soundEnabled ? 'ON' : 'OFF'}
                        <span className="text-[11px] font-medium text-gray-400">(이 브라우저에 저장됨)</span>
                    </button>
                </section>

                {loading ? (
                    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
                        실시간 추첨 데이터를 불러오는 중입니다...
                    </section>
                ) : !settings.live_page_enabled ? (
                    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <p className="text-xl font-bold text-gray-500">현재 라이브 추첨이 비활성화되어 있습니다.</p>
                    </section>
                ) : (
                    <>
                        <DrawMachineStage
                            phase={phase}
                            currentEvent={currentEvent}
                            preStartItemName={preStartItemName}
                            studentNumberById={studentNumberById}
                        />
                        {settings.show_recent_winners && (
                            <DrawRecentWinners
                                winners={recentWinners}
                                studentNumberById={studentNumberById}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
