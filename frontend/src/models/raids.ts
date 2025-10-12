import { createModel } from '@rematch/core';

import { RootModel } from '.';
import { Shape, ShapeCircle, ShapeRectangle } from '@/shapes';
import { Keyable, keyableValueAtStep, keyableWithValueAtStep } from '@/keyable';
import { AnyProperties } from '@/property-spec';
import { Material } from '@/renderer';

interface RaidMetadata {
    id: string;
    name: string;
    creationTime: number;

    sceneIds: string[];
}

type RaidSceneShape = ShapeRectangle | ShapeCircle;

export interface RaidScene {
    id: string;
    raidId: string;

    name: string;
    creationTime: number;
    shape: RaidSceneShape;

    stepIds: string[];
    entityIds: string[];
}

export interface RaidStep {
    id: string;
    raidId: string;
    sceneId: string;

    name: string;
    creationTime: number;
}

interface RaidEntityPropertiesGroup {
    type: 'group';
    children: string[];
}

interface RaidEntityPropertiesShapeEffect {
    id: string;
    factoryId: string;
    properties: AnyProperties;
}

export interface RaidEntityPropertiesShape {
    type: 'shape';
    shape: Shape;
    fill?: Material;
    position: Keyable<{ x: number; y: number }>;
    effects?: RaidEntityPropertiesShapeEffect[];
}

export type RaidEntityType = 'group' | 'shape';
type RaidEntityProperties = RaidEntityPropertiesGroup | RaidEntityPropertiesShape;

type PartialRaidEntityPropertiesGroup = Partial<Omit<RaidEntityPropertiesGroup, 'type'>> &
    Pick<RaidEntityPropertiesGroup, 'type'>;
type PartialRaidEntityPropertiesShape = Partial<Omit<RaidEntityPropertiesShape, 'type'>> &
    Pick<RaidEntityPropertiesShape, 'type'>;
export type PartialRaidEntityProperties = PartialRaidEntityPropertiesGroup | PartialRaidEntityPropertiesShape;

export interface RaidEntity {
    id: string;
    raidId: string;
    sceneId: string;

    name: string;
    creationTime: number;
    properties: RaidEntityProperties;
}

interface RaidsState {
    metadata: Record<string, RaidMetadata>;
    scenes: Record<string, RaidScene>;
    steps: Record<string, RaidStep>;
    entities: Record<string, RaidEntity>;
}

export interface RaidBatchOperation {
    putMetadata?: RaidMetadata;
    putScenes?: RaidScene[];
    removeScenes?: string[];
    putSteps?: RaidStep[];
    removeSteps?: string[];
    putEntities?: RaidEntity[];
    removeEntities?: string[];
}

export const raids = createModel<RootModel>()({
    state: {
        metadata: {},
        scenes: {},
        steps: {},
        entities: {},
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
        putEntity(state, entity: RaidEntity) {
            state.entities[entity.id] = entity;
        },
        removeEntity(state, entityId: string) {
            delete state.entities[entityId];
        },
    },
    effects: (dispatch) => ({
        create(
            payload: {
                name: string;
            },
            _state,
        ) {
            const newRaid = {
                id: crypto.randomUUID(),
                name: payload.name,
                creationTime: Date.now(),
                sceneIds: [],
            };

            dispatch.raids.putMetadata(newRaid);
            return newRaid.id;
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

            if (payload.putEntities) {
                for (const entity of payload.putEntities) {
                    const existing = state.raids.entities[entity.id];
                    if (existing) {
                        if (!undo.putEntities) {
                            undo.putEntities = [];
                        }
                        undo.putEntities.push(existing);
                    } else {
                        undo.removeEntities = undo.removeEntities || [];
                        undo.removeEntities.push(entity.id);
                    }
                    dispatch.raids.putEntity(entity);
                }
            }

            if (payload.removeEntities) {
                for (const entityId of payload.removeEntities) {
                    const existing = state.raids.entities[entityId];
                    if (existing) {
                        if (!undo.putEntities) {
                            undo.putEntities = [];
                        }
                        undo.putEntities.push(existing);
                        dispatch.raids.removeEntity(entityId);
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
            const raid = _state.raids.metadata[payload.raidId];
            if (!raid) {
                throw new Error('Raid not found');
            }

            const newScene = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                name: payload.name,
                creationTime: Date.now(),
                shape: payload.shape,
                stepIds: [],
                entityIds: [],
            };

            const newRaid = {
                ...raid,
                sceneIds: [...raid.sceneIds, newScene.id],
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Scene',
                raidId: payload.raidId,
                operation: {
                    putMetadata: newRaid,
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
        deleteScenes(
            payload: {
                ids: string[];
            },
            state,
        ) {
            if (payload.ids.length === 0) {
                return;
            }

            const existingScenes = payload.ids.map((id) => state.raids.scenes[id]).filter((s) => !!s);
            if (existingScenes.length === 0) {
                return;
            }

            const raidId = existingScenes[0].raidId;
            if (existingScenes.some((s) => s.raidId !== raidId)) {
                throw new Error('Can only delete scenes from one raid at a time');
            }

            const stepsToRemove = Object.values(state.raids.steps).filter((s) => payload.ids.includes(s.sceneId));
            const entitiesToRemove = Object.values(state.raids.entities).filter((e) => payload.ids.includes(e.sceneId));

            dispatch.raids.undoableBatchOperation({
                name: `Delete Scene${existingScenes.length > 1 ? 's' : ''}`,
                raidId,
                operation: {
                    removeEntities: entitiesToRemove.map((e) => e.id),
                    removeScenes: existingScenes.map((s) => s.id),
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
            const scene = state.raids.scenes[payload.sceneId];
            if (!scene) {
                throw new Error('Scene not found');
            }

            const newStep = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                sceneId: payload.sceneId,
                name: payload.name,
                creationTime: Date.now(),
            };

            const newScene = {
                ...scene,
                stepIds: [...scene.stepIds, newStep.id],
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Step',
                raidId: payload.raidId,
                operation: {
                    putScenes: [newScene],
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
        deleteSteps(
            payload: {
                ids: string[];
            },
            state,
        ) {
            if (payload.ids.length === 0) {
                return;
            }

            const existingSteps = payload.ids.map((id) => state.raids.steps[id]).filter((s) => !!s);
            if (existingSteps.length === 0) {
                return;
            }

            const raidId = existingSteps[0].raidId;
            if (existingSteps.some((s) => s.raidId !== raidId)) {
                throw new Error('Can only delete steps from one raid at a time');
            }

            dispatch.raids.undoableBatchOperation({
                name: `Delete Step${existingSteps.length > 1 ? 's' : ''}`,
                raidId,
                operation: {
                    removeSteps: existingSteps.map((s) => s.id),
                },
            });
        },
        createEntity(
            payload: {
                name: string;
                raidId: string;
                sceneId: string;
                properties: RaidEntityProperties;
            },
            state,
        ) {
            const scene = state.raids.scenes[payload.sceneId];
            if (!scene) {
                throw new Error('Scene not found');
            }

            const newEntity = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                sceneId: payload.sceneId,
                name: payload.name,
                creationTime: Date.now(),
                properties: payload.properties,
            };

            const newScene = {
                ...scene,
                entityIds: [...scene.entityIds, newEntity.id],
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Entity',
                raidId: payload.raidId,
                operation: {
                    putEntities: [newEntity],
                    putScenes: [newScene],
                },
            });

            return newEntity.id;
        },
        updateEntity(
            payload: {
                id: string;
                name?: string;
                properties?: PartialRaidEntityProperties;
            },
            state,
        ) {
            const existing = state.raids.entities[payload.id];
            if (!existing) {
                return;
            }

            const newEntity = {
                ...existing,
                ...{ ...payload, properties: existing.properties },
            };

            if (payload.properties) {
                if (existing.properties.type !== payload.properties.type) {
                    throw new Error('Cannot change entity type');
                }
                // The typechecker isn't smart enough to handle this narrowing here for each case.
                if (existing.properties.type === 'shape' && payload.properties.type === 'shape') {
                    newEntity.properties = { ...existing.properties, ...payload.properties };
                } else {
                    throw new Error('Unsupported entity properties update');
                }
            }

            dispatch.raids.undoableBatchOperation({
                name: 'Update Entity',
                raidId: existing.raidId,
                operation: {
                    putEntities: [newEntity],
                },
            });
        },
        moveEntities(
            payload: {
                stepId: string;
                entityIds: string[];
                offset: { x: number; y: number };
            },
            state,
        ) {
            const step = state.raids.steps[payload.stepId];
            if (!step) {
                return;
            }

            const scene = state.raids.scenes[step.sceneId];
            if (!scene) {
                return;
            }

            const entitiesToUpdate: RaidEntity[] = [];
            const toGather = [...payload.entityIds];

            while (toGather.length > 0) {
                const id = toGather.pop()!;
                const entity = state.raids.entities[id];
                if (!entity) {
                    continue;
                }

                switch (entity.properties.type) {
                    case 'shape':
                        entitiesToUpdate.push(entity);
                        break;
                    case 'group':
                        toGather.push(...entity.properties.children);
                        break;
                }
            }

            const updatedEntities: RaidEntity[] = [];

            for (const entity of entitiesToUpdate) {
                const ep = entity.properties;
                if (ep.type !== 'shape') {
                    continue;
                }

                const currentPosition = keyableValueAtStep(ep.position, scene.stepIds, payload.stepId);
                const newPosition = {
                    x: currentPosition.x + payload.offset.x,
                    y: currentPosition.y + payload.offset.y,
                };

                const newEntity = {
                    ...entity,
                    properties: {
                        ...ep,
                        position: keyableWithValueAtStep(ep.position, newPosition, scene.stepIds, payload.stepId),
                    },
                };

                updatedEntities.push(newEntity);
            }

            dispatch.raids.undoableBatchOperation({
                name: `Move Entit${payload.entityIds.length > 1 ? 'ies' : 'y'}`,
                raidId: scene.raidId,
                operation: {
                    putEntities: updatedEntities,
                },
            });
        },
        deleteEntities(
            payload: {
                ids: string[];
            },
            state,
        ) {
            if (payload.ids.length === 0) {
                return;
            }

            const existingEntities = payload.ids.map((id) => state.raids.entities[id]).filter((e) => !!e);
            if (existingEntities.length === 0) {
                return;
            }

            const raidId = existingEntities[0].raidId;
            if (existingEntities.some((e) => e.raidId !== raidId)) {
                throw new Error('Can only delete entities from one raid at a time');
            }

            dispatch.raids.undoableBatchOperation({
                name: `Delete Entit${existingEntities.length > 1 ? 'ies' : 'y'}`,
                raidId,
                operation: {
                    removeEntities: existingEntities.map((e) => e.id),
                },
            });

            dispatch.workspaces.removeEntitiesFromSelection({ raidId, entityIds: payload.ids });
        },
    }),
});
