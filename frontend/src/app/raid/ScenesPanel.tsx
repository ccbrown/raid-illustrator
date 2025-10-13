import { GearSixIcon, PlusIcon } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useState } from 'react';

import { Button, EditableText } from '@/components';
import { useRaid, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { useDispatch } from '@/store';

import { SceneSettingsDialog } from './SceneSettingsDialog';
import { useRaidId } from './hooks';

interface ListItemProps {
    id: string;
    onSettingsClick: () => void;
    openSceneId?: string;
    selectedSceneIds?: string[];
}

const ListItem = ({ id, onSettingsClick, openSceneId, selectedSceneIds }: ListItemProps) => {
    const scene = useScene(id);
    const dispatch = useDispatch();

    if (!scene) {
        return null;
    }

    const openScene = () => {
        if (scene) {
            dispatch.workspaces.openScene({ id, raidId: scene.raidId });
            dispatch.workspaces.select({ raidId: scene.raidId, selection: { sceneIds: [scene.id] } });
        }
    };

    const isOpen = scene.id === openSceneId;
    const isSelected = selectedSceneIds?.includes(scene.id);

    return (
        <div
            className={clsx('flex flex-row gap-2 px-2 py-2 transition', {
                'bg-indigo-500': isSelected,
                'cursor-pointer': !isSelected,
                'bg-white/10 hover:bg-white/20': isOpen && !isSelected,
                'hover:bg-white/10': !isOpen && !isSelected,
            })}
            onClick={() => {
                openScene();
            }}
        >
            <EditableText
                className="text-sm"
                disabled={!isSelected}
                value={scene.name}
                onChange={(newName) => {
                    dispatch.raids.updateScene({ id: scene.id, name: newName });
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
                <GearSixIcon size={18} />
            </button>
        </div>
    );
};

export const ScenesPanel = () => {
    const raidId = useRaidId();
    const raid = useRaid(raidId || '');
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const selection = useSelection(raidId || '');

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
                    selectedSceneIds={selection?.sceneIds}
                />
            ))}
        </div>
    );
};
