import { useState } from 'react';

import { EditableText } from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { useDispatch } from '@/store';

import { useRaidId } from '../../hooks';
import { EntitySettingsDialog } from '../EntitySettingsDialog';

interface ListItemProps {
    id: string;
    selectedEntityIds: string[];
}

const ListItem = ({ id, selectedEntityIds }: ListItemProps) => {
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
        </div>
    );
};

export const EntitiesTab = () => {
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const scene = useScene(workspace?.openSceneId || '');

    const selection = useSelection(raidId || '');
    const selectedEntityIds = selection?.entityIds || [];

    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    return (
        <div className="py-2 flex flex-col max-h-[400px] overflow-y-auto">
            {raidId && scene && (
                <EntitySettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    raidId={raidId}
                    sceneId={scene.id}
                />
            )}
            {scene?.entityIds.map((id) => (
                <ListItem key={id} id={id} selectedEntityIds={selectedEntityIds} />
            ))}
        </div>
    );
};
