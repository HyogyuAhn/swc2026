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
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-label="항목 설정 닫기"
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

                <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">항목 설정</h3>
                <p className="mt-2 text-sm text-gray-500">이름, 개수, 공개 범위를 수정할 수 있습니다.</p>

                <div className="mt-5 space-y-4">
                    <label className="text-sm">
                        <span className="mb-2 block font-bold text-gray-700">당첨 항목 이름</span>
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base font-medium transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            value={name}
                            onChange={event => onNameChange(event.target.value)}
                        />
                    </label>

                    <label className="text-sm">
                        <span className="mb-2 block font-bold text-gray-700">당첨 개수</span>
                        <input
                            type="number"
                            min={1}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base font-medium transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            value={quota}
                            onChange={event => onQuotaChange(event.target.value)}
                        />
                    </label>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50/30 p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">옵션 설정</p>
                        <div className="space-y-2.5">
                            <button
                                type="button"
                                onClick={() => onAllowDuplicateChange(!allowDuplicate)}
                                className={`${optionCardClass} w-full rounded-xl ${allowDuplicate
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.15)]'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">중복 당첨 허용</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {allowDuplicate ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs">다른 항목 당첨자도 추첨 대상에 포함합니다.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => onRealtimePublicChange(!isRealtimePublic)}
                                className={`${optionCardClass} w-full rounded-xl ${isRealtimePublic
                                        ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.15)]'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">실시간 당첨자 공개</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {isRealtimePublic ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs">OFF면 라이브 추첨 장면에 해당 항목이 노출되지 않습니다.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => onRecentPublicChange(!isRecentPublic)}
                                className={`${optionCardClass} w-full rounded-xl ${isRecentPublic
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-900 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.15)]'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold">최근 당첨 결과 공개</span>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                                        {isRecentPublic ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs">라이브 페이지 하단 최근 당첨 결과 목록 반영 여부입니다.</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={disabled}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
