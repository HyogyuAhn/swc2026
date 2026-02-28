import { X } from 'lucide-react';

type DrawItemSettingsModalProps = {
    isOpen: boolean;
    name: string;
    quota: string;
    allowDuplicate: boolean;
    isRealtimePublic: boolean;
    isRecentPublic: boolean;
    disabled?: boolean;
    onClose: () => void;
    onNameChange: (value: string) => void;
    onQuotaChange: (value: string) => void;
    onAllowDuplicateChange: (checked: boolean) => void;
    onRealtimePublicChange: (checked: boolean) => void;
    onRecentPublicChange: (checked: boolean) => void;
    onSave: () => void;
};

export default function DrawItemSettingsModal({
    isOpen,
    name,
    quota,
    allowDuplicate,
    isRealtimePublic,
    isRecentPublic,
    disabled = false,
    onClose,
    onNameChange,
    onQuotaChange,
    onAllowDuplicateChange,
    onRealtimePublicChange,
    onRecentPublicChange,
    onSave
}: DrawItemSettingsModalProps) {
    if (!isOpen) {
        return null;
    }

    const optionCardClass = 'rounded-lg border px-3 py-2 text-left transition-colors';

    return (
        <div className="fixed inset-0 z-[97] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
                aria-label="항목 설정 닫기"
            />

            <div className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="text-xl font-bold text-gray-900">항목 설정</h3>
                <p className="mt-1 text-sm text-gray-500">이름, 개수, 공개 범위를 수정할 수 있습니다.</p>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.8fr_1.8fr]">
                    <label className="text-sm">
                        <span className="mb-1.5 block font-semibold text-gray-700">당첨 항목 이름</span>
                        <input
                            type="text"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition focus:border-blue-300 focus:bg-white focus:outline-none"
                            value={name}
                            onChange={event => onNameChange(event.target.value)}
                        />
                    </label>

                    <label className="text-sm">
                        <span className="mb-1.5 block font-semibold text-gray-700">당첨 개수</span>
                        <input
                            type="number"
                            min={1}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition focus:border-blue-300 focus:bg-white focus:outline-none"
                            value={quota}
                            onChange={event => onQuotaChange(event.target.value)}
                        />
                    </label>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="mb-2 text-xs font-bold text-gray-600">옵션</p>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => onAllowDuplicateChange(!allowDuplicate)}
                                className={`${optionCardClass} w-full ${
                                    allowDuplicate
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">중복 당첨 허용</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {allowDuplicate ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onRealtimePublicChange(!isRealtimePublic)}
                                className={`${optionCardClass} w-full ${
                                    isRealtimePublic
                                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">실시간 당첨자 공개</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {isRealtimePublic ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onRecentPublicChange(!isRecentPublic)}
                                className={`${optionCardClass} w-full ${
                                    isRecentPublic
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">최근 당첨 결과 공개</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {isRecentPublic ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={disabled}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
