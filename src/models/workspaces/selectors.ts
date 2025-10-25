import { createSelector } from 'reselect';

import { PersistedRaidWorkspace, WorkspacesState } from './types';

export const selectPersistedRaidWorkspace = createSelector(
    [
        (state: WorkspacesState, raidId: string) => state.raids[raidId],
        (state: WorkspacesState, raidId: string) =>
            Object.values(state.scenes).filter((scene) => scene.raidId === raidId),
    ],
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
