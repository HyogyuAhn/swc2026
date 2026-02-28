import { Settings2, X } from 'lucide-react';
import FormToggleSetting from '@/features/admin/components/FormToggleSetting';

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
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-label="라이브 설정 닫기"
            />

            <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/60 bg-white/95 p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="mb-6 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-gray-900">
                    <Settings2 size={24} className="text-blue-500" />
                    라이브 설정
                </h3>

                <div className="space-y-4">
                    <FormToggleSetting
                        checked={livePageEnabled}
                        title="라이브 페이지 공개"
                        description="OFF면 라이브 페이지에서 추첨 화면이 비활성 안내 상태로 표시됩니다."
                        onChange={() => onToggleLivePage()}
                    />

                    <FormToggleSetting
                        checked={showRecentWinners}
                        title="최근 당첨 결과 공개"
                        description="OFF면 라이브 페이지에서 최근 당첨 결과 목록이 숨겨집니다."
                        onChange={() => onToggleRecentWinners()}
                    />
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
