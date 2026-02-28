import { X, Plus, Trash2 } from 'lucide-react';
import { DrawItemWithComputed, DrawMode, DrawSequenceStep } from '@/features/admin/draw/types';

type DrawSequenceModalProps = {
    isOpen: boolean;
    steps: DrawSequenceStep[];
    items: DrawItemWithComputed[];
    activeDrawNumbers: string[];
    disabled?: boolean;
    onClose: () => void;
    onChangeStep: (stepId: string, patch: Partial<DrawSequenceStep>) => void;
    onAddStep: () => void;
    onRemoveStep: (stepId: string) => void;
    onStart: () => void;
};

export default function DrawSequenceModal({
    isOpen,
    steps,
    items,
    activeDrawNumbers,
    disabled = false,
    onClose,
    onChangeStep,
    onAddStep,
    onRemoveStep,
    onStart
}: DrawSequenceModalProps) {
    if (!isOpen) {
        return null;
    }

    const selectableItems = items.filter(item => item.remainingCount > 0);
    const isValid = steps.every(step => (
        step.itemId &&
        (step.mode === 'RANDOM' || (step.mode === 'MANUAL' && step.targetDrawNumber.trim()))
    ));

    return (
        <div className="fixed inset-0 z-[98] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
                aria-label="연속 뽑기 설정 닫기"
            />

            <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="mb-1 text-lg font-bold text-gray-900">연속 뽑기</h3>
                <p className="mb-4 text-sm text-gray-500">순서를 조합해 한 번에 여러 항목을 연속 추첨합니다.</p>

                <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                    {steps.map((step, index) => (
                        <div key={step.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-gray-800">{index + 1}번 뽑기</p>
                                {steps.length > 2 && index >= 2 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveStep(step.id)}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                                    >
                                        <Trash2 size={12} />
                                        제거
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1.2fr_auto_1fr]">
                                <label className="text-xs font-semibold text-gray-600">
                                    항목
                                    <select
                                        value={step.itemId}
                                        onChange={event => onChangeStep(step.id, { itemId: event.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                                    >
                                        <option value="">항목 선택</option>
                                        {selectableItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} (남은 {item.remainingCount})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="text-xs font-semibold text-gray-600">
                                    방식
                                    <div className="mt-1 flex gap-1">
                                        {(['RANDOM', 'MANUAL'] as DrawMode[]).map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => onChangeStep(step.id, { mode })}
                                                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                                    step.mode === mode
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {mode === 'RANDOM' ? '랜덤' : '번호'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {step.mode === 'MANUAL' ? (
                                    <label className="text-xs font-semibold text-gray-600">
                                        번호
                                        <input
                                            value={step.targetDrawNumber}
                                            onChange={event => onChangeStep(step.id, { targetDrawNumber: event.target.value.replace(/\D/g, '').slice(0, 8) })}
                                            list={`draw-sequence-number-${step.id}`}
                                            placeholder="번호 입력/선택"
                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                        />
                                        <datalist id={`draw-sequence-number-${step.id}`}>
                                            {activeDrawNumbers.map(drawNumber => (
                                                <option key={drawNumber} value={drawNumber} />
                                            ))}
                                        </datalist>
                                    </label>
                                ) : (
                                    <div className="text-xs font-semibold text-gray-400">
                                        번호
                                        <div className="mt-1 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-sm">
                                            랜덤 추첨
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onAddStep}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        <Plus size={12} />
                        순서 추가
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            onClick={onStart}
                            disabled={disabled || !isValid}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            연속 뽑기 시작
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

