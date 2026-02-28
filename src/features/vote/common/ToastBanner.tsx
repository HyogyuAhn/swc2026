import { ToastState } from './types';

type ToastBannerProps = {
    toast: ToastState;
    positionClassName: string;
};

export default function ToastBanner({ toast, positionClassName }: ToastBannerProps) {
    if (!toast) {
        return null;
    }

    return (
        <div
            role="alert"
            className={`${positionClassName} rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed shadow-xl sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base ${toast.kind === 'error'
                ? 'border-red-200 bg-white text-red-600'
                : 'border-blue-200 bg-white text-blue-700'}`}
        >
            {toast.message}
        </div>
    );
}
