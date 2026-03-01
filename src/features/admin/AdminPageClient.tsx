'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastState } from '@/features/vote/common/types';
import ToastBanner from '@/features/vote/common/ToastBanner';
import AdminLoginScreen from '@/features/admin/components/AdminLoginScreen';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import AdminDashboardSection from '@/features/admin/components/AdminDashboardSection';
import AdminStudentsSection from '@/features/admin/components/AdminStudentsSection';
import StudentDeleteModal from '@/features/admin/components/StudentDeleteModal';
import StudentHistoryModal from '@/features/admin/components/StudentHistoryModal';
import VoteEditorSection from '@/features/admin/components/VoteEditorSection';
import VoteDetailsModal from '@/features/admin/components/VoteDetailsModal';
import DrawManagementSection from '@/features/admin/draw/components/DrawManagementSection';
import useAdminAuth from '@/features/admin/hooks/useAdminAuth';
import useStudentManagement from '@/features/admin/hooks/useStudentManagement';
import useVoteManagement from '@/features/admin/hooks/useVoteManagement';
import useDrawManagement from '@/features/admin/draw/hooks/useDrawManagement';

export default function AdminPageClient() {
    const {
        isAuthenticated,
        id,
        setId,
        pw,
        setPw,
        error,
        handleLogin,
        handleLogout: baseHandleLogout
    } = useAdminAuth();
    const [view, setView] = useState<'DASHBOARD' | 'STUDENTS' | 'DRAW' | 'CREATE' | 'EDIT'>('DASHBOARD');
    const [toast, setToast] = useState<ToastState>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, kind: 'error' | 'info' | 'success' = 'error') => {
        setToast({ message, kind });

        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 5000);
    }, []);

    const {
        dashboardFilter,
        setDashboardFilter,
        votes,
        selectedVote,
        voteRecords,
        showDetailsModal,
        setShowDetailsModal,
        detailsVote,
        counts,
        voteStats,
        formData,
        setFormData,
        fetchVotes,
        fetchVoteDetails: fetchVoteDetailsRaw,
        toggleValidity: toggleValidityRaw,
        handlePin,
        getStatus,
        getRemainingTime,
        startCreate: prepareCreate,
        startEdit: prepareEdit,
        handleSave: saveVote,
        handleDelete: deleteVote,
        handleEarlyEnd,
        removeOption
    } = useVoteManagement(isAuthenticated);

    const {
        students,
        studentSearch,
        setStudentSearch,
        studentGenderFilter,
        setStudentGenderFilter,
        studentRoleFilter,
        setStudentRoleFilter,
        studentDepartmentFilter,
        setStudentDepartmentFilter,
        selectedStudent,
        studentHistory,
        studentDrawWinners,
        showStudentModal,
        setShowStudentModal,
        showDeleteModal,
        setShowDeleteModal,
        deleteTarget,
        setDeleteTarget,
        forceVoteData,
        setForceVoteData,
        fetchStudents,
        handleAddStudent,
        handleImportStudents,
        handleBulkDeleteStudents,
        handleToggleSuspend,
        handleDeleteStudent,
        executeDeleteStudent,
        handleResetStudentVotes,
        handleDeleteRecord,
        handleForceAddVote,
        handleStudentDetails,
        handleUpdateStudentInfo,
        patchStudentHistoryValidity
    } = useStudentManagement({ onVotesChanged: fetchVotes });

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (showDetailsModal || showStudentModal || showDeleteModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailsModal, showStudentModal, showDeleteModal]);

    const handleLogout = () => {
        baseHandleLogout();
        setView('DASHBOARD');
    };

    const fetchVoteDetails = useCallback(async (vote: any) => {
        await fetchVoteDetailsRaw(vote, setForceVoteData);
    }, [fetchVoteDetailsRaw, setForceVoteData]);

    const toggleValidity = useCallback(async (recordId: string, currentStatus: boolean) => {
        await toggleValidityRaw(recordId, currentStatus, patchStudentHistoryValidity);
    }, [patchStudentHistoryValidity, toggleValidityRaw]);

    const startCreate = useCallback(() => {
        prepareCreate();
        setView('CREATE');
    }, [prepareCreate]);

    const startEdit = useCallback((vote: any) => {
        prepareEdit(vote);
        setView('EDIT');
    }, [prepareEdit]);

    const handleSave = useCallback(async () => {
        await saveVote(view, showToast, () => setView('DASHBOARD'));
    }, [saveVote, showToast, view]);

    const handleDelete = useCallback(async () => {
        await deleteVote(() => setView('DASHBOARD'));
    }, [deleteVote]);

    const runForceAddVote = useCallback(async () => {
        await handleForceAddVote({
            showDetailsModal,
            detailsVote,
            refreshVoteDetails: fetchVoteDetails
        });
    }, [detailsVote, fetchVoteDetails, handleForceAddVote, showDetailsModal]);

    const drawManagement = useDrawManagement(showToast, isAuthenticated);

    if (!isAuthenticated) {
        return (
            <AdminLoginScreen
                id={id}
                pw={pw}
                error={error}
                onIdChange={setId}
                onPwChange={setPw}
                onSubmit={handleLogin}
            />
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            <AdminSidebar
                view={view}
                setView={setView}
                fetchStudents={fetchStudents}
                startCreate={startCreate}
                votes={votes}
                selectedVote={selectedVote}
                startEdit={startEdit}
                getStatus={getStatus}
                onLogout={handleLogout}
            />

            <div className="flex-1 h-full overflow-y-auto relative bg-gray-50">
                {view === 'DASHBOARD' && (
                    <AdminDashboardSection
                        votes={votes}
                        dashboardFilter={dashboardFilter}
                        setDashboardFilter={setDashboardFilter}
                        counts={counts}
                        voteStats={voteStats}
                        getStatus={getStatus}
                        getRemainingTime={getRemainingTime}
                        handlePin={handlePin}
                        fetchVoteDetails={fetchVoteDetails}
                        startEdit={startEdit}
                        handleEarlyEnd={handleEarlyEnd}
                    />
                )}

                {view === 'STUDENTS' && (
                    <>
                        <AdminStudentsSection
                            students={students}
                            fetchStudents={fetchStudents}
                            studentSearch={studentSearch}
                            setStudentSearch={setStudentSearch}
                            studentGenderFilter={studentGenderFilter}
                            setStudentGenderFilter={setStudentGenderFilter}
                            studentRoleFilter={studentRoleFilter}
                            setStudentRoleFilter={setStudentRoleFilter}
                            studentDepartmentFilter={studentDepartmentFilter}
                            setStudentDepartmentFilter={setStudentDepartmentFilter}
                            handleAddStudent={handleAddStudent}
                            handleImportStudents={handleImportStudents}
                            handleBulkDeleteStudents={handleBulkDeleteStudents}
                            handleStudentDetails={handleStudentDetails}
                        />
                        <StudentDeleteModal
                            showDeleteModal={showDeleteModal}
                            deleteTarget={deleteTarget}
                            executeDeleteStudent={executeDeleteStudent}
                            setShowDeleteModal={setShowDeleteModal}
                            setDeleteTarget={setDeleteTarget}
                        />
                        <StudentHistoryModal
                            showStudentModal={showStudentModal}
                            selectedStudent={selectedStudent}
                            studentHistory={studentHistory}
                            studentDrawWinners={studentDrawWinners}
                            setShowStudentModal={setShowStudentModal}
                            forceVoteData={forceVoteData}
                            setForceVoteData={setForceVoteData}
                            votes={votes}
                            getStatus={getStatus}
                            handleForceAddVote={runForceAddVote}
                            toggleValidity={toggleValidity}
                            handleDeleteRecord={handleDeleteRecord}
                            handleStudentDetails={handleStudentDetails}
                            handleUpdateStudentInfo={handleUpdateStudentInfo}
                            handleResetStudentVotes={handleResetStudentVotes}
                            handleToggleSuspend={handleToggleSuspend}
                            handleDeleteStudent={handleDeleteStudent}
                        />
                    </>
                )}

                {view === 'DRAW' && (
                    <DrawManagementSection
                        loading={drawManagement.loading}
                        submitting={drawManagement.submitting}
                        drawInProgressItemId={drawManagement.drawInProgressItemId}
                        sequenceRunning={drawManagement.sequenceRunning}
                        settings={drawManagement.settings}
                        items={drawManagement.items}
                        activeStudentIds={drawManagement.activeStudentIds}
                        drawNumberByStudentId={drawManagement.drawNumberByStudentId}
                        studentInfoById={drawManagement.studentInfoById}
                        newItemName={drawManagement.newItemName}
                        newItemQuota={drawManagement.newItemQuota}
                        newItemAllowDuplicate={drawManagement.newItemAllowDuplicate}
                        newItemPublic={drawManagement.newItemPublic}
                        newItemShowRecentWinners={drawManagement.newItemShowRecentWinners}
                        drawModeByItem={drawManagement.drawModeByItem}
                        manualStudentByItem={drawManagement.manualStudentByItem}
                        editingWinnerById={drawManagement.editingWinnerById}
                        editingStudentByWinnerId={drawManagement.editingStudentByWinnerId}
                        pendingAction={drawManagement.pendingAction}
                        setNewItemName={drawManagement.setNewItemName}
                        setNewItemQuota={drawManagement.setNewItemQuota}
                        setNewItemAllowDuplicate={drawManagement.setNewItemAllowDuplicate}
                        setNewItemPublic={drawManagement.setNewItemPublic}
                        setNewItemShowRecentWinners={drawManagement.setNewItemShowRecentWinners}
                        handleCreateItem={drawManagement.handleCreateItem}
                        toggleDrawLiveEnabled={drawManagement.toggleDrawLiveEnabled}
                        toggleRecentWinnersEnabled={drawManagement.toggleRecentWinnersEnabled}
                        setModeForItem={drawManagement.setModeForItem}
                        setManualStudentForItem={drawManagement.setManualStudentForItem}
                        handleStartDraw={drawManagement.handleStartDraw}
                        handleStartSequence={drawManagement.handleStartSequence}
                        saveItemSettings={drawManagement.saveItemSettings}
                        handleDeleteItem={drawManagement.handleDeleteItem}
                        startEditWinner={drawManagement.startEditWinner}
                        cancelEditWinner={drawManagement.cancelEditWinner}
                        changeEditWinnerStudent={drawManagement.changeEditWinnerStudent}
                        handleUpdateWinner={drawManagement.handleUpdateWinner}
                        handleDeleteWinner={drawManagement.handleDeleteWinner}
                        toggleWinnerPublic={drawManagement.toggleWinnerPublic}
                        confirmPendingAction={drawManagement.confirmPendingAction}
                        cancelPendingAction={drawManagement.cancelPendingAction}
                    />
                )}

                <VoteEditorSection
                    view={view}
                    selectedVote={selectedVote}
                    getStatus={getStatus}
                    fetchVoteDetails={fetchVoteDetails}
                    formData={formData}
                    setFormData={setFormData}
                    removeOption={removeOption}
                    handleDelete={handleDelete}
                    handleSave={handleSave}
                    setView={setView}
                />

                <VoteDetailsModal
                    showDetailsModal={showDetailsModal}
                    detailsVote={detailsVote}
                    setShowDetailsModal={setShowDetailsModal}
                    forceVoteData={forceVoteData}
                    setForceVoteData={setForceVoteData}
                    handleForceAddVote={runForceAddVote}
                    voteRecords={voteRecords}
                    toggleValidity={toggleValidity}
                    handleDeleteRecord={handleDeleteRecord}
                    fetchVoteDetails={fetchVoteDetails}
                />
            </div>

            <ToastBanner
                toast={toast}
                positionClassName="fixed left-1/2 top-4 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-6 sm:top-6 sm:w-auto sm:min-w-[360px] sm:max-w-[460px] sm:translate-x-0"
            />
        </div>
    );
}
