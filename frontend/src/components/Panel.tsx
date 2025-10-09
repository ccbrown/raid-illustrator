import React from 'react';

interface Props {
    children: React.ReactNode;
}

export const Panel = ({ children }: Props) => {
    return (
        <div className="bg-background rounded-lg w-full max-w-3xl shadow-lg">
            <div className="bg-white/5 rounded-lg p-6">{children}</div>
        </div>
    );
};
