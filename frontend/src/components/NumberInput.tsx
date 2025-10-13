import { InputNumber } from 'primereact/inputnumber';

import { disablePasswordManagers } from './TextField';

interface Props {
    label: string;
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    maxFractionDigits?: number;
}

export const NumberInput = (props: Props) => (
    <div className="flex flex-row items-center gap-2">
        <div className="text-white/60 text-xs whitespace-nowrap">{props.label}</div>
        <InputNumber
            value={props.value}
            onValueChange={(e) => {
                if (e.value !== null && e.value !== undefined) {
                    props.onChange(e.value);
                }
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
