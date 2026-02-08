import { Download } from 'lucide-react';
import { useState } from 'react';
import ExportModal from './ExportModal';

export default function ExportButton({ students, department }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getFormattedData = (filteredStudents, options) => {
        return filteredStudents.map(s => {
            let deptName = s.department;
            if (s.department === 'CS') deptName = '컴퓨터공학과';
            else if (s.department === 'AI') deptName = '인공지능공학과';

            const row = {
                '이름': s.name,
                '전화번호': s.phone,
                '이메일': s.email,
            };

            if (options.includeDepartment) {
                row['학과'] = deptName;
            }

            row['OT 참석 여부'] = s.ot_attendance === 'Y' ? '참석' : '불참';
            row['뒤풀이 참석 여부'] = s.after_party_attendance === 'Y' ? '참석' : '불참';
            row['참석 인증 상태'] = s.verification_status === 'VERIFIED' ? '참석(인증완료)' : '불참석(미인증)';
            row['확인자'] = s.verifier_name || '';

            if (options.includeCreatedAt) {
                row['등록일'] = new Date(s.created_at).toLocaleString();
            }

            return row;
        });
    };

    const handleExport = async (format, filters) => {
        let filteredStudents = [...students];

        if (filters.verificationStatus !== 'ALL') {
            filteredStudents = filteredStudents.filter(s => s.verification_status === filters.verificationStatus);
        }
        if (filters.otAttendance !== 'ALL') {
            filteredStudents = filteredStudents.filter(s => s.ot_attendance === filters.otAttendance);
        }
        if (filters.afterPartyAttendance !== 'ALL') {
            filteredStudents = filteredStudents.filter(s => s.after_party_attendance === filters.afterPartyAttendance);
        }

        if (filteredStudents.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const data = getFormattedData(filteredStudents, {
            includeDepartment: filters.includeDepartment,
            includeCreatedAt: filters.includeCreatedAt
        });

        const deptName = department === 'CS' ? '컴퓨터공학과' : '인공지능공학과';
        const date = new Date();
        const yymmdd = date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/\s/g, '');
        const fileName = `[${deptName}-${yymmdd}]_OT_명단`;

        if (format === 'csv') {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${fileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } else if (format === 'xlsx') {
            try {
                const XLSX = await import('xlsx');
                const { saveAs } = await import('file-saver');

                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "학생 명단");

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

                saveAs(dataBlob, `${fileName}.xlsx`);
            } catch (error) {
                console.error('Export error:', error);
                alert('XLSX 내보내기 중 오류가 발생했습니다.');
            }
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all hover:scale-105 active:scale-95"
            >
                <Download className="h-4 w-4 mr-2" />
                내보내기
            </button>

            <ExportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onExport={handleExport}
            />
        </>
    );
}
