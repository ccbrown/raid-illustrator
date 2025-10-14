import { NumberInput } from '@/components';

interface Props {
    value: { r: number; g: number; b: number };
    onChange: (newValue: { r: number; g: number; b: number }) => void;
}

export const RGBInput = ({ value, onChange }: Props) => {
    return (
        <div className="flex flex-row gap-2">
            <NumberInput
                label="R"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.r}
                onChange={(newR) => onChange({ r: newR, g: value.g, b: value.b })}
            />
            <NumberInput
                label="G"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.g}
                onChange={(newG) => onChange({ r: value.r, g: newG, b: value.b })}
            />
            <NumberInput
                label="B"
                min={0}
                max={255}
                maxFractionDigits={0}
                value={value.b}
                onChange={(newB) => onChange({ r: value.r, g: value.g, b: newB })}
            />
        </div>
    );
};
