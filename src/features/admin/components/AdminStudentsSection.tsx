import type { FormEvent } from 'react';

type AdminStudentsSectionProps = {
    students: any[];
    studentIdInput: string;
    setStudentIdInput: (value: string) => void;
    studentSearch: string;
    setStudentSearch: (value: string) => void;
    handleAddStudent: (e?: FormEvent<HTMLFormElement>) => void;
    handleResetStudentVotes: (student: any) => void;
    handleStudentDetails: (student: any) => void;
    handleToggleSuspend: (student: any) => void;
    handleDeleteStudent: (student: any) => void;
};

export default function AdminStudentsSection({
    students,
    studentIdInput,
    setStudentIdInput,
    studentSearch,
    setStudentSearch,
    handleAddStudent,
    handleResetStudentVotes,
    handleStudentDetails,
    handleToggleSuspend,
    handleDeleteStudent
}: AdminStudentsSectionProps) {
    return (
        <div className="p-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">학번 관리</h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h3 className="font-bold text-lg mb-4 text-gray-700">신규 학번 등록</h3>
                <form onSubmit={handleAddStudent} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="학번 8자리 (예: 12240000)"
                        className="flex-1 p-3 border rounded-xl text-lg"
                        maxLength={8}
                        value={studentIdInput}
                        onChange={e => setStudentIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm whitespace-nowrap">
                        등록하기
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">
                        등록된 학번 목록 <span className="text-blue-600 ml-1">({students.length}명)</span>
                    </h3>
                    <input
                        type="text"
                        placeholder="학번 검색"
                        className="p-2 border rounded-lg text-sm w-64"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">학번</th>
                                <th className="px-6 py-3">상태</th>
                                <th className="px-6 py-3">등록일</th>
                                <th className="px-6 py-3 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students
                                .filter(s => s.student_id.includes(studentSearch))
                                .map(student => (
                                    <tr key={student.student_id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-800">{student.student_id}</td>
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
