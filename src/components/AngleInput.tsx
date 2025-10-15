import { InputNumber } from 'primereact/inputnumber';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useThrottledCallback } from '@/hooks';

import { disablePasswordManagers } from './TextField';

interface Props {
    value: number;
    onChange: (newRadians: number) => void;
}

const normalize = (rads: number) => {
    rads = rads % (2 * Math.PI);
    if (rads > Math.PI) {
        rads -= 2 * Math.PI;
    } else if (rads < -Math.PI) {
        rads += 2 * Math.PI;
    }
    if (Object.is(rads, -0)) {
        rads = 0;
    }
    return rads;
};

const snap = (rads: number) => {
    const snapIncrement = Math.PI / 4;
    return Math.round(rads / snapIncrement) * snapIncrement;
};

export const AngleInput = ({ value, onChange }: Props) => {
    const [hasMouse, setHasMouse] = useState(false);
    const knobRef = useRef<HTMLDivElement>(null);
    const throttledOnChange = useThrottledCallback(onChange, 100);

    const mouseDownHandler = useCallback((e: React.MouseEvent) => {
        setHasMouse(true);
        e.preventDefault();
    }, []);

    const mouseUpHandler = useCallback(() => {
        setHasMouse(false);
    }, []);

    useEffect(() => {
        if (!hasMouse) {
            return;
        }

        const moveListener = (e: MouseEvent) => {
            if (!knobRef.current) {
                return;
            }
            const rect = knobRef.current.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            const rads = Math.atan2(x, -y);
            throttledOnChange(normalize(e.shiftKey ? snap(rads) : rads));
            e.preventDefault();
        };
        window.addEventListener('mousemove', moveListener);
        window.addEventListener('mouseup', mouseUpHandler);

        return () => {
            window.removeEventListener('mousemove', moveListener);
            window.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [hasMouse, mouseUpHandler, throttledOnChange]);

    return (
        <div className="flex flex-row items-center gap-2">
            <div
                className={`rounded-full bg-black/20 w-5 h-5 pt-0.5 cursor-pointer ${hasMouse ? 'outline outline-1 outline-cyan-500' : ''}`}
                style={{
                    transform: `rotate(${value}rad)`,
                }}
                onMouseDown={mouseDownHandler}
                onMouseUp={mouseUpHandler}
                ref={knobRef}
            >
                <div className="w-1 h-1 bg-white rounded-full mx-auto" />
            </div>

            <InputNumber
                value={(value / Math.PI) * 180}
                onValueChange={(e) => {
                    if (e.value !== null && e.value !== undefined) {
                        onChange(normalize((e.value / 180) * Math.PI));
                    }
                }}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                size={3}
                suffix="°"
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
};
