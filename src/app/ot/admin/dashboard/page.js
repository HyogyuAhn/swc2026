'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StudentTable from '@/components/ot/StudentTable';
import StudentForm from '@/components/ot/StudentForm';
import Filters from '@/components/ot/Filters';
import ExportButton from '@/components/ot/ExportButton';
import { LogOut, Plus, UserPlus } from 'lucide-react';

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
                .order('created_at', { ascending: false });

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

            const { data, error } = await query;

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('학생 목록을 불러오는데 실패했습니다.');
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
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">
                                {department === 'CS' ? '컴퓨터공학과' : '인공지능공학과'} OT 관리
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                            >
                                <LogOut className="h-4 w-4 inline mr-2" />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <Filters filters={filters} setFilters={setFilters} />
                        <div className="flex gap-2">
                            <ExportButton students={students} department={department} />
                            <button
                                onClick={handleAdd}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                학생 추가
                            </button>
                        </div>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
