import { PlusIcon } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useCallback } from 'react';

import { Button, EditableText, ScrollList, ScrollListItem } from '@/components';
import { useRaid, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { RaidMetadata } from '@/models/raids/types';
import { fillSelectionRange } from '@/models/workspaces/utils';
import { useDispatch } from '@/store';

import { useCommands } from '../commands';
import { useRaidId } from '../hooks';

interface ListItemProps {
    id: string;
    openSceneId?: string;
    selectedSceneIds?: string[];
    raid: RaidMetadata;
}

const ListItem = ({ id, openSceneId, selectedSceneIds, raid }: ListItemProps) => {
    const scene = useScene(id);
    const dispatch = useDispatch();

    if (!scene) {
        return null;
    }

    const openScene = () => {
        if (scene) {
            dispatch.workspaces.openScene({ id });
            dispatch.workspaces.select({ raidId: scene.raidId, selection: { sceneIds: [scene.id] } });
        }
    };

    const fillSelection = () => {
        const newSelection = fillSelectionRange(raid.sceneIds, selectedSceneIds || [], scene.id);
        dispatch.workspaces.select({ raidId: scene.raidId, selection: { sceneIds: newSelection } });
    };

    const isOpen = scene.id === openSceneId;
    const isSelected = selectedSceneIds?.includes(scene.id);

    return (
        <div
            className={clsx('flex flex-row gap-2 px-2 py-1 transition border-indigo-400', {
                'bg-indigo-500': isSelected,
                'cursor-pointer': !isSelected,
                'bg-white/10 hover:bg-white/20': isOpen && !isSelected,
                'hover:bg-white/10': !isOpen && !isSelected,
                'border-l-4 pl-[4px]': isOpen,
            })}
            onContextMenu={(e) => {
                if (e.ctrlKey) {
                    // let the click handler deal handle control clicks
                    e.preventDefault();
                }
            }}
            onClick={(e) => {
                if (e.shiftKey) {
                    fillSelection();
                } else if (e.ctrlKey) {
                    // don't open the scene, just select or deselect it
                    if (isSelected) {
                        dispatch.workspaces.select({
                            raidId: scene.raidId,
                            selection: { sceneIds: selectedSceneIds?.filter((sid) => sid !== scene.id) || [] },
                        });
                    } else {
                        dispatch.workspaces.select({
                            raidId: scene.raidId,
                            selection: { sceneIds: [...(selectedSceneIds || []), scene.id] },
                        });
                    }
                } else {
                    openScene();
                }
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
        </div>
    );
};

export const ScenesPanel = () => {
    const raidId = useRaidId();
    const raid = useRaid(raidId || '');
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const selection = useSelection(raidId || '');
    const selectedSceneIds = selection?.sceneIds;
    const commands = useCommands();
    const dispatch = useDispatch();

    const onMove = useCallback(
        (movedId: string, targetId: string, position: 'above' | 'below') => {
            // if the moved item is part of the selection, move all selected items. otherwise just move the one
            const sceneIdsToMove = selectedSceneIds?.includes(movedId) ? selectedSceneIds : [movedId];
            dispatch.raids.reorderScenes({
                sceneIds: sceneIdsToMove,
                destinationSceneId: targetId,
                destinationPosition: position === 'above' ? 'before' : 'after',
            });
        },
        [selectedSceneIds, dispatch],
    );

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg flex flex-col min-h-48 overflow-auto">
            <div className="flex flex-row items-center py-2 border-b-1 border-elevation-2">
                <div className="px-4 font-semibold text-sm">Scenes</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            commands.newScene.execute();
                        }}
                        title="Add Scene"
                    />
                </div>
            </div>
            <ScrollList onMove={onMove}>
                {raid?.sceneIds.map((id) => {
                    const isOpenOrSelected = id === raidWorkspace?.openSceneId || selectedSceneIds?.includes(id);
                    return (
                        <ScrollListItem key={id} id={id} draggable scrollIntoView={isOpenOrSelected}>
                            <ListItem
                                id={id}
                                openSceneId={raidWorkspace?.openSceneId}
                                selectedSceneIds={selectedSceneIds || []}
                                raid={raid}
                            />
                        </ScrollListItem>
                    );
                })}
            </ScrollList>
        </div>
    );
};
