import { PlusIcon } from '@phosphor-icons/react';
import clsx from 'clsx';

import { Button, EditableText } from '@/components';
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
            className={clsx('flex flex-row gap-2 px-2 py-2 transition', {
                'bg-indigo-500': isSelected,
                'cursor-pointer': !isSelected,
                'bg-white/10 hover:bg-white/20': isOpen && !isSelected,
                'hover:bg-white/10': !isOpen && !isSelected,
            })}
            onClick={() => {
                openStep();
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
    const commands = useCommands();

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
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
            {scene?.stepIds.map((id) => (
                <ListItem
                    key={id}
                    id={id}
                    openStepId={sceneWorkspace?.openStepId}
                    selectedStepIds={selection?.stepIds}
                />
            ))}
        </div>
    );
};
