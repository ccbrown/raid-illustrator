import React from 'react';
import { Icon } from '@phosphor-icons/react';

interface Props {
    text: string;
    icon?: Icon;
    onClick?: () => void;
    disabled?: boolean;
}

export const PanelButton = (props: Props) => {
    return (
        <button
            className="flex flex-row gap-2 bg-cyan-500 shadow-md shadow-cyan-500/50 cursor-pointer rounded-md py-2 px-4 items-center hover:brightness-110 active:brightness-90 transition"
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.icon && <props.icon size={22} />}
            <div className="font-semibold text-sm">{props.text}</div>
        </button>
    );
};
