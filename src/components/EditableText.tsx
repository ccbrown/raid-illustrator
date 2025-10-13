import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { disablePasswordManagers } from '@/components/TextField';

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
    className?: string;
}

export const EditableText = ({ className, disabled, value, onChange }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState(value);

    useEffect(() => {
        if (disabled && isEditing) {
            setIsEditing(false);
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    }, [disabled, isEditing]);

    const commit = () => {
        if (!disabled && editedValue.trim() !== '' && editedValue !== value) {
            onChange(editedValue);
        }
        setIsEditing(false);
    };

    return (
        <input
            className={clsx(
                'border-0 rounded-md shadow-none px-2 py-1 focus:bg-black/20 focus:outline-1 outline-cyan-500 ring-none',
                {
                    'pointer-events-none': disabled,
                    'cursor-text': !disabled,
                },
                className,
            )}
            autoComplete="off"
            disabled={disabled}
            readOnly={!isEditing || disabled}
            type="text"
            onFocus={() => {
                setEditedValue(value);
                setIsEditing(true);
            }}
            onChange={(e) => {
                setEditedValue(e.target.value);
            }}
            onBlur={() => {
                commit();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                    e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditing(false);
                    e.currentTarget.blur();
                }
            }}
            ref={inputRef}
            value={isEditing ? editedValue : value}
            {...disablePasswordManagers}
        />
    );
};
