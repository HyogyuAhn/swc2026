'use client';

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_GENDER_OPTIONS,
    STUDENT_ROLE_OPTIONS,
    StudentDepartment,
    StudentGender,
    StudentRole
} from '@/features/admin/student/constants';

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

type StudentCreatePayload = {
    name: string;
    gender: StudentGender;
    department: StudentDepartment;
    studentRole: StudentRole;
    studentId?: string;
    drawNumber?: string;
};

type StudentUpdatePayload = {
    name: string;
    gender: StudentGender;
    department: StudentDepartment;
    studentRole: StudentRole;
    studentId: string;
    drawNumber?: string;
};

type StudentImportResult = {
    total: number;
    added: StudentCreatePayload[];
    skippedDuplicates: number;
    skippedInvalid: number;
    failed: number;
};

type StudentBulkDeleteResult = {
    deleted: number;
    failed: number;
};

const isGender = (value: string): value is StudentGender => (
    (STUDENT_GENDER_OPTIONS as readonly string[]).includes(value)
);

const isDepartment = (value: string): value is StudentDepartment => (
    (STUDENT_DEPARTMENT_OPTIONS as readonly string[]).includes(value)
);

const isRole = (value: string): value is StudentRole => (
    (STUDENT_ROLE_OPTIONS as readonly string[]).includes(value)
);

const createTemporaryStudentId = () => {
    const stamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TMP-${stamp}${random}`;
};

const normalizeDrawNumber = (value?: string) => {
    const digits = (value || '').trim().replace(/\D/g, '');
    if (!digits) {
        return '';
    }

    const withoutLeadingZeros = digits.replace(/^0+/, '');
    return withoutLeadingZeros || '0';
};

const buildStudentDuplicateKey = ({
    name,
    gender,
    department,
    drawNumber
}: {
    name: string;
    gender: StudentGender;
    department: StudentDepartment;
    drawNumber: string;
}) => {
    return `${name.trim().toLowerCase()}|${gender}|${department}|${drawNumber}`;
};

const chunkArray = <T,>(source: T[], chunkSize: number) => {
    const result: T[][] = [];
    for (let index = 0; index < source.length; index += chunkSize) {
        result.push(source.slice(index, index + chunkSize));
    }
    return result;
};

export default function useStudentManagement({ onVotesChanged }: UseStudentManagementParams) {
    const [students, setStudents] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentGenderFilter, setStudentGenderFilter] = useState('ALL');
    const [studentRoleFilter, setStudentRoleFilter] = useState('ALL');
    const [studentDepartmentFilter, setStudentDepartmentFilter] = useState('ALL');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [studentDrawWinners, setStudentDrawWinners] = useState<any[]>([]);
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

    const handleAddStudent = useCallback(async (payload: StudentCreatePayload) => {
        const normalizedName = payload.name.trim();
        if (!normalizedName) {
            alert('이름을 입력해주세요.');
            return false;
        }

        if (!isGender(payload.gender)) {
            alert('성별을 선택해주세요.');
            return false;
        }

        if (!isDepartment(payload.department)) {
            alert('학과를 선택해주세요.');
            return false;
        }

        if (!isRole(payload.studentRole)) {
            alert('역할을 선택해주세요.');
            return false;
        }

        const normalizedStudentId = (payload.studentId || '').trim();
        if (normalizedStudentId && !/^\d{8}$/.test(normalizedStudentId)) {
            alert('학번은 8자리 숫자여야 합니다.');
            return false;
        }

        const rawDrawNumber = (payload.drawNumber || '').trim().replace(/\D/g, '');
        if (rawDrawNumber && !/^\d{1,3}$/.test(rawDrawNumber)) {
            alert('추첨 번호는 1~3자리 숫자여야 합니다.');
            return false;
        }
        const normalizedDrawNumber = normalizeDrawNumber(rawDrawNumber);

        const studentIdToUse = normalizedStudentId || createTemporaryStudentId();

        const { error } = await supabase
            .from('students')
            .insert({
                student_id: studentIdToUse,
                name: normalizedName,
                gender: payload.gender,
                department: payload.department,
                student_role: payload.studentRole,
                draw_number: normalizedDrawNumber || null
            });

        if (error) {
            if (error.code === '23505') {
                const lowerMessage = (error.message || '').toLowerCase();
                if (lowerMessage.includes('draw_number')) {
                    alert('이미 사용 중인 추첨 번호입니다.');
                } else if (lowerMessage.includes('student_id')) {
                    alert('이미 등록된 학번/임시번호입니다.');
                } else {
                    alert('중복된 값이 있습니다.');
                }
            } else {
                alert('등록 실패: ' + error.message);
            }
            return false;
        }

        await fetchStudents();
        return true;
    }, [fetchStudents]);

    const handleImportStudents = useCallback(async (rows: StudentCreatePayload[]): Promise<StudentImportResult> => {
        const result: StudentImportResult = {
            total: Array.isArray(rows) ? rows.length : 0,
            added: [],
            skippedDuplicates: 0,
            skippedInvalid: 0,
            failed: 0
        };

        if (!Array.isArray(rows) || rows.length === 0) {
            return result;
        }

        const usedStudentIds = new Set<string>(
            students
                .map(student => String(student.student_id || ''))
                .filter(Boolean)
        );
        const existingDrawNumbers = new Set<string>();
        const existingCompositeKeys = new Set<string>();
        students.forEach(student => {
            const drawNumber = normalizeDrawNumber(String(student.draw_number || ''));
            if (!drawNumber) {
                return;
            }

            existingDrawNumbers.add(drawNumber);
            const gender = String(student.gender || '');
            const department = String(student.department || '');
            if (isGender(gender) && isDepartment(department)) {
                existingCompositeKeys.add(buildStudentDuplicateKey({
                    name: String(student.name || ''),
                    gender,
                    department,
                    drawNumber
                }));
            }
        });

        const batchDrawNumbers = new Set<string>();
        const batchCompositeKeys = new Set<string>();
        for (const row of rows) {
            const normalizedName = (row.name || '').trim();
            const genderValue = String(row.gender || '');
            const departmentValue = String(row.department || '');
            const roleValue = String(row.studentRole || '');
            const rawDrawNumber = String(row.drawNumber || '').trim().replace(/\D/g, '');
            const normalizedDrawNumber = normalizeDrawNumber(rawDrawNumber);

            if (
                !normalizedName
                || !isGender(genderValue)
                || !isDepartment(departmentValue)
                || !isRole(roleValue)
                || !rawDrawNumber
                || !/^\d{1,3}$/.test(rawDrawNumber)
                || !normalizedDrawNumber
            ) {
                result.skippedInvalid += 1;
                continue;
            }

            if (existingDrawNumbers.has(normalizedDrawNumber) || batchDrawNumbers.has(normalizedDrawNumber)) {
                result.skippedDuplicates += 1;
                continue;
            }

            const compositeKey = buildStudentDuplicateKey({
                name: normalizedName,
                gender: genderValue,
                department: departmentValue,
                drawNumber: normalizedDrawNumber
            });

            if (existingCompositeKeys.has(compositeKey) || batchCompositeKeys.has(compositeKey)) {
                result.skippedDuplicates += 1;
                continue;
            }

            let studentIdToUse = '';
            for (let tryCount = 0; tryCount < 20; tryCount += 1) {
                const generated = createTemporaryStudentId();
                if (!usedStudentIds.has(generated)) {
                    studentIdToUse = generated;
                    usedStudentIds.add(generated);
                    break;
                }
            }

            if (!studentIdToUse) {
                studentIdToUse = `TMP-${Date.now()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
                if (usedStudentIds.has(studentIdToUse)) {
                    result.failed += 1;
                    continue;
                }
                usedStudentIds.add(studentIdToUse);
            }

            const { error } = await supabase
                .from('students')
                .insert({
                    student_id: studentIdToUse,
                    name: normalizedName,
                    gender: genderValue,
                    department: departmentValue,
                    student_role: roleValue,
                    draw_number: normalizedDrawNumber
                });

            if (error) {
                if (error.code === '23505') {
                    result.skippedDuplicates += 1;
                } else {
                    result.failed += 1;
                }
                continue;
            }

            existingDrawNumbers.add(normalizedDrawNumber);
            batchDrawNumbers.add(normalizedDrawNumber);
            existingCompositeKeys.add(compositeKey);
            batchCompositeKeys.add(compositeKey);
            result.added.push({
                name: normalizedName,
                gender: genderValue,
                department: departmentValue,
                studentRole: roleValue,
                drawNumber: normalizedDrawNumber
            });
        }

        if (result.added.length > 0) {
            await fetchStudents();
        }

        return result;
    }, [fetchStudents, students]);

    const handleUpdateStudentDrawNumber = useCallback(async (student: any, drawNumber: string) => {
        const rawDrawNumber = drawNumber.trim().replace(/\D/g, '');
        if (rawDrawNumber && !/^\d{1,3}$/.test(rawDrawNumber)) {
            alert('추첨 번호는 1~3자리 숫자여야 합니다.');
            return false;
        }
        const normalizedDrawNumber = normalizeDrawNumber(rawDrawNumber);

        const { error } = await supabase
            .from('students')
            .update({ draw_number: normalizedDrawNumber || null })
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

        setSelectedStudent((prev: any) => {
            if (!prev || prev.student_id !== student.student_id) {
                return prev;
            }

            return {
                ...prev,
                is_suspended: !Boolean(prev.is_suspended)
            };
        });

        await fetchStudents();
    }, [fetchStudents]);

    const handleDeleteStudent = useCallback((student: any) => {
        setDeleteTarget({ type: 'STUDENT', data: student });
        setShowDeleteModal(true);
    }, []);

    const deleteStudentsByIds = useCallback(async (studentIds: string[]): Promise<StudentBulkDeleteResult> => {
        const uniqueStudentIds = Array.from(new Set(
            (studentIds || [])
                .map(id => String(id || '').trim())
                .filter(Boolean)
        ));

        if (uniqueStudentIds.length === 0) {
            return { deleted: 0, failed: 0 };
        }

        let deleted = 0;
        let failed = 0;
        const chunks = chunkArray(uniqueStudentIds, 200);

        for (const ids of chunks) {
            const { error: drawWinnerDeleteError } = await supabase
                .from('draw_winners')
                .delete()
                .in('student_id', ids);

            if (drawWinnerDeleteError && drawWinnerDeleteError.code !== '42P01') {
                failed += ids.length;
                continue;
            }

            const { error: historyError } = await supabase
                .from('vote_records')
                .delete()
                .in('student_id', ids);

            if (historyError) {
                failed += ids.length;
                continue;
            }

            const { error: drawEventDeleteError } = await supabase
                .from('draw_live_events')
                .delete()
                .in('winner_student_id', ids);

            if (drawEventDeleteError && drawEventDeleteError.code !== '42P01') {
                failed += ids.length;
                continue;
            }

            const { error: studentDeleteError } = await supabase
                .from('students')
                .delete()
                .in('student_id', ids);

            if (studentDeleteError) {
                failed += ids.length;
                continue;
            }

            deleted += ids.length;
        }

        return { deleted, failed };
    }, []);

    const handleBulkDeleteStudents = useCallback(async (studentIds: string[]): Promise<StudentBulkDeleteResult> => {
        const result = await deleteStudentsByIds(studentIds);

        if (result.deleted > 0) {
            await fetchStudents();
        }

        const deletedIdSet = new Set(
            (studentIds || [])
                .map(id => String(id || '').trim())
                .filter(Boolean)
        );
        if (selectedStudent?.student_id && deletedIdSet.has(String(selectedStudent.student_id))) {
            setShowStudentModal(false);
            setSelectedStudent(null);
            setStudentHistory([]);
            setStudentDrawWinners([]);
        }

        if (deleteTarget?.data?.student_id && deletedIdSet.has(String(deleteTarget.data.student_id))) {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }

        return result;
    }, [deleteStudentsByIds, deleteTarget?.data?.student_id, fetchStudents, selectedStudent?.student_id]);

    const executeDeleteStudent = useCallback(async () => {
        if (!deleteTarget?.data?.student_id) {
            return;
        }

        const studentId = deleteTarget.data.student_id;
        const result = await handleBulkDeleteStudents([studentId]);
        if (result.deleted === 0) {
            alert('삭제 실패: 관련 기록 또는 학생 정보를 삭제하지 못했습니다.');
            return;
        }
    }, [deleteTarget, handleBulkDeleteStudents]);

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
        const { data: latestStudent } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', student.student_id)
            .maybeSingle();

        const nextStudent = latestStudent || student;

        setSelectedStudent(nextStudent);
        setForceVoteData({ targetStudentId: nextStudent.student_id, targetVoteId: '', targetOptionId: '' });

        const [{ data: voteData }, { data: drawData }] = await Promise.all([
            supabase
                .from('vote_records')
                .select('*, votes(title, vote_options(id, name))')
                .eq('student_id', nextStudent.student_id)
                .order('created_at', { ascending: false }),
            supabase
                .from('draw_winners')
                .select('id, draw_item_id, student_id, selected_mode, is_forced, is_public, created_at, draw_items(name)')
                .eq('student_id', nextStudent.student_id)
                .order('created_at', { ascending: false })
        ]);

        if (voteData) {
            setStudentHistory(voteData);
        } else {
            setStudentHistory([]);
        }

        if (drawData) {
            setStudentDrawWinners(drawData);
        } else {
            setStudentDrawWinners([]);
        }

        setShowStudentModal(true);
    }, []);

    const handleUpdateStudentInfo = useCallback(async (student: any, payload: StudentUpdatePayload) => {
        const normalizedName = payload.name.trim();
        if (!normalizedName) {
            alert('이름을 입력해주세요.');
            return false;
        }

        if (!isGender(payload.gender)) {
            alert('성별을 선택해주세요.');
            return false;
        }

        if (!isDepartment(payload.department)) {
            alert('학과를 선택해주세요.');
            return false;
        }

        if (!isRole(payload.studentRole)) {
            alert('역할을 선택해주세요.');
            return false;
        }

        const rawDrawNumber = (payload.drawNumber || '').trim().replace(/\D/g, '');
        if (rawDrawNumber && !/^\d{1,3}$/.test(rawDrawNumber)) {
            alert('추첨 번호는 1~3자리 숫자여야 합니다.');
            return false;
        }
        const normalizedDrawNumber = normalizeDrawNumber(rawDrawNumber);
        const currentStudentId = String(student.student_id || '');
        const nextStudentId = (payload.studentId || '').trim();
        const currentDrawNumber = normalizeDrawNumber(String(student.draw_number || ''));
        if (!nextStudentId) {
            alert('학번을 입력해주세요.');
            return false;
        }

        if (nextStudentId !== currentStudentId && !/^\d{8}$/.test(nextStudentId)) {
            alert('학번 변경 시 8자리 숫자로 입력해주세요.');
            return false;
        }

        if (nextStudentId !== currentStudentId && normalizedDrawNumber) {
            const { data: drawNumberOwner, error: drawNumberOwnerError } = await supabase
                .from('students')
                .select('student_id')
                .eq('draw_number', normalizedDrawNumber)
                .neq('student_id', currentStudentId)
                .maybeSingle();

            if (drawNumberOwnerError) {
                alert('추첨 번호 중복 확인 실패: ' + drawNumberOwnerError.message);
                return false;
            }

            if (drawNumberOwner?.student_id) {
                alert('이미 사용 중인 추첨 번호입니다.');
                return false;
            }
        }

        if (nextStudentId === currentStudentId) {
            const { error } = await supabase
                .from('students')
                .update({
                    name: normalizedName,
                    gender: payload.gender,
                    department: payload.department,
                    student_role: payload.studentRole,
                    draw_number: normalizedDrawNumber || null
                })
                .eq('student_id', currentStudentId);

            if (error) {
                if (error.code === '23505') {
                    alert('이미 사용 중인 추첨 번호입니다.');
                } else {
                    alert('학생 정보 수정 실패: ' + error.message);
                }
                return false;
            }

            await fetchStudents();
            await handleStudentDetails({
                ...student,
                name: normalizedName,
                gender: payload.gender,
                department: payload.department,
                student_role: payload.studentRole,
                draw_number: normalizedDrawNumber || null
            });
            return true;
        }

        const shouldDeferDrawNumber = Boolean(normalizedDrawNumber) && normalizedDrawNumber === currentDrawNumber;

        const insertPayload: any = {
            student_id: nextStudentId,
            name: normalizedName,
            gender: payload.gender,
            department: payload.department,
            student_role: payload.studentRole,
            draw_number: shouldDeferDrawNumber ? null : (normalizedDrawNumber || null),
            is_suspended: Boolean(student.is_suspended)
        };

        if (student.created_at) {
            insertPayload.created_at = student.created_at;
        }

        const { error: insertError } = await supabase
            .from('students')
            .insert(insertPayload);

        if (insertError) {
            if (insertError.code === '23505') {
                const lowerMessage = (insertError.message || '').toLowerCase();
                if (lowerMessage.includes('student_id')) {
                    alert('이미 사용 중인 학번입니다.');
                } else if (lowerMessage.includes('draw_number')) {
                    alert('이미 사용 중인 추첨 번호입니다.');
                } else {
                    alert('중복된 값이 있습니다.');
                }
            } else {
                alert('학번 변경 준비 실패: ' + insertError.message);
            }
            return false;
        }

        const { error: drawWinnerMoveError } = await supabase
            .from('draw_winners')
            .update({ student_id: nextStudentId })
            .eq('student_id', currentStudentId);

        if (drawWinnerMoveError && drawWinnerMoveError.code !== '42P01') {
            await supabase.from('students').delete().eq('student_id', nextStudentId);
            alert('학번 변경 실패(추첨 기록 이동): ' + drawWinnerMoveError.message);
            return false;
        }

        const { error: deleteOldError } = await supabase
            .from('students')
            .delete()
            .eq('student_id', currentStudentId);

        if (deleteOldError) {
            alert('기존 학번 제거 실패: ' + deleteOldError.message);
            return false;
        }

        await supabase
            .from('vote_records')
            .update({ student_id: nextStudentId })
            .eq('student_id', currentStudentId);

        await supabase
            .from('draw_live_events')
            .update({ winner_student_id: nextStudentId })
            .eq('winner_student_id', currentStudentId);

        if (shouldDeferDrawNumber) {
            const { error: restoreDrawNumberError } = await supabase
                .from('students')
                .update({ draw_number: normalizedDrawNumber })
                .eq('student_id', nextStudentId);

            if (restoreDrawNumberError) {
                alert('학번 변경은 완료됐지만 추첨 번호 복원에 실패했습니다: ' + restoreDrawNumberError.message);
            }
        }

        await fetchStudents();
        await handleStudentDetails({
            ...student,
            student_id: nextStudentId,
            name: normalizedName,
            gender: payload.gender,
            department: payload.department,
            student_role: payload.studentRole,
            draw_number: normalizedDrawNumber || null
        });
        return true;
    }, [fetchStudents, handleStudentDetails]);

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
        handleUpdateStudentDrawNumber,
        handleToggleSuspend,
        handleDeleteStudent,
        handleBulkDeleteStudents,
        executeDeleteStudent,
        handleResetStudentVotes,
        handleDeleteRecord,
        handleForceAddVote,
        handleStudentDetails,
        handleUpdateStudentInfo,
        patchStudentHistoryValidity
    };
}
