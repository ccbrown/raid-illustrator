import { NumberInput } from '@/components';

interface Props {
    value: { r: number; g: number; b: number; a: number };
    onChange: (newValue: { r: number; g: number; b: number; a: number }) => void;
}

export const RGBAInput = ({ value, onChange }: Props) => {
    return (
        <div className="flex flex-row gap-2">
            <NumberInput
                label="R"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.r}
                onChange={(newR) => onChange({ r: newR, g: value.g, b: value.b, a: value.a })}
            />
            <NumberInput
                label="G"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.g}
                onChange={(newG) => onChange({ r: value.r, g: newG, b: value.b, a: value.a })}
            />
            <NumberInput
                label="B"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.b}
                onChange={(newB) => onChange({ r: value.r, g: value.g, b: newB, a: value.a })}
            />
            <NumberInput
                label="A"
                min={0}
                max={1}
                maxFractionDigits={3}
                value={value.a}
                onChange={(newA) => onChange({ r: value.r, g: value.g, b: value.b, a: newA })}
            />
        </div>
    );
};
