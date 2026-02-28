'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ToastState } from '@/features/vote/common/types';
import { supabase } from '@/lib/supabase';
import {
    fetchStudentStatus,
    fetchStudentVotes,
    fetchVoteSnapshot,
    upsertVoteRecord
} from '@/features/vote/user/api';
import { getRemainingTime, getVisibleVotesByFilter, getVoteStatus } from '@/features/vote/user/utils';

const buildVoteCounts = (records: any[]) => {
    const counts = {};

    records.forEach(record => {
        if (!counts[record.vote_id]) {
            counts[record.vote_id] = { total: 0 };
        }

        if (!counts[record.vote_id][record.option_id]) {
            counts[record.vote_id][record.option_id] = 0;
        }

        counts[record.vote_id][record.option_id]++;
        counts[record.vote_id].total++;
    });

    return counts;
};

export default function useVotePageController() {
    const [studentId, setStudentId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [votes, setVotes] = useState<any[]>([]);
    const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
    const [voteCounts, setVoteCounts] = useState<Record<string, any>>({});
    const [totalStudents, setTotalStudents] = useState(0);

    const [filter, setFilter] = useState('ALL');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [toast, setToast] = useState<ToastState>(null);
    const [isLoginButtonPressed, setIsLoginButtonPressed] = useState(false);

    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, kind: 'error' | 'info' = 'error') => {
        setToast({ message, kind });

        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 5000);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('swc_vote_student_id');
        setStudentId('');
        setIsLoggedIn(false);
        setUserVotes(new Set<string>());
        setSelectedOptions({});
    }, []);

    const fetchVotesData = useCallback(async (currentId?: string | null) => {
        try {
            const { votesData, totalStudents: studentsCount, records } = await fetchVoteSnapshot();

            if (votesData) {
                setVotes(votesData);
            }

            setTotalStudents(studentsCount);

            if (records) {
                setVoteCounts(buildVoteCounts(records));
            }

            const idToCheck = currentId || localStorage.getItem('swc_vote_student_id');
            if (!idToCheck) {
                return;
            }

            const { data: studentData } = await fetchStudentStatus(idToCheck);
            if (!studentData) {
                showToast('등록되지 않은 학번입니다. 자동 로그아웃됩니다.');
                handleLogout();
                return;
            }

            if (studentData.is_suspended) {
                showToast('정지된 학번입니다. 새터준비위원회에게 문의해주세요.');
                handleLogout();
                return;
            }

            const { data: myVotes } = await fetchStudentVotes(idToCheck);
            if (!myVotes) {
                return;
            }

            setUserVotes(new Set(myVotes.map(vote => vote.vote_id)));

            const votedOptionMap: Record<string, string> = {};
            myVotes.forEach(vote => {
                if (vote.option_id) {
                    votedOptionMap[vote.vote_id] = vote.option_id;
                }
            });

            setSelectedOptions(prev => ({ ...prev, ...votedOptionMap }));
        } finally {
            setLoading(false);
        }
    }, [handleLogout, showToast]);

    const scheduleVotesRefresh = useCallback((delay = 250) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        refreshTimerRef.current = setTimeout(() => {
            refreshTimerRef.current = null;
            fetchVotesData(localStorage.getItem('swc_vote_student_id'));
        }, delay);
    }, [fetchVotesData]);

    useEffect(() => {
        const storedId = localStorage.getItem('swc_vote_student_id');

        if (storedId) {
            setStudentId(storedId);
            setIsLoggedIn(true);
        }

        fetchVotesData(storedId);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const fallbackSync = setInterval(() => {
            scheduleVotesRefresh(0);
        }, 5000);

        const channel = supabase
            .channel('vote-page-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => scheduleVotesRefresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vote_options' }, () => scheduleVotesRefresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vote_records' }, () => scheduleVotesRefresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => scheduleVotesRefresh())
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    scheduleVotesRefresh(0);
                }
            });

        return () => {
            clearInterval(timer);
            clearInterval(fallbackSync);
            supabase.removeChannel(channel);

            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }

            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, [fetchVotesData, scheduleVotesRefresh]);

    const filteredVotes = useMemo(() => {
        return getVisibleVotesByFilter(votes, filter, currentTime);
    }, [votes, filter, currentTime]);

    const handleLogin = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const sanitizedStudentId = studentId.replace(/\D/g, '').slice(0, 8);
        setStudentId(sanitizedStudentId);

        if (!sanitizedStudentId) {
            showToast('학번을 입력해주세요.');
            return;
        }

        const { data: student, error } = await fetchStudentStatus(sanitizedStudentId);

        if (error) {
            showToast('로그인 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        if (!student) {
            showToast('등록되지 않은 학번입니다. 새터준비위원회에게 문의해주세요.');
            return;
        }

        if (student.is_suspended) {
            showToast('정지된 학번입니다. 새터준비위원회에게 문의해주세요.');
            return;
        }

        localStorage.setItem('swc_vote_student_id', sanitizedStudentId);
        setIsLoggedIn(true);
        fetchVotesData(sanitizedStudentId);
    }, [fetchVotesData, showToast, studentId]);

    const setSelectedOptionForVote = useCallback((voteId: string, optionId: string) => {
        setSelectedOptions(prev => ({ ...prev, [voteId]: optionId }));
    }, []);

    const handleVote = useCallback(async (vote: any) => {
        const voteId = vote.id;
        const selectedOption = selectedOptions[voteId];
        const canChangeVoteWhileActive = getVoteStatus(vote) === 'ACTIVE' && (vote.allow_vote_change_while_active ?? false);
        const alreadyVoted = userVotes.has(voteId);

        if (!selectedOption) {
            alert('투표 항목을 선택해주세요.');
            return;
        }

        if (alreadyVoted && !canChangeVoteWhileActive) {
            alert('이미 참여한 투표입니다.');
            return;
        }

        const { error, mode } = await upsertVoteRecord({
            voteId,
            studentId,
            optionId: selectedOption,
            allowUpdate: alreadyVoted && canChangeVoteWhileActive
        });

        if (mode === 'fetch_error') {
            alert('기존 투표 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        if (error) {
            alert(error.message.includes('unique') ? '이미 참여하셨습니다.' : '투표 실패: ' + error.message);
            return;
        }

        setUserVotes(prev => {
            const next = new Set(prev);
            next.add(voteId);
            return next;
        });

        alert(alreadyVoted && canChangeVoteWhileActive ? '투표가 수정되었습니다!' : '투표완료!');
        await fetchVotesData(studentId || localStorage.getItem('swc_vote_student_id'));
        scheduleVotesRefresh(0);
    }, [fetchVotesData, scheduleVotesRefresh, selectedOptions, studentId, userVotes]);

    return {
        studentId,
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
        getVoteStatus,
        getRemainingTime
    };
}
