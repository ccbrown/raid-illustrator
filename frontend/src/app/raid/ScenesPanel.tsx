import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { useRaidId } from './hooks';
import { SceneSettingsDialog } from './SceneSettingsDialog';
import { Button } from '@/components';
import { useRaid, useRaidWorkspace, useScene } from '@/hooks';
import { useDispatch } from '@/store';

interface ListItemProps {
    id: string;
    onSettingsClick: () => void;
    openSceneId?: string;
}

const ListItem = ({ id, onSettingsClick, openSceneId }: ListItemProps) => {
    const scene = useScene(id);
    const dispatch = useDispatch();

    if (!scene) {
        return null;
    }

    const openScene = () => {
        if (scene) {
            dispatch.workspaces.openScene({ id, raidId: scene.raidId });
        }
    };

    const deleteScene = () => {
        dispatch.raids.deleteScene({ id });
    };

    return (
        <div
            className={`flex flex-row gap-2 px-4 py-2 transition ${scene.id === openSceneId ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
            onClick={() => {
                openScene();
            }}
        >
            <div className="pr-2">{scene.name}</div>
            <div className="flex-grow" />
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    onSettingsClick();
                }}
            >
                <GearSixIcon size={18} />
            </button>
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteScene();
                }}
            >
                <TrashIcon size={18} />
            </button>
        </div>
    );
};

export const ScenesPanel = () => {
    const raidId = useRaidId();
    const raid = useRaid(raidId || '');
    const raidWorkspace = useRaidWorkspace(raidId || '');

    const [settingsDialogSceneId, setSettingsDialogSceneId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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
            {raid?.sceneIds.map((id) => (
                <ListItem
                    key={id}
                    id={id}
                    openSceneId={raidWorkspace?.openSceneId}
                    onSettingsClick={() => {
                        setSettingsDialogSceneId(id);
                        setSettingsDialogOpen(true);
                    }}
                />
            ))}
        </div>
    );
};
