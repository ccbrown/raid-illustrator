import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button, Dialog, TextField } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';
import { RaidStep } from '@/models/raids';

interface StepSettingsProps {
    existing?: RaidStep;
    raidId: string;
    sceneId: string;
    onClose?: () => void;
}

const StepSettings = (props: StepSettingsProps) => {
    const dispatch = useDispatch();

    const [populatedFromId, setPopulatedFromId] = useState('');
    const [name, setName] = useState('New Step');

    useEffect(() => {
        if (props.existing && props.existing.id !== populatedFromId) {
            setPopulatedFromId(props.existing.id);
            setName(props.existing.name);
        }
    }, [props.existing, populatedFromId]);

    const hasValidInput = !!name.trim();

    const submit = () => {
        if (!hasValidInput) {
            return;
        }

        const update = {
            name,
        };
        if (props.existing) {
            dispatch.raids.updateStep({ id: props.existing.id, ...update });
        } else {
            const id = dispatch.raids.createStep({ raidId: props.raidId, sceneId: props.sceneId, ...update });
            dispatch.workspaces.openStep({ id, sceneId: props.sceneId });
        }

        if (props.onClose) {
            props.onClose();
        }
    };

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <TextField label="Name" value={name} onChange={setName} />
            <div className="flex flex-row justify-end">
                <Button text={props.existing ? 'Update Step' : 'Add Step'} type="submit" disabled={!hasValidInput} />
            </div>
        </form>
    );
};

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

    const settingsDialogStep = settingsDialogStepId ? steps.find((s) => s.id === settingsDialogStepId) : undefined;

    const dispatch = useDispatch();

    const openStep = (id: string) => {
        if (scene) {
            dispatch.workspaces.openStep({ id, sceneId: scene.id });
        }
    };

    const deleteStep = (id: string) => {
        if (confirm('Are you sure you want to delete this step? This action cannot be undone.')) {
            dispatch.raids.deleteStep({ id });
        }
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            <Dialog
                isOpen={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                title={settingsDialogStepId ? 'Step Settings' : 'New Step'}
            >
                {raidId && scene && (
                    <StepSettings
                        onClose={() => setSettingsDialogOpen(false)}
                        raidId={raidId}
                        sceneId={scene.id}
                        existing={settingsDialogStep}
                    />
                )}
            </Dialog>
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
