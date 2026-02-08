'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StudentTable from '@/components/ot/StudentTable';
import StudentForm from '@/components/ot/StudentForm';
import SearchFilter from '@/components/ot/SearchFilter';
import ExportButton from '@/components/ot/ExportButton';
import { LogOut, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
    const [department, setDepartment] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [filters, setFilters] = useState({
        feeStatus: 'ALL',
        otAttendance: 'ALL',
        afterPartyAttendance: 'ALL',
        search: ''
    });
    const router = useRouter();

    useEffect(() => {
        checkSession();
    }, []);

    useEffect(() => {
        if (department) {
            fetchStudents();
        }
    }, [department, filters]);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/ot/session');
            const data = await res.json();
            if (data.loggedIn && data.department) {
                setDepartment(data.department);
            } else {
                router.push('/ot/admin');
            }
        } catch (e) {
            router.push('/ot/admin');
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('students')
                .select('*')
                .eq('department', department)
                .order('name', { ascending: true });

            if (filters.feeStatus !== 'ALL') {
                if (filters.feeStatus === 'PAID') query = query.eq('fee_status', 'PAID');
                else if (filters.feeStatus === 'UNPAID') query = query.in('fee_status', ['UNPAID', 'NON_PARTICIPANT']);
            }

            if (filters.otAttendance !== 'ALL') {
                query = query.eq('ot_attendance', filters.otAttendance);
            }

            if (filters.afterPartyAttendance !== 'ALL') {
                query = query.eq('after_party_attendance', filters.afterPartyAttendance);
            }

            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,student_id.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/ot/logout', { method: 'POST' });
        router.push('/ot/admin');
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 이 학생 정보를 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
            alert('학생 삭제에 실패했습니다.');
        } else {
            fetchStudents();
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        fetchStudents();
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-lg">
                                {department === 'CS' ? 'C' : 'A'}
                            </span>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                {department === 'CS' ? '컴퓨터공학과' : '인공지능공학과'} OT 관리
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 space-y-6">

                    <SearchFilter filters={filters} setFilters={setFilters} />

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900">학생 명단</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                {students.length}명
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <ExportButton students={students} department={department} />
                            <button
                                onClick={handleAdd}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                학생 추가
                            </button>
                        </div>
                    </div>

                    <StudentTable
                        students={students}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRefresh={fetchStudents}
                    />
                </div>
            </main>

            {isModalOpen && (
                <StudentForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    student={editingStudent}
                    department={department}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
