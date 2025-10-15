import { useStep } from '@/hooks';

interface Props {
    id: string;
}

export const StepInspectorPanel = ({ id }: Props) => {
    const step = useStep(id);

    if (!step) {
        return null;
    }

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col h-full overflow-auto">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{step.name}</div>
            </div>
        </div>
    );
};
