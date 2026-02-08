import { Download, FileSpreadsheet, FileText, X, Check, ChevronsUpDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ExportModal({ isOpen, onClose, onExport }) {
    const [format, setFormat] = useState('xlsx');
    const [filters, setFilters] = useState({
        verificationStatus: 'ALL',
        otAttendance: 'ALL',
        afterPartyAttendance: 'ALL',
        includeDepartment: false,
        includeCreatedAt: false,
    });

    useEffect(() => {
        if (isOpen) {
            setFormat('xlsx');
            setFilters({
                verificationStatus: 'ALL',
                otAttendance: 'ALL',
                afterPartyAttendance: 'ALL',
                includeDepartment: false,
                includeCreatedAt: false,
            });
        }
    }, [isOpen]);

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

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-0">

                    <div className="relative pt-10 pb-6 px-6 sm:px-10 text-center border-b border-gray-100">
                        <button
                            type="button"
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-50"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 mb-4">
                            <Download className="h-8 w-8 text-indigo-600" />
                        </div>

                        <h3 className="text-xl leading-6 font-bold text-gray-900 font-outfit" id="modal-title">
                            데이터 내보내기
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            필터를 선택하여 원하는 데이터만 다운로드할 수 있습니다.<br />(기본값: 전체 데이터)
                        </p>
                    </div>

                    <div className="bg-gray-50/50 px-6 py-6 sm:px-10">
                        {/* Format Selection - Toggle Style */}
                        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                            <button
                                onClick={() => setFormat('xlsx')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${format === 'xlsx'
                                    ? 'bg-white text-green-700 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <FileSpreadsheet className={`h-5 w-5 ${format === 'xlsx' ? 'text-green-600' : 'text-gray-400'}`} />
                                Excel (.xlsx)
                                {format === 'xlsx' && <Check className="h-4 w-4 ml-1 text-green-600" />}
                            </button>
                            <button
                                onClick={() => setFormat('csv')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${format === 'csv'
                                    ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <FileText className={`h-5 w-5 ${format === 'csv' ? 'text-gray-600' : 'text-gray-400'}`} />
                                CSV (.csv)
                                {format === 'csv' && <Check className="h-4 w-4 ml-1 text-gray-600" />}
                            </button>
                        </div>

                        {/* Filters - Card Style */}
                        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                            {/* Verification Status */}
                            <div className="p-4 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-500">참석 인증 상태</label>
                                <div className="relative">
                                    <select
                                        value={filters.verificationStatus}
                                        onChange={(e) => handleChange('verificationStatus', e.target.value)}
                                        className="appearance-none bg-transparent border-none pr-8 py-1 text-right text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="ALL">전체</option>
                                        <option value="VERIFIED">인증 완료</option>
                                        <option value="NOT_VERIFIED">미인증</option>
                                    </select>
                                    <ChevronsUpDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* OT Attendance */}
                            <div className="p-4 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-500">OT 참석 여부</label>
                                <div className="relative">
                                    <select
                                        value={filters.otAttendance}
                                        onChange={(e) => handleChange('otAttendance', e.target.value)}
                                        className="appearance-none bg-transparent border-none pr-8 py-1 text-right text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="ALL">전체</option>
                                        <option value="Y">참석</option>
                                        <option value="N">불참</option>
                                    </select>
                                    <ChevronsUpDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* After Party Attendance */}
                            <div className="p-4 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-500">뒤풀이 참석 여부</label>
                                <div className="relative">
                                    <select
                                        value={filters.afterPartyAttendance}
                                        onChange={(e) => handleChange('afterPartyAttendance', e.target.value)}
                                        className="appearance-none bg-transparent border-none pr-8 py-1 text-right text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="ALL">전체</option>
                                        <option value="Y">참석</option>
                                        <option value="N">불참</option>
                                    </select>
                                    <ChevronsUpDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Include Options */}
                            <div className="p-4 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-500">학과 포함</label>
                                <input
                                    type="checkbox"
                                    checked={filters.includeDepartment}
                                    onChange={(e) => handleChange('includeDepartment', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-500">생성일(웹 등록일) 포함</label>
                                <input
                                    type="checkbox"
                                    checked={filters.includeCreatedAt}
                                    onChange={(e) => handleChange('includeCreatedAt', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg shadow-indigo-200 px-6 py-4 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:-translate-y-0.5"
                                onClick={handleExport}
                            >
                                다운로드
                            </button>
                            <button
                                type="button"
                                className="w-full inline-flex justify-center items-center rounded-xl px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white transition-colors"
                                onClick={onClose}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
