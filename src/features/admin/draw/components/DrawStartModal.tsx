import { X } from 'lucide-react';
import { DrawMode } from '@/features/admin/draw/types';

type DrawStartModalProps = {
    isOpen: boolean;
    itemName: string;
    mode: DrawMode;
    manualStudentId: string;
    activeStudentIds: string[];
    disabled?: boolean;
    onClose: () => void;
    onModeChange: (mode: DrawMode) => void;
    onManualStudentChange: (value: string) => void;
    onConfirm: () => void;
};

export default function DrawStartModal({
    isOpen,
    itemName,
    mode,
    manualStudentId,
    activeStudentIds,
    disabled = false,
    onClose,
    onModeChange,
    onManualStudentChange,
    onConfirm
}: DrawStartModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[97] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-label="추첨 시작 설정 닫기"
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

                <h3 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">추첨 시작</h3>
                <p className="mb-6 text-sm font-medium text-gray-500">{itemName}</p>

                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/30 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">모드 선택</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => onModeChange('RANDOM')}
                            className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${mode === 'RANDOM' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            랜덤 뽑기
                        </button>
                        <button
                            type="button"
                            onClick={() => onModeChange('MANUAL')}
                            className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${mode === 'MANUAL' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            번호 뽑기
                        </button>
                    </div>
                </div>

                {mode === 'MANUAL' && (
                    <label className="mb-6 block text-sm">
                        <span className="mb-2 block font-bold text-gray-700">대상 번호</span>
                        <input
                            value={manualStudentId}
                            onChange={event => onManualStudentChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            list="draw-start-manual-numbers"
                            placeholder="추첨 번호 입력/선택"
                            maxLength={4}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base font-medium transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        />
                        <datalist id="draw-start-manual-numbers">
                            {activeStudentIds.map(studentId => (
                                <option key={studentId} value={studentId} />
                            ))}
                        </datalist>
                    </label>
                )}

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
                        onClick={onConfirm}
                        disabled={disabled || (mode === 'MANUAL' && !manualStudentId)}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        추첨 시작
                    </button>
                </div>
            </div>
        </div>
    );
}
