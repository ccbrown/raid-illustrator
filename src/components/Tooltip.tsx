'use client';

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    disabled?: boolean;
    children: React.ReactNode;
    content: React.ReactNode;
}

export const Tooltip = ({ disabled, children, content }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | undefined>();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            {isHovered &&
                !disabled &&
                createPortal(
                    <div
                        className="absolute z-1000 bg-elevation-3 text-white py-1 px-2 text-xs rounded-md -translate-x-1/2 -translate-y-full pointer-events-none"
                        style={{
                            left: (rect?.left || 0) + (rect?.width || 0) / 2,
                            top: rect?.top,
                        }}
                    >
                        {content}
                    </div>,
                    document.body,
                )}
            <div
                onMouseEnter={() => {
                    const rect = ref.current?.getBoundingClientRect();
                    setRect(rect);
                    setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
                ref={ref}
                className="inline-block"
            >
                {children}
            </div>
        </>
    );
};
