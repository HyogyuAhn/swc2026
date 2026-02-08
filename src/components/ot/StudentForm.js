import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

export default function StudentForm({ isOpen, onClose, student, department, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        student_id: '',
        email: '',
        phone: '',
        ot_attendance: 'Y',
        after_party_attendance: 'Y',
        fee_status: 'UNPAID',
        verifier_name: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name,
                student_id: student.student_id || '',
                email: student.email || '',
                phone: student.phone,
                ot_attendance: student.ot_attendance,
                after_party_attendance: student.after_party_attendance,
                fee_status: student.fee_status,
                verifier_name: student.verifier_name || '',
            });
        } else {
            setFormData({
                name: '',
                student_id: '',
                email: '',
                phone: '',
                ot_attendance: 'Y',
                after_party_attendance: 'Y',
                fee_status: 'UNPAID',
                verifier_name: '',
            });
        }
    }, [student, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                department,
                verifier_name: formData.fee_status === 'PAID' ? formData.verifier_name : null,
            };

            if (student) {
                const { error } = await supabase
                    .from('students')
                    .update(dataToSave)
                    .eq('id', student.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('students')
                    .insert([dataToSave]);
                if (error) throw error;
            }
            onSave();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('학생 정보 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                            {student ? '학생 정보 수정' : '학생 추가'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 bg-gray-50 p-1 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">학번</label>
                            <input type="text" name="student_id" value={formData.student_id} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">전화번호</label>
                                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">이메일 (선택)</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">OT 참석 여부</label>
                                <select name="ot_attendance" value={formData.ot_attendance} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3">
                                    <option value="Y">참석</option>
                                    <option value="N">불참</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">뒤풀이 참석 여부</label>
                                <select name="after_party_attendance" value={formData.after_party_attendance} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3">
                                    <option value="Y">참석</option>
                                    <option value="N">불참</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">참석 인증 상태</label>
                            <select name="fee_status" value={formData.fee_status} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3 mb-3">
                                <option value="UNPAID">불참석(미인증)</option>
                                <option value="PAID">참석(인증완료)</option>
                            </select>

                            {formData.fee_status === 'PAID' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">확인자 이름</label>
                                    <input type="text" name="verifier_name" required value={formData.verifier_name} onChange={handleChange} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3" placeholder="누가 참석을 확인했나요?" />
                                </div>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 transition-colors"
                            >
                                {loading ? '저장 중...' : '저장'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors"
                                onClick={onClose}
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
