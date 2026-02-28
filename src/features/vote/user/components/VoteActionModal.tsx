type VoteActionModalProps = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmTone?: 'primary' | 'danger';
    onConfirm: () => void;
    onClose: () => void;
};

export default function VoteActionModal({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    confirmTone = 'primary',
    onConfirm,
    onClose
}: VoteActionModalProps) {
    if (!isOpen) {
        return null;
    }

    const confirmClassName = confirmTone === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'bg-blue-600 text-white hover:bg-blue-700';

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <button
                type="button"
                aria-label="모달 닫기"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{message}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${confirmClassName}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
