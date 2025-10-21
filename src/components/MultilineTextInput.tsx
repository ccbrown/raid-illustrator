import { Field, Label } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    disabled?: boolean;
    label?: string;
    onChange: (value: string) => void;
    value: string;
    className?: string;
}

// Like TextField, but commits changes on blur or Enter, and cancels on Escape.
export const MultilineTextInput = ({ className, disabled, label, value, onChange }: Props) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const ignoreBlurRef = useRef(false);
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
        if (!disabled && editedValue !== value) {
            onChange(editedValue);
        }
        setIsEditing(false);
    };

    return (
        <Field className={`flex flex-row items-center gap-2 ${className}`}>
            {label && <Label className="text-white/60 text-xs whitespace-nowrap">{label}</Label>}
            <textarea
                className={`block w-full bg-black/20 rounded-sm border-0 outline-none shadow-none px-2 py-0.5 ring-inset focus:ring-1 focus:ring-inset focus:ring-cyan-500 text-xs`}
                disabled={disabled}
                onFocus={() => {
                    setEditedValue(value);
                    setIsEditing(true);
                }}
                onChange={(e) => {
                    setEditedValue(e.target.value);
                }}
                onBlur={() => {
                    if (!ignoreBlurRef.current) {
                        commit();
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsEditing(false);
                        ignoreBlurRef.current = true;
                        e.currentTarget.blur();
                        ignoreBlurRef.current = false;
                    }
                }}
                ref={inputRef}
                rows={3}
                value={isEditing ? editedValue : value}
            />
        </Field>
    );
};
