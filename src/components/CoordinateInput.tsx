import { NumberInput } from '@/components';

interface Props {
    value: { x: number; y: number };
    onChange: (newValue: { x: number; y: number }) => void;
}

export const CoordinateInput = ({ value, onChange }: Props) => {
    return (
        <div className="flex flex-row gap-2">
            <NumberInput label="X" value={value.x} onChange={(newX) => onChange({ x: newX, y: value.y })} />
            <NumberInput label="Y" value={value.y} onChange={(newY) => onChange({ x: value.x, y: newY })} />
        </div>
    );
};
