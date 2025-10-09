import { PlusIcon } from '@phosphor-icons/react';

import { Button } from '@/components';

export const EntitiesPanel = () => {
    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Entities</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            // TODO
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
