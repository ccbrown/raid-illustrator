import { OptionalNumberInput } from '@/components';
import { useStep } from '@/hooks';
import { useDispatch } from '@/store';

interface Props {
    id: string;
}

export const StepInspectorPanel = ({ id }: Props) => {
    const step = useStep(id);
    const dispatch = useDispatch();

    if (!step) {
        return null;
    }

    const updateRenderDuration = (newDuration: number | null) => {
        dispatch.raids.updateStep({ id: step.id, renderDuration: newDuration === null ? undefined : newDuration });
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col h-full overflow-auto">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{step.name}</div>
                <OptionalNumberInput
                    label="Render Duration (ms)"
                    value={step.renderDuration ?? null}
                    min={0}
                    maxFractionDigits={0}
                    onChange={updateRenderDuration}
                />
            </div>
        </div>
    );
};
