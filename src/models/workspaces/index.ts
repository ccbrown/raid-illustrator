import { createModel } from '@rematch/core';

import { RootModel } from '..';
import {
    EntityPresetDragData,
    RaidWorkspace,
    SceneWorkspace,
    Selection,
    UndoRedoStackAction,
    WorkspacesState,
} from './types';

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
                state.scenes[id] = { id, zoom: 0.35 };
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
        pushUndo(state, payload: { raidId: string; action: UndoRedoStackAction; preserveRedo?: boolean }) {
            const raid = state.raids[payload.raidId];
            if (!raid) {
                return;
            }
            if (!raid.undoStack) {
                raid.undoStack = [];
            }
            raid.undoStack.push(payload.action);
            if (!payload.preserveRedo) {
                raid.redoStack = [];
            }
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
            dispatch.workspaces.ensureScene(payload.id);
            const existing = state.workspaces.raids[payload.raidId];
            if (existing) {
                dispatch.workspaces.putRaid({ ...existing, openSceneId: payload.id });
            }
            const scene = state.workspaces.scenes[payload.id];
            if (scene && !scene.openStepId) {
                const raidState = state.raids;
                const raidScene = raidState.scenes[payload.id];
                if (raidScene && raidScene.stepIds.length > 0) {
                    dispatch.workspaces.openStep({ id: raidScene.stepIds[0], sceneId: payload.id });
                }
            }
        },
        revalidateSelection(payload: { raidId: string }, state) {
            const raid = state.workspaces.raids[payload.raidId];
            if (!raid || !raid.selection) {
                return;
            }

            const sel = { ...raid.selection };
            if (sel.entityIds) {
                sel.entityIds = sel.entityIds.filter((id) => !!state.raids.entities[id]);
            }
            if (sel.stepIds) {
                sel.stepIds = sel.stepIds.filter((id) => !!state.raids.steps[id]);
            }
            if (sel.sceneIds) {
                sel.sceneIds = sel.sceneIds.filter((id) => !!state.raids.scenes[id]);
            }
            dispatch.workspaces.putRaid({ ...raid, selection: sel });
        },
        updateScene(
            payload: {
                id: string;
                zoom?: number;
                center?: { x: number; y: number };
            },
            state,
        ) {
            dispatch.workspaces.ensureScene(payload.id);
            const existing = state.workspaces.scenes[payload.id];
            if (existing) {
                dispatch.workspaces.putScene({ ...existing, ...payload });
            }
        },
        toggleGroupExpansion(
            payload: {
                id: string;
                sceneId: string;
            },
            state,
        ) {
            dispatch.workspaces.ensureScene(payload.sceneId);
            const existing = state.workspaces.scenes[payload.sceneId];
            if (existing) {
                const expandedGroupIds = [...(existing.expandedGroupIds || [])];
                const index = expandedGroupIds.indexOf(payload.id);
                if (index === -1) {
                    expandedGroupIds.push(payload.id);
                } else {
                    expandedGroupIds.splice(index, 1);
                }
                dispatch.workspaces.putScene({ ...existing, expandedGroupIds });
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
        putEntityPresetDragData(
            payload: {
                raidId: string;
                data?: EntityPresetDragData;
            },
            state,
        ) {
            dispatch.workspaces.ensureRaid(payload.raidId);
            const existing = state.workspaces.raids[payload.raidId];
            if (existing) {
                dispatch.workspaces.putRaid({ ...existing, entityPresetDragData: payload.data });
            }
        },
        openEntitiesPanelTab(
            payload: {
                raidId: string;
                tab: 'entities' | 'presets';
            },
            state,
        ) {
            dispatch.workspaces.ensureRaid(payload.raidId);
            const existing = state.workspaces.raids[payload.raidId];
            if (existing) {
                dispatch.workspaces.putRaid({ ...existing, entitiesPanelTab: payload.tab });
            }
        },
        select(
            payload: {
                raidId: string;
                selection: Selection | undefined;
            },
            state,
        ) {
            dispatch.workspaces.ensureRaid(payload.raidId);
            const existing = state.workspaces.raids[payload.raidId];
            if (existing) {
                dispatch.workspaces.putRaid({ ...existing, selection: payload.selection });
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
            dispatch.workspaces.pushUndo({
                raidId: payload.raidId,
                action: { name: item.name, operation: undoOp },
                preserveRedo: true,
            });
        },
    }),
});
