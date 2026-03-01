import { useEffect, useMemo, useState } from 'react';
import {
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_GENDER_OPTIONS,
    STUDENT_ROLE_OPTIONS,
    StudentDepartment,
    StudentGender,
    StudentRole
} from '@/features/admin/student/constants';

type StudentCreatePayload = {
    name: string;
    gender: StudentGender;
    department: StudentDepartment;
    studentRole: StudentRole;
    studentId?: string;
    drawNumber?: string;
};

type AdminStudentsSectionProps = {
    students: any[];
    fetchStudents: () => void;
    studentSearch: string;
    setStudentSearch: (value: string) => void;
    studentRoleFilter: string;
    setStudentRoleFilter: (value: string) => void;
    studentDepartmentFilter: string;
    setStudentDepartmentFilter: (value: string) => void;
    handleAddStudent: (payload: StudentCreatePayload) => Promise<boolean>;
    handleStudentDetails: (student: any) => void;
};

const PAGE_SIZE = 50;

export default function AdminStudentsSection({
    students,
    fetchStudents,
    studentSearch,
    setStudentSearch,
    studentRoleFilter,
    setStudentRoleFilter,
    studentDepartmentFilter,
    setStudentDepartmentFilter,
    handleAddStudent,
    handleStudentDetails
}: AdminStudentsSectionProps) {
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        gender: STUDENT_GENDER_OPTIONS[0] as StudentGender,
        department: STUDENT_DEPARTMENT_OPTIONS[0] as StudentDepartment,
        studentRole: STUDENT_ROLE_OPTIONS[0] as StudentRole,
        studentId: '',
        drawNumber: ''
    });

    const filteredStudents = useMemo(() => {
        const keyword = studentSearch.trim().toLowerCase();

        return students
            .filter(student => {
                if (studentRoleFilter !== 'ALL' && String(student.student_role || '') !== studentRoleFilter) {
                    return false;
                }

                if (studentDepartmentFilter !== 'ALL' && String(student.department || '') !== studentDepartmentFilter) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                const byStudentId = String(student.student_id || '').toLowerCase().includes(keyword);
                const byDrawNumber = String(student.draw_number || '').toLowerCase().includes(keyword);
                const byName = String(student.name || '').toLowerCase().includes(keyword);

                return byStudentId || byDrawNumber || byName;
            })
            .sort((a, b) => {
                const drawA = Number.parseInt(String(a.draw_number || ''), 10);
                const drawB = Number.parseInt(String(b.draw_number || ''), 10);
                const hasA = Number.isFinite(drawA);
                const hasB = Number.isFinite(drawB);

                if (hasA && hasB && drawA !== drawB) {
                    return drawA - drawB;
                }

                if (hasA && !hasB) {
                    return -1;
                }

                if (!hasA && hasB) {
                    return 1;
                }

                return String(a.student_id || '').localeCompare(String(b.student_id || ''));
            });
    }, [studentDepartmentFilter, studentRoleFilter, studentSearch, students]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedStudents = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredStudents.slice(start, start + PAGE_SIZE);
    }, [filteredStudents, safePage]);

    useEffect(() => {
        setPage(1);
    }, [studentSearch, studentRoleFilter, studentDepartmentFilter]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateForm({
            name: '',
            gender: STUDENT_GENDER_OPTIONS[0],
            department: STUDENT_DEPARTMENT_OPTIONS[0],
            studentRole: STUDENT_ROLE_OPTIONS[0],
            studentId: '',
            drawNumber: ''
        });
    };

    const submitCreate = async () => {
        if (creating) {
            return;
        }

        setCreating(true);
        const ok = await handleAddStudent({
            name: createForm.name,
            gender: createForm.gender,
            department: createForm.department,
            studentRole: createForm.studentRole,
            studentId: createForm.studentId.replace(/\D/g, '').slice(0, 8),
            drawNumber: createForm.drawNumber.replace(/\D/g, '').slice(0, 4)
        });
        setCreating(false);

        if (ok) {
            closeCreateModal();
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-8 pb-10 pt-4">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">학생 관리</h2>
            </div>

            <section className="mb-4 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-gray-600">필터링</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <select
                        className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                        value={studentRoleFilter}
                        onChange={event => setStudentRoleFilter(event.target.value)}
                    >
                        <option value="ALL">역할 전체</option>
                        {STUDENT_ROLE_OPTIONS.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <select
                        className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                        value={studentDepartmentFilter}
                        onChange={event => setStudentDepartmentFilter(event.target.value)}
                    >
                        <option value="ALL">학과 전체</option>
                        {STUDENT_DEPARTMENT_OPTIONS.map(department => (
                            <option key={department} value={department}>{department}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-bold text-gray-600">검색</p>
                    <input
                        type="text"
                        placeholder="이름, 학번 또는 추첨 번호 검색"
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                    />
                </div>
                <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-bold text-gray-600">작업</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={fetchStudents}
                            className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                        >
                            새로고침
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                        >
                            학생 추가
                        </button>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 px-5 py-4">
                    <div>
                        <h3 className="font-bold text-gray-800">
                            등록된 학생 목록 <span className="ml-1 text-blue-600">({filteredStudents.length}명)</span>
                        </h3>
                        <p className="mt-1 text-xs font-medium text-gray-500">정렬 기준: 추첨 번호 오름차순</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-300 bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3">이름</th>
                                <th className="px-6 py-3">학번</th>
                                <th className="px-6 py-3">역할</th>
                                <th className="px-6 py-3">학과</th>
                                <th className="px-6 py-3">번호</th>
                                <th className="px-6 py-3">상태</th>
                                <th className="px-6 py-3">등록일</th>
                                <th className="px-6 py-3 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedStudents.map(student => (
                                <tr key={student.student_id} className="border-b border-gray-300 last:border-0 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-gray-800">{student.name || '-'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{student.student_id}</td>
                                    <td className="px-6 py-4 text-gray-700">{student.student_role || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700">{student.department || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-700">{student.draw_number || '-'}</td>
                                    <td className="px-6 py-4">
                                        {student.is_suspended ? (
                                            <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600">정지됨</span>
                                        ) : (
                                            <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-600">정상</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(student.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleStudentDetails(student)}
                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                        >
                                            관리
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pagedStudents.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">
                                        조건에 맞는 학생이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-300 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500">
                            페이지 {safePage} / {totalPages} · 페이지당 {PAGE_SIZE}명
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={safePage <= 1}
                                className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                                이전
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safePage >= totalPages}
                                className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {showCreateModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-gray-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                            <h3 className="text-xl font-bold text-gray-900">신규 학생 등록</h3>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                            >
                                닫기
                            </button>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <label className="block">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">이름</span>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={createForm.name}
                                    onChange={event => setCreateForm(prev => ({ ...prev, name: event.target.value }))}
                                    placeholder="이름 입력"
                                />
                            </label>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">성별</span>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={createForm.gender}
                                        onChange={event => setCreateForm(prev => ({ ...prev, gender: event.target.value as StudentGender }))}
                                    >
                                        {STUDENT_GENDER_OPTIONS.map(gender => (
                                            <option key={gender} value={gender}>{gender}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">역할</span>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={createForm.studentRole}
                                        onChange={event => setCreateForm(prev => ({ ...prev, studentRole: event.target.value as StudentRole }))}
                                    >
                                        {STUDENT_ROLE_OPTIONS.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-sm font-semibold text-gray-700">학과</span>
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={createForm.department}
                                    onChange={event => setCreateForm(prev => ({ ...prev, department: event.target.value as StudentDepartment }))}
                                >
                                    {STUDENT_DEPARTMENT_OPTIONS.map(department => (
                                        <option key={department} value={department}>{department}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">학번 (선택)</span>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={createForm.studentId}
                                        onChange={event => setCreateForm(prev => ({ ...prev, studentId: event.target.value.replace(/[^0-9]/g, '').slice(0, 8) }))}
                                        placeholder="8자리 숫자"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">추첨 번호 (선택)</span>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={createForm.drawNumber}
                                        onChange={event => setCreateForm(prev => ({ ...prev, drawNumber: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                                        placeholder="최대 4자리"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">
                                학번을 비워두면 임시 번호(`TMP-...`)가 자동 생성되어 투표 로그인은 불가능합니다.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-gray-300 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={submitCreate}
                                disabled={creating}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {creating ? '등록 중...' : '등록하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
