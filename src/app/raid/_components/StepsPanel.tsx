import { PlusIcon } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useCallback } from 'react';

import { Button, EditableText, ScrollList, ScrollListItem } from '@/components';
import { useRaidWorkspace, useScene, useSceneWorkspace, useSelection, useStep } from '@/hooks';
import { useDispatch } from '@/store';

import { useCommands } from '../commands';
import { useRaidId } from '../hooks';

interface ListItemProps {
    id: string;
    openStepId?: string;
    selectedStepIds?: string[];
}

const ListItem = ({ id, openStepId, selectedStepIds }: ListItemProps) => {
    const step = useStep(id);
    const dispatch = useDispatch();

    if (!step) {
        return null;
    }

    const openStep = () => {
        if (step) {
            dispatch.workspaces.openStep({ id, sceneId: step.sceneId });
            dispatch.workspaces.select({ raidId: step.raidId, selection: { stepIds: [step.id] } });
        }
    };

    const isOpen = step.id === openStepId;
    const isSelected = selectedStepIds?.includes(step.id);

    return (
        <div
            className={clsx('flex flex-row gap-2 px-2 py-1 transition', {
                'bg-indigo-500': isSelected,
                'cursor-pointer': !isSelected,
                'bg-white/10 hover:bg-white/20': isOpen && !isSelected,
                'hover:bg-white/10': !isOpen && !isSelected,
            })}
            onClick={(e) => {
                if (e.shiftKey || e.ctrlKey) {
                    // don't open the step, just select or deselect it
                    if (isSelected) {
                        dispatch.workspaces.select({
                            raidId: step.raidId,
                            selection: { stepIds: selectedStepIds?.filter((sid) => sid !== step.id) || [] },
                        });
                    } else {
                        dispatch.workspaces.select({
                            raidId: step.raidId,
                            selection: { stepIds: [...(selectedStepIds || []), step.id] },
                        });
                    }
                } else {
                    openStep();
                }
            }}
        >
            <EditableText
                className="text-sm"
                disabled={!isSelected}
                value={step.name}
                onChange={(newName) => {
                    dispatch.raids.updateStep({ id: step.id, name: newName });
                }}
            />
        </div>
    );
};

export const StepsPanel = () => {
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const scene = useScene(workspace?.openSceneId || '');
    const sceneWorkspace = useSceneWorkspace(scene?.id || '');
    const selection = useSelection(raidId || '');
    const selectedStepIds = selection?.stepIds;
    const commands = useCommands();
    const dispatch = useDispatch();

    const onMove = useCallback(
        (movedId: string, targetId: string, position: 'above' | 'below') => {
            // if the moved item is part of the selection, move all selected items. otherwise just move the one
            const stepIdsToMove = selectedStepIds?.includes(movedId) ? selectedStepIds : [movedId];
            dispatch.raids.reorderSteps({
                stepIds: stepIdsToMove,
                destinationStepId: targetId,
                destinationPosition: position === 'above' ? 'before' : 'after',
            });
        },
        [selectedStepIds, dispatch],
    );

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col min-h-64 overflow-auto">
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Steps</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            commands.newStep.execute();
                        }}
                    />
                </div>
            </div>
            <ScrollList onMove={onMove}>
                {scene?.stepIds.map((id) => (
                    <ScrollListItem key={id} id={id} draggable>
                        <ListItem
                            id={id}
                            openStepId={sceneWorkspace?.openStepId}
                            selectedStepIds={selectedStepIds || []}
                        />
                    </ScrollListItem>
                ))}
            </ScrollList>
        </div>
    );
};
