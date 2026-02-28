import { DrawItemWithComputed, DrawMode } from '@/features/admin/draw/types';

type DrawControlPanelProps = {
    item: DrawItemWithComputed;
    drawMode: DrawMode;
    manualStudentId: string;
    forceStudentId: string;
    activeStudentIds: string[];
    disabled?: boolean;
    onModeChange: (mode: DrawMode) => void;
    onManualStudentChange: (studentId: string) => void;
    onForceStudentChange: (studentId: string) => void;
    onForceAdd: () => void;
};

export default function DrawControlPanel({
    item,
    drawMode,
    manualStudentId,
    forceStudentId,
    activeStudentIds,
    disabled = false,
    onModeChange,
    onManualStudentChange,
    onForceStudentChange,
    onForceAdd
}: DrawControlPanelProps) {
    const manualListId = `draw-manual-${item.id}`;
    const forceListId = `draw-force-${item.id}`;

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">모드</span>
                    <div className="rounded-lg border border-gray-200 bg-white p-1">
                        {(['RANDOM', 'MANUAL'] as const).map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => onModeChange(mode)}
                                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                                    drawMode === mode
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {mode === 'RANDOM' ? '랜덤 뽑기' : '번호 뽑기'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {drawMode === 'MANUAL' && (
                <label className="mb-3 block text-sm">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">번호 뽑기 대상</span>
                    <input
                        value={manualStudentId}
                        onChange={event => onManualStudentChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                        list={manualListId}
                        placeholder="번호 입력/선택"
                        maxLength={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                    <datalist id={manualListId}>
                        {activeStudentIds.map(studentId => (
                            <option key={studentId} value={studentId} />
                        ))}
                    </datalist>
                </label>
            )}

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">강제 추가 번호</span>
                    <input
                        value={forceStudentId}
                        onChange={event => onForceStudentChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                        list={forceListId}
                        placeholder="뽑기 없이 직접 추가"
                        maxLength={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                    <datalist id={forceListId}>
                        {activeStudentIds.map(studentId => (
                            <option key={studentId} value={studentId} />
                        ))}
                    </datalist>
                </label>

                <button
                    type="button"
                    onClick={onForceAdd}
                    disabled={disabled || item.remainingCount <= 0 || !forceStudentId}
                    className="h-fit self-end rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                    강제 추가
                </button>
            </div>
        </div>
    );
}
