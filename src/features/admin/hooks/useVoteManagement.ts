'use client';

import useVoteDashboardData from './useVoteDashboardData';
import useVoteEditorForm from './useVoteEditorForm';

export default function useVoteManagement(isAuthenticated: boolean) {
    const {
        dashboardFilter,
        setDashboardFilter,
        votes,
        selectedVote,
        setSelectedVote,
        voteRecords,
        showDetailsModal,
        setShowDetailsModal,
        detailsVote,
        counts,
        voteStats,
        fetchVotes,
        fetchVoteDetails,
        toggleValidity,
        handlePin,
        getStatus,
        getRemainingTime
    } = useVoteDashboardData(isAuthenticated);

    const {
        formData,
        setFormData,
        startCreate,
        startEdit,
        handleSave,
        handleDelete,
        handleEarlyEnd,
        removeOption
    } = useVoteEditorForm({
        selectedVote,
        setSelectedVote,
        fetchVotes,
        getStatus
    });

    return {
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
        fetchVoteDetails,
        toggleValidity,
        handlePin,
        getStatus,
        getRemainingTime,
        startCreate,
        startEdit,
        handleSave,
        handleDelete,
        handleEarlyEnd,
        removeOption
    };
}
