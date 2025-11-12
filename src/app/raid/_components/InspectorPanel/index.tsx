import { useSelection } from '@/hooks';

import { useRaidId } from '../../hooks';
import { EntityInspectorPanel } from './EntityInspectorPanel';
import { SceneInspectorPanel } from './SceneInspectorPanel';
import { StepInspectorPanel } from './StepInspectorPanel';

export const InspectorPanel = () => {
    const raidId = useRaidId();
    const selection = useSelection(raidId);

    if (!selection) {
        return null;
    }

    if (
        (selection.entityIds?.length || 0) + (selection.stepIds?.length || 0) + (selection.sceneIds?.length || 0) !==
        1
    ) {
        return null;
    }

    if (selection.entityIds?.length) {
        return <EntityInspectorPanel id={selection.entityIds[0]} />;
    }

    if (selection.stepIds?.length) {
        return <StepInspectorPanel id={selection.stepIds[0]} />;
    }

    if (selection.sceneIds?.length) {
        return <SceneInspectorPanel id={selection.sceneIds[0]} />;
    }

    return null;
};
