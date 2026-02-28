import { Settings2, X } from 'lucide-react';

type DrawLiveSettingsModalProps = {
    isOpen: boolean;
    livePageEnabled: boolean;
    showRecentWinners: boolean;
    onClose: () => void;
    onToggleLivePage: () => void;
    onToggleRecentWinners: () => void;
};

export default function DrawLiveSettingsModal({
    isOpen,
    livePageEnabled,
    showRecentWinners,
    onClose,
    onToggleLivePage,
    onToggleRecentWinners
}: DrawLiveSettingsModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[97] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
                aria-label="라이브 설정 닫기"
            />

            <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Settings2 size={18} />
                    라이브 설정
                </h3>

                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={onToggleLivePage}
                        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold ${
                            livePageEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        라이브 페이지: {livePageEnabled ? 'ON' : 'OFF'}
                    </button>

                    <button
                        type="button"
                        onClick={onToggleRecentWinners}
                        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold ${
                            showRecentWinners ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        최근 당첨 결과 공개: {showRecentWinners ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
