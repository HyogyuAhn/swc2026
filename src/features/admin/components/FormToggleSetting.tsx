import { CheckCircle, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

type FormToggleSettingProps = {
    checked: boolean;
    title: string;
    description: ReactNode;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    disabledReason?: ReactNode;
};

export default function FormToggleSetting({
    checked,
    title,
    description,
    onChange,
    disabled = false,
    disabledReason
}: FormToggleSettingProps) {
    const stateBadgeClass = disabled
        ? 'bg-amber-100 text-amber-700'
        : checked
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500';

    const stateBadgeText = disabled ? '상태 잠금' : checked ? 'ON' : 'OFF';

    return (
        <div
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-center col-span-1 md:col-span-2 ${
                disabled
                    ? 'bg-amber-50/70 border-amber-200 ring-1 ring-amber-100'
                    : checked
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-200'
            }`}
        >
            <label className={`flex items-center group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
                        checked
                            ? disabled
                                ? 'bg-amber-500 border-amber-500'
                                : 'bg-gray-800 border-gray-800'
                            : disabled
                                ? 'bg-white border-amber-200'
                                : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}
                >
                    {checked && <CheckCircle size={14} className="text-white" />}
                </div>
                <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    disabled={disabled}
                    onChange={event => onChange(event.target.checked)}
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-bold block transition-colors ${
                                disabled
                                    ? 'text-gray-700'
                                    : checked
                                        ? 'text-gray-800'
                                        : 'text-gray-500'
                            }`}
                        >
                            {title}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stateBadgeClass}`}>
                            {stateBadgeText}
                        </span>
                    </div>

                    {disabled && disabledReason && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                            <Lock size={11} />
                            {disabledReason}
                        </span>
                    )}

                    <span className={`text-xs ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
                        {description}
                    </span>
                </div>
            </label>
        </div>
    );
}
