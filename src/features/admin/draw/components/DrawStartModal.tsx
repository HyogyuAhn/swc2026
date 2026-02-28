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
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
                aria-label="추첨 시작 설정 닫기"
            />

            <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="mb-1 text-lg font-bold text-gray-900">추첨 시작</h3>
                <p className="mb-4 text-sm text-gray-500">{itemName}</p>

                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-bold text-gray-500">모드 선택</p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onModeChange('RANDOM')}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                mode === 'RANDOM' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                        >
                            랜덤 뽑기
                        </button>
                        <button
                            type="button"
                            onClick={() => onModeChange('MANUAL')}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                mode === 'MANUAL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                        >
                            번호 뽑기
                        </button>
                    </div>
                </div>

                {mode === 'MANUAL' && (
                    <label className="mb-4 block text-sm">
                        <span className="mb-1 block text-xs font-semibold text-gray-600">대상 번호</span>
                        <input
                            value={manualStudentId}
                            onChange={event => onManualStudentChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            list="draw-start-manual-numbers"
                            placeholder="추첨 번호 입력/선택"
                            maxLength={4}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        />
                        <datalist id="draw-start-manual-numbers">
                            {activeStudentIds.map(studentId => (
                                <option key={studentId} value={studentId} />
                            ))}
                        </datalist>
                    </label>
                )}

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={disabled || (mode === 'MANUAL' && !manualStudentId)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        추첨 시작
                    </button>
                </div>
            </div>
        </div>
    );
}
