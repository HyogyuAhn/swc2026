import { Filter } from 'lucide-react';

export default function Filters({ filters, setFilters }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center text-gray-500 mr-2">
                <Filter className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">필터:</span>
            </div>

            <div>
                <select
                    name="feeStatus"
                    value={filters.feeStatus}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="ALL">납부 여부: 전체</option>
                    <option value="PAID">참석(인증완료)</option>
                    <option value="UNPAID">불참석(미인증)</option>
                </select>
            </div>

            <div>
                <select
                    name="otAttendance"
                    value={filters.otAttendance}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="ALL">OT 참석: 전체</option>
                    <option value="Y">OT: 참석</option>
                    <option value="N">OT: 불참</option>
                </select>
            </div>

            <div>
                <select
                    name="afterPartyAttendance"
                    value={filters.afterPartyAttendance}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="ALL">뒤풀이 참석: 전체</option>
                    <option value="Y">뒤풀이: 참석</option>
                    <option value="N">뒤풀이: 불참</option>
                </select>
            </div>
        </div>
    );
}
