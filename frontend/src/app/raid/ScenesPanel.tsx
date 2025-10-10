import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { SceneSettingsDialog } from './SceneSettingsDialog';
import { Button } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

export const ScenesPanel = () => {
    const raidId = useHashParam('id');
    const scenes = Object.values(useSelector((state) => state.raids.scenes)).filter((scene) => scene.raidId === raidId);
    scenes.sort((a, b) => a.name.localeCompare(b.name));

    const workspace = useSelector((state) => (raidId ? state.workspaces.raids[raidId] : undefined));

    const [settingsDialogSceneId, setSettingsDialogSceneId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const dispatch = useDispatch();

    const openScene = (id: string) => {
        if (raidId) {
            dispatch.workspaces.openScene({ id, raidId });
        }
    };

    const deleteScene = (id: string) => {
        dispatch.raids.deleteScene({ id });
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            {raidId && (
                <SceneSettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    sceneId={settingsDialogSceneId}
                    raidId={raidId}
                />
            )}
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Scenes</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            setSettingsDialogSceneId(null);
                            setSettingsDialogOpen(true);
                        }}
                    />
                </div>
            </div>
            {scenes.map((scene) => (
                <div
                    key={scene.id}
                    className={`flex flex-row gap-2 px-4 py-2 transition ${scene.id === workspace?.openSceneId ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                    onClick={() => {
                        openScene(scene.id);
                    }}
                >
                    <div className="pr-2">{scene.name}</div>
                    <div className="flex-grow" />
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDialogSceneId(scene.id);
                            setSettingsDialogOpen(true);
                        }}
                    >
                        <GearSixIcon size={18} />
                    </button>
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteScene(scene.id);
                        }}
                    >
                        <TrashIcon size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};
