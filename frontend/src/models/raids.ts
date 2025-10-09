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
        createScene(
            payload: {
                name: string;
                shape: RaidSceneShape;
                raidId: string;
            },
            _state,
        ) {
            const id = crypto.randomUUID();
            const creationTime = Date.now();
            dispatch.raids.putScene({
                id,
                raidId: payload.raidId,
                name: payload.name,
                creationTime,
                shape: payload.shape,
            });
            return id;
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
            dispatch.raids.putScene({ ...existing, ...payload });
        },
        deleteScene(
            payload: {
                id: string;
            },
            state,
        ) {
            dispatch.raids.removeScene(payload.id);
            dispatch.workspaces.removeScene(payload.id);
        },
        createStep(
            payload: {
                name: string;
                raidId: string;
                sceneId: string;
            },
            state,
        ) {
            const id = crypto.randomUUID();
            const creationTime = Date.now();
            const stepsInScene = Object.values(state.raids.steps).filter((s) => s.sceneId === payload.sceneId);
            const maxOrder = stepsInScene.reduce((max, step) => (step.order > max ? step.order : max), 0);
            dispatch.raids.putStep({
                id,
                raidId: payload.raidId,
                sceneId: payload.sceneId,
                name: payload.name,
                order: maxOrder + 1,
                creationTime,
            });
            return id;
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
            dispatch.raids.putStep({ ...existing, ...payload });
        },
        deleteStep(
            payload: {
                id: string;
            },
            state,
        ) {
            dispatch.raids.removeStep(payload.id);
        },
    }),
});
