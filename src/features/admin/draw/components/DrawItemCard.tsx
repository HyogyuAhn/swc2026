import DrawWinnerList from '@/features/admin/draw/components/DrawWinnerList';
import { DrawItemWithComputed, DrawMode, DrawWinner } from '@/features/admin/draw/types';

type DrawItemCardProps = {
    item: DrawItemWithComputed;
    drawMode: DrawMode;
    drawInProgressItemId: string | null;
    activeStudentIds: string[];
    editingWinnerById: Record<string, boolean>;
    editingStudentByWinnerId: Record<string, string>;
    disabled?: boolean;
    onOpenStartModal: () => void;
    onOpenSettingsModal: () => void;
    onStartEditWinner: (winner: DrawWinner) => void;
    onCancelEditWinner: (winner: DrawWinner) => void;
    onChangeEditStudent: (winnerId: string, studentId: string) => void;
    onSaveWinner: (winner: DrawWinner) => void;
    onDeleteWinner: (winner: DrawWinner) => void;
    onToggleWinnerPublic: (winner: DrawWinner) => void;
};

export default function DrawItemCard({
    item,
    drawMode,
    drawInProgressItemId,
    activeStudentIds,
    editingWinnerById,
    editingStudentByWinnerId,
    disabled = false,
    onOpenStartModal,
    onOpenSettingsModal,
    onStartEditWinner,
    onCancelEditWinner,
    onChangeEditStudent,
    onSaveWinner,
    onDeleteWinner,
    onToggleWinnerPublic
}: DrawItemCardProps) {
    const isAnotherDrawInProgress = Boolean(drawInProgressItemId && drawInProgressItemId !== item.id);
    const isThisDrawInProgress = drawInProgressItemId === item.id;
    const modeLabel = drawMode === 'RANDOM' ? '랜덤 뽑기' : '수동 지정';

    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">
                        당첨 {item.winnerCount} / {item.winner_quota} · 남은 개수: {item.remainingCount}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            모드: {modeLabel}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${item.is_public ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            실시간 당첨자 공개 {item.is_public ? 'ON' : 'OFF'}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${item.show_recent_winners ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                            최근 당첨 결과 공개 {item.show_recent_winners ? 'ON' : 'OFF'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={onOpenSettingsModal}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        항목 설정
                    </button>
                    {item.remainingCount > 0 ? (
                        <button
                            type="button"
                            onClick={onOpenStartModal}
                            disabled={disabled || isAnotherDrawInProgress || isThisDrawInProgress}
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
            </div>

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
                    onTogglePublic={onToggleWinnerPublic}
                />
            </div>
        </article>
    );
}
