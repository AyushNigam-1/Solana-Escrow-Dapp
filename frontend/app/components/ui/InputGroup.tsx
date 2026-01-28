import { EscrowFormState } from "@/app/types/states";

const InputGroup: React.FC<{
    label: string;
    name: keyof EscrowFormState;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    disabled: boolean;
}> = ({ label, name, value, onChange, placeholder, type = 'text', disabled }) => (
    <div className='w-full '>
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            step={type === 'number' ? 'any' : undefined}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 dark:border-gray-600 rounded-lg shadow-sm  dark:bg-white/5 dark:text-gray-200  disabled:dark:bg-white/8 transition"
        />
    </div>
);


export default InputGroup