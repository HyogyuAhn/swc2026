import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_ROLE_OPTIONS
} from '@/features/admin/student/constants';

type AdminStudentsSectionProps = {
    students: any[];
    studentIdInput: string;
    setStudentIdInput: (value: string) => void;
    studentNumberInput: string;
    setStudentNumberInput: (value: string) => void;
    studentSearch: string;
    setStudentSearch: (value: string) => void;
    studentRoleFilter: string;
    setStudentRoleFilter: (value: string) => void;
    studentDepartmentFilter: string;
    setStudentDepartmentFilter: (value: string) => void;
    handleAddStudent: (e?: FormEvent<HTMLFormElement>) => void;
    handleUpdateStudentDrawNumber: (student: any, drawNumber: string) => Promise<boolean>;
    handleResetStudentVotes: (student: any) => void;
    handleStudentDetails: (student: any) => void;
    handleToggleSuspend: (student: any) => void;
    handleDeleteStudent: (student: any) => void;
};

export default function AdminStudentsSection({
    students,
    studentIdInput,
    setStudentIdInput,
    studentNumberInput,
    setStudentNumberInput,
    studentSearch,
    setStudentSearch,
    studentRoleFilter,
    setStudentRoleFilter,
    studentDepartmentFilter,
    setStudentDepartmentFilter,
    handleAddStudent,
    handleUpdateStudentDrawNumber,
    handleResetStudentVotes,
    handleStudentDetails,
    handleToggleSuspend,
    handleDeleteStudent
}: AdminStudentsSectionProps) {
    const PAGE_SIZE = 50;
    const [numberDraftByStudentId, setNumberDraftByStudentId] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);

    useEffect(() => {
        const next: Record<string, string> = {};
        students.forEach(student => {
            next[student.student_id] = String(student.draw_number || '');
        });
        setNumberDraftByStudentId(next);
    }, [students]);

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

    return (
        <div className="mx-auto max-w-5xl px-10 pb-10 pt-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">학생 관리</h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h3 className="font-bold text-lg mb-4 text-gray-700">신규 학생 등록</h3>
                <form onSubmit={handleAddStudent} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="학번 8자리 (예: 12240000)"
                        className="flex-1 p-3 border rounded-xl text-lg"
                        maxLength={8}
                        value={studentIdInput}
                        onChange={e => setStudentIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <input
                        type="text"
                        placeholder="추첨 번호 필수 (예: 1, 3)"
                        className="w-44 p-3 border rounded-xl text-lg"
                        maxLength={4}
                        required
                        value={studentNumberInput}
                        onChange={e => setStudentNumberInput(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm whitespace-nowrap">
                        등록하기
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">
                        등록된 학생 목록 <span className="text-blue-600 ml-1">({filteredStudents.length}명)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <select
                            className="rounded-lg border p-2 text-sm"
                            value={studentRoleFilter}
                            onChange={event => setStudentRoleFilter(event.target.value)}
                        >
                            <option value="ALL">역할 전체</option>
                            {STUDENT_ROLE_OPTIONS.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <select
                            className="rounded-lg border p-2 text-sm"
                            value={studentDepartmentFilter}
                            onChange={event => setStudentDepartmentFilter(event.target.value)}
                        >
                            <option value="ALL">학과 전체</option>
                            {STUDENT_DEPARTMENT_OPTIONS.map(department => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="학번/번호/이름 검색"
                            className="p-2 border rounded-lg text-sm w-64"
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 bg-gray-50 border-b">
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
                                <tr key={student.student_id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-gray-800">{student.name || '-'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{student.student_id}</td>
                                    <td className="px-6 py-4 text-gray-700">{student.student_role || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700">{student.department || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={numberDraftByStudentId[student.student_id] ?? String(student.draw_number || '')}
                                                maxLength={4}
                                                onChange={event => setNumberDraftByStudentId(prev => ({
                                                    ...prev,
                                                    [student.student_id]: event.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                                }))}
                                                className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700"
                                                placeholder="미지정"
                                            />
                                            <button
                                                onClick={async () => {
                                                    await handleUpdateStudentDrawNumber(
                                                        student,
                                                        numberDraftByStudentId[student.student_id] ?? ''
                                                    );
                                                }}
                                                className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                            >
                                                저장
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                            {student.is_suspended ? (
                                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">정지됨</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">정상</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                            <button
                                                onClick={() => handleResetStudentVotes(student)}
                                                className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded font-medium border border-transparent hover:border-gray-200"
                                                title="투표 기록 초기화"
                                            >
                                                초기화
                                            </button>
                                            <button
                                                onClick={() => handleStudentDetails(student)}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded font-medium border border-transparent hover:border-blue-100"
                                            >
                                                투표 상세
                                            </button>
                                            <button
                                                onClick={() => handleToggleSuspend(student)}
                                                className={`px-3 py-1.5 rounded font-medium border transition-colors
                                                            ${student.is_suspended
                                                        ? 'text-green-600 border-green-200 hover:bg-green-50'
                                                        : 'text-orange-500 border-orange-200 hover:bg-orange-50'}`}
                                            >
                                                {student.is_suspended ? '정지 해제' : '정지'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStudent(student)}
                                                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded font-medium border border-transparent hover:border-red-100"
                                            >
                                                삭제
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
                <div className="border-t bg-gray-50 px-4 py-3">
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
            </div>
        </div>
    );
}
