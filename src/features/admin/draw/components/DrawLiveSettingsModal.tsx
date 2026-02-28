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
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
                aria-label="라이브 설정 닫기"
            />

            <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
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

                <div className="space-y-3">
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

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
