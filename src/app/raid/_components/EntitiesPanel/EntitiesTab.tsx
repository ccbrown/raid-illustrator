import { useCallback, useState } from 'react';

import { EditableText, ScrollList, ScrollListItem } from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { RaidEntity } from '@/models/raids/types';
import { useDispatch } from '@/store';

import { useRaidId } from '../../hooks';
import { EntitySettingsDialog } from '../EntitySettingsDialog';

interface ListItemProps {
    entity: RaidEntity;
    selectedEntityIds: string[];
    level: number;
}

const ListItem = ({ entity, selectedEntityIds, level }: ListItemProps) => {
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
        <ScrollListItem id={entity.id} draggable>
            <div
                className={`flex flex-row gap-2 px-2 py-1 transition ${isSelected ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={(e) => {
                    if (e.shiftKey || e.ctrlKey) {
                        // toggle selection, leaving other selections as they are
                        if (isSelected) {
                            dispatch.workspaces.select({
                                raidId: entity.raidId,
                                selection: { entityIds: selectedEntityIds?.filter((sid) => sid !== entity.id) || [] },
                            });
                        } else {
                            dispatch.workspaces.select({
                                raidId: entity.raidId,
                                selection: { entityIds: [...(selectedEntityIds || []), entity.id] },
                            });
                        }
                    } else {
                        selectEntity();
                    }
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
        </ScrollListItem>
    );
};

interface ListItemsProps {
    id: string;
    selectedEntityIds: string[];
    level: number;
}

const ListItems = ({ id, selectedEntityIds, level }: ListItemsProps) => {
    const entity = useEntity(id);

    if (!entity) {
        return null;
    }

    const ep = entity.properties;
    return (
        <>
            <ListItem entity={entity} selectedEntityIds={selectedEntityIds} level={level} />
            {ep.type === 'group' &&
                ep.children.map((childId) => (
                    <ListItems key={childId} id={childId} level={level + 1} selectedEntityIds={selectedEntityIds} />
                ))}
        </>
    );
};

export const EntitiesTab = () => {
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const scene = useScene(workspace?.openSceneId || '');
    const dispatch = useDispatch();

    const selection = useSelection(raidId || '');
    const selectedEntityIds = selection?.entityIds;

    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const onMove = useCallback(
        (movedId: string, targetId: string, position: 'above' | 'below') => {
            // if the moved item is part of the selection, move all selected items. otherwise just move the one
            const entityIdsToMove = selectedEntityIds?.includes(movedId) ? selectedEntityIds : [movedId];
            dispatch.raids.reorderEntities({
                entityIds: entityIdsToMove,
                destinationEntityId: targetId,
                destinationPosition: position === 'above' ? 'before' : 'after',
            });
        },
        [selectedEntityIds, dispatch],
    );

    return (
        <div className="flex max-h-[400px]">
            {raidId && scene && (
                <EntitySettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    raidId={raidId}
                    sceneId={scene.id}
                />
            )}
            <ScrollList onMove={onMove}>
                {scene?.entityIds.map((id) => (
                    <ListItems key={id} id={id} selectedEntityIds={selectedEntityIds || []} level={0} />
                ))}
            </ScrollList>
        </div>
    );
};
