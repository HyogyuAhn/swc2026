import { X, Plus } from 'lucide-react';

type StudentHistoryModalProps = {
    showStudentModal: boolean;
    selectedStudent: any;
    studentHistory: any[];
    setShowStudentModal: (show: boolean) => void;
    forceVoteData: { targetStudentId: string; targetVoteId: string; targetOptionId: string };
    setForceVoteData: (value: any) => void;
    votes: any[];
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
    handleForceAddVote: () => void;
    toggleValidity: (recordId: string, currentStatus: boolean) => void;
    handleDeleteRecord: (recordId: string, refreshCallback?: (() => void) | null) => void;
    handleStudentDetails: (student: any) => void;
};

export default function StudentHistoryModal({
    showStudentModal,
    selectedStudent,
    studentHistory,
    setShowStudentModal,
    forceVoteData,
    setForceVoteData,
    votes,
    getStatus,
    handleForceAddVote,
    toggleValidity,
    handleDeleteRecord,
    handleStudentDetails
}: StudentHistoryModalProps) {
    if (!showStudentModal || !selectedStudent) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-base">{selectedStudent.student_id}</span>
                            투표 기록
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            총 {studentHistory.length}건의 투표에 참여했습니다.
                        </p>
                    </div>
                    <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                    <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1"><Plus size={12} /> 투표 강제 추가</p>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none"
                            value={forceVoteData.targetVoteId}
                            onChange={e => setForceVoteData({ ...forceVoteData, targetVoteId: e.target.value, targetOptionId: '' })}
                        >
                            <option value="">투표 선택...</option>
                            {votes.filter(v => getStatus(v) !== 'UPCOMING').map(v => (
                                <option key={v.id} value={v.id}>[{getStatus(v)}] {v.title}</option>
                            ))}
                        </select>

                        <select
                            className="flex-1 p-2 text-sm border rounded hover:border-blue-300 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                            value={forceVoteData.targetOptionId}
                            onChange={e => setForceVoteData({ ...forceVoteData, targetOptionId: e.target.value })}
                            disabled={!forceVoteData.targetVoteId}
                        >
                            <option value="">항목 선택...</option>
                            {forceVoteData.targetVoteId && votes.find(v => v.id === forceVoteData.targetVoteId)?.vote_options.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleForceAddVote}
                            disabled={!forceVoteData.targetOptionId}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-sm"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {studentHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">참여한 투표 기록이 없습니다.</div>
                    ) : (
                        studentHistory.map(record => {
                            const optionName = record.votes?.vote_options?.find(o => o.id === record.option_id)?.name || '삭제된 항목';
                            const voteTitle = record.votes?.title || '삭제된 투표';

                            return (
                                <div key={record.id} className={`p-4 rounded-xl border flex justify-between items-center
                                ${record.is_valid ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                                    <div>
                                        <div className="font-bold text-gray-800 mb-1">{voteTitle}</div>
                                        <div className="text-sm text-gray-600">
                                            선택: <span className="font-bold text-blue-600">{optionName}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(record.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!record.is_valid && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">무효 처리됨</span>}
                                        <button
                                            onClick={() => toggleValidity(record.id, record.is_valid)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                                        ${record.is_valid
                                                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                        >
                                            {record.is_valid ? '무효 처리' : '유효 복구'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRecord(record.id, () => handleStudentDetails(selectedStudent))}
                                            className="px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
