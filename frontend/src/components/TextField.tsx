import { Field, Label } from '@headlessui/react';

interface Props {
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'search' | 'number';
    autocomplete?: 'email' | 'current-password' | 'new-password';
    required?: boolean;
    onChange?: (value: string) => void;
    value: string;
}

export const TextField = (props: Props) => {
    return (
        <Field className="grow">
            <div className="flex text-sm">
                {props.label && <Label className="block leading-6 font-semibold">{props.label}</Label>}
            </div>
            <input
                className={`block w-full bg-black/20 rounded-full border-0 outline-none mt-1 shadow-none px-4 p-2 ring-inset focus:ring-1 focus:ring-inset focus:ring-cyan-500 text-sm/6`}
                disabled={props.disabled}
                type={props.type || 'text'}
                required={props.required}
                autoComplete={props.autocomplete}
                onChange={(e) => props.onChange && props.onChange(e.target.value)}
                value={props.value}
                placeholder={props.placeholder}
            />
        </Field>
    );
};
