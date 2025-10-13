import { Field, Label } from '@headlessui/react';

interface Props {
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    allowPasswordManagers?: boolean;
    type?: 'text' | 'email' | 'password' | 'search' | 'number';
    autocomplete?: 'email' | 'current-password' | 'new-password';
    required?: boolean;
    onChange?: (value: string) => void;
    value: string;
}

export const disablePasswordManagers = {
    'data-lpignore': 'true',
    'data-1p-ignore': true,
    'data-protonpass-ignore': true,
};

export const TextField = (props: Props) => {
    return (
        <Field className="flex flex-row items-center gap-2">
            {props.label && <Label className="text-white/60 text-xs whitespace-nowrap">{props.label}</Label>}
            <input
                className={`block w-full bg-black/20 rounded-sm border-0 outline-none shadow-none px-2 py-0.5 ring-inset focus:ring-1 focus:ring-inset focus:ring-cyan-500 text-xs`}
                disabled={props.disabled}
                type={props.type || 'text'}
                required={props.required}
                autoComplete={props.autocomplete || 'off'}
                onChange={(e) => props.onChange && props.onChange(e.target.value)}
                value={props.value}
                placeholder={props.placeholder}
                {...(props.autocomplete || props.allowPasswordManagers ? {} : disablePasswordManagers)}
            />
        </Field>
    );
};
