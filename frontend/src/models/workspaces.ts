import { createModel } from '@rematch/core';

import { RootModel } from '.';

interface SceneWorkspace {
    id: string;

    openStepId?: string;
}

interface RaidWorkspace {
    id: string;
    lastActivityTime: number;

    openSceneId?: string;
}

interface WorkspacesState {
    raids: Record<string, RaidWorkspace>;
    scenes: Record<string, SceneWorkspace>;
}

export const workspaces = createModel<RootModel>()({
    state: {
        raids: {},
        scenes: {},
    } as WorkspacesState,
    reducers: {
        ensureRaid(state, id: string) {
            const existing = state.raids[id];
            if (!existing) {
                state.raids[id] = { id, lastActivityTime: Date.now() };
            } else {
                existing.lastActivityTime = Date.now();
            }
        },
        ensureScene(state, id: string) {
            const existing = state.scenes[id];
            if (!existing) {
                state.scenes[id] = { id };
            }
        },
        putRaid(state, workspace: RaidWorkspace) {
            state.raids[workspace.id] = workspace;
        },
        putScene(state, workspace: SceneWorkspace) {
            state.scenes[workspace.id] = workspace;
        },
        removeScene(state, id: string) {
            delete state.scenes[id];
            Object.values(state.raids).forEach((raid) => {
                if (raid.openSceneId === id) {
                    raid.openSceneId = undefined;
                }
            });
        },
    },
    effects: (dispatch) => ({
        // Ensures the workspace exists and updates its last open time.
        open(
            payload: {
                id: string;
            },
            state,
        ) {
            dispatch.workspaces.ensureRaid(payload.id);
        },
        openScene(
            payload: {
                id: string;
                raidId: string;
            },
            state,
        ) {
            dispatch.workspaces.ensureRaid(payload.raidId);
            const existing = state.workspaces.raids[payload.raidId];
            if (existing) {
                dispatch.workspaces.putRaid({ ...existing, openSceneId: payload.id });
            }
        },
        openStep(
            payload: {
                id: string;
                sceneId: string;
            },
            state,
        ) {
            dispatch.workspaces.ensureScene(payload.sceneId);
            const existing = state.workspaces.scenes[payload.sceneId];
            if (existing) {
                dispatch.workspaces.putScene({ ...existing, openStepId: payload.id });
            }
        },
    }),
});
