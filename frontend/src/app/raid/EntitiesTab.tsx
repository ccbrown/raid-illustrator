import { GearSixIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { useRaidId } from './hooks';
import { useEntity, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { EntitySettingsDialog } from './EntitySettingsDialog';
import { useDispatch } from '@/store';

interface ListItemProps {
    id: string;
    onSettingsClick: () => void;
    selectedEntityIds: string[];
}

const ListItem = ({ id, onSettingsClick, selectedEntityIds }: ListItemProps) => {
    const entity = useEntity(id);
    const dispatch = useDispatch();

    const selectEntity = () => {
        if (entity) {
            dispatch.workspaces.select({ raidId: entity.raidId, selection: { entityIds: [entity.id] } });
        }
    };

    const deleteEntity = () => {
        dispatch.raids.deleteEntity({ id });
    };

    if (!entity) {
        return null;
    }

    return (
        <div
            className={`flex flex-row gap-2 px-4 py-2 transition ${selectedEntityIds.includes(entity.id) ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
            onClick={() => {
                selectEntity();
            }}
        >
            <div className="pr-2">{entity.name}</div>
            <div className="flex-grow" />
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    onSettingsClick();
                }}
            >
                <GearSixIcon size={20} />
            </button>
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteEntity();
                }}
            >
                <TrashIcon size={18} />
            </button>
        </div>
    );
};

export const EntitiesTab = () => {
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const scene = useScene(workspace?.openSceneId || '');

    const selection = useSelection(raidId || '');
    const selectedEntityIds = selection?.entityIds || [];

    const [settingsDialogEntityId, setSettingsDialogEntityId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    return (
        <div className="py-2 flex flex-col">
            {raidId && scene && (
                <EntitySettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    raidId={raidId}
                    sceneId={scene.id}
                    entityId={settingsDialogEntityId}
                />
            )}
            {scene?.entityIds.map((id) => (
                <ListItem
                    key={id}
                    id={id}
                    onSettingsClick={() => {
                        setSettingsDialogEntityId(id);
                        setSettingsDialogOpen(true);
                    }}
                    selectedEntityIds={selectedEntityIds}
                />
            ))}
        </div>
    );
};
