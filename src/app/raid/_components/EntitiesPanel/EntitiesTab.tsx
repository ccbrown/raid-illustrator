import { CaretRightIcon, CircleIcon, RectangleIcon, SquareIcon } from '@phosphor-icons/react';
import { useCallback, useState } from 'react';

import { EditableText, ScrollList, ScrollListItem } from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSelection } from '@/hooks';
import { selectParentByChildIds } from '@/models/raids/selectors';
import { RaidEntity } from '@/models/raids/types';
import { fillSelectionRange } from '@/models/workspaces/utils';
import { useDispatch, useSelector } from '@/store';

import { useRaidId } from '../../hooks';
import { EntitySettingsDialog } from '../EntitySettingsDialog';

interface ListItemProps {
    entity: RaidEntity;
    selectedEntityIds: string[];
    level: number;
    isGroupExpanded?: boolean;
}

const ListItem = ({ entity, isGroupExpanded, selectedEntityIds, level }: ListItemProps) => {
    const dispatch = useDispatch();
    const entityParent = useSelector((state) => selectParentByChildIds(state.raids, [entity.id]));

    const selectEntity = () => {
        dispatch.workspaces.select({ raidId: entity.raidId, selection: { entityIds: [entity.id] } });
    };

    const fillSelection = () => {
        if (!entityParent) {
            return;
        }
        const parentChildren =
            entityParent.type === 'scene'
                ? entityParent.scene.entityIds
                : entityParent.entity.properties.type === 'group'
                  ? entityParent.entity.properties.children
                  : [];
        const newSelection = fillSelectionRange(parentChildren, selectedEntityIds, entity.id);
        dispatch.workspaces.select({ raidId: entity.raidId, selection: { entityIds: newSelection } });
    };

    const toggleGroupExpansion = () => {
        if (entity.properties.type === 'group') {
            dispatch.workspaces.toggleGroupExpansion({ id: entity.id, sceneId: entity.raidId });
        }
    };

    if (!entity) {
        return null;
    }

    const ep = entity.properties;
    const iconSize = 12;
    const isSelected = selectedEntityIds.includes(entity.id);

    return (
        <ScrollListItem id={entity.id} draggable>
            <div
                className={`flex flex-row items-center gap-1 px-2 py-1 transition ${isSelected ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
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
                {ep.type === 'shape' &&
                    ep.shape.type === 'rectangle' &&
                    (ep.shape.width === ep.shape.height ? (
                        <SquareIcon size={iconSize} />
                    ) : (
                        <RectangleIcon size={iconSize} />
                    ))}
                {ep.type === 'shape' && ep.shape.type === 'circle' && <CircleIcon size={iconSize} />}
                {ep.type === 'group' && (
                    <CaretRightIcon
                        size={iconSize}
                        className={`transition cursor-pointer ${isGroupExpanded ? 'rotate-90' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupExpansion();
                        }}
                    />
                )}
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
    const isGroupExpanded = useSelector((state) =>
        state.workspaces.scenes[entity.raidId]?.expandedGroupIds?.includes(entity.id),
    );

    if (!entity) {
        return null;
    }

    const ep = entity.properties;
    return (
        <>
            <ListItem
                entity={entity}
                selectedEntityIds={selectedEntityIds}
                isGroupExpanded={isGroupExpanded}
                level={level}
            />
            {ep.type === 'group' &&
                isGroupExpanded &&
                ep.children.map((childId) => (
                    <ListItems
                        key={entity.id + ':' + childId}
                        id={childId}
                        level={level + 1}
                        selectedEntityIds={selectedEntityIds}
                    />
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
