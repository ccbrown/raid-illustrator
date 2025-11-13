import { Icon } from '@phosphor-icons/react';
import clsx from 'clsx';
import React from 'react';

interface Props {
    text?: string;
    icon?: Icon;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'extra-small' | 'small' | 'medium';
    title?: string;
    type?: 'submit';
}

export const Button = (props: Props) => {
    return (
        <button
            className={clsx(
                'flex flex-row gap-2 rounded-full items-center hover:brightness-110 active:brightness-90 outline-none',
                {
                    'py-2 px-4': !!props.text,
                    'p-1': !props.text,
                    'bg-cyan-500 cursor-pointer shadow-md shadow-cyan-500/50': !props.disabled,
                    'bg-white/10 cursor-default text-white/50': props.disabled,
                },
            )}
            onClick={props.onClick}
            disabled={props.disabled}
            title={props.title}
            type={props.type}
        >
            {props.icon && <props.icon size={props.size === 'extra-small' ? 8 : props.size === 'small' ? 14 : 22} />}
            {props.text && <div className="font-semibold text-sm text-center flex-grow">{props.text}</div>}
        </button>
    );
};
