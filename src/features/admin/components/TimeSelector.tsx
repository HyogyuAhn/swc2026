import type { Dispatch, SetStateAction } from 'react';

type TimeSelectorProps = {
    prefix: string;
    formData: Record<string, any>;
    setFormData: Dispatch<SetStateAction<any>>;
    disabled: boolean;
};

export default function TimeSelector({ prefix, formData, setFormData, disabled }: TimeSelectorProps) {
    const handleChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex gap-1 w-full text-sm">
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Hour`]} onChange={e => handleChange(`${prefix}Hour`, e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => i).map(h => {
                    const hour = h.toString().padStart(2, '0');
                    return <option key={hour} value={hour}>{hour}시</option>;
                })}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Minute`]} onChange={e => handleChange(`${prefix}Minute`, e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
            </select>
            <select disabled={disabled} className="p-2 border rounded bg-white" value={formData[`${prefix}Second`]} onChange={e => handleChange(`${prefix}Second`, e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => i).map(s => <option key={s} value={s.toString().padStart(2, '0')}>{s.toString().padStart(2, '0')}초</option>)}
            </select>
        </div>
    );
}
