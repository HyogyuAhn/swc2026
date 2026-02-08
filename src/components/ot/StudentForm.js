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

    const handleSegmentChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                student_id: formData.student_id.trim() === '' ? null : formData.student_id,
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
            alert('학생 정보 저장에 실패했습니다. (학번 중복 등 확인 필요)');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl leading-6 font-bold text-gray-900 font-outfit" id="modal-title">
                            {student ? '학생 정보 수정' : '학생 추가'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 bg-gray-50 p-2 rounded-full transition-colors hover:bg-gray-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">이름</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all" placeholder="이름 입력" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">학번 <span className="text-gray-300 font-normal normal-case">(선택)</span></label>
                                <input type="text" name="student_id" value={formData.student_id} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all" placeholder="학번 (없으면 비워둠)" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">전화번호</label>
                                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all" placeholder="010-0000-0000" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">이메일 <span className="text-gray-300 font-normal normal-case">(선택)</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all" placeholder="example@inha.edu" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">OT 참석</label>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleSegmentChange('ot_attendance', 'Y')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.ot_attendance === 'Y' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        참석
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSegmentChange('ot_attendance', 'N')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.ot_attendance === 'N' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        불참
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">뒤풀이 참석</label>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleSegmentChange('after_party_attendance', 'Y')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.after_party_attendance === 'Y' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        참석
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSegmentChange('after_party_attendance', 'N')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.after_party_attendance === 'N' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        불참
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-5 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">참석 인증 상태</label>
                            <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                                <button
                                    type="button"
                                    onClick={() => handleSegmentChange('fee_status', 'UNPAID')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.fee_status === 'UNPAID' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    미인증 (불참석)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSegmentChange('fee_status', 'PAID')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.fee_status === 'PAID' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    인증 완료 (참석)
                                </button>
                            </div>

                            {formData.fee_status === 'PAID' && (
                                <div className="animate-fadeIn">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">확인자 이름</label>
                                    <input type="text" name="verifier_name" required value={formData.verifier_name} onChange={handleChange} className="block w-full rounded-xl border-indigo-200 ring-2 ring-indigo-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all" placeholder="누가 참석을 확인했나요?" />
                                </div>
                            )}
                        </div>

                        <div className="mt-8 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-indigo-200 px-4 py-3.5 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-70 transition-all hover:-translate-y-0.5"
                            >
                                {loading ? '저장 중...' : '저장하기'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-4 py-3.5 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-all"
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
