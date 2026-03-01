import { X, Plus } from 'lucide-react';

type VoteDetailsModalProps = {
    showDetailsModal: boolean;
    detailsVote: any;
    setShowDetailsModal: (show: boolean) => void;
    forceVoteData: { targetStudentId: string; targetVoteId: string; targetOptionId: string };
    setForceVoteData: (value: any) => void;
    handleForceAddVote: () => void;
    voteRecords: any[];
    toggleValidity: (recordId: string, currentStatus: boolean) => void;
    handleDeleteRecord: (recordId: string, refreshCallback?: (() => void) | null) => void;
    fetchVoteDetails: (vote: any) => void;
};

export default function VoteDetailsModal({
    showDetailsModal,
    detailsVote,
    setShowDetailsModal,
    forceVoteData,
    setForceVoteData,
    handleForceAddVote,
    voteRecords,
    toggleValidity,
    handleDeleteRecord,
    fetchVoteDetails
}: VoteDetailsModalProps) {
    if (!showDetailsModal || !detailsVote) {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800">투표 내역 상세</h3>
                        <p className="text-sm text-gray-500">{detailsVote.title}</p>
                    </div>
                    <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                    <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Plus size={12} /> 투표 강제 추가</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="학번 입력 (8자리)"
                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                            maxLength={8}
                            value={forceVoteData.targetStudentId}
                            onChange={e => setForceVoteData({ ...forceVoteData, targetStudentId: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                        <select
                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                            value={forceVoteData.targetOptionId}
                            onChange={e => setForceVoteData({ ...forceVoteData, targetOptionId: e.target.value })}
                        >
                            <option value="">항목 선택...</option>
                            {detailsVote.vote_options.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleForceAddVote}
                            disabled={!forceVoteData.targetStudentId || !forceVoteData.targetOptionId || forceVoteData.targetStudentId.length < 8}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-sm"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                            <tr>
                                <th className="px-4 py-3">학생</th>
                                <th className="px-4 py-3">선택 항목</th>
                                <th className="px-4 py-3">투표 시간</th>
                                <th className="px-4 py-3">상태 (유효성)</th>
                                <th className="px-4 py-3 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {voteRecords.map(record => {
                                const optionName = detailsVote.vote_options?.find(o => o.id === record.option_id)?.name || '알수없음';
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="leading-tight">
                                                <p className="font-semibold text-gray-900">{record.student_name || '이름 미등록'}</p>
                                                <p className="text-xs text-gray-500">{record.student_id}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{optionName}</td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(record.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            {record.is_valid ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">유효함</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">무효처리됨</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => toggleValidity(record.id, record.is_valid)}
                                                className={`px-3 py-1 rounded border text-xs font-bold transition mr-2
                                            ${record.is_valid
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                            >
                                                {record.is_valid ? '무효 처리' : '유효 복구'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRecord(record.id, () => fetchVoteDetails(detailsVote))}
                                                className="px-2 py-1 rounded border border-gray-200 text-xs font-bold text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {voteRecords.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">투표 기록이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t bg-gray-50 text-right">
                    <p className="text-xs text-gray-500">무효 처리된 표는 집계에서 제외됩니다.</p>
                </div>
            </div>
        </div>
    );
}
