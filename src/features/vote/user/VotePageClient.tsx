'use client';

import VoteLoginScreen from '@/features/vote/user/components/VoteLoginScreen';
import VoteDashboard from '@/features/vote/user/components/VoteDashboard';
import useVotePageController from '@/features/vote/user/hooks/useVotePageController';

export default function VotePageClient() {
    const {
        studentId,
        studentName,
        studentRole,
        setStudentId,
        isLoggedIn,
        filter,
        setFilter,
        filteredVotes,
        userVotes,
        selectedOptions,
        setSelectedOptionForVote,
        voteCounts,
        totalStudents,
        loading,
        toast,
        isLoginButtonPressed,
        setIsLoginButtonPressed,
        handleLogin,
        handleLogout,
        handleVote,
        handleCancelVote,
        getVoteEditCooldownRemaining,
        getVoteStatus,
        getRemainingTime
    } = useVotePageController();

    if (!isLoggedIn) {
        return (
            <VoteLoginScreen
                studentId={studentId}
                onStudentIdChange={setStudentId}
                onSubmit={handleLogin}
                isLoginButtonPressed={isLoginButtonPressed}
                setIsLoginButtonPressed={setIsLoginButtonPressed}
                toast={toast}
            />
        );
    }

    return (
        <VoteDashboard
            studentId={studentId}
            studentName={studentName}
            studentRole={studentRole}
            filter={filter}
            setFilter={setFilter}
            loading={loading}
            filteredVotes={filteredVotes}
            userVotes={userVotes}
            selectedOptions={selectedOptions}
            voteCounts={voteCounts}
            totalStudents={totalStudents}
            toast={toast}
            handleLogout={handleLogout}
            handleVote={handleVote}
            handleCancelVote={handleCancelVote}
            getVoteEditCooldownRemaining={getVoteEditCooldownRemaining}
            setSelectedOptionForVote={setSelectedOptionForVote}
            getVoteStatus={getVoteStatus}
            getRemainingTime={getRemainingTime}
        />
    );
}
