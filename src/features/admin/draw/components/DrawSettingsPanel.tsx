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
                        OFF면 `/draw` 페이지 전체가 비활성 안내 화면으로 표시됩니다.
                    </p>
                    <a
                        href="/draw"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        /draw 페이지 열기
                    </a>
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
