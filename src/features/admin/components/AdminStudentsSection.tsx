import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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

type ImportTargetRole = '재학생' | '신입생';

type ImportSummary = {
    role: ImportTargetRole;
    fileName: string;
    totalRows: number;
    added: StudentCreatePayload[];
    skippedDuplicates: number;
    skippedInvalid: number;
    failed: number;
};

type AdminStudentsSectionProps = {
    students: any[];
    fetchStudents: () => void;
    studentSearch: string;
    setStudentSearch: (value: string) => void;
    studentGenderFilter: string;
    setStudentGenderFilter: (value: string) => void;
    studentRoleFilter: string;
    setStudentRoleFilter: (value: string) => void;
    studentDepartmentFilter: string;
    setStudentDepartmentFilter: (value: string) => void;
    handleAddStudent: (payload: StudentCreatePayload) => Promise<boolean>;
    handleImportStudents: (rows: StudentCreatePayload[]) => Promise<StudentImportResult>;
    handleBulkDeleteStudents: (studentIds: string[]) => Promise<StudentBulkDeleteResult>;
    handleStudentDetails: (student: any) => void;
};

const PAGE_SIZE = 50;

const normalizeHeaderKey = (value: unknown) => (
    String(value ?? '')
        .replace(/[^0-9a-zA-Z가-힣]/g, '')
        .toLowerCase()
);

const isOneOfNormalized = (value: string, candidates: string[]) => {
    const normalized = normalizeHeaderKey(value);
    return candidates.map(normalizeHeaderKey).includes(normalized);
};

const getRowValue = (row: Record<string, unknown>, aliases: string[]) => {
    const aliasSet = new Set(aliases.map(normalizeHeaderKey));
    for (const [key, value] of Object.entries(row)) {
        if (aliasSet.has(normalizeHeaderKey(key))) {
            return String(value ?? '').trim();
        }
    }

    return '';
};

const normalizeGenderValue = (value: string): StudentGender | null => {
    const text = value.trim().toLowerCase();
    if (!text) {
        return null;
    }

    if (text === '남' || text === '남자' || text === '남성' || text === 'male' || text === 'm') {
        return '남';
    }

    if (text === '여' || text === '여자' || text === '여성' || text === 'female' || text === 'f') {
        return '여';
    }

    return null;
};

const normalizeDepartmentValue = (value: string): StudentDepartment | null => {
    const text = value.trim();
    const normalized = text.toLowerCase();
    if (!text) {
        return null;
    }

    if (STUDENT_DEPARTMENT_OPTIONS.includes(text as StudentDepartment)) {
        return text as StudentDepartment;
    }

    if (normalized === 'cs' || text.includes('컴공') || text.includes('컴퓨터')) {
        return '컴퓨터공학과';
    }
    if (normalized === 'ai' || text.includes('인공지능')) {
        return '인공지능공학과';
    }
    if (normalized === 'dt' || text.includes('디자인')) {
        return '디자인테크놀로지학과';
    }
    if (normalized === 'ds' || text.includes('데이터')) {
        return '데이터사이언스학과';
    }
    if (normalized === 'sm' || normalized === 'me' || text.includes('모빌리티')) {
        return '스마트모빌리티공학과';
    }

    return null;
};

const normalizeImportedName = (value: string) => {
    return value
        .replace(/\s*[\(\[（]\s*(?:조장|부\s*조장|부조장)\s*[\)\]）]\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const parseStudentRowsFromFile = async (file: File, role: ImportTargetRole) => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
        return {
            rows: [] as StudentCreatePayload[],
            totalRows: 0,
            skippedInvalid: 0
        };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const drawAliases = role === '재학생'
        ? ['Column 19', 'Column19', '19', '추첨번호', '추첨 번호', 'draw number', 'drawnumber']
        : ['Column 17', 'Column17', '17', '추첨번호', '추첨 번호', 'draw number', 'drawnumber'];

    const convertRows = (rawRows: Record<string, unknown>[]) => {
        const rows: StudentCreatePayload[] = [];
        let skippedInvalid = 0;

        rawRows.forEach(rawRow => {
            const rawName = getRowValue(rawRow, ['이름', 'name']);
            const rawGender = getRowValue(rawRow, ['성별', 'gender']);
            const rawDepartment = getRowValue(rawRow, ['소속 학과', '소속학과', '학과', 'department']);
            const rawDrawNumberCell = getRowValue(rawRow, drawAliases);

            if (!rawName && !rawGender && !rawDepartment && !rawDrawNumberCell) {
                return;
            }

            const headerLike = isOneOfNormalized(rawName, ['이름', 'name'])
                && isOneOfNormalized(rawGender, ['성별', 'gender'])
                && isOneOfNormalized(rawDepartment, ['소속 학과', '소속학과', '학과', 'department'])
                && isOneOfNormalized(rawDrawNumberCell, drawAliases);

            if (headerLike) {
                return;
            }

            const name = normalizeImportedName(rawName);
            const gender = normalizeGenderValue(rawGender);
            const department = normalizeDepartmentValue(rawDepartment);
            const drawNumberRaw = rawDrawNumberCell.replace(/\D/g, '').slice(0, 3);

            if (!name || !gender || !department || !drawNumberRaw) {
                skippedInvalid += 1;
                return;
            }

            rows.push({
                name,
                gender,
                department,
                studentRole: role,
                drawNumber: drawNumberRaw
            });
        });

        return {
            rows,
            totalRows: rawRows.length,
            skippedInvalid
        };
    };

    const parsedDefaultHeader = convertRows(
        XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: ''
        })
    );

    if (parsedDefaultHeader.rows.length > 0 || parsedDefaultHeader.skippedInvalid > 0) {
        return parsedDefaultHeader;
    }

    return convertRows(
        XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: '',
            range: 1
        })
    );
};

export default function AdminStudentsSection({
    students,
    fetchStudents,
    studentSearch,
    setStudentSearch,
    studentGenderFilter,
    setStudentGenderFilter,
    studentRoleFilter,
    setStudentRoleFilter,
    studentDepartmentFilter,
    setStudentDepartmentFilter,
    handleAddStudent,
    handleImportStudents,
    handleBulkDeleteStudents,
    handleStudentDetails
}: AdminStudentsSectionProps) {
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [importingRole, setImportingRole] = useState<ImportTargetRole | null>(null);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    const [creating, setCreating] = useState(false);
    const [deletingBulk, setDeletingBulk] = useState(false);
    const enrolledFileInputRef = useRef<HTMLInputElement | null>(null);
    const freshmanFileInputRef = useRef<HTMLInputElement | null>(null);
    const [createForm, setCreateForm] = useState({
        name: '',
        gender: STUDENT_GENDER_OPTIONS[0] as StudentGender,
        department: STUDENT_DEPARTMENT_OPTIONS[0] as StudentDepartment,
        studentRole: STUDENT_ROLE_OPTIONS[0] as StudentRole,
        studentId: '',
        drawNumber: ''
    });
    const [bulkDeleteGenderFilter, setBulkDeleteGenderFilter] = useState('ALL');
    const [bulkDeleteRoleFilter, setBulkDeleteRoleFilter] = useState('ALL');
    const [bulkDeleteDepartmentFilter, setBulkDeleteDepartmentFilter] = useState('ALL');

    const filteredStudentsByCategory = useMemo(() => {
        return students
            .filter(student => {
                if (studentRoleFilter !== 'ALL' && String(student.student_role || '') !== studentRoleFilter) {
                    return false;
                }

                if (studentDepartmentFilter !== 'ALL' && String(student.department || '') !== studentDepartmentFilter) {
                    return false;
                }

                if (studentGenderFilter !== 'ALL' && String(student.gender || '') !== studentGenderFilter) {
                    return false;
                }

                return true;
            });
    }, [studentDepartmentFilter, studentGenderFilter, studentRoleFilter, students]);

    const filteredStudents = useMemo(() => {
        const keyword = studentSearch.trim().toLowerCase();

        return filteredStudentsByCategory
            .filter(student => {
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
    }, [filteredStudentsByCategory, studentSearch]);

    const bulkDeleteTargets = useMemo(() => {
        return students.filter(student => {
            if (bulkDeleteGenderFilter !== 'ALL' && String(student.gender || '') !== bulkDeleteGenderFilter) {
                return false;
            }

            if (bulkDeleteRoleFilter !== 'ALL' && String(student.student_role || '') !== bulkDeleteRoleFilter) {
                return false;
            }

            if (bulkDeleteDepartmentFilter !== 'ALL' && String(student.department || '') !== bulkDeleteDepartmentFilter) {
                return false;
            }

            return true;
        });
    }, [bulkDeleteDepartmentFilter, bulkDeleteGenderFilter, bulkDeleteRoleFilter, students]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedStudents = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredStudents.slice(start, start + PAGE_SIZE);
    }, [filteredStudents, safePage]);

    useEffect(() => {
        setPage(1);
    }, [studentSearch, studentGenderFilter, studentRoleFilter, studentDepartmentFilter]);

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
            drawNumber: createForm.drawNumber.replace(/\D/g, '').slice(0, 3)
        });
        setCreating(false);

        if (ok) {
            closeCreateModal();
        }
    };

    const openFilePicker = (role: ImportTargetRole) => {
        if (importingRole) {
            return;
        }

        if (role === '재학생') {
            enrolledFileInputRef.current?.click();
            return;
        }

        freshmanFileInputRef.current?.click();
    };

    const handleImportFile = async (role: ImportTargetRole, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setImportingRole(role);
        try {
            const parsed = await parseStudentRowsFromFile(file, role);
            const imported = await handleImportStudents(parsed.rows);
            setImportSummary({
                role,
                fileName: file.name,
                totalRows: parsed.totalRows,
                added: imported.added,
                skippedDuplicates: imported.skippedDuplicates,
                skippedInvalid: parsed.skippedInvalid + imported.skippedInvalid,
                failed: imported.failed
            });
            setShowImportModal(false);
        } catch (error: any) {
            alert('엑셀 업로드 실패: ' + (error?.message || '파일을 읽는 중 오류가 발생했습니다.'));
        } finally {
            setImportingRole(null);
        }
    };

    const openBulkDeleteModal = () => {
        setBulkDeleteGenderFilter(studentGenderFilter);
        setBulkDeleteRoleFilter(studentRoleFilter);
        setBulkDeleteDepartmentFilter(studentDepartmentFilter);
        setShowBulkDeleteModal(true);
    };

    const handleDeleteFilteredStudents = async () => {
        if (deletingBulk) {
            return;
        }

        const targetStudentIds = bulkDeleteTargets
            .map(student => String(student.student_id || '').trim())
            .filter(Boolean);

        if (targetStudentIds.length === 0) {
            alert('선택한 필터 조건에 해당하는 학생이 없습니다.');
            return;
        }

        const filterSummary = [
            `성별: ${bulkDeleteGenderFilter === 'ALL' ? '전체' : bulkDeleteGenderFilter}`,
            `학과: ${bulkDeleteDepartmentFilter === 'ALL' ? '전체' : bulkDeleteDepartmentFilter}`,
            `역할: ${bulkDeleteRoleFilter === 'ALL' ? '전체' : bulkDeleteRoleFilter}`
        ].join(', ');

        const confirmed = confirm(
            `현재 필터 조건(${filterSummary})에 해당하는 학생 ${targetStudentIds.length}명을 전체 삭제하시겠습니까?\n학생 정보/투표 기록/추첨 기록이 모두 삭제됩니다.`
        );
        if (!confirmed) {
            return;
        }

        setDeletingBulk(true);
        const result = await handleBulkDeleteStudents(targetStudentIds);
        setDeletingBulk(false);

        if (result.deleted === 0) {
            alert('전체 삭제 실패: 삭제된 학생이 없습니다.');
            return;
        }

        if (result.failed > 0) {
            alert(`전체 삭제 완료: ${result.deleted}명 삭제, ${result.failed}명 실패`);
            setShowBulkDeleteModal(false);
            return;
        }

        alert(`전체 삭제 완료: ${result.deleted}명 삭제`);
        setShowBulkDeleteModal(false);
    };

    return (
        <div className="mx-auto max-w-7xl px-8 pb-10 pt-4">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">학생 관리</h2>
            </div>

            <section className="mb-4 rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-gray-600">필터링</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                        className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                        value={studentGenderFilter}
                        onChange={event => setStudentGenderFilter(event.target.value)}
                    >
                        <option value="ALL">성별 전체</option>
                        {STUDENT_GENDER_OPTIONS.map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                        ))}
                    </select>
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

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
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
                        <button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                        >
                            엑셀 업로드
                        </button>
                        <button
                            type="button"
                            onClick={openBulkDeleteModal}
                            disabled={deletingBulk}
                            className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            필터 전체 삭제
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
                                <th className="px-6 py-3">성별</th>
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
                                    <td className="px-6 py-4">
                                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                                            student.gender === '남'
                                                ? 'bg-blue-100 text-blue-700'
                                                : student.gender === '여'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {student.gender || '-'}
                                        </span>
                                    </td>
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
                                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-400">
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
                                        maxLength={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={createForm.drawNumber}
                                        onChange={event => setCreateForm(prev => ({ ...prev, drawNumber: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))}
                                        placeholder="최대 3자리"
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

            {showImportModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-gray-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                            <h3 className="text-xl font-bold text-gray-900">엑셀 업로드</h3>
                            <button
                                type="button"
                                onClick={() => setShowImportModal(false)}
                                disabled={Boolean(importingRole)}
                                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                닫기
                            </button>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm text-gray-600">
                                파일 형식: <span className="font-semibold">.xlsx, .xls, .csv</span>
                            </p>
                            <p className="text-xs text-gray-500">
                                공통 매핑: 이름, 성별, 소속 학과(또는 학과), 추첨번호 컬럼 사용. 학번은 비워둬도 정상 등록됩니다.
                            </p>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => openFilePicker('재학생')}
                                    disabled={Boolean(importingRole)}
                                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {importingRole === '재학생' ? '재학생 업로드 중...' : '재학생 파일 업로드'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openFilePicker('신입생')}
                                    disabled={Boolean(importingRole)}
                                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {importingRole === '신입생' ? '신입생 업로드 중...' : '신입생 파일 업로드'}
                                </button>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                                <p>재학생 파일: 추첨 번호 컬럼 `Column 19`</p>
                                <p>신입생 파일: 추첨 번호 컬럼 `Column 17`</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {importSummary && (
                <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-gray-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                            <h3 className="text-xl font-bold text-gray-900">업로드 결과</h3>
                            <button
                                type="button"
                                onClick={() => setImportSummary(null)}
                                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                            >
                                닫기
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            <div className="rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
                                <p><span className="font-semibold">대상:</span> {importSummary.role}</p>
                                <p><span className="font-semibold">파일:</span> {importSummary.fileName}</p>
                                <p><span className="font-semibold">총 행:</span> {importSummary.totalRows}</p>
                                <p><span className="font-semibold text-green-700">추가:</span> {importSummary.added.length}명</p>
                                <p><span className="font-semibold text-amber-700">중복 제외:</span> {importSummary.skippedDuplicates}건</p>
                                <p><span className="font-semibold text-orange-700">형식 오류 제외:</span> {importSummary.skippedInvalid}건</p>
                                <p><span className="font-semibold text-red-700">실패:</span> {importSummary.failed}건</p>
                            </div>

                            {importSummary.added.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                                    추가된 사람이 없습니다.
                                </div>
                            ) : (
                                <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-300">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-gray-300 bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2.5">이름</th>
                                                <th className="px-4 py-2.5">성별</th>
                                                <th className="px-4 py-2.5">학과</th>
                                                <th className="px-4 py-2.5">역할</th>
                                                <th className="px-4 py-2.5">추첨 번호</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importSummary.added.map((student, index) => (
                                                <tr key={`${student.name}-${student.drawNumber}-${index}`} className="border-b border-gray-200 last:border-0">
                                                    <td className="px-4 py-2.5 font-semibold text-gray-800">{student.name}</td>
                                                    <td className="px-4 py-2.5 text-gray-700">{student.gender}</td>
                                                    <td className="px-4 py-2.5 text-gray-700">{student.department}</td>
                                                    <td className="px-4 py-2.5 text-gray-700">{student.studentRole}</td>
                                                    <td className="px-4 py-2.5 font-mono font-bold text-gray-800">{student.drawNumber}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteModal && (
                <div className="fixed inset-0 z-[86] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-gray-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                            <h3 className="text-xl font-bold text-gray-900">필터 전체 삭제</h3>
                            <button
                                type="button"
                                onClick={() => setShowBulkDeleteModal(false)}
                                disabled={deletingBulk}
                                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                닫기
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm text-gray-600">삭제할 대상 필터를 선택하세요.</p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-bold text-gray-600">성별</span>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                                        value={bulkDeleteGenderFilter}
                                        onChange={event => setBulkDeleteGenderFilter(event.target.value)}
                                    >
                                        <option value="ALL">성별 전체</option>
                                        {STUDENT_GENDER_OPTIONS.map(gender => (
                                            <option key={gender} value={gender}>{gender}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-bold text-gray-600">학과</span>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                                        value={bulkDeleteDepartmentFilter}
                                        onChange={event => setBulkDeleteDepartmentFilter(event.target.value)}
                                    >
                                        <option value="ALL">학과 전체</option>
                                        {STUDENT_DEPARTMENT_OPTIONS.map(department => (
                                            <option key={department} value={department}>{department}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-bold text-gray-600">역할</span>
                                    <select
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
                                        value={bulkDeleteRoleFilter}
                                        onChange={event => setBulkDeleteRoleFilter(event.target.value)}
                                    >
                                        <option value="ALL">역할 전체</option>
                                        {STUDENT_ROLE_OPTIONS.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-bold text-red-700">
                                    현재 삭제 대상: {bulkDeleteTargets.length}명
                                </p>
                                <p className="mt-1 text-xs text-red-600">
                                    학생 정보, 투표 기록, 추첨 기록이 모두 삭제되며 복구할 수 없습니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-gray-300 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowBulkDeleteModal(false)}
                                disabled={deletingBulk}
                                className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteFilteredStudents}
                                disabled={deletingBulk || bulkDeleteTargets.length === 0}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {deletingBulk ? '삭제 중...' : '삭제 실행'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={enrolledFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,text/csv"
                className="hidden"
                onChange={event => handleImportFile('재학생', event)}
            />
            <input
                ref={freshmanFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,text/csv"
                className="hidden"
                onChange={event => handleImportFile('신입생', event)}
            />
        </div>
    );
}
