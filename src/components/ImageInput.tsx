import { UploadIcon } from '@phosphor-icons/react';
import { useRef } from 'react';

import { StandaloneTextInput } from '@/components/StandaloneTextInput';

interface Props {
    disabled?: boolean;
    label?: string;
    onChange: (value: string) => void;
    value: string;
    className?: string;
}

// Like TextField, but commits changes on blur or Enter, and cancels on Escape.
export const ImageInput = ({ className, disabled, label, value, onChange }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={'flex flex-row items-center gap-2 ' + className}>
            <StandaloneTextInput
                className="flex-grow"
                disabled={disabled}
                label={label}
                value={value}
                onChange={onChange}
            />
            <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result;
                            if (typeof result === 'string') {
                                onChange(result);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
            <UploadIcon
                size={14}
                className="cursor-pointer opacity-80 hover:opacity-100"
                onClick={() => {
                    if (fileInputRef.current) {
                        fileInputRef.current.click();
                    }
                }}
            />
        </div>
    );
};
