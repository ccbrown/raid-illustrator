import { InputNumber } from 'primereact/inputnumber';

import { disablePasswordManagers } from './TextField';

interface OptionalInputInputProps {
    label?: string;
    value: number | null;
    onChange: (newValue: number | null) => void;
    min?: number;
    max?: number;
    maxFractionDigits?: number;
}

export const OptionalNumberInput = (props: OptionalInputInputProps) => (
    <div className="flex flex-row items-center gap-2">
        {props.label && <div className="text-white/60 text-xs whitespace-nowrap">{props.label}</div>}
        <InputNumber
            value={props.value}
            onValueChange={(e) => {
                props.onChange(e.value ?? null);
            }}
            mode="decimal"
            min={props.min}
            max={props.max}
            minFractionDigits={0}
            maxFractionDigits={props.maxFractionDigits ?? 2}
            size={3}
            pt={{
                input: {
                    root: () => ({
                        ...disablePasswordManagers,
                        className:
                            'bg-black/20 rounded-sm shadow-none focus:outline-1 outline-cyan-500 ring-none text-xs px-2 py-0.5 text-right',
                    }),
                },
            }}
        />
    </div>
);

interface NumberInputProps {
    label?: string;
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    maxFractionDigits?: number;
}

export const NumberInput = (props: NumberInputProps) => (
    <OptionalNumberInput
        label={props.label}
        value={props.value}
        onChange={(newValue) => {
            if (newValue !== null) {
                props.onChange(newValue);
            }
        }}
        min={props.min}
        max={props.max}
        maxFractionDigits={props.maxFractionDigits}
    />
);
