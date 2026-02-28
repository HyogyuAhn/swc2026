import { useState } from 'react';
import { Plus } from 'lucide-react';
import DrawConfirmModal from '@/features/admin/draw/components/DrawConfirmModal';
import DrawItemCard from '@/features/admin/draw/components/DrawItemCard';
import DrawItemCreateModal from '@/features/admin/draw/components/DrawItemCreateModal';
import DrawSettingsPanel from '@/features/admin/draw/components/DrawSettingsPanel';
import { DrawItemWithComputed, DrawPendingAction } from '@/features/admin/draw/types';

type DrawManagementSectionProps = {
    loading: boolean;
    submitting: boolean;
    drawInProgressItemId: string | null;
    settings: { live_page_enabled: boolean };
    items: DrawItemWithComputed[];
    activeStudentIds: string[];
    newItemName: string;
    newItemQuota: string;
    newItemAllowDuplicate: boolean;
    newItemPublic: boolean;
    drawModeByItem: Record<string, 'RANDOM' | 'MANUAL'>;
    manualStudentByItem: Record<string, string>;
    forceStudentByItem: Record<string, string>;
    editingWinnerById: Record<string, boolean>;
    editingStudentByWinnerId: Record<string, string>;
    pendingAction: DrawPendingAction;
    setNewItemName: (value: string) => void;
    setNewItemQuota: (value: string) => void;
    setNewItemAllowDuplicate: (checked: boolean) => void;
    setNewItemPublic: (checked: boolean) => void;
    handleCreateItem: () => Promise<boolean>;
    toggleDrawLiveEnabled: () => void;
    setModeForItem: (itemId: string, mode: 'RANDOM' | 'MANUAL') => void;
    setManualStudentForItem: (itemId: string, studentId: string) => void;
    setForceStudentForItem: (itemId: string, studentId: string) => void;
    handleStartDraw: (item: DrawItemWithComputed) => void;
    handleForceAdd: (item: DrawItemWithComputed) => void;
    toggleItemPublic: (item: DrawItemWithComputed) => void;
    toggleItemAllowDuplicate: (item: DrawItemWithComputed) => void;
    startEditWinner: (winner: any) => void;
    cancelEditWinner: (winner: any) => void;
    changeEditWinnerStudent: (winnerId: string, studentId: string) => void;
    handleUpdateWinner: (item: DrawItemWithComputed, winner: any) => void;
    handleDeleteWinner: (item: DrawItemWithComputed, winner: any) => void;
    confirmPendingAction: () => void;
    cancelPendingAction: () => void;
};

const getPendingTitle = (pendingAction: DrawPendingAction) => {
    if (!pendingAction) {
        return '';
    }

    if (pendingAction.type === 'MANUAL_PICK') {
        return '수동 추첨 경고';
    }

    if (pendingAction.type === 'FORCED_ADD') {
        return '강제 추가 경고';
    }

    return '당첨자 수정 경고';
};

const getPendingDescription = (pendingAction: DrawPendingAction) => {
    if (!pendingAction) {
        return '';
    }

    if (pendingAction.type === 'MANUAL_PICK') {
        return `${pendingAction.targetStudentId} 학번을 ${pendingAction.item.name} 항목에 당첨 처리합니다.`;
    }

    if (pendingAction.type === 'FORCED_ADD') {
        return `${pendingAction.targetStudentId} 학번을 뽑기 없이 당첨자로 강제 추가합니다.`;
    }

    return `${pendingAction.winner.student_id} → ${pendingAction.targetStudentId} 로 당첨자를 변경합니다.`;
};

export default function DrawManagementSection({
    loading,
    submitting,
    drawInProgressItemId,
    settings,
    items,
    activeStudentIds,
    newItemName,
    newItemQuota,
    newItemAllowDuplicate,
    newItemPublic,
    drawModeByItem,
    manualStudentByItem,
    forceStudentByItem,
    editingWinnerById,
    editingStudentByWinnerId,
    pendingAction,
    setNewItemName,
    setNewItemQuota,
    setNewItemAllowDuplicate,
    setNewItemPublic,
    handleCreateItem,
    toggleDrawLiveEnabled,
    setModeForItem,
    setManualStudentForItem,
    setForceStudentForItem,
    handleStartDraw,
    handleForceAdd,
    toggleItemPublic,
    toggleItemAllowDuplicate,
    startEditWinner,
    cancelEditWinner,
    changeEditWinnerStudent,
    handleUpdateWinner,
    handleDeleteWinner,
    confirmPendingAction,
    cancelPendingAction
}: DrawManagementSectionProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreateWithClose = async () => {
        const ok = await handleCreateItem();
        if (ok) {
            setShowCreateModal(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-10 pb-10 pt-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">추첨 관리</h2>
                    <p className="mt-1 text-sm text-gray-500">활성 학번을 기준으로 항목별 추첨/강제추가/수정/삭제를 관리합니다.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                    <Plus size={16} />
                    추첨 항목 추가
                </button>
            </div>

            <div className="grid gap-4">
                <DrawSettingsPanel
                    livePageEnabled={settings.live_page_enabled}
                    onToggle={toggleDrawLiveEnabled}
                />
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-400">
                        추첨 데이터를 불러오는 중입니다...
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-400">
                        아직 생성된 추첨 항목이 없습니다.
                    </div>
                ) : (
                    items.map(item => (
                        <DrawItemCard
                            key={item.id}
                            item={item}
                            drawMode={drawModeByItem[item.id] || 'RANDOM'}
                            drawInProgressItemId={drawInProgressItemId}
                            manualStudentId={manualStudentByItem[item.id] || ''}
                            forceStudentId={forceStudentByItem[item.id] || ''}
                            activeStudentIds={activeStudentIds}
                            editingWinnerById={editingWinnerById}
                            editingStudentByWinnerId={editingStudentByWinnerId}
                            disabled={submitting}
                            onModeChange={mode => setModeForItem(item.id, mode)}
                            onManualStudentChange={value => setManualStudentForItem(item.id, value)}
                            onForceStudentChange={value => setForceStudentForItem(item.id, value)}
                            onStartDraw={() => handleStartDraw(item)}
                            onForceAdd={() => handleForceAdd(item)}
                            onTogglePublic={() => toggleItemPublic(item)}
                            onToggleAllowDuplicate={() => toggleItemAllowDuplicate(item)}
                            onStartEditWinner={startEditWinner}
                            onCancelEditWinner={cancelEditWinner}
                            onChangeEditStudent={changeEditWinnerStudent}
                            onSaveWinner={winner => handleUpdateWinner(item, winner)}
                            onDeleteWinner={winner => handleDeleteWinner(item, winner)}
                        />
                    ))
                )}
            </div>

            <DrawConfirmModal
                isOpen={Boolean(pendingAction)}
                title={getPendingTitle(pendingAction)}
                description={getPendingDescription(pendingAction)}
                warnings={pendingAction?.warnings || []}
                onCancel={cancelPendingAction}
                onConfirm={confirmPendingAction}
                confirmLabel="경고 무시 후 진행"
            />

            <DrawItemCreateModal
                isOpen={showCreateModal}
                name={newItemName}
                quota={newItemQuota}
                allowDuplicate={newItemAllowDuplicate}
                isPublic={newItemPublic}
                disabled={submitting}
                onClose={() => setShowCreateModal(false)}
                onNameChange={setNewItemName}
                onQuotaChange={setNewItemQuota}
                onAllowDuplicateChange={setNewItemAllowDuplicate}
                onPublicChange={setNewItemPublic}
                onCreate={handleCreateWithClose}
            />
        </div>
    );
}
