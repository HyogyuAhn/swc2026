const FILTERS = ['ALL', 'ACTIVE', 'UPCOMING', 'ENDED'] as const;

type VoteFilterTabsProps = {
    filter: string;
    onFilterChange: (filter: string) => void;
};

export default function VoteFilterTabs({ filter, onFilterChange }: VoteFilterTabsProps) {
    return (
        <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {FILTERS.map(category => (
                <button
                    key={category}
                    onClick={() => onFilterChange(category)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap shadow-sm ${
                        filter === category
                            ? 'bg-blue-600 text-white shadow-blue-200'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                    {category === 'ALL' ? '전체' : category === 'ACTIVE' ? '진행 중' : category === 'UPCOMING' ? '시작 전' : '종료됨'}
                </button>
            ))}
        </div>
    );
}
