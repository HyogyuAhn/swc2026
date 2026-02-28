'use client';

import DrawMachineStage from '@/features/draw-live/components/DrawMachineStage';
import DrawRecentWinners from '@/features/draw-live/components/DrawRecentWinners';
import useDrawLiveFeed from '@/features/draw-live/hooks/useDrawLiveFeed';

export default function DrawLivePageClient() {
    const {
        loading,
        settings,
        recentWinners,
        currentEvent,
        preStartItemName,
        phase,
        connectionStatus
    } = useDrawLiveFeed();

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto max-w-5xl space-y-5">
                <header className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                    <h1 className="text-3xl font-extrabold text-blue-900">실시간 추첨 LIVE</h1>
                    <p className="mt-1 text-sm text-gray-500">관리자 추첨 시작 시 이 화면에 실시간으로 추첨 연출이 표시됩니다.</p>
                </header>

                {loading ? (
                    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
                        실시간 추첨 데이터를 불러오는 중입니다...
                    </section>
                ) : !settings.live_page_enabled ? (
                    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <p className="text-xl font-bold text-gray-500">현재 라이브 추첨이 비활성화되어 있습니다.</p>
                        <p className="mt-2 text-sm text-gray-400">관리자 페이지에서 라이브 페이지 설정을 ON으로 변경해주세요.</p>
                    </section>
                ) : (
                    <>
                        <DrawMachineStage
                            phase={phase}
                            currentEvent={currentEvent}
                            preStartItemName={preStartItemName}
                            connectionStatus={connectionStatus}
                        />
                        <DrawRecentWinners winners={recentWinners} />
                    </>
                )}
            </div>
        </main>
    );
}
