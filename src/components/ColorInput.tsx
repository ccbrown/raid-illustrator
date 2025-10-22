import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { SketchPicker } from 'react-color';

import { useThrottledCallback } from '@/hooks';

interface RGBAProps {
    value: { r: number; g: number; b: number; a: number };
    onChange: (newValue: { r: number; g: number; b: number; a: number }) => void;
}

const styles = {
    default: {
        picker: {
            background: '#2a2a2a',
            userSelect: 'none' as const,
        },
        activeColor: {
            boxShadow: 'none',
        },
    },
};

export const RGBAInput = ({ value, onChange }: RGBAProps) => {
    const onChangeThrottled = useThrottledCallback(onChange, 100);

    return (
        <div className="flex flex-row gap-2">
            <Popover className="relative w-12 h-5">
                <PopoverPanel anchor="bottom">
                    <SketchPicker
                        styles={styles}
                        color={value}
                        onChange={(color) => {
                            onChangeThrottled({
                                r: color.rgb.r,
                                g: color.rgb.g,
                                b: color.rgb.b,
                                a: color.rgb.a ?? 1,
                            });
                        }}
                        presetColors={[]}
                    />
                </PopoverPanel>
                <PopoverButton className="w-full h-full border border-white/10 rounded-sm relative">
                    <div
                        style={{ backgroundColor: `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a})` }}
                        className="w-full h-full rounded-sm"
                    />
                </PopoverButton>
            </Popover>
        </div>
    );
};

interface RGBProps {
    label?: string;
    value: { r: number; g: number; b: number };
    onChange: (newValue: { r: number; g: number; b: number }) => void;
}

export const RGBInput = ({ label, value, onChange }: RGBProps) => {
    const onChangeThrottled = useThrottledCallback(onChange, 100);

    return (
        <div className="flex flex-row gap-2 items-center">
            {label && <div className="text-white/60 text-xs whitespace-nowrap">{label}</div>}
            <Popover className="relative w-12 h-5">
                <PopoverPanel anchor="bottom">
                    <SketchPicker
                        styles={styles}
                        color={value}
                        disableAlpha={true}
                        onChange={(color) => {
                            onChangeThrottled({
                                r: color.rgb.r,
                                g: color.rgb.g,
                                b: color.rgb.b,
                            });
                        }}
                        presetColors={[]}
                    />
                </PopoverPanel>
                <PopoverButton className="w-full h-full border border-white/10 rounded-sm relative">
                    <div
                        style={{ backgroundColor: `rgba(${value.r}, ${value.g}, ${value.b}, 1)` }}
                        className="w-full h-full rounded-sm"
                    />
                </PopoverButton>
            </Popover>
        </div>
    );
};
