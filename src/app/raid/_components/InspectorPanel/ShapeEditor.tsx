import { Dropdown, NumberInput } from '@/components';
import { Shape } from '@/models/raids/types';

interface Props {
    value: Shape;
    onChange: (newShape: Shape) => void;
}

export const ShapeEditor = ({ value, onChange }: Props) => (
    <div className="flex flex-row gap-2">
        <Dropdown
            options={[
                { label: 'Circle', key: 'circle' },
                { label: 'Rectangle', key: 'rectangle' },
            ]}
            label="Shape"
            selectedOptionKey={value.type}
            onChange={(option) => {
                switch (value.type) {
                    case 'rectangle':
                        switch (option.key) {
                            case 'circle':
                                // use the smaller of the width or height as the radius
                                const radius = Math.min(value.width, value.height) / 2;
                                onChange({ type: 'circle', radius });
                                return;
                        }
                        return;
                    case 'circle':
                        switch (option.key) {
                            case 'rectangle':
                                // use the diameter as both width and height
                                const diameter = value.radius * 2;
                                onChange({
                                    type: 'rectangle',
                                    width: diameter,
                                    height: diameter,
                                });
                                return;
                        }
                        return;
                }
            }}
        />
        <div className="flex-grow" />
        {value.type === 'rectangle' ? (
            <>
                <NumberInput
                    label="Width (m)"
                    min={1}
                    value={value.width}
                    onChange={(w) => {
                        if (value.type === 'rectangle') {
                            onChange({ ...value, width: w });
                        }
                    }}
                />
                <NumberInput
                    label="Height (m)"
                    min={1}
                    value={value.height}
                    onChange={(h) => {
                        if (value.type === 'rectangle') {
                            onChange({ ...value, height: h });
                        }
                    }}
                />
            </>
        ) : (
            <NumberInput
                label="Radius (m)"
                min={1}
                value={value.radius}
                onChange={(r) => {
                    if (value.type === 'circle') {
                        onChange({ ...value, radius: r });
                    }
                }}
            />
        )}
    </div>
);
