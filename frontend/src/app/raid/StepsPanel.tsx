import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { StepSettingsDialog } from './StepSettingsDialog';
import { Button } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

export const StepsPanel = () => {
    const raidId = useHashParam('id');

    const workspace = useSelector((state) => (raidId ? state.workspaces.raids[raidId] : undefined));

    const scene = useSelector((state) =>
        workspace?.openSceneId ? state.raids.scenes[workspace.openSceneId] : undefined,
    );

    const sceneWorkspace = useSelector((state) => (scene ? state.workspaces.scenes[scene.id] : undefined));

    const steps = Object.values(useSelector((state) => state.raids.steps)).filter((step) => step.sceneId === scene?.id);
    steps.sort((a, b) => a.order - b.order);

    const [settingsDialogStepId, setSettingsDialogStepId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const dispatch = useDispatch();

    const openStep = (id: string) => {
        if (scene) {
            dispatch.workspaces.openStep({ id, sceneId: scene.id });
        }
    };

    const deleteStep = (id: string) => {
        dispatch.raids.deleteStep({ id });
    };

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
            {steps.map((step) => (
                <div
                    key={step.id}
                    className={`flex flex-row gap-2 px-4 py-2 transition ${step.id === sceneWorkspace?.openStepId ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                    onClick={() => {
                        openStep(step.id);
                    }}
                >
                    <div className="pr-2">{step.name}</div>
                    <div className="flex-grow" />
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDialogStepId(step.id);
                            setSettingsDialogOpen(true);
                        }}
                    >
                        <GearSixIcon size={20} />
                    </button>
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteStep(step.id);
                        }}
                    >
                        <TrashIcon size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};
