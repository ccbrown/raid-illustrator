import { createModel } from '@rematch/core';

import { RootModel } from '.';

interface RaidMetadata {
    id: string;
    name: string;
    creationTime: number;
}

interface RaidSceneShapeRectangle {
    type: 'rectangle';
    width: number;
    height: number;
}

interface RaidSceneShapeCircle {
    type: 'circle';
    radius: number;
}

type RaidSceneShape = RaidSceneShapeRectangle | RaidSceneShapeCircle;

export interface RaidScene {
    id: string;
    raidId: string;

    name: string;
    creationTime: number;
    shape: RaidSceneShape;
}

export interface RaidStep {
    id: string;
    raidId: string;
    sceneId: string;

    name: string;
    order: number;
    creationTime: number;
}

interface RaidsState {
    metadata: Record<string, RaidMetadata>;
    scenes: Record<string, RaidScene>;
    steps: Record<string, RaidStep>;
}

export interface RaidBatchOperation {
    putMetadata?: RaidMetadata;
    putScenes?: RaidScene[];
    removeScenes?: string[];
    putSteps?: RaidStep[];
    removeSteps?: string[];
}

export const raids = createModel<RootModel>()({
    state: {
        metadata: {},
        scenes: {},
        steps: {},
    } as RaidsState,
    reducers: {
        putMetadata(state, metadata: RaidMetadata) {
            state.metadata[metadata.id] = metadata;
        },
        putScene(state, scene: RaidScene) {
            state.scenes[scene.id] = scene;
        },
        removeScene(state, sceneId: string) {
            delete state.scenes[sceneId];
            for (const stepId in state.steps) {
                if (state.steps[stepId].sceneId === sceneId) {
                    delete state.steps[stepId];
                }
            }
        },
        putStep(state, step: RaidStep) {
            state.steps[step.id] = step;
        },
        removeStep(state, stepId: string) {
            delete state.steps[stepId];
        },
    },
    effects: (dispatch) => ({
        create(
            payload: {
                name: string;
            },
            _state,
        ) {
            const id = crypto.randomUUID();
            const creationTime = Date.now();
            dispatch.raids.putMetadata({ id, name: payload.name, creationTime });
            return id;
        },
        update(
            payload: {
                id: string;
                name?: string;
            },
            state,
        ) {
            const existing = state.raids.metadata[payload.id];
            if (!existing) {
                return;
            }
            dispatch.raids.putMetadata({ ...existing, ...payload });
        },
        // performs a batch operation and returns the inverse operation to undo it
        batchOperation(payload: RaidBatchOperation, state) {
            const undo: RaidBatchOperation = {};

            if (payload.putMetadata) {
                const existing = state.raids.metadata[payload.putMetadata.id];
                if (existing) {
                    undo.putMetadata = existing;
                }
                dispatch.raids.putMetadata(payload.putMetadata);
            }

            if (payload.putScenes) {
                for (const scene of payload.putScenes) {
                    const existing = state.raids.scenes[scene.id];
                    if (existing) {
                        if (!undo.putScenes) {
                            undo.putScenes = [];
                        }
                        undo.putScenes.push(existing);
                    } else {
                        undo.removeScenes = undo.removeScenes || [];
                        undo.removeScenes.push(scene.id);
                    }
                    dispatch.raids.putScene(scene);
                }
            }

            if (payload.removeScenes) {
                for (const sceneId of payload.removeScenes) {
                    const existing = state.raids.scenes[sceneId];
                    if (existing) {
                        if (!undo.putScenes) {
                            undo.putScenes = [];
                        }
                        undo.putScenes.push(existing);
                        dispatch.raids.removeScene(sceneId);
                    }
                }
            }

            if (payload.putSteps) {
                for (const step of payload.putSteps) {
                    const existing = state.raids.steps[step.id];
                    if (existing) {
                        if (!undo.putSteps) {
                            undo.putSteps = [];
                        }
                        undo.putSteps.push(existing);
                    } else {
                        undo.removeSteps = undo.removeSteps || [];
                        undo.removeSteps.push(step.id);
                    }
                    dispatch.raids.putStep(step);
                }
            }

            if (payload.removeSteps) {
                for (const stepId of payload.removeSteps) {
                    const existing = state.raids.steps[stepId];
                    if (existing) {
                        if (!undo.putSteps) {
                            undo.putSteps = [];
                        }
                        undo.putSteps.push(existing);
                        dispatch.raids.removeStep(stepId);
                    }
                }
            }

            return undo;
        },
        undoableBatchOperation(
            payload: {
                name: string;
                raidId: string;
                operation: RaidBatchOperation;
            },
            _state,
        ) {
            const undoOp = dispatch.raids.batchOperation(payload.operation);
            dispatch.workspaces.pushUndo({
                raidId: payload.raidId,
                action: {
                    name: payload.name,
                    operation: undoOp,
                },
            });
        },
        createScene(
            payload: {
                name: string;
                shape: RaidSceneShape;
                raidId: string;
            },
            _state,
        ) {
            const newScene = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                name: payload.name,
                creationTime: Date.now(),
                shape: payload.shape,
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Scene',
                raidId: payload.raidId,
                operation: {
                    putScenes: [newScene],
                },
            });

            return newScene.id;
        },
        updateScene(
            payload: {
                id: string;
                name?: string;
                shape?: RaidSceneShape;
            },
            state,
        ) {
            const existing = state.raids.scenes[payload.id];
            if (!existing) {
                return;
            }

            const newScene = { ...existing, ...payload };

            dispatch.raids.undoableBatchOperation({
                name: 'Update Scene',
                raidId: existing.raidId,
                operation: {
                    putScenes: [newScene],
                },
            });
        },
        deleteScene(
            payload: {
                id: string;
            },
            state,
        ) {
            const existing = state.raids.scenes[payload.id];
            if (!existing) {
                return;
            }

            const stepsToRemove = Object.values(state.raids.steps).filter((s) => s.sceneId === payload.id);

            dispatch.raids.undoableBatchOperation({
                name: 'Delete Scene',
                raidId: existing.raidId,
                operation: {
                    removeScenes: [payload.id],
                    removeSteps: stepsToRemove.map((s) => s.id),
                },
            });
        },
        createStep(
            payload: {
                name: string;
                raidId: string;
                sceneId: string;
            },
            state,
        ) {
            const stepsInScene = Object.values(state.raids.steps).filter((s) => s.sceneId === payload.sceneId);
            const maxOrder = stepsInScene.reduce((max, step) => (step.order > max ? step.order : max), 0);

            const newStep = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                sceneId: payload.sceneId,
                name: payload.name,
                order: maxOrder + 1,
                creationTime: Date.now(),
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Step',
                raidId: payload.raidId,
                operation: {
                    putSteps: [newStep],
                },
            });

            return newStep.id;
        },
        updateStep(
            payload: {
                id: string;
                name?: string;
            },
            state,
        ) {
            const existing = state.raids.steps[payload.id];
            if (!existing) {
                return;
            }

            const newStep = { ...existing, ...payload };

            dispatch.raids.undoableBatchOperation({
                name: 'Update Step',
                raidId: existing.raidId,
                operation: {
                    putSteps: [newStep],
                },
            });
        },
        deleteStep(
            payload: {
                id: string;
            },
            state,
        ) {
            const existing = state.raids.steps[payload.id];
            if (!existing) {
                return;
            }

            dispatch.raids.undoableBatchOperation({
                name: 'Delete Step',
                raidId: existing.raidId,
                operation: {
                    removeSteps: [payload.id],
                },
            });
        },
    }),
});
