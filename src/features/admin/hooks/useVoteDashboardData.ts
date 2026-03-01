'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ForceVoteSetter = (value: {
    targetStudentId: string;
    targetVoteId: string;
    targetOptionId: string;
}) => void;

export default function useVoteDashboardData(isAuthenticated: boolean) {
    const [dashboardFilter, setDashboardFilter] = useState('ALL');
    const [votes, setVotes] = useState<any[]>([]);
    const [selectedVote, setSelectedVote] = useState<any>(null);
    const [voteRecords, setVoteRecords] = useState<any[]>([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsVote, setDetailsVote] = useState<any>(null);

    const [counts, setCounts] = useState({ upcoming: 0, active: 0, ended: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [voteStats, setVoteStats] = useState<Record<string, any>>({});

    const fetchVotes = useCallback(async () => {
        const { data: votesData, error: voteError } = await supabase
            .from('votes')
            .select('*, vote_options(*)')
            .order('created_at', { ascending: false });

        if (voteError) {
            console.error('Error fetching votes:', voteError);
            return;
        }

        if (!votesData) {
            return;
        }

        setVotes(votesData);

        const { data: records, error: recordError } = await supabase
            .from('vote_records')
            .select('vote_id, option_id')
            .eq('is_valid', true);

        if (recordError) {
            console.error('Error fetching records:', recordError);
            return;
        }

        if (!records) {
            return;
        }

        const stats = {};
        records.forEach(record => {
            if (!stats[record.vote_id]) {
                stats[record.vote_id] = { total: 0 };
            }

            if (!stats[record.vote_id][record.option_id]) {
                stats[record.vote_id][record.option_id] = 0;
            }

            stats[record.vote_id][record.option_id]++;
            stats[record.vote_id].total++;
        });

        setVoteStats(stats);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        fetchVotes();

        const poller = setInterval(() => {
            if (localStorage.getItem('swc_admin_session') === 'true') {
                fetchVotes();
            }
        }, 5000);

        return () => {
            clearInterval(poller);
        };
    }, [fetchVotes, isAuthenticated]);

    useEffect(() => {
        if (votes.length === 0) {
            setCounts({ upcoming: 0, active: 0, ended: 0 });
            return;
        }

        const now = new Date();
        let upcomingCount = 0;
        let activeCount = 0;
        let endedCount = 0;

        votes.forEach(vote => {
            const start = new Date(vote.start_at);
            const end = new Date(vote.end_at);

            if (now < start) {
                upcomingCount++;
            } else if (now <= end) {
                activeCount++;
            } else {
                endedCount++;
            }
        });

        setCounts({ upcoming: upcomingCount, active: activeCount, ended: endedCount });
    }, [votes, currentTime]);

    const getStatus = useCallback((vote: any): 'UPCOMING' | 'ACTIVE' | 'ENDED' => {
        const now = new Date();
        const start = new Date(vote.start_at);
        const end = new Date(vote.end_at);

        if (now < start) {
            return 'UPCOMING';
        }

        if (now <= end) {
            return 'ACTIVE';
        }

        return 'ENDED';
    }, []);

    const getRemainingTime = useCallback((endDate: string | Date) => {
        const total = new Date(endDate).getTime() - Date.now();
        if (total <= 0) {
            return null;
        }

        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return `${days}일 ${hours}시간 남음`;
        }

        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 남음`;
    }, []);

    const fetchVoteDetails = useCallback(async (vote: any, setForceVoteData?: ForceVoteSetter) => {
        setDetailsVote(vote);

        if (setForceVoteData) {
            setForceVoteData({ targetVoteId: vote.id, targetStudentId: '', targetOptionId: '' });
        }

        const { data } = await supabase
            .from('vote_records')
            .select('*')
            .eq('vote_id', vote.id)
            .order('created_at', { ascending: false });

        if (data) {
            const studentIds = Array.from(new Set(
                data
                    .map(record => String(record.student_id || ''))
                    .filter(Boolean)
            ));

            let nameById: Record<string, string> = {};
            if (studentIds.length > 0) {
                const { data: studentRows } = await supabase
                    .from('students')
                    .select('student_id, name')
                    .in('student_id', studentIds);

                if (studentRows) {
                    nameById = studentRows.reduce((acc: Record<string, string>, row: any) => {
                        acc[String(row.student_id)] = String(row.name || '');
                        return acc;
                    }, {});
                }
            }

            setVoteRecords(data.map(record => ({
                ...record,
                student_name: nameById[String(record.student_id)] || ''
            })));
        }

        setShowDetailsModal(true);
    }, []);

    const toggleValidity = useCallback(async (
        recordId: string,
        currentStatus: boolean,
        patchStudentHistoryValidity?: (recordId: string, nextStatus: boolean) => void
    ) => {
        const { error } = await supabase
            .from('vote_records')
            .update({ is_valid: !currentStatus })
            .eq('id', recordId);

        if (error) {
            return;
        }

        const nextStatus = !currentStatus;

        setVoteRecords(prev => prev.map(record => (
            record.id === recordId
                ? { ...record, is_valid: nextStatus }
                : record
        )));

        if (patchStudentHistoryValidity) {
            patchStudentHistoryValidity(recordId, nextStatus);
        }

        fetchVotes();
    }, [fetchVotes]);

    const handlePin = useCallback(async (voteId: string) => {
        await supabase
            .from('votes')
            .update({ is_pinned: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (voteId !== 'NONE') {
            await supabase
                .from('votes')
                .update({ is_pinned: true })
                .eq('id', voteId);
        }

        fetchVotes();
    }, [fetchVotes]);

    return {
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
    };
}
