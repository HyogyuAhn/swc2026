import { LogOut, User } from 'lucide-react';

type VotePageHeaderProps = {
    studentId: string;
    studentName: string;
    studentRole: string;
    onLogout: () => void;
};

export default function VotePageHeader({ studentId, studentName, studentRole, onLogout }: VotePageHeaderProps) {
    const studentDisplayName = studentName.trim() || '이름 미등록';
    const roleDisplayName = studentRole.trim() || '역할 미지정';

    return (
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm !sticky !top-0 !w-auto">
            <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="font-bold text-xl text-blue-900">소프트웨어융합대학 투표</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                        <User size={16} />
                        <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-gray-700">{studentDisplayName} · {roleDisplayName}</span>
                            <span className="text-[11px] text-gray-500">{studentId}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}
