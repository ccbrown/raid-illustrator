import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
    className?: string;
}

export const EditableText = ({ className, disabled, value, onChange }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (disabled && isEditing) {
            setIsEditing(false);
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    }, [disabled, isEditing]);

    useEffect(() => {
        if (!isEditing && inputRef.current) {
            inputRef.current.innerText = value;
        }
    }, [value, isEditing]);

    const commit = () => {
        if (inputRef.current) {
            const editedValue = inputRef.current.innerText;
            if (!disabled && editedValue.trim() !== '' && editedValue !== value) {
                onChange(editedValue);
            }
        }
    };

    return (
        <div className="pointer-events-none">
            <div
                className={clsx(
                    'border-0 select-none rounded-md shadow-none px-2 py-1 focus:bg-black/20 focus:outline-1 outline-cyan-500 ring-none',
                    {
                        'pointer-events-none': disabled,
                        'pointer-events-auto cursor-text': !disabled,
                    },
                    className,
                )}
                onClick={() => {
                    if (!disabled && inputRef.current && !isEditing) {
                        inputRef.current.contentEditable = 'plaintext-only';
                        inputRef.current.focus();
                        // move cursor to end
                        const range = document.createRange();
                        range.selectNodeContents(inputRef.current);
                        range.collapse(false);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                }}
                onFocus={() => {
                    setIsEditing(true);
                }}
                onBlur={() => {
                    commit();
                    setIsEditing(false);
                    inputRef.current!.contentEditable = 'false';
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit();
                        e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        if (inputRef.current) {
                            inputRef.current.innerText = value;
                        }
                        setIsEditing(false);
                        e.currentTarget.blur();
                    }
                }}
                ref={inputRef}
            >
                {value}
            </div>
        </div>
    );
};
