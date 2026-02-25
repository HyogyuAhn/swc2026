import { CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function VerificationModal({ isOpen, onClose, student, onVerify }) {
    const [verifierName, setVerifierName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setVerifierName('');
        }
    }, [isOpen]);

    if (!isOpen || !student) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onVerify(student.id, verifierName);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-0">

                    <div className="relative pt-8 pb-6 px-6 text-center border-b border-gray-100">
                        <button
                            type="button"
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-50"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>

                        <h3 className="text-xl leading-6 font-bold text-gray-900 font-outfit" id="modal-title">
                            참석 확인
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            <span className="font-bold text-gray-900">{student.name}</span> 학생의 참석을 인증합니다.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-gray-50/50 px-6 py-6 font-sans">
                        <div>
                            <label htmlFor="verifierName" className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                확인자 이름
                            </label>
                            <input
                                type="text"
                                id="verifierName"
                                required
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 transition-all"
                                placeholder="확인자 이름 입력"
                                value={verifierName}
                                onChange={(e) => setVerifierName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="mt-6 flex gap-3 sm:flex-row-reverse">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-green-200 px-4 py-3 bg-green-600 text-base font-bold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-all hover:-translate-y-0.5"
                            >
                                인증 완료
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-all"
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
