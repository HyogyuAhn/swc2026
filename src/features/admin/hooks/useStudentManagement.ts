'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

type ForceVoteData = {
    targetStudentId: string;
    targetVoteId: string;
    targetOptionId: string;
};

type UseStudentManagementParams = {
    onVotesChanged: () => Promise<void> | void;
};

type ForceAddVoteContext = {
    showDetailsModal: boolean;
    detailsVote: any;
    refreshVoteDetails: (vote: any) => Promise<void> | void;
};

export default function useStudentManagement({ onVotesChanged }: UseStudentManagementParams) {
    const [students, setStudents] = useState<any[]>([]);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [studentNumberInput, setStudentNumberInput] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [showStudentModal, setShowStudentModal] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const [forceVoteData, setForceVoteData] = useState<ForceVoteData>({
        targetStudentId: '',
        targetVoteId: '',
        targetOptionId: ''
    });

    const fetchStudents = useCallback(async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setStudents(data);
        }

        if (error) {
            console.error(error);
        }
    }, []);

    const handleAddStudent = useCallback(async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();

        if (!/^\d{8}$/.test(studentIdInput)) {
            alert('학번은 8자리 숫자여야 합니다.');
            return;
        }

        const normalizedDrawNumber = studentNumberInput.trim().replace(/\D/g, '');
        if (!normalizedDrawNumber) {
            alert('추첨 번호를 함께 입력해주세요.');
            return;
        }

        if (!/^\d{1,4}$/.test(normalizedDrawNumber)) {
            alert('추첨 번호는 1~4자리 숫자여야 합니다.');
            return;
        }

        const { error } = await supabase
            .from('students')
            .insert({
                student_id: studentIdInput,
                draw_number: normalizedDrawNumber
            });

        if (error) {
            if (error.code === '23505') {
                if ((error.message || '').toLowerCase().includes('draw_number')) {
                    alert('이미 사용 중인 번호입니다.');
                } else {
                    alert('이미 등록된 학번입니다.');
                }
            } else {
                alert('등록 실패: ' + error.message);
            }
            return;
        }

        setStudentIdInput('');
        setStudentNumberInput('');
        fetchStudents();
    }, [fetchStudents, studentIdInput, studentNumberInput]);

    const handleUpdateStudentDrawNumber = useCallback(async (student: any, drawNumber: string) => {
        const normalizedDrawNumber = drawNumber.trim().replace(/\D/g, '');
        if (!normalizedDrawNumber) {
            alert('추첨 번호는 비워둘 수 없습니다.');
            return false;
        }

        if (!/^\d{1,4}$/.test(normalizedDrawNumber)) {
            alert('추첨 번호는 1~4자리 숫자여야 합니다.');
            return false;
        }

        const { error } = await supabase
            .from('students')
            .update({ draw_number: normalizedDrawNumber })
            .eq('student_id', student.student_id);

        if (error) {
            if (error.code === '23505') {
                alert('이미 사용 중인 번호입니다.');
            } else {
                alert('번호 저장 실패: ' + error.message);
            }
            return false;
        }

        await fetchStudents();
        return true;
    }, [fetchStudents]);

    const handleToggleSuspend = useCallback(async (student: any) => {
        const confirmMsg = student.is_suspended
            ? `${student.student_id} 학번의 정지를 해제하시겠습니까?`
            : `${student.student_id} 학번을 정지시키겠습니까?\n정지 시 해당 사용자는 로그아웃 처리됩니다.`;

        if (!confirm(confirmMsg)) {
            return;
        }

        const { error } = await supabase
            .from('students')
            .update({ is_suspended: !student.is_suspended })
            .eq('student_id', student.student_id);

        if (error) {
            alert('처리 실패: ' + error.message);
            return;
        }

        fetchStudents();
    }, [fetchStudents]);

    const handleDeleteStudent = useCallback((student: any) => {
        setDeleteTarget({ type: 'STUDENT', data: student });
        setShowDeleteModal(true);
    }, []);

    const executeDeleteStudent = useCallback(async (mode: 'ID_ONLY' | 'ALL') => {
        if (!deleteTarget?.data?.student_id) {
            return;
        }

        const studentId = deleteTarget.data.student_id;

        if (mode === 'ALL') {
            const { error: historyError } = await supabase
                .from('vote_records')
                .delete()
                .eq('student_id', studentId);

            if (historyError) {
                alert(historyError.message);
                return;
            }
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (error) {
            alert('삭제 실패: ' + error.message);
            return;
        }

        fetchStudents();
        setShowDeleteModal(false);
        setDeleteTarget(null);
    }, [deleteTarget, fetchStudents]);

    const handleResetStudentVotes = useCallback(async (student: any) => {
        if (!confirm(`${student.student_id} 의 모든 투표 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        const { error } = await supabase
            .from('vote_records')
            .delete()
            .eq('student_id', student.student_id);

        if (error) {
            alert('초기화 실패: ' + error.message);
            return;
        }

        alert('초기화되었습니다.');
        fetchStudents();
    }, [fetchStudents]);

    const handleStudentDetails = useCallback(async (student: any) => {
        setSelectedStudent(student);
        setForceVoteData({ targetStudentId: student.student_id, targetVoteId: '', targetOptionId: '' });

        const { data } = await supabase
            .from('vote_records')
            .select('*, votes(title, vote_options(id, name))')
            .eq('student_id', student.student_id)
            .order('created_at', { ascending: false });

        if (data) {
            setStudentHistory(data);
        }

        setShowStudentModal(true);
    }, []);

    const handleDeleteRecord = useCallback(async (recordId: string, refreshCallback?: (() => void) | null) => {
        if (!confirm('정말 이 투표 기록을 삭제하시겠습니까?')) {
            return;
        }

        const { error } = await supabase
            .from('vote_records')
            .delete()
            .eq('id', recordId);

        if (error) {
            alert('삭제 실패: ' + error.message);
            return;
        }

        if (refreshCallback) {
            refreshCallback();
        }

        await onVotesChanged();
    }, [onVotesChanged]);

    const handleForceAddVote = useCallback(async ({
        showDetailsModal,
        detailsVote,
        refreshVoteDetails
    }: ForceAddVoteContext) => {
        const { targetStudentId, targetVoteId, targetOptionId } = forceVoteData;

        if (!targetStudentId || !targetVoteId || !targetOptionId) {
            alert('모든 항목을 선택해주세요.');
            return;
        }

        const { data: student } = await supabase
            .from('students')
            .select('student_id')
            .eq('student_id', targetStudentId)
            .single();

        const { data: existingVote } = await supabase
            .from('vote_records')
            .select('id')
            .eq('vote_id', targetVoteId)
            .eq('student_id', targetStudentId)
            .maybeSingle();

        if (!student) {
            if (!confirm(`등록되지 않은 학번(${targetStudentId})입니다.\n강제로 투표를 진행하시겠습니까? (학번이 자동 등록되지 않습니다)`)) {
                return;
            }
        }

        if (existingVote) {
            alert('이미 해당 투표에 참여한 기록이 있습니다.');
            return;
        }

        const { error } = await supabase
            .from('vote_records')
            .insert({
                vote_id: targetVoteId,
                student_id: targetStudentId,
                option_id: targetOptionId,
                is_valid: true
            });

        if (error) {
            alert('추가 실패: ' + error.message);
            return;
        }

        alert('투표가 강제 추가되었습니다.');
        setForceVoteData(prev => ({ ...prev, targetOptionId: '', targetStudentId: '' }));

        if (showDetailsModal && detailsVote) {
            await refreshVoteDetails(detailsVote);
        }

        if (showStudentModal && selectedStudent) {
            await handleStudentDetails(selectedStudent);
        }

        await onVotesChanged();
    }, [forceVoteData, handleStudentDetails, onVotesChanged, selectedStudent, showStudentModal]);

    const patchStudentHistoryValidity = useCallback((recordId: string, nextStatus: boolean) => {
        setStudentHistory(prev => prev.map(record => (
            record.id === recordId
                ? { ...record, is_valid: nextStatus }
                : record
        )));
    }, []);

    return {
        students,
        studentIdInput,
        setStudentIdInput,
        studentNumberInput,
        setStudentNumberInput,
        studentSearch,
        setStudentSearch,
        selectedStudent,
        studentHistory,
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
        handleUpdateStudentDrawNumber,
        handleToggleSuspend,
        handleDeleteStudent,
        executeDeleteStudent,
        handleResetStudentVotes,
        handleDeleteRecord,
        handleForceAddVote,
        handleStudentDetails,
        patchStudentHistoryValidity
    };
}
