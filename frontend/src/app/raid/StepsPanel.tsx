import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { useRaidId } from './hooks';
import { StepSettingsDialog } from './StepSettingsDialog';
import { Button } from '@/components';
import { useRaidWorkspace, useSceneWorkspace, useScene, useStep } from '@/hooks';
import { useDispatch } from '@/store';

interface ListItemProps {
    id: string;
    onSettingsClick: () => void;
    openStepId?: string;
}

const ListItem = ({ id, onSettingsClick, openStepId }: ListItemProps) => {
    const step = useStep(id);
    const dispatch = useDispatch();

    if (!step) {
        return null;
    }

    const openStep = () => {
        if (step) {
            dispatch.workspaces.openStep({ id, sceneId: step.sceneId });
        }
    };

    const deleteStep = () => {
        dispatch.raids.deleteStep({ id });
    };

    return (
        <div
            className={`flex flex-row gap-2 px-4 py-2 transition ${step.id === openStepId ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
            onClick={() => {
                openStep();
            }}
        >
            <div className="pr-2">{step.name}</div>
            <div className="flex-grow" />
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    onSettingsClick();
                }}
            >
                <GearSixIcon size={20} />
            </button>
            <button
                className="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteStep();
                }}
            >
                <TrashIcon size={18} />
            </button>
        </div>
    );
};

export const StepsPanel = () => {
    const raidId = useRaidId();
    const workspace = useRaidWorkspace(raidId || '');
    const scene = useScene(workspace?.openSceneId || '');
    const sceneWorkspace = useSceneWorkspace(scene?.id || '');

    const [settingsDialogStepId, setSettingsDialogStepId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            {raidId && scene && (
                <StepSettingsDialog
                    isOpen={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    raidId={raidId}
                    sceneId={scene.id}
                    stepId={settingsDialogStepId}
                />
            )}
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Steps</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            setSettingsDialogStepId(null);
                            setSettingsDialogOpen(true);
                        }}
                    />
                </div>
            </div>
            {scene?.stepIds.map((id) => (
                <ListItem
                    key={id}
                    id={id}
                    onSettingsClick={() => {
                        setSettingsDialogStepId(id);
                        setSettingsDialogOpen(true);
                    }}
                    openStepId={sceneWorkspace?.openStepId}
                />
            ))}
        </div>
    );
};
