import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, onExportCSV, onExportXLSX }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
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
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 font-outfit" id="modal-title">
                                데이터 내보내기
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    학생 명단 데이터를 원하는 형식으로 다운로드할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            onClick={onExportXLSX}
                            className="w-full flex items-center justify-between px-4 py-4 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all group"
                        >
                            <div className="flex items-center">
                                <span className="flex items-center justify-center p-2 bg-green-100 rounded-lg mr-4 group-hover:bg-green-200 transition-colors">
                                    <FileSpreadsheet className="h-6 w-6 text-green-700" />
                                </span>
                                <div className="text-left">
                                    <span className="block text-base font-bold text-gray-900">Excel (.xlsx)</span>
                                    <span className="block text-xs text-gray-500">스프레드시트 프로그램용</span>
                                </div>
                            </div>
                            <span className="text-indigo-600 font-semibold text-xs bg-indigo-50 px-2 py-1 rounded">추천</span>
                        </button>

                        <button
                            onClick={onExportCSV}
                            className="w-full flex items-center justify-between px-4 py-4 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all group"
                        >
                            <div className="flex items-center">
                                <span className="flex items-center justify-center p-2 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-colors">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </span>
                                <div className="text-left">
                                    <span className="block text-base font-bold text-gray-900">CSV (.csv)</span>
                                    <span className="block text-xs text-gray-500">범용 데이터 포맷</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all hover:scale-[1.02]"
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
