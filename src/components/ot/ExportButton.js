import { Download } from 'lucide-react';
import { useState } from 'react';
import ExportModal from './ExportModal';

export default function ExportButton({ students, department }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getFormattedData = () => {
        return students.map(s => ({
            '이름': s.name,

            '전화번호': s.phone,
            '이메일': s.email,
            '학과': s.department,
            'OT 참석 여부': s.ot_attendance === 'Y' ? '참석' : '불참',
            '뒤풀이 참석 여부': s.after_party_attendance === 'Y' ? '참석' : '불참',
            '참석 인증 상태': s.verification_status === 'VERIFIED' ? '참석(인증완료)' : '불참석(미인증)',
            '확인자': s.verifier_name || '',
            '생성일': new Date(s.created_at).toLocaleString(),
        }));
    };

    const exportToCSV = () => {
        const data = getFormattedData();
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `students_${department}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsModalOpen(false);
    };

    const exportToXLSX = async () => {
        try {
            const XLSX = await import('xlsx');
            const { saveAs } = await import('file-saver');

            const data = getFormattedData();
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "학생 명단");

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            saveAs(dataBlob, `students_${department}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            alert('XLSX 내보내기를 위해 필요한 라이브러리가 설치되지 않았습니다. npm install xlsx file-saver 명령어를 실행해주세요.');
            if (confirm('대신 CSV로 내보내시겠습니까?')) {
                exportToCSV();
            }
        }
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
                onExportCSV={exportToCSV}
                onExportXLSX={exportToXLSX}
            />
        </>
    );
}
