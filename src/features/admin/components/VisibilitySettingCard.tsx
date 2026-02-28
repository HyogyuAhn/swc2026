import { CheckCircle } from 'lucide-react';

type VisibilitySettingCardProps = {
    title: string;
    isEnabled: boolean;
    resultType: string;
    showTotal: boolean;
    showTurnout: boolean;
    onModeChange: (mode: 'ALL' | 'PARTIAL' | 'OFF') => void;
    onShowTotalChange: (checked: boolean) => void;
    onShowTurnoutChange: (checked: boolean) => void;
    onResultTypeChange: (type: string) => void;
};

const PARTIAL_OPTIONS = [
    { id: 'COUNT', label: '투표수' },
    { id: 'PERCENT', label: '비율(%)' },
    { id: 'GAUGE', label: '게이지바' }
];

export default function VisibilitySettingCard({
    title,
    isEnabled,
    resultType,
    showTotal,
    showTurnout,
    onModeChange,
    onShowTotalChange,
    onShowTurnoutChange,
    onResultTypeChange
}: VisibilitySettingCardProps) {
    const currentMode = !isEnabled ? 'OFF' : resultType === 'ALL' ? 'ALL' : 'PARTIAL';

    const selectedTypes = (resultType === 'BOTH' ? 'COUNT,PERCENT,GAUGE' : resultType || 'COUNT,PERCENT,GAUGE')
        .split(',')
        .filter(Boolean);

    return (
        <div
            className={`p-5 rounded-2xl border transition-all duration-200 ${
                isEnabled
                    ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100'
                    : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="font-bold flex items-center gap-2">
                    <span className={isEnabled ? 'text-blue-900' : 'text-gray-600'}>{title}</span>
                    {isEnabled ? (
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {resultType === 'ALL' ? '전체 공개' : '부분 공개'}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">비공개</span>
                    )}
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm mb-4">
                {(['ALL', 'PARTIAL', 'OFF'] as const).map(mode => (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onModeChange(mode)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                            currentMode === mode
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        {mode === 'ALL' ? '모두 공개' : mode === 'PARTIAL' ? '부분 공개' : '비공개'}
                    </button>
                ))}
            </div>

            <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs font-bold text-gray-500 mb-2">전체 통계 설정</div>
                <label className="flex items-center cursor-pointer group">
                    <div
                        className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${
                            showTotal ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                        }`}
                    >
                        {showTotal && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={showTotal}
                        onChange={event => onShowTotalChange(event.target.checked)}
                    />
                    <span className="text-sm text-gray-600 font-medium">참여 인원수 표시</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                    <div
                        className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${
                            showTurnout ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                        }`}
                    >
                        {showTurnout && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={showTurnout}
                        onChange={event => onShowTurnoutChange(event.target.checked)}
                    />
                    <span className="text-sm text-gray-600 font-medium">총 투표율 표시 (게이지)</span>
                </label>
            </div>

            {isEnabled && resultType !== 'ALL' && (
                <div className="space-y-3 pt-2 border-t border-blue-100 animate-fadeIn">
                    <div className="text-xs font-bold text-gray-500 mb-2">항목별 표시 설정 (1개 이상 선택)</div>
                    <div className="flex flex-wrap gap-2">
                        {PARTIAL_OPTIONS.map(option => {
                            const isChecked = selectedTypes.includes(option.id);

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        const nextTypes = isChecked
                                            ? selectedTypes.filter(type => type !== option.id)
                                            : [...selectedTypes, option.id];

                                        if (nextTypes.length === 0) {
                                            return;
                                        }

                                        onResultTypeChange(nextTypes.join(','));
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                                        isChecked
                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <div
                                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                            isChecked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        {isChecked && <CheckCircle size={8} className="text-white" />}
                                    </div>
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
