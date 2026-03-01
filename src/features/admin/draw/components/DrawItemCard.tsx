import DrawWinnerList from '@/features/admin/draw/components/DrawWinnerList';
import { DrawItemWithComputed, DrawWinner } from '@/features/admin/draw/types';

type DrawItemCardProps = {
    key?: string | number;
    item: DrawItemWithComputed;
    drawInProgressItemId: string | null;
    activeStudentIds: string[];
    drawNumberByStudentId: Record<string, string>;
    studentInfoById: Record<string, any>;
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
    drawInProgressItemId,
    activeStudentIds,
    drawNumberByStudentId,
    studentInfoById,
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

    return (
        <article className="group relative overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h4 className="text-2xl font-extrabold tracking-tight text-gray-900">{item.name}</h4>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        당첨 {item.winnerCount} / {item.winner_quota} · 남은 개수: {item.remainingCount}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.is_public ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            실시간 당첨자 공개 {item.is_public ? 'ON' : 'OFF'}
                        </span>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.show_recent_winners ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                            최근 당첨 결과 공개 {item.show_recent_winners ? 'ON' : 'OFF'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onOpenSettingsModal}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
                    >
                        항목 설정
                    </button>
                    {item.remainingCount > 0 ? (
                        <button
                            type="button"
                            onClick={onOpenStartModal}
                            disabled={disabled || isAnotherDrawInProgress || isThisDrawInProgress}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isThisDrawInProgress ? '추첨 진행중...' : '추첨 시작'}
                        </button>
                    ) : (
                        <span className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-500">
                            추첨 완료
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
                <h5 className="mb-4 text-base font-extrabold tracking-tight text-gray-900">당첨자 목록</h5>
                <DrawWinnerList
                    item={item}
                    activeStudentIds={activeStudentIds}
                    drawNumberByStudentId={drawNumberByStudentId}
                    studentInfoById={studentInfoById}
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
