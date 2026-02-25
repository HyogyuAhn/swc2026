'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StudentTable from '@/components/ot/StudentTable';
import StudentForm from '@/components/ot/StudentForm';
import SearchFilter from '@/components/ot/SearchFilter';
import ExportButton from '@/components/ot/ExportButton';
import { LogOut, UserPlus } from 'lucide-react';

type AdminFilters = {
    verificationStatus: string;
    otAttendance: string;
    afterPartyAttendance: string;
    search: string;
};

export default function AdminDashboard() {
    const [department, setDepartment] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [filters, setFilters] = useState<AdminFilters>({
        verificationStatus: 'ALL',
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
                .from('ot_students')
                .select('*')
                .eq('department', department)
                .order('name', { ascending: true });

            if (filters.verificationStatus !== 'ALL') {
                if (filters.verificationStatus === 'VERIFIED') query = query.eq('verification_status', 'VERIFIED');
                else if (filters.verificationStatus === 'NOT_VERIFIED') query = query.in('verification_status', ['NOT_VERIFIED']);
            }

            if (filters.otAttendance !== 'ALL') {
                query = query.eq('ot_attendance', filters.otAttendance);
            }

            if (filters.afterPartyAttendance !== 'ALL') {
                query = query.eq('after_party_attendance', filters.afterPartyAttendance);
            }

            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
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

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 학생 정보를 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('ot_students').delete().eq('id', id);
        if (error) {
            alert('학생 삭제에 실패했습니다.');
        } else {
            fetchStudents();
        }
    };

    const handleEdit = (student: any) => {
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
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 w-full">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center px-3 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm font-outfit tracking-wide">
                                {department}
                            </span>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                                {department === 'CS' ? '컴퓨터공학과' : department === 'DT' ? '디자인테크놀로지학과' : '인공지능공학과'} OT 관리
                            </h1>
                        </div>
                        <div className="flex items-center ml-auto">
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 space-y-8">

                    {/* Top Bar: Filters & Add Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-full sm:flex-1">
                            <SearchFilter filters={filters} setFilters={setFilters} />
                        </div>
                        <div className="flex px-2 sm:px-0 pb-2 sm:pb-0">
                            <button
                                onClick={handleAdd}
                                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                학생 추가
                            </button>
                        </div>
                    </div>

                    {/* Section Header: Status & Export */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg leading-6 font-bold text-gray-900">
                                    등록 현황
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    등록된 학생 및 참석/인증 상태 목록입니다.
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        총 {students.length}명
                                    </span>
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <ExportButton students={students} department={department} />
                            </div>
                        </div>

                        {/* Table */}
                        <StudentTable
                            students={students}
                            loading={loading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRefresh={fetchStudents}
                        />
                    </div>
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
