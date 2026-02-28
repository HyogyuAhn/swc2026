type DrawSettingsPanelProps = {
    livePageEnabled: boolean;
    onToggle: () => void;
};

export default function DrawSettingsPanel({ livePageEnabled, onToggle }: DrawSettingsPanelProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">라이브 페이지 설정</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        라이브 추첨 페이지 공개 여부를 설정합니다.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                        livePageEnabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                >
                    {livePageEnabled ? 'LIVE ON' : 'LIVE OFF'}
                </button>
            </div>
        </div>
    );
}
