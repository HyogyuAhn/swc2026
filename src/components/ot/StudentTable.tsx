import { Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import VerificationModal from '@/components/ot/VerificationModal';

export default function StudentTable({ students, loading, onEdit, onDelete, onRefresh }) {
    const [verifyingStudent, setVerifyingStudent] = useState<any>(null);

    const handleVerify = async (id, verifierName) => {
        if (!verifierName.trim()) {
            alert('확인자 이름을 입력해주세요.');
            return;
        }

        const { error } = await supabase
            .from('ot_students')
            .update({
                verification_status: 'VERIFIED',
                verifier_name: verifierName
            })
            .eq('id', id);

        if (error) {
            alert('인증 처리에 실패했습니다.');
        } else {
            setVerifyingStudent(null);
            onRefresh();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center justify-center gap-3">
                    <p className="text-lg font-medium text-gray-900">등록된 학생이 없습니다.</p>
                    <p className="text-sm text-gray-500">학생을 추가하거나 필터를 변경해보세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/80 backdrop-blur-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                        No.
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        상태
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        학생 정보
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        연락처
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        참석 조사
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        참석 인증
                                    </th>
                                    <th scope="col" className="relative px-6 py-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1.5 ${student.verification_status === 'VERIFIED'
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${student.verification_status === 'VERIFIED' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                {student.verification_status === 'VERIFIED' ? '참석(인증완료)' : '불참석(미인증)'}
                                            </span>
                                            {student.verification_status === 'VERIFIED' && student.verifier_name && (
                                                <div className="text-xs text-gray-500 mt-1.5 pl-1">
                                                    확인자: <span className="font-medium text-gray-700">{student.verifier_name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-bold text-gray-900">{student.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col text-sm">
                                                <div className="text-gray-900">{student.phone}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{student.email || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center gap-2" title="OT 참석 여부">
                                                    <span className="w-12 text-xs font-medium text-gray-500">OT</span>
                                                    {student.ot_attendance === 'Y' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            <CheckCircle className="h-3 w-3 mr-1" /> 참석
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                            <XCircle className="h-3 w-3 mr-1" /> 불참
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2" title="뒤풀이 참석 여부">
                                                    <span className="w-12 text-xs font-medium text-gray-500">뒤풀이</span>
                                                    {student.after_party_attendance === 'Y' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            <CheckCircle className="h-3 w-3 mr-1" /> 참석
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                            <XCircle className="h-3 w-3 mr-1" /> 불참
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.verification_status !== 'VERIFIED' ? (
                                                <button
                                                    onClick={() => setVerifyingStudent(student)}
                                                    className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 hover:shadow-indigo-200 hover:-translate-y-0.5"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    참석 확인
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <CheckCircle className="h-3 w-3" /> 완료됨
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    onClick={() => onEdit(student)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1.5 bg-gray-50 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                                                    title="수정"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(student.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 bg-gray-50 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <VerificationModal
                isOpen={!!verifyingStudent}
                onClose={() => setVerifyingStudent(null)}
                student={verifyingStudent}
                onVerify={handleVerify}
            />
        </div>
    );
}
