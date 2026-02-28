import { CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type FormToggleSettingProps = {
    checked: boolean;
    title: string;
    description: ReactNode;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
};

export default function FormToggleSetting({
    checked,
    title,
    description,
    onChange,
    disabled = false
}: FormToggleSettingProps) {
    return (
        <div
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-center col-span-1 md:col-span-2 ${
                disabled
                    ? 'bg-gray-50 border-gray-200 opacity-70'
                    : checked
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-200'
            }`}
        >
            <label className={`flex items-center group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
                        checked
                            ? 'bg-gray-800 border-gray-800'
                            : disabled
                                ? 'bg-white border-gray-200'
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
                <div>
                    <span className={`font-bold block transition-colors ${checked ? 'text-gray-800' : 'text-gray-500'}`}>
                        {title}
                    </span>
                    <span className="text-xs text-gray-400">{description}</span>
                </div>
            </label>
        </div>
    );
}
