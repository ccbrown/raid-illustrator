import { useEffect, useState } from 'react';

import { Button, Dialog, TextField } from '@/components';
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

interface Props {
    isOpen?: boolean;
    raidId: string;
    sceneId: string;
    stepId?: string | null;
    onClose: () => void;
}

export const StepSettingsDialog = (props: Props) => {
    const step = useSelector((state) => state.raids.steps[props.stepId || '']);

    return (
        <Dialog
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            title={props.stepId ? 'Step Settings' : 'New Step'}
        >
            {props.raidId && (
                <StepSettings
                    onClose={() => props.onClose()}
                    raidId={props.raidId}
                    sceneId={props.sceneId}
                    existing={step}
                />
            )}
        </Dialog>
    );
};
