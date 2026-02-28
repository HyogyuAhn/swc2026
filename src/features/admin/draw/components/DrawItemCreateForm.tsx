type DrawItemCreateFormProps = {
    name: string;
    quota: string;
    allowDuplicate: boolean;
    isPublic: boolean;
    onNameChange: (value: string) => void;
    onQuotaChange: (value: string) => void;
    onAllowDuplicateChange: (checked: boolean) => void;
    onPublicChange: (checked: boolean) => void;
    onCreate: () => void;
    disabled?: boolean;
};

export default function DrawItemCreateForm({
    name,
    quota,
    allowDuplicate,
    isPublic,
    onNameChange,
    onQuotaChange,
    onAllowDuplicateChange,
    onPublicChange,
    onCreate,
    disabled = false
}: DrawItemCreateFormProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-800">추첨 항목 추가</h3>
            <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                    <span className="mb-1 block font-semibold text-gray-700">당첨 항목 이름</span>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        value={name}
                        onChange={event => onNameChange(event.target.value)}
                        placeholder="예: 기프티콘"
                    />
                </label>

                <label className="text-sm">
                    <span className="mb-1 block font-semibold text-gray-700">당첨 개수</span>
                    <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        value={quota}
                        onChange={event => onQuotaChange(event.target.value)}
                    />
                </label>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={allowDuplicate}
                        onChange={event => onAllowDuplicateChange(event.target.checked)}
                    />
                    중복 당첨 허용 (다른 항목)
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={event => onPublicChange(event.target.checked)}
                    />
                    당첨자 공개 (라이브 포함)
                </label>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={disabled}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    항목 추가
                </button>
            </div>
        </div>
    );
}
