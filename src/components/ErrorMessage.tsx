import { WarningCircleIcon } from '@phosphor-icons/react';

export const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full rounded-md p-2 text-white bg-red-500/40 sm:text-sm flex flex-row gap-1">
        <WarningCircleIcon size={20} />
        <div>{children}</div>
    </div>
);
