import { GearSixIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { EditableText } from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { useDispatch } from '@/store';

import { EntitySettingsDialog } from './EntitySettingsDialog';
import { useRaidId } from './hooks';

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

    if (!entity) {
        return null;
    }

    const isSelected = selectedEntityIds.includes(entity.id);
    return (
        <div
            className={`flex flex-row gap-2 px-2 py-2 transition ${isSelected ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
            onClick={() => {
                selectEntity();
            }}
        >
            <EditableText
                className="text-sm"
                disabled={!isSelected}
                value={entity.name}
                onChange={(newName) => {
                    dispatch.raids.updateEntity({ id: entity.id, name: newName });
                }}
            />
            <div className="flex-grow" />
            <button
                className="subtle pr-2"
                onClick={(e) => {
                    e.stopPropagation();
                    onSettingsClick();
                }}
            >
                <GearSixIcon size={20} />
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
        <div className="py-2 flex flex-col max-h-[400px] overflow-y-auto">
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
