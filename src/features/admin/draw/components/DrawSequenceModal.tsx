import { X, Plus, Trash2 } from 'lucide-react';
import {
    DrawItemWithComputed,
    DrawMode,
    DrawRandomFilterGender,
    DrawSequenceBatchRevealStyle,
    DrawSequenceRevealMode,
    DrawSequenceStep
} from '@/features/admin/draw/types';
import {
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_ROLE_OPTIONS
} from '@/features/admin/student/constants';

type DrawSequenceModalProps = {
    isOpen: boolean;
    steps: DrawSequenceStep[];
    items: DrawItemWithComputed[];
    activeDrawNumbers: string[];
    revealMode: DrawSequenceRevealMode;
    batchRevealStyle: DrawSequenceBatchRevealStyle;
    disabled?: boolean;
    onClose: () => void;
    onChangeRevealMode: (mode: DrawSequenceRevealMode) => void;
    onChangeBatchRevealStyle: (style: DrawSequenceBatchRevealStyle) => void;
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
    revealMode,
    batchRevealStyle,
    disabled = false,
    onClose,
    onChangeRevealMode,
    onChangeBatchRevealStyle,
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
        (
            (step.mode === 'RANDOM'
                && (step.randomFilter?.departments?.length ?? STUDENT_DEPARTMENT_OPTIONS.length) > 0
                && (step.randomFilter?.roles?.length ?? STUDENT_ROLE_OPTIONS.length) > 0)
            || (step.mode === 'MANUAL' && step.targetDrawNumber.trim())
        )
    ));
    const remainingTotal = selectableItems.reduce((sum, item) => sum + item.remainingCount, 0);

    return (
        <div className="fixed inset-0 z-[98] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-label="연속 뽑기 설정 닫기"
            />

            <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)] transition-all sm:p-8">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="닫기"
                >
                    <X size={18} />
                </button>

                <h3 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">연속 뽑기</h3>
                <p className="mb-6 text-sm font-medium text-gray-500">순서를 조합해 한 번에 여러 항목을 연속 추첨합니다.</p>

                <div className="mb-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">공개 방식</p>
                    <div className="grid gap-2 md:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => onChangeRevealMode('STEP')}
                            className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                revealMode === 'STEP'
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <p className="text-sm font-extrabold">순차 공개</p>
                            <p className="mt-1 text-xs font-medium">설정한 순서대로 1개씩 연출하고 공개합니다.</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => onChangeRevealMode('BATCH')}
                            className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                revealMode === 'BATCH'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                    : 'border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <p className="text-sm font-extrabold">일괄 공개</p>
                            <p className="mt-1 text-xs font-medium">모든 추첨 완료 후 결과를 한 번에 공개합니다.</p>
                        </button>
                    </div>
                    {revealMode === 'BATCH' && (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => onChangeBatchRevealStyle('ONE_BY_ONE')}
                                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                    batchRevealStyle === 'ONE_BY_ONE'
                                        ? 'border-violet-500 bg-violet-50 text-violet-900'
                                        : 'border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <p className="text-sm font-extrabold">차례대로 공개</p>
                                <p className="mt-1 text-xs font-medium">당첨자 카드를 위에서부터 한 명씩 공개합니다.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeBatchRevealStyle('AT_ONCE')}
                                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                    batchRevealStyle === 'AT_ONCE'
                                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900'
                                        : 'border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <p className="text-sm font-extrabold">한 번에 공개</p>
                                <p className="mt-1 text-xs font-medium">당첨자 카드가 동시에 숫자를 공개합니다.</p>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        총 순서: {steps.length}
                    </span>
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        전체 남은 개수: {remainingTotal}
                    </span>
                    <span className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        최소 2개 순서 유지
                    </span>
                    <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        공개 방식: {revealMode === 'STEP' ? '순차 공개' : '일괄 공개'}
                    </span>
                    {revealMode === 'BATCH' && (
                        <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            일괄 상세: {batchRevealStyle === 'ONE_BY_ONE' ? '차례대로 공개' : '한 번에 공개'}
                        </span>
                    )}
                </div>

                <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1 sm:pr-2">
                    {steps.map((step, index) => {
                        const stepRandomFilter = step.randomFilter || {
                            gender: 'ALL' as DrawRandomFilterGender,
                            departments: [...STUDENT_DEPARTMENT_OPTIONS],
                            roles: [...STUDENT_ROLE_OPTIONS]
                        };

                        return (
                        <div key={step.id} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-extrabold text-white">
                                        {index + 1}
                                    </span>
                                    <p className="text-sm font-extrabold text-gray-900">순서 {index + 1}</p>
                                </div>
                                {steps.length > 2 && index >= 2 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveStep(step.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                                    >
                                        <Trash2 size={12} />
                                        제거
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-3 lg:grid-cols-12">
                                <label className="text-xs font-bold text-gray-700 lg:col-span-5">
                                    <span className="mb-1 block">추첨 항목</span>
                                    <select
                                        value={step.itemId}
                                        onChange={event => onChangeStep(step.id, { itemId: event.target.value })}
                                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option value="">항목 선택</option>
                                        {selectableItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} (남은 개수: {item.remainingCount})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="text-xs font-bold text-gray-700 lg:col-span-3">
                                    <span className="mb-1 block">추첨 방식</span>
                                    <div className="flex gap-2">
                                        {(['RANDOM', 'MANUAL'] as DrawMode[]).map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => onChangeStep(step.id, { mode })}
                                                className={`flex min-w-[86px] flex-1 items-center justify-center rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${step.mode === mode
                                                        ? 'bg-blue-600 text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.8)]'
                                                        : 'border-2 border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {mode === 'RANDOM' ? '랜덤' : '번호'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {step.mode === 'MANUAL' ? (
                                    <label className="text-xs font-bold text-gray-700 lg:col-span-4">
                                        <span className="mb-1 block">번호 입력</span>
                                        <input
                                            value={step.targetDrawNumber}
                                            onChange={event => onChangeStep(step.id, { targetDrawNumber: event.target.value.replace(/\D/g, '').slice(0, 3) })}
                                            list={`draw-sequence-number-${step.id}`}
                                            placeholder="예: 001"
                                            maxLength={3}
                                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                        />
                                        <datalist id={`draw-sequence-number-${step.id}`}>
                                            {activeDrawNumbers.map(drawNumber => (
                                                <option key={drawNumber} value={drawNumber} />
                                            ))}
                                        </datalist>
                                        <p className="mt-1 text-[11px] font-medium text-gray-500">등록된 추첨 번호에서 선택할 수 있습니다.</p>
                                    </label>
                                ) : (
                                    <div className="text-xs font-bold text-gray-500 lg:col-span-4">
                                        <span className="mb-1 block">번호 입력</span>
                                        <div className="flex h-[50px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-500">
                                            랜덤 추첨
                                        </div>
                                    </div>
                                )}
                            </div>

                            {step.mode === 'RANDOM' && (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">랜덤 필터 설정</p>

                                    <div className="mb-3">
                                        <p className="mb-1 text-[11px] font-bold text-slate-600">성별</p>
                                        <div className="flex gap-1.5">
                                            {(['ALL', '남', '여'] as DrawRandomFilterGender[]).map(gender => (
                                                <button
                                                    key={`${step.id}-gender-${gender}`}
                                                    type="button"
                                                    onClick={() => onChangeStep(step.id, {
                                                        randomFilter: {
                                                            ...stepRandomFilter,
                                                            gender
                                                        }
                                                    })}
                                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                                                        stepRandomFilter.gender === gender
                                                            ? 'bg-blue-600 text-white'
                                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {gender === 'ALL' ? '모두' : gender}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <p className="mb-1 text-[11px] font-bold text-slate-600">학과 (최소 1개)</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {STUDENT_DEPARTMENT_OPTIONS.map(department => {
                                                const selected = stepRandomFilter.departments.includes(department);
                                                return (
                                                    <button
                                                        key={`${step.id}-dept-${department}`}
                                                        type="button"
                                                        onClick={() => {
                                                            const nextDepartments = selected
                                                                ? stepRandomFilter.departments.filter(value => value !== department)
                                                                : [...stepRandomFilter.departments, department];
                                                            onChangeStep(step.id, {
                                                                randomFilter: {
                                                                    ...stepRandomFilter,
                                                                    departments: nextDepartments
                                                                }
                                                            });
                                                        }}
                                                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                                                            selected
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {department}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-1 text-[11px] font-bold text-slate-600">역할 (최소 1개)</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {STUDENT_ROLE_OPTIONS.map(role => {
                                                const selected = stepRandomFilter.roles.includes(role);
                                                return (
                                                    <button
                                                        key={`${step.id}-role-${role}`}
                                                        type="button"
                                                        onClick={() => {
                                                            const nextRoles = selected
                                                                ? stepRandomFilter.roles.filter(value => value !== role)
                                                                : [...stepRandomFilter.roles, role];
                                                            onChangeStep(step.id, {
                                                                randomFilter: {
                                                                    ...stepRandomFilter,
                                                                    roles: nextRoles
                                                                }
                                                            });
                                                        }}
                                                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                                                            selected
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {role}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={onAddStep}
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            <Plus size={16} />
                            순서 추가
                        </button>
                        <p className={`text-xs font-bold ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                            {isValid ? '모든 순서 설정이 완료되었습니다.' : '항목/번호가 비어 있는 순서가 있습니다.'}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            onClick={onStart}
                            disabled={disabled || !isValid}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            연속 뽑기 시작
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
