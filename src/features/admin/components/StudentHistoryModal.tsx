import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import {
    STUDENT_DEPARTMENT_OPTIONS,
    STUDENT_GENDER_OPTIONS,
    STUDENT_ROLE_OPTIONS,
    StudentDepartment,
    StudentGender,
    StudentRole
} from '@/features/admin/student/constants';

type StudentHistoryModalProps = {
    showStudentModal: boolean;
    selectedStudent: any;
    studentHistory: any[];
    studentDrawWinners: any[];
    setShowStudentModal: (show: boolean) => void;
    forceVoteData: { targetStudentId: string; targetVoteId: string; targetOptionId: string };
    setForceVoteData: (value: any) => void;
    votes: any[];
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
    handleForceAddVote: () => void;
    toggleValidity: (recordId: string, currentStatus: boolean) => void;
    handleDeleteRecord: (recordId: string, refreshCallback?: (() => void) | null) => void;
    handleStudentDetails: (student: any) => void | Promise<void>;
    handleUpdateStudentInfo: (student: any, payload: {
        name: string;
        gender: StudentGender;
        department: StudentDepartment;
        studentRole: StudentRole;
        studentId: string;
        drawNumber?: string;
    }) => Promise<boolean>;
    handleResetStudentVotes: (student: any) => void | Promise<void>;
    handleToggleSuspend: (student: any) => void | Promise<void>;
    handleDeleteStudent: (student: any) => void;
};

type StudentTab = 'INFO' | 'VOTE' | 'DRAW';

export default function StudentHistoryModal({
    showStudentModal,
    selectedStudent,
    studentHistory,
    studentDrawWinners,
    setShowStudentModal,
    forceVoteData,
    setForceVoteData,
    votes,
    getStatus,
    handleForceAddVote,
    toggleValidity,
    handleDeleteRecord,
    handleStudentDetails,
    handleUpdateStudentInfo,
    handleResetStudentVotes,
    handleToggleSuspend,
    handleDeleteStudent
}: StudentHistoryModalProps) {
    const [activeTab, setActiveTab] = useState<StudentTab>('INFO');
    const [savingInfo, setSavingInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({
        name: '',
        studentId: '',
        gender: STUDENT_GENDER_OPTIONS[0] as StudentGender,
        department: STUDENT_DEPARTMENT_OPTIONS[0] as StudentDepartment,
        studentRole: STUDENT_ROLE_OPTIONS[0] as StudentRole,
        drawNumber: ''
    });

    useEffect(() => {
        if (!showStudentModal || !selectedStudent) {
            return;
        }

        setActiveTab('INFO');
        setInfoForm({
            name: String(selectedStudent.name || ''),
            studentId: String(selectedStudent.student_id || ''),
            gender: (selectedStudent.gender || STUDENT_GENDER_OPTIONS[0]) as StudentGender,
            department: (selectedStudent.department || STUDENT_DEPARTMENT_OPTIONS[0]) as StudentDepartment,
            studentRole: (selectedStudent.student_role || STUDENT_ROLE_OPTIONS[0]) as StudentRole,
            drawNumber: String(selectedStudent.draw_number || '')
        });
    }, [showStudentModal, selectedStudent]);

    const drawWinnerRows = useMemo(() => {
        return studentDrawWinners.map(row => {
            const drawItem = Array.isArray(row.draw_items) ? row.draw_items[0] : row.draw_items;
            return {
                id: row.id,
                itemName: String(drawItem?.name || '알 수 없는 항목'),
                selectedMode: String(row.selected_mode || ''),
                isForced: Boolean(row.is_forced),
                isPublic: row.is_public ?? true,
                createdAt: row.created_at
            };
        });
    }, [studentDrawWinners]);

    if (!showStudentModal || !selectedStudent) {
        return null;
    }

    const onSaveInfo = async () => {
        if (savingInfo) {
            return;
        }

        setSavingInfo(true);
        const ok = await handleUpdateStudentInfo(selectedStudent, {
            name: infoForm.name,
            studentId: infoForm.studentId,
            gender: infoForm.gender,
            department: infoForm.department,
            studentRole: infoForm.studentRole,
            drawNumber: infoForm.drawNumber.replace(/\D/g, '').slice(0, 4)
        });
        setSavingInfo(false);

        if (ok) {
            alert('학생 정보가 수정되었습니다.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col border border-gray-300">
                <div className="p-6 border-b border-gray-300 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-base">{selectedStudent.student_id}</span>
                            학생 관리
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            이름 {selectedStudent.name || '-'} · 투표 {studentHistory.length}건 · 추첨 당첨 {studentDrawWinners.length}건
                        </p>
                    </div>
                    <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-300 bg-white">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onSaveInfo}
                            disabled={savingInfo}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {savingInfo ? '저장 중...' : '정보 수정 저장'}
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                await Promise.resolve(handleResetStudentVotes(selectedStudent));
                                await Promise.resolve(handleStudentDetails(selectedStudent));
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                            투표 초기화
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStudentDetails(selectedStudent)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                            새로고침
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                await Promise.resolve(handleToggleSuspend(selectedStudent));
                                await Promise.resolve(handleStudentDetails(selectedStudent));
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                                selectedStudent.is_suspended
                                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                        >
                            {selectedStudent.is_suspended ? '정지 해제' : '정지'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowStudentModal(false);
                                handleDeleteStudent(selectedStudent);
                            }}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                            삭제
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-300 bg-gray-50">
                    <div className="inline-flex rounded-xl border border-gray-300 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('INFO')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === 'INFO' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            정보 항목
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('VOTE')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === 'VOTE' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            투표 항목
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('DRAW')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === 'DRAW' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            추첨 항목
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'INFO' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">이름</span>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={infoForm.name}
                                        onChange={event => setInfoForm(prev => ({ ...prev, name: event.target.value }))}
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">학번 (수정 가능)</span>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                        value={infoForm.studentId}
                                        onChange={event => setInfoForm(prev => ({ ...prev, studentId: event.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 24) }))}
                                        placeholder="예: 12243672"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">성별</span>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={infoForm.gender}
                                        onChange={event => setInfoForm(prev => ({ ...prev, gender: event.target.value as StudentGender }))}
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
                                        value={infoForm.studentRole}
                                        onChange={event => setInfoForm(prev => ({ ...prev, studentRole: event.target.value as StudentRole }))}
                                    >
                                        {STUDENT_ROLE_OPTIONS.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">상태</span>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                        value={selectedStudent.is_suspended ? '정지됨' : '정상'}
                                        disabled
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">학과</span>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={infoForm.department}
                                        onChange={event => setInfoForm(prev => ({ ...prev, department: event.target.value as StudentDepartment }))}
                                    >
                                        {STUDENT_DEPARTMENT_OPTIONS.map(department => (
                                            <option key={department} value={department}>{department}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-semibold text-gray-700">추첨 번호</span>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                                        value={infoForm.drawNumber}
                                        onChange={event => setInfoForm(prev => ({ ...prev, drawNumber: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                                        placeholder="미지정"
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-gray-500">
                                등록일: {new Date(selectedStudent.created_at).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {activeTab === 'VOTE' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Plus size={12} /> 투표 강제 추가</p>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        className="flex-1 min-w-[180px] p-2 text-sm border border-gray-300 rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                                        value={forceVoteData.targetVoteId}
                                        onChange={e => setForceVoteData({ ...forceVoteData, targetVoteId: e.target.value, targetOptionId: '' })}
                                    >
                                        <option value="">투표 선택...</option>
                                        {votes.filter(v => getStatus(v) !== 'UPCOMING').map(v => (
                                            <option key={v.id} value={v.id}>[{getStatus(v)}] {v.title}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="flex-1 min-w-[180px] p-2 text-sm border border-gray-300 rounded hover:border-blue-300 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                        value={forceVoteData.targetOptionId}
                                        onChange={e => setForceVoteData({ ...forceVoteData, targetOptionId: e.target.value })}
                                        disabled={!forceVoteData.targetVoteId}
                                    >
                                        <option value="">항목 선택...</option>
                                        {forceVoteData.targetVoteId && votes.find(v => v.id === forceVoteData.targetVoteId)?.vote_options.map(o => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleForceAddVote}
                                        disabled={!forceVoteData.targetOptionId}
                                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-sm"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>

                            {studentHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">참여한 투표 기록이 없습니다.</div>
                            ) : (
                                studentHistory.map(record => {
                                    const optionName = record.votes?.vote_options?.find((o: any) => o.id === record.option_id)?.name || '삭제된 항목';
                                    const voteTitle = record.votes?.title || '삭제된 투표';

                                    return (
                                        <div
                                            key={record.id}
                                            className={`p-4 rounded-xl border border-gray-300 flex flex-wrap justify-between gap-3 items-center ${record.is_valid ? 'bg-white' : 'bg-red-50 border-red-200'}`}
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800 mb-1">{voteTitle}</div>
                                                <div className="text-sm text-gray-600">
                                                    선택: <span className="font-bold text-blue-600">{optionName}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(record.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!record.is_valid && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">무효 처리됨</span>}
                                                <button
                                                    onClick={() => toggleValidity(record.id, record.is_valid)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${record.is_valid
                                                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                >
                                                    {record.is_valid ? '무효 처리' : '유효 복구'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecord(record.id, () => handleStudentDetails(selectedStudent))}
                                                    className="px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'DRAW' && (
                        <div className="space-y-3">
                            {drawWinnerRows.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">당첨된 추첨 항목이 없습니다.</div>
                            ) : (
                                drawWinnerRows.map(row => (
                                    <div key={row.id} className="rounded-xl border border-gray-300 bg-white p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-bold text-gray-900">{row.itemName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{row.selectedMode}</span>
                                                {row.isForced && (
                                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">FORCED</span>
                                                )}
                                                <span className={`rounded px-2 py-0.5 text-xs font-bold ${row.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {row.isPublic ? '공개' : '비공개'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">{new Date(row.createdAt).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
