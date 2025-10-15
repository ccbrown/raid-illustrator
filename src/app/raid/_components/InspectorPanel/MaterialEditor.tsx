import { Dropdown, RGBAInput, StandaloneTextInput } from '@/components';
import { Material } from '@/models/raids/types';

interface Props {
    label: string;
    value?: Material;
    onChange: (newFill?: Material) => void;
    defaultColor?: { r: number; g: number; b: number; a: number };
}

export const MaterialEditor = ({ label, value, onChange }: Props) => {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Dropdown
                options={[
                    { label: 'None', key: 'none' },
                    { label: 'Color', key: 'color' },
                    { label: 'Image', key: 'image' },
                ]}
                label={label}
                selectedOptionKey={value?.type ?? 'none'}
                onChange={(option) => {
                    switch (option.key) {
                        case 'none':
                            onChange(undefined);
                            return;
                        case 'color':
                            onChange({ type: 'color', color: { r: 255, g: 255, b: 255, a: 1 } });
                            return;
                        case 'image':
                            onChange({ type: 'image', url: '' });
                            return;
                    }
                }}
            />

            {value?.type === 'color' && (
                <RGBAInput
                    value={value.color}
                    onChange={(c) => {
                        onChange({ type: 'color', color: c });
                    }}
                />
            )}

            {value?.type === 'image' && (
                <StandaloneTextInput
                    className="flex-grow"
                    value={value.url}
                    onChange={(url) => {
                        onChange({ type: 'image', url });
                    }}
                />
            )}
        </div>
    );
};
