import { PlusIcon } from '@phosphor-icons/react';
import clsx from 'clsx';

import { Button } from '@/components';
import { useCommands } from './commands';
import { EntitiesTab } from './EntitiesTab';
import { EntityPresetsTab } from './EntityPresetsTab';
import { useRaidId } from './hooks';
import { useRaidWorkspace } from '@/hooks';
import { useDispatch } from '@/store';

const Tab = ({ id, label, activeTabId }: { id: string; label: string; activeTabId: string }) => {
    const raidId = useRaidId();
    const dispatch = useDispatch();

    return (
        <div
            className={clsx(`px-4 py-2 font-semibold cursor-pointer text-sm`, {
                'border-b-2 border-white/70 text-white': activeTabId === id,
                'text-white/50 hover:text-white': activeTabId !== id,
            })}
            onClick={() => {
                if (raidId) {
                    dispatch.workspaces.openEntitiesPanelTab({ raidId, tab: id as 'entities' | 'presets' });
                }
            }}
        >
            {label}
        </div>
    );
};

export const EntitiesPanel = () => {
    const commands = useCommands();
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const tab = workspace?.entitiesPanelTab || 'entities';

    if (!raidId) {
        return null;
    }

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg flex flex-col">
            <div className="flex flex-row items-center border-b-1 border-elevation-2">
                <Tab id="entities" label="Entities" activeTabId={tab} />
                <Tab id="presets" label="Presets" activeTabId={tab} />
                <div className="flex-grow" />
                {tab === 'entities' && (
                    <div className="px-4">
                        <Button
                            icon={PlusIcon}
                            size="small"
                            onClick={() => {
                                commands.newEntity.execute();
                            }}
                        />
                    </div>
                )}
            </div>
            {tab === 'entities' && <EntitiesTab />}
            {tab === 'presets' && <EntityPresetsTab />}
        </div>
    );
};
