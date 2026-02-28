import { DrawItemWithComputed, DrawWinner } from '@/features/admin/draw/types';

type DrawWinnerListProps = {
    item: DrawItemWithComputed;
    activeStudentIds: string[];
    editingWinnerById: Record<string, boolean>;
    editingStudentByWinnerId: Record<string, string>;
    disabled?: boolean;
    onStartEdit: (winner: DrawWinner) => void;
    onCancelEdit: (winner: DrawWinner) => void;
    onChangeEditStudent: (winnerId: string, studentId: string) => void;
    onSaveEdit: (winner: DrawWinner) => void;
    onDeleteWinner: (winner: DrawWinner) => void;
    onTogglePublic: (winner: DrawWinner) => void;
};

const modeLabel: Record<string, string> = {
    RANDOM: '랜덤',
    MANUAL: '수동',
    FORCED: '강제'
};

export default function DrawWinnerList({
    item,
    activeStudentIds,
    editingWinnerById,
    editingStudentByWinnerId,
    disabled = false,
    onStartEdit,
    onCancelEdit,
    onChangeEditStudent,
    onSaveEdit,
    onDeleteWinner,
    onTogglePublic
}: DrawWinnerListProps) {
    if (item.winners.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-sm text-gray-400">
                아직 당첨자가 없습니다.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {item.winners.map((winner, index) => {
                const isEditing = Boolean(editingWinnerById[winner.id]);
                const editingValue = editingStudentByWinnerId[winner.id] || winner.student_id;
                const datalistId = `draw-winner-edit-${winner.id}`;
                const winnerPublic = winner.is_public ?? true;
                const canTogglePublic = item.is_public;

                return (
                    <div key={winner.id} className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                                    #{index + 1}
                                </span>
                                <span className="font-mono text-sm font-bold text-gray-900">{winner.student_id}</span>
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                    {modeLabel[winner.selected_mode] || winner.selected_mode}
                                </span>
                                {winner.is_forced && (
                                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                        Override
                                    </span>
                                )}
                            </div>

                            {!isEditing && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onTogglePublic(winner)}
                                        disabled={disabled || !canTogglePublic}
                                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                                            canTogglePublic
                                                ? winnerPublic
                                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    : 'border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'border border-gray-200 bg-gray-100 text-gray-400'
                                        }`}
                                        title={canTogglePublic ? '라이브 최근 결과 공개/비공개' : '항목이 비공개라 전환할 수 없습니다.'}
                                    >
                                        {winnerPublic ? '공개' : '비공개'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onStartEdit(winner)}
                                        disabled={disabled}
                                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                    >
                                        수정
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteWinner(winner)}
                                        disabled={disabled}
                                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                    >
                                        제거
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                                <input
                                    list={datalistId}
                                    value={editingValue}
                                    onChange={event => onChangeEditStudent(winner.id, event.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                />
                                <datalist id={datalistId}>
                                    {activeStudentIds.map(studentId => (
                                        <option key={studentId} value={studentId} />
                                    ))}
                                </datalist>
                                <button
                                    type="button"
                                    onClick={() => onSaveEdit(winner)}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                    저장
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onCancelEdit(winner)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    취소
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
