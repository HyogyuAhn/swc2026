import { Edit2, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function StudentTable({ students, loading, onEdit, onDelete, onRefresh }) {
    const [verifyingId, setVerifyingId] = useState(null);
    const [verifierName, setVerifierName] = useState('');

    const handleVerify = async (id) => {
        if (!verifierName.trim()) {
            alert('확인자 이름을 입력해주세요.');
            return;
        }

        const { error } = await supabase
            .from('students')
            .update({
                fee_status: 'PAID',
                verifier_name: verifierName
            })
            .eq('id', id);

        if (error) {
            alert('인증 처리에 실패했습니다.');
        } else {
            setVerifyingId(null);
            setVerifierName('');
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
            <div className="text-center py-10 text-gray-500">
                등록된 학생이 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이름 / 학번
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            연락처
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            OT / 뒤풀이
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참석 인증
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">작업</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.fee_status === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {student.fee_status === 'PAID' ? '참석(인증완료)' : '불참석(미인증)'}
                                </span>
                                {student.fee_status === 'PAID' && student.verifier_name && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        확인자: {student.verifier_name}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.student_id || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.phone}</div>
                                <div className="text-sm text-gray-500">{student.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center" title="OT 참석 여부">
                                        <span className="mr-1 text-xs font-bold">OT:</span>
                                        {student.ot_attendance === 'Y' ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center" title="뒤풀이 참석 여부">
                                        <span className="mr-1 text-xs font-bold">뒤풀이:</span>
                                        {student.after_party_attendance === 'Y' ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.fee_status !== 'PAID' ? (
                                    verifyingId === student.id ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-xs border-gray-300 rounded-md"
                                                placeholder="확인자 이름"
                                                value={verifierName}
                                                onChange={(e) => setVerifierName(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleVerify(student.id)}
                                                className="text-green-600 hover:text-green-900 text-xs font-medium"
                                            >
                                                확인
                                            </button>
                                            <button
                                                onClick={() => { setVerifyingId(null); setVerifierName(''); }}
                                                className="text-gray-400 hover:text-gray-600 text-xs"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setVerifyingId(student.id)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium text-xs flex items-center"
                                        >
                                            참석 인증
                                        </button>
                                    )
                                ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onEdit(student)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(student.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
