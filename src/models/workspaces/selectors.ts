import { createSelector } from 'reselect';

import { PersistedRaidWorkspace, WorkspacesState } from './types';

const selectSceneWorkspacesInRaid = createSelector(
    [(state: WorkspacesState) => state.scenes, (_state: WorkspacesState, raidId: string) => raidId],
    (scenes, raidId) => Object.values(scenes).filter((scene) => scene.raidId === raidId),
);

export const selectPersistedRaidWorkspace = createSelector(
    [(state: WorkspacesState, raidId: string) => state.raids[raidId], selectSceneWorkspacesInRaid],
    (raid, scenes): PersistedRaidWorkspace | undefined => {
        if (!raid) {
            return undefined;
        }
        return {
            raid,
            scenes,
        };
    },
);
