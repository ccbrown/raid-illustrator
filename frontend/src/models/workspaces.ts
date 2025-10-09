import { createModel } from '@rematch/core';

import { RootModel } from '.';
import { RaidBatchOperation } from './raids';

interface SceneWorkspace {
    id: string;

    openStepId?: string;
}

interface UndoRedoStackAction {
    name: string;
    operation: RaidBatchOperation;
}

interface RaidWorkspace {
    id: string;
    lastActivityTime: number;

    openSceneId?: string;

    undoStack?: UndoRedoStackAction[];
    redoStack?: UndoRedoStackAction[];
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
        pushUndo(state, payload: { raidId: string; action: UndoRedoStackAction }) {
            const raid = state.raids[payload.raidId];
            if (!raid) {
                return;
            }
            if (!raid.undoStack) {
                raid.undoStack = [];
            }
            raid.undoStack.push(payload.action);
            raid.redoStack = [];
        },
        popUndo(state, raidId: string) {
            const raid = state.raids[raidId];
            if (!raid || !raid.undoStack || raid.undoStack.length === 0) {
                return;
            }
            raid.undoStack.pop();
        },
        pushRedo(state, payload: { raidId: string; action: UndoRedoStackAction }) {
            const raid = state.raids[payload.raidId];
            if (!raid) {
                return;
            }
            if (!raid.redoStack) {
                raid.redoStack = [];
            }
            raid.redoStack.push(payload.action);
        },
        popRedo(state, raidId: string) {
            const raid = state.raids[raidId];
            if (!raid || !raid.redoStack || raid.redoStack.length === 0) {
                return;
            }
            raid.redoStack.pop();
        },
    },
    effects: (dispatch) => ({
        // Ensures the workspace exists and updates its last open time.
        open(
            payload: {
                id: string;
            },
            _state,
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
        undo(
            payload: {
                raidId: string;
            },
            state,
        ) {
            const raid = state.workspaces.raids[payload.raidId];
            if (!raid || !raid.undoStack || raid.undoStack.length === 0) {
                return;
            }
            const item = raid.undoStack[raid.undoStack.length - 1];
            dispatch.workspaces.popUndo(payload.raidId);
            const redoOp = dispatch.raids.batchOperation(item.operation);
            dispatch.workspaces.pushRedo({ raidId: payload.raidId, action: { name: item.name, operation: redoOp } });
        },
        redo(
            payload: {
                raidId: string;
            },
            state,
        ) {
            const raid = state.workspaces.raids[payload.raidId];
            if (!raid || !raid.redoStack || raid.redoStack.length === 0) {
                return;
            }
            const item = raid.redoStack[raid.redoStack.length - 1];
            dispatch.workspaces.popRedo(payload.raidId);
            const undoOp = dispatch.raids.batchOperation(item.operation);
            dispatch.workspaces.pushUndo({ raidId: payload.raidId, action: { name: item.name, operation: undoOp } });
        },
    }),
});
