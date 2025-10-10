import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { EntitySettingsDialog } from './EntitySettingsDialog';
import { useCommands } from './commands';
import { Button } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

export const EntitiesPanel = () => {
    const commands = useCommands();

    const dispatch = useDispatch();

    const raidId = useHashParam('id');

    const workspace = useSelector((state) => (raidId ? state.workspaces.raids[raidId] : undefined));

    const scene = useSelector((state) =>
        workspace?.openSceneId ? state.raids.scenes[workspace.openSceneId] : undefined,
    );

    const sceneWorkspace = useSelector((state) => (scene ? state.workspaces.scenes[scene.id] : undefined));

    const entities = Object.values(useSelector((state) => state.raids.entities)).filter(
        (step) => step.sceneId === scene?.id,
    );
    entities.sort((a, b) => a.order - b.order);

    const selectEntity = (id: string) => {
        if (scene) {
            dispatch.workspaces.selectEntities({ sceneId: scene.id, ids: [id] });
        }
    };

    const deleteEntity = (id: string) => {
        dispatch.raids.deleteEntity({ id });
    };

    const selectedEntityIds = sceneWorkspace?.selectedEntityIds || [];

    const [settingsDialogEntityId, setSettingsDialogEntityId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            {raidId && scene && (
                <EntitySettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    raidId={raidId}
                    sceneId={scene.id}
                    entityId={settingsDialogEntityId}
                />
            )}
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Entities</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            commands.newEntity.execute();
                        }}
                    />
                </div>
            </div>
            {entities.map((entity) => (
                <div
                    key={entity.id}
                    className={`flex flex-row gap-2 px-4 py-2 transition ${selectedEntityIds.includes(entity.id) ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                    onClick={() => {
                        selectEntity(entity.id);
                    }}
                >
                    <div className="pr-2">{entity.name}</div>
                    <div className="flex-grow" />
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDialogEntityId(entity.id);
                            setSettingsDialogOpen(true);
                        }}
                    >
                        <GearSixIcon size={20} />
                    </button>
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteEntity(entity.id);
                        }}
                    >
                        <TrashIcon size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};
