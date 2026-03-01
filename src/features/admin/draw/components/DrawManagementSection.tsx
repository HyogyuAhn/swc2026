import { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import DrawConfirmModal from '@/features/admin/draw/components/DrawConfirmModal';
import DrawItemCard from '@/features/admin/draw/components/DrawItemCard';
import DrawItemCreateModal from '@/features/admin/draw/components/DrawItemCreateModal';
import DrawItemSettingsModal from '@/features/admin/draw/components/DrawItemSettingsModal';
import DrawLiveSettingsModal from '@/features/admin/draw/components/DrawLiveSettingsModal';
import DrawSequenceModal from '@/features/admin/draw/components/DrawSequenceModal';
import DrawStartModal from '@/features/admin/draw/components/DrawStartModal';
import { DrawItemWithComputed, DrawPendingAction, DrawRandomFilter, DrawSequenceStep } from '@/features/admin/draw/types';
import {
    DEFAULT_DRAW_RANDOM_ROLES,
    STUDENT_DEPARTMENT_OPTIONS
} from '@/features/admin/student/constants';

type DrawManagementSectionProps = {
    loading: boolean;
    submitting: boolean;
    drawInProgressItemId: string | null;
    settings: { live_page_enabled: boolean; show_recent_winners: boolean };
    items: DrawItemWithComputed[];
    activeStudentIds: string[];
    drawNumberByStudentId: Record<string, string>;
    studentInfoById: Record<string, any>;
    newItemName: string;
    newItemQuota: string;
    newItemAllowDuplicate: boolean;
    newItemPublic: boolean;
    newItemShowRecentWinners: boolean;
    drawModeByItem: Record<string, 'RANDOM' | 'MANUAL'>;
    manualStudentByItem: Record<string, string>;
    editingWinnerById: Record<string, boolean>;
    editingStudentByWinnerId: Record<string, string>;
    pendingAction: DrawPendingAction;
    setNewItemName: (value: string) => void;
    setNewItemQuota: (value: string) => void;
    setNewItemAllowDuplicate: (checked: boolean) => void;
    setNewItemPublic: (checked: boolean) => void;
    setNewItemShowRecentWinners: (checked: boolean) => void;
    handleCreateItem: () => Promise<boolean>;
    toggleDrawLiveEnabled: () => void;
    toggleRecentWinnersEnabled: () => void;
    setModeForItem: (itemId: string, mode: 'RANDOM' | 'MANUAL') => void;
    setManualStudentForItem: (itemId: string, studentId: string) => void;
    handleStartDraw: (item: DrawItemWithComputed, options?: {
        mode: 'RANDOM' | 'MANUAL';
        targetStudentId?: string;
        randomFilter?: DrawRandomFilter;
    }) => Promise<boolean>;
    handleStartSequence: (steps: DrawSequenceStep[]) => Promise<boolean>;
    saveItemSettings: (item: DrawItemWithComputed, patch: {
        name: string;
        winner_quota: number;
        allow_duplicate_winners: boolean;
        is_public: boolean;
        show_recent_winners: boolean;
    }) => Promise<boolean>;
    startEditWinner: (winner: any) => void;
    cancelEditWinner: (winner: any) => void;
    changeEditWinnerStudent: (winnerId: string, studentId: string) => void;
    handleUpdateWinner: (item: DrawItemWithComputed, winner: any) => void;
    handleDeleteWinner: (item: DrawItemWithComputed, winner: any) => void;
    toggleWinnerPublic: (item: DrawItemWithComputed, winner: any) => void;
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

const getPendingDescription = (
    pendingAction: DrawPendingAction,
    drawNumberByStudentId: Record<string, string>
) => {
    if (!pendingAction) {
        return '';
    }

    if (pendingAction.type === 'MANUAL_PICK') {
        return `${pendingAction.targetStudentId} 번호를 ${pendingAction.item.name} 항목에 당첨 처리합니다.`;
    }

    if (pendingAction.type === 'FORCED_ADD') {
        return `${pendingAction.targetStudentId} 번호를 뽑기 없이 당첨자로 강제 추가합니다.`;
    }

    const currentNumber = drawNumberByStudentId[pendingAction.winner.student_id] || '번호 미지정';
    return `${currentNumber} → ${pendingAction.targetStudentId} 로 당첨자를 변경합니다.`;
};

export default function DrawManagementSection({
    loading,
    submitting,
    drawInProgressItemId,
    settings,
    items,
    activeStudentIds,
    drawNumberByStudentId,
    studentInfoById,
    newItemName,
    newItemQuota,
    newItemAllowDuplicate,
    newItemPublic,
    newItemShowRecentWinners,
    drawModeByItem,
    manualStudentByItem,
    editingWinnerById,
    editingStudentByWinnerId,
    pendingAction,
    setNewItemName,
    setNewItemQuota,
    setNewItemAllowDuplicate,
    setNewItemPublic,
    setNewItemShowRecentWinners,
    handleCreateItem,
    toggleDrawLiveEnabled,
    toggleRecentWinnersEnabled,
    setModeForItem,
    setManualStudentForItem,
    handleStartDraw,
    handleStartSequence,
    saveItemSettings,
    startEditWinner,
    cancelEditWinner,
    changeEditWinnerStudent,
    handleUpdateWinner,
    handleDeleteWinner,
    toggleWinnerPublic,
    confirmPendingAction,
    cancelPendingAction
}: DrawManagementSectionProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLiveSettingsModal, setShowLiveSettingsModal] = useState(false);
    const [drawStartItem, setDrawStartItem] = useState<DrawItemWithComputed | null>(null);
    const [drawStartMode, setDrawStartMode] = useState<'RANDOM' | 'MANUAL'>('RANDOM');
    const [drawStartStudentId, setDrawStartStudentId] = useState('');
    const [settingsItem, setSettingsItem] = useState<DrawItemWithComputed | null>(null);
    const [settingsName, setSettingsName] = useState('');
    const [settingsQuota, setSettingsQuota] = useState('1');
    const [settingsAllowDuplicate, setSettingsAllowDuplicate] = useState(false);
    const [settingsRealtimePublic, setSettingsRealtimePublic] = useState(true);
    const [settingsRecentPublic, setSettingsRecentPublic] = useState(true);
    const [showSequenceModal, setShowSequenceModal] = useState(false);
    const [sequenceSteps, setSequenceSteps] = useState<DrawSequenceStep[]>([]);
    const defaultRandomFilter = (): DrawRandomFilter => ({
        gender: 'ALL',
        departments: [...STUDENT_DEPARTMENT_OPTIONS],
        roles: [...DEFAULT_DRAW_RANDOM_ROLES]
    });
    const [drawStartRandomFilter, setDrawStartRandomFilter] = useState<DrawRandomFilter>(defaultRandomFilter());

    const createSequenceStep = (itemId = ''): DrawSequenceStep => ({
        id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemId,
        mode: 'RANDOM',
        targetDrawNumber: ''
    });

    const handleCreateWithClose = async () => {
        const ok = await handleCreateItem();
        if (ok) {
            setShowCreateModal(false);
        }
    };

    const openStartModal = (item: DrawItemWithComputed) => {
        setDrawStartItem(item);
        setDrawStartMode(drawModeByItem[item.id] || 'RANDOM');
        setDrawStartStudentId(manualStudentByItem[item.id] || '');
        setDrawStartRandomFilter(defaultRandomFilter());
    };

    const confirmStartDraw = async () => {
        if (!drawStartItem) {
            return;
        }

        setModeForItem(drawStartItem.id, drawStartMode);
        if (drawStartMode === 'MANUAL') {
            setManualStudentForItem(drawStartItem.id, drawStartStudentId);
        }

        setDrawStartItem(null);
        await handleStartDraw(drawStartItem, {
            mode: drawStartMode,
            targetStudentId: drawStartMode === 'MANUAL' ? drawStartStudentId : undefined,
            randomFilter: drawStartMode === 'RANDOM' ? drawStartRandomFilter : undefined
        });
    };

    const toggleDrawStartDepartment = (department: string) => {
        setDrawStartRandomFilter(prev => {
            const exists = prev.departments.includes(department);
            if (exists) {
                return { ...prev, departments: prev.departments.filter(item => item !== department) };
            }
            return { ...prev, departments: [...prev.departments, department] };
        });
    };

    const toggleDrawStartRole = (role: string) => {
        setDrawStartRandomFilter(prev => {
            const exists = prev.roles.includes(role);
            if (exists) {
                return { ...prev, roles: prev.roles.filter(item => item !== role) };
            }
            return { ...prev, roles: [...prev.roles, role] };
        });
    };

    const openSequenceModal = () => {
        const selectableItems = items.filter(item => item.remainingCount > 0);
        const firstItemId = selectableItems[0]?.id || '';
        const secondItemId = selectableItems[1]?.id || firstItemId;
        setSequenceSteps([
            createSequenceStep(firstItemId),
            createSequenceStep(secondItemId)
        ]);
        setShowSequenceModal(true);
    };

    const changeSequenceStep = (stepId: string, patch: Partial<DrawSequenceStep>) => {
        setSequenceSteps(prev => prev.map(step => {
            if (step.id !== stepId) {
                return step;
            }

            const nextStep = { ...step, ...patch };
            if (typeof patch.targetDrawNumber === 'string') {
                nextStep.targetDrawNumber = patch.targetDrawNumber.replace(/\D/g, '').slice(0, 4);
            }

            if (patch.mode === 'RANDOM') {
                nextStep.targetDrawNumber = '';
            }

            return nextStep;
        }));
    };

    const addSequenceStep = () => {
        const selectableItems = items.filter(item => item.remainingCount > 0);
        setSequenceSteps(prev => [
            ...prev,
            createSequenceStep(selectableItems[0]?.id || '')
        ]);
    };

    const removeSequenceStep = (stepId: string) => {
        setSequenceSteps(prev => {
            if (prev.length <= 2) {
                return prev;
            }
            return prev.filter(step => step.id !== stepId);
        });
    };

    const startSequence = async () => {
        const ok = await handleStartSequence(sequenceSteps);
        if (ok) {
            setShowSequenceModal(false);
        }
    };

    const openItemSettings = (item: DrawItemWithComputed) => {
        setSettingsItem(item);
        setSettingsName(item.name);
        setSettingsQuota(String(item.winner_quota));
        setSettingsAllowDuplicate(item.allow_duplicate_winners);
        setSettingsRealtimePublic(item.is_public);
        setSettingsRecentPublic(item.show_recent_winners ?? true);
    };

    const saveCurrentItemSettings = async () => {
        if (!settingsItem) {
            return;
        }

        const ok = await saveItemSettings(settingsItem, {
            name: settingsName,
            winner_quota: Number(settingsQuota),
            allow_duplicate_winners: settingsAllowDuplicate,
            is_public: settingsRealtimePublic,
            show_recent_winners: settingsRecentPublic
        });

        if (ok) {
            setSettingsItem(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-10 pb-10 pt-4">
            <div className="mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">추첨 관리</h2>
                    <p className="mt-2 text-sm font-medium text-gray-500">활성 번호를 기준으로 항목별 추첨/수정/삭제를 관리합니다.</p>
                </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
                    <div className="mb-5 flex items-start gap-3 text-gray-900">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                            <Plus size={20} />
                        </div>
                        <div>
                            <p className="text-base font-extrabold tracking-tight">추첨 항목 추가</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">새 항목 이름/개수/공개 옵션을 설정합니다.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-sm"
                    >
                        항목 추가
                    </button>
                </div>

                <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md">
                    <div className="mb-5 flex items-start gap-3 text-gray-900">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <p className="text-base font-extrabold tracking-tight">라이브 설정</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">페이지 공개 및 최근 결과 노출 범위를 관리합니다.</p>
                        </div>
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className={`rounded-full px-2.5 py-1 ${settings.live_page_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                            라이브 {settings.live_page_enabled ? 'ON' : 'OFF'}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 ${settings.show_recent_winners ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                            최근 결과 {settings.show_recent_winners ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowLiveSettingsModal(true)}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-700"
                    >
                        설정 열기
                    </button>
                </div>

                <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-violet-100 bg-violet-50/30 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md">
                    <div className="mb-5 flex items-start gap-3 text-gray-900">
                        <div className="rounded-xl bg-violet-100 p-3 text-violet-600 transition-colors group-hover:bg-violet-200 group-hover:text-violet-700">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <p className="text-base font-extrabold tracking-tight">연속 뽑기</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">여러 항목을 원하는 순서로 연속 추첨합니다.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openSequenceModal}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-700 transition-all hover:bg-violet-200 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-sm"
                    >
                        연속 뽑기 설정
                    </button>
                </div>
            </div>

            <div className="space-y-4">
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
                            drawInProgressItemId={drawInProgressItemId}
                            activeStudentIds={activeStudentIds}
                            drawNumberByStudentId={drawNumberByStudentId}
                            studentInfoById={studentInfoById}
                            editingWinnerById={editingWinnerById}
                            editingStudentByWinnerId={editingStudentByWinnerId}
                            disabled={submitting}
                            onOpenStartModal={() => openStartModal(item)}
                            onOpenSettingsModal={() => openItemSettings(item)}
                            onStartEditWinner={startEditWinner}
                            onCancelEditWinner={cancelEditWinner}
                            onChangeEditStudent={changeEditWinnerStudent}
                            onSaveWinner={winner => handleUpdateWinner(item, winner)}
                            onDeleteWinner={winner => handleDeleteWinner(item, winner)}
                            onToggleWinnerPublic={winner => toggleWinnerPublic(item, winner)}
                        />
                    ))
                )}
            </div>

            <DrawConfirmModal
                isOpen={Boolean(pendingAction)}
                title={getPendingTitle(pendingAction)}
                description={getPendingDescription(pendingAction, drawNumberByStudentId)}
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
                isRealtimePublic={newItemPublic}
                isRecentPublic={newItemShowRecentWinners}
                disabled={submitting}
                onClose={() => setShowCreateModal(false)}
                onNameChange={setNewItemName}
                onQuotaChange={setNewItemQuota}
                onAllowDuplicateChange={setNewItemAllowDuplicate}
                onRealtimePublicChange={setNewItemPublic}
                onRecentPublicChange={setNewItemShowRecentWinners}
                onCreate={handleCreateWithClose}
            />

            <DrawLiveSettingsModal
                isOpen={showLiveSettingsModal}
                livePageEnabled={settings.live_page_enabled}
                showRecentWinners={settings.show_recent_winners}
                onClose={() => setShowLiveSettingsModal(false)}
                onToggleLivePage={toggleDrawLiveEnabled}
                onToggleRecentWinners={toggleRecentWinnersEnabled}
            />

            <DrawStartModal
                isOpen={Boolean(drawStartItem)}
                itemName={drawStartItem?.name || ''}
                mode={drawStartMode}
                manualStudentId={drawStartStudentId}
                activeStudentIds={activeStudentIds}
                randomFilter={drawStartRandomFilter}
                disabled={submitting}
                onClose={() => setDrawStartItem(null)}
                onModeChange={setDrawStartMode}
                onManualStudentChange={setDrawStartStudentId}
                onRandomGenderChange={value => setDrawStartRandomFilter(prev => ({ ...prev, gender: value }))}
                onToggleRandomDepartment={toggleDrawStartDepartment}
                onToggleRandomRole={toggleDrawStartRole}
                onConfirm={confirmStartDraw}
            />

            <DrawItemSettingsModal
                isOpen={Boolean(settingsItem)}
                name={settingsName}
                quota={settingsQuota}
                allowDuplicate={settingsAllowDuplicate}
                isRealtimePublic={settingsRealtimePublic}
                isRecentPublic={settingsRecentPublic}
                disabled={submitting}
                onClose={() => setSettingsItem(null)}
                onNameChange={setSettingsName}
                onQuotaChange={setSettingsQuota}
                onAllowDuplicateChange={setSettingsAllowDuplicate}
                onRealtimePublicChange={setSettingsRealtimePublic}
                onRecentPublicChange={setSettingsRecentPublic}
                onSave={saveCurrentItemSettings}
            />

            <DrawSequenceModal
                isOpen={showSequenceModal}
                steps={sequenceSteps}
                items={items}
                activeDrawNumbers={activeStudentIds}
                disabled={submitting}
                onClose={() => setShowSequenceModal(false)}
                onChangeStep={changeSequenceStep}
                onAddStep={addSequenceStep}
                onRemoveStep={removeSequenceStep}
                onStart={startSequence}
            />
        </div>
    );
}
