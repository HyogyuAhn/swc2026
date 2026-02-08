import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { useState } from 'react';

export default function ExportModal({ isOpen, onClose, onExport }) {
    const [format, setFormat] = useState('xlsx');
    const [filters, setFilters] = useState({
        verificationStatus: 'ALL',
        otAttendance: 'ALL',
        afterPartyAttendance: 'ALL',
    });

    if (!isOpen) return null;

    const handleExport = () => {
        onExport(format, filters);
        onClose();
    };

    const handleChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            type="button"
                            className="bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                            <Download className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 font-outfit" id="modal-title">
                                데이터 내보내기 설정
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    내보낼 파일의 형식과 데이터를 필터링하세요.
                                </p>
                            </div>

                            {/* Format Selection */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">파일 형식</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setFormat('xlsx')}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${format === 'xlsx'
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileSpreadsheet className={`h-8 w-8 ${format === 'xlsx' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-bold ${format === 'xlsx' ? 'text-indigo-900' : 'text-gray-500'}`}>Excel (.xlsx)</span>
                                    </div>
                                    <div
                                        onClick={() => setFormat('csv')}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${format === 'csv'
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <FileText className={`h-8 w-8 ${format === 'csv' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-bold ${format === 'csv' ? 'text-indigo-900' : 'text-gray-500'}`}>CSV (.csv)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="mt-6 space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">데이터 필터링</label>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">참석 인증 상태</label>
                                    <select
                                        value={filters.verificationStatus}
                                        onChange={(e) => handleChange('verificationStatus', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                    >
                                        <option value="ALL">전체 (All)</option>
                                        <option value="VERIFIED">인증 완료 (Verified)</option>
                                        <option value="NOT_VERIFIED">미인증 (Not Verified)</option>
                                    </select>
                                </div>

                                {/* OT Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">OT 참석 여부</label>
                                    <select
                                        value={filters.otAttendance}
                                        onChange={(e) => handleChange('otAttendance', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                    >
                                        <option value="ALL">전체 (All)</option>
                                        <option value="Y">참석 (Yes)</option>
                                        <option value="N">불참 (No)</option>
                                    </select>
                                </div>

                                {/* After Party Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">뒤풀이 참석 여부</label>
                                    <select
                                        value={filters.afterPartyAttendance}
                                        onChange={(e) => handleChange('afterPartyAttendance', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                    >
                                        <option value="ALL">전체 (All)</option>
                                        <option value="Y">참석 (Yes)</option>
                                        <option value="N">불참 (No)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                            onClick={handleExport}
                        >
                            다운로드
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-all"
                            onClick={onClose}
                        >
                            취소
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
