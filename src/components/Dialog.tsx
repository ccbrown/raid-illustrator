import { CloseButton, DialogBackdrop, Dialog as DialogImpl, DialogPanel, DialogTitle } from '@headlessui/react';
import { XIcon } from '@phosphor-icons/react';
import React from 'react';

interface Props {
    children: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
    size?: 'xl';
}

export const Dialog = (props: Props) => {
    const width = props.size === 'xl' ? 'w-xl' : 'max-w-xl';

    return (
        <DialogImpl open={!!props.isOpen} onClose={() => props.onClose && props.onClose()} className="relative z-50">
            <DialogBackdrop
                className="fixed inset-0 bg-radial from-black/10 to-black/40 ease-out duration-200 data-[closed]:opacity-0"
                transition
            />
            <div className="fixed inset-0 flex w-screen items-center justify-center">
                <DialogPanel
                    className={`relative min-w-lg ${width} space-y-4 bg-elevation-2 shadow-lg rounded-xl p-4 duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0`}
                    transition
                >
                    <CloseButton className="absolute right-2 top-2 cursor-pointer subtle">
                        <XIcon size={22} />
                    </CloseButton>
                    {props.title && <DialogTitle className="font-bold">{props.title}</DialogTitle>}
                    {props.children}
                </DialogPanel>
            </div>
        </DialogImpl>
    );
};
