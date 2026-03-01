import { Trash2 } from 'lucide-react';

type StudentDeleteModalProps = {
    showDeleteModal: boolean;
    deleteTarget: any;
    executeDeleteStudent: () => void;
    setShowDeleteModal: (show: boolean) => void;
    setDeleteTarget: (target: any) => void;
};

export default function StudentDeleteModal({
    showDeleteModal,
    deleteTarget,
    executeDeleteStudent,
    setShowDeleteModal,
    setDeleteTarget
}: StudentDeleteModalProps) {
    if (!showDeleteModal || !deleteTarget) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{deleteTarget.data.student_id} 학번 삭제</h3>
                <p className="text-sm text-gray-500 mb-6">
                    정말 삭제하시겠습니까?<br />
                    학생 정보와 관련 기록이 모두 삭제되며 복구할 수 없습니다.
                </p>
                <div className="space-y-2">
                    <button onClick={executeDeleteStudent} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
                        삭제
                    </button>
                    <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
}
