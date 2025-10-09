import React from 'react';
import { Icon } from '@phosphor-icons/react';

interface Props {
    text?: string;
    icon?: Icon;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    type?: 'submit';
}

export const Button = (props: Props) => {
    return (
        <button
            className={`flex flex-row gap-2 bg-cyan-500 shadow-md shadow-cyan-500/50 cursor-pointer rounded-full ${props.text ? 'py-2 px-4' : 'p-1'} items-center hover:brightness-110 active:brightness-90 transition outline-none`}
            onClick={props.onClick}
            disabled={props.disabled}
            type={props.type}
        >
            {props.icon && <props.icon size={props.size === 'small' ? 14 : 22} />}
            {props.text && <div className="font-semibold text-sm text-center flex-grow">{props.text}</div>}
        </button>
    );
};
