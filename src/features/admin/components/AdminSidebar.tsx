import { LogOut, Plus, LayoutDashboard, Users } from 'lucide-react';

type AdminSidebarProps = {
    view: string;
    setView: (view: string) => void;
    fetchStudents: () => void;
    startCreate: () => void;
    votes: any[];
    selectedVote: any;
    startEdit: (vote: any) => void;
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
    onLogout: () => void;
};

export default function AdminSidebar({
    view,
    setView,
    fetchStudents,
    startCreate,
    votes,
    selectedVote,
    startEdit,
    getStatus,
    onLogout
}: AdminSidebarProps) {
    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-20 shadow-sm">
            <div className="p-6 border-b border-gray-100 cursor-pointer" onClick={() => setView('DASHBOARD')}>
                <h1 className="font-bold text-xl text-blue-900 flex items-center gap-2">
                    <LayoutDashboard size={20} /> ADMIN
                </h1>
            </div>
            <div className="p-4 border-b border-gray-100 space-y-2">
                <button
                    onClick={() => setView('DASHBOARD')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm
                        ${view === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                    <LayoutDashboard size={18} /> 대시보드
                </button>
                <button
                    onClick={() => { fetchStudents(); setView('STUDENTS'); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm
                        ${view === 'STUDENTS' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                    <Users size={18} /> 학번 관리
                </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <span className="text-xs font-bold text-gray-500">투표 목록</span>
                <button onClick={startCreate} className="p-1 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 text-blue-600">
                    <Plus size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {votes.map(vote => {
                    const s = getStatus(vote);
                    return (
                        <div
                            key={vote.id}
                            onClick={() => startEdit(vote)}
                            className={`p-3 rounded-lg cursor-pointer text-sm transition border
                            ${selectedVote?.id === vote.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100 border-transparent'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${s === 'ACTIVE' ? 'bg-green-500' : s === 'UPCOMING' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
                                <span className="font-medium truncate">{vote.title}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t">
                <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 text-sm font-medium">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
}
