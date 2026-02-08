import { Filter, Search } from 'lucide-react';

export default function SearchFilter({ filters, setFilters, onSearch }) {
    const handleChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">

                {/* Status Filter */}
                <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        value={filters.verificationStatus}
                        onChange={(e) => handleChange('verificationStatus', e.target.value)}
                        className="block w-full sm:w-32 pl-10 pr-8 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer appearance-none text-gray-700"
                    >
                        <option value="ALL">상태 전체</option>
                        <option value="VERIFIED">인증 완료</option>
                        <option value="NOT_VERIFIED">미인증</option>
                    </select>
                </div>

                {/* OT Attendance Filter */}
                <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        value={filters.otAttendance}
                        onChange={(e) => handleChange('otAttendance', e.target.value)}
                        className="block w-full sm:w-40 pl-10 pr-8 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer appearance-none text-gray-700"
                    >
                        <option value="ALL">OT 전체</option>
                        <option value="Y">OT: 참석</option>
                        <option value="N">OT: 불참</option>
                    </select>
                </div>

                {/* After Party Filter */}
                <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        value={filters.afterPartyAttendance}
                        onChange={(e) => handleChange('afterPartyAttendance', e.target.value)}
                        className="block w-full sm:w-48 pl-10 pr-8 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer appearance-none text-gray-700"
                    >
                        <option value="ALL">뒤풀이 전체</option>
                        <option value="Y">뒤풀이: 참석</option>
                        <option value="N">뒤풀이: 불참</option>
                    </select>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-auto flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={filters.search || ''}
                        onChange={(e) => handleChange('search', e.target.value)}
                        placeholder="이름 검색"
                        className="block w-full sm:w-64 pl-10 pr-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-colors text-gray-700 placeholder-gray-400"
                    />
                </div>
            </div>
        </div>
    );
}
