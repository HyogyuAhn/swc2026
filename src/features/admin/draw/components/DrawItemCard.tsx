import DrawControlPanel from '@/features/admin/draw/components/DrawControlPanel';
import DrawWinnerList from '@/features/admin/draw/components/DrawWinnerList';
import { DrawItemWithComputed, DrawMode, DrawWinner } from '@/features/admin/draw/types';

type DrawItemCardProps = {
    item: DrawItemWithComputed;
    drawMode: DrawMode;
    drawInProgressItemId: string | null;
    manualStudentId: string;
    forceStudentId: string;
    activeStudentIds: string[];
    editingWinnerById: Record<string, boolean>;
    editingStudentByWinnerId: Record<string, string>;
    disabled?: boolean;
    onModeChange: (mode: DrawMode) => void;
    onManualStudentChange: (value: string) => void;
    onForceStudentChange: (value: string) => void;
    onStartDraw: () => void;
    onForceAdd: () => void;
    onTogglePublic: () => void;
    onToggleAllowDuplicate: () => void;
    onStartEditWinner: (winner: DrawWinner) => void;
    onCancelEditWinner: (winner: DrawWinner) => void;
    onChangeEditStudent: (winnerId: string, studentId: string) => void;
    onSaveWinner: (winner: DrawWinner) => void;
    onDeleteWinner: (winner: DrawWinner) => void;
};

export default function DrawItemCard({
    item,
    drawMode,
    drawInProgressItemId,
    manualStudentId,
    forceStudentId,
    activeStudentIds,
    editingWinnerById,
    editingStudentByWinnerId,
    disabled = false,
    onModeChange,
    onManualStudentChange,
    onForceStudentChange,
    onStartDraw,
    onForceAdd,
    onTogglePublic,
    onToggleAllowDuplicate,
    onStartEditWinner,
    onCancelEditWinner,
    onChangeEditStudent,
    onSaveWinner,
    onDeleteWinner
}: DrawItemCardProps) {
    const isAnotherDrawInProgress = Boolean(drawInProgressItemId && drawInProgressItemId !== item.id);
    const isThisDrawInProgress = drawInProgressItemId === item.id;

    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">
                        당첨 {item.winnerCount} / {item.winner_quota} · 남은 {item.remainingCount}
                    </p>
                </div>

                {item.remainingCount > 0 ? (
                    <button
                        type="button"
                        onClick={onStartDraw}
                        disabled={disabled || isAnotherDrawInProgress || isThisDrawInProgress || (drawMode === 'MANUAL' && !manualStudentId)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isThisDrawInProgress ? '추첨 진행중...' : '추첨 시작'}
                    </button>
                ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                        추첨 완료
                    </span>
                )}
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={item.is_public} onChange={onTogglePublic} />
                    당첨자 공개 (라이브 노출)
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={item.allow_duplicate_winners} onChange={onToggleAllowDuplicate} />
                    중복 당첨 허용 (다른 항목)
                </label>
            </div>

            <DrawControlPanel
                item={item}
                drawMode={drawMode}
                manualStudentId={manualStudentId}
                forceStudentId={forceStudentId}
                activeStudentIds={activeStudentIds}
                disabled={disabled}
                onModeChange={onModeChange}
                onManualStudentChange={onManualStudentChange}
                onForceStudentChange={onForceStudentChange}
                onForceAdd={onForceAdd}
            />

            <div className="mt-4 border-t border-gray-100 pt-4">
                <h5 className="mb-2 text-sm font-bold text-gray-700">당첨자 목록</h5>
                <DrawWinnerList
                    item={item}
                    activeStudentIds={activeStudentIds}
                    editingWinnerById={editingWinnerById}
                    editingStudentByWinnerId={editingStudentByWinnerId}
                    disabled={disabled}
                    onStartEdit={onStartEditWinner}
                    onCancelEdit={onCancelEditWinner}
                    onChangeEditStudent={onChangeEditStudent}
                    onSaveEdit={onSaveWinner}
                    onDeleteWinner={onDeleteWinner}
                />
            </div>
        </article>
    );
}
