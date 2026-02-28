import { AlertTriangle } from 'lucide-react';

type DrawConfirmModalProps = {
    isOpen: boolean;
    title: string;
    warnings: string[];
    description?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    onCancel: () => void;
    onConfirm: () => void;
};

export default function DrawConfirmModal({
    isOpen,
    title,
    warnings,
    description,
    cancelLabel = '취소',
    confirmLabel = '강행',
    onCancel,
    onConfirm
}: DrawConfirmModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={onCancel}
                aria-label="경고 모달 닫기"
            />
            <div className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl">
                <div className="mb-3 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
                    </div>
                </div>

                <ul className="space-y-1 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
                    {warnings.map((warning, index) => (
                        <li key={index}>- {warning}</li>
                    ))}
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
