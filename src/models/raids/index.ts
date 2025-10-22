import { createModel } from '@rematch/core';

import { RootModel } from '..';
import {
    selectEntitiesInScene,
    selectEntityAndDescendants,
    selectEntityExport,
    selectGroupByChildId,
    selectParentByChildIds,
    selectRaidSharedBySceneIds,
    selectRelativeOrderOfEntityIds,
    selectSceneExport,
    selectSceneSharedByEntityIds,
    selectSceneSharedByStepIds,
    selectStepExport,
    selectStepsInScene,
} from './selectors';
import {
    Exports,
    Keyable,
    Material,
    RaidBatchOperation,
    RaidEntity,
    RaidEntityProperties,
    RaidEntityUpdate,
    RaidMetadata,
    RaidScene,
    RaidSceneShape,
    RaidStep,
    RaidsState,
} from './types';
import {
    cloneEntityAndChildren,
    cloneSceneStepsAndEntities,
    cloneStep,
    importOperation,
    keyableValueAtStep,
    keyableWithUnkeyedSteps,
    keyableWithValueAtStep,
    updateKeyedEntitiesValues,
    updateKeyedEntityValues,
} from './utils';

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
        remove(state, raidId: string) {
            const raid = state.metadata[raidId];
            if (!raid) {
                return;
            }
            delete state.metadata[raidId];
            for (const sceneId of raid.sceneIds) {
                const scene = state.scenes[sceneId];
                if (!scene) {
                    continue;
                }
                delete state.scenes[sceneId];
                for (const stepId of scene.stepIds) {
                    delete state.steps[stepId];
                }
                for (const entityId of scene.entityIds) {
                    delete state.entities[entityId];
                }
            }
        },
        putScene(state, scene: RaidScene) {
            state.scenes[scene.id] = scene;
        },
        removeScene(state, sceneId: string) {
            const scene = state.scenes[sceneId];
            if (!scene) {
                return;
            }
            delete state.scenes[sceneId];
            for (const stepId in state.steps) {
                if (state.steps[stepId].sceneId === sceneId) {
                    delete state.steps[stepId];
                }
            }
            for (const entityId in state.entities) {
                if (state.entities[entityId].sceneId === sceneId) {
                    delete state.entities[entityId];
                }
            }
            const raid = state.metadata[scene.raidId];
            if (raid) {
                raid.sceneIds = raid.sceneIds.filter((id) => id !== sceneId);
            }
        },
        putStep(state, step: RaidStep) {
            state.steps[step.id] = step;
        },
        removeStep(state, stepId: string) {
            const step = state.steps[stepId];
            if (!step) {
                return;
            }
            const entitiesInScene = selectEntitiesInScene(state, step.sceneId);
            const updatedEntities = updateKeyedEntitiesValues(entitiesInScene, (k) =>
                keyableWithUnkeyedSteps(k, [stepId]),
            );
            for (const entity of updatedEntities) {
                state.entities[entity.id] = entity;
            }
            delete state.steps[stepId];
            const scene = state.scenes[step.sceneId];
            if (scene) {
                scene.stepIds = scene.stepIds.filter((id) => id !== stepId);
            }
        },
        putEntity(state, entity: RaidEntity) {
            state.entities[entity.id] = entity;
        },
        removeEntity(state, entityId: string) {
            const entity = state.entities[entityId];
            if (!entity) {
                return;
            }
            const toDelete = selectEntityAndDescendants(state, entityId);
            for (const entity of toDelete) {
                delete state.entities[entity.id];
            }
            const scene = state.scenes[entity.sceneId];
            if (scene) {
                scene.entityIds = scene.entityIds.filter((id) => id !== entityId);
            }
        },
    },
    effects: (dispatch) => ({
        delete(
            payload: {
                id: string;
            },
            _state,
        ) {
            dispatch.raids.remove(payload.id);
        },
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
            const undoScenes = new Set<string>();

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
                        undoScenes.add(existing.id);
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
                    if (!existing) {
                        continue;
                    }

                    const entitiesInScene = selectEntitiesInScene(state.raids, sceneId);
                    for (const entity of entitiesInScene) {
                        if (!undo.putEntities) {
                            undo.putEntities = [];
                        }
                        undo.putEntities.push(entity);
                    }

                    const stepsInScene = selectStepsInScene(state.raids, sceneId);
                    for (const step of stepsInScene) {
                        if (!undo.putSteps) {
                            undo.putSteps = [];
                        }
                        undo.putSteps.push(step);
                    }

                    const raid = state.raids.metadata[existing.raidId];
                    if (raid && !undo.putMetadata) {
                        undo.putMetadata = raid;
                    }

                    if (!undo.putScenes) {
                        undo.putScenes = [];
                    }
                    undo.putScenes.push(existing);
                    dispatch.raids.removeScene(sceneId);
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
                    if (!existing) {
                        continue;
                    }

                    if (!undoScenes.has(existing.sceneId)) {
                        if (!undo.putScenes) {
                            undo.putScenes = [];
                        }
                        undo.putScenes.push(state.raids.scenes[existing.sceneId]);
                        undoScenes.add(existing.sceneId);
                    }

                    const toDelete = selectEntityAndDescendants(state.raids, entityId);
                    if (!undo.putEntities) {
                        undo.putEntities = [];
                    }
                    undo.putEntities.push(...toDelete);
                    dispatch.raids.removeEntity(entityId);
                }
            }

            if (payload.removeSteps) {
                const entitiesWithKeyedStep = new Map<string, RaidEntity>();

                for (const stepId of payload.removeSteps) {
                    const existing = state.raids.steps[stepId];
                    if (!existing) {
                        continue;
                    }

                    if (!undoScenes.has(existing.sceneId)) {
                        if (!undo.putScenes) {
                            undo.putScenes = [];
                        }
                        undo.putScenes.push(state.raids.scenes[existing.sceneId]);
                        undoScenes.add(existing.sceneId);
                    }

                    const entitiesInScene = selectEntitiesInScene(state.raids, existing.sceneId);
                    for (const e of entitiesInScene) {
                        let hasKey = false;
                        updateKeyedEntityValues(e, (k) => {
                            if (stepId in k.steps) {
                                hasKey = true;
                            }
                            return k;
                        });
                        if (hasKey) {
                            entitiesWithKeyedStep.set(e.id, e);
                        }
                    }

                    if (!undo.putSteps) {
                        undo.putSteps = [];
                    }
                    undo.putSteps.push(existing);
                    dispatch.raids.removeStep(stepId);
                }

                for (const entity of entitiesWithKeyedStep.values()) {
                    if (!undo.putEntities) {
                        undo.putEntities = [];
                    }
                    undo.putEntities.push(entity);
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
                fill?: Material;
                raidId: string;
                afterSceneId?: string;
            },
            state,
        ) {
            const raid = state.raids.metadata[payload.raidId];
            if (!raid) {
                throw new Error('Raid not found');
            }

            const newScene: RaidScene = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                name: payload.name,
                creationTime: Date.now(),
                shape: payload.shape,
                fill: payload.fill,
                stepIds: [],
                entityIds: [],
            };

            const newStep = {
                id: crypto.randomUUID(),
                raidId: payload.raidId,
                sceneId: newScene.id,
                name: 'Start',
                creationTime: Date.now(),
            };
            newScene.stepIds.push(newStep.id);

            let newSceneIds: string[];
            if (payload.afterSceneId) {
                const index = raid.sceneIds.indexOf(payload.afterSceneId) ?? raid.sceneIds.length - 1;
                newSceneIds = [...raid.sceneIds.slice(0, index + 1), newScene.id, ...raid.sceneIds.slice(index + 1)];
            } else {
                newSceneIds = [...raid.sceneIds, newScene.id];
            }

            const newRaid = {
                ...raid,
                sceneIds: newSceneIds,
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Create Scene',
                raidId: payload.raidId,
                operation: {
                    putMetadata: newRaid,
                    putScenes: [newScene],
                    putSteps: [newStep],
                },
            });

            return newScene;
        },
        reorderScenes(
            payload: {
                sceneIds: string[];
                destinationSceneId: string;
                destinationPosition: 'before' | 'after';
            },
            state,
        ) {
            const movingSceneIds = payload.sceneIds.filter((id) => id !== payload.destinationSceneId);
            if (movingSceneIds.length === 0) {
                return;
            }

            const raid = selectRaidSharedBySceneIds(state.raids, [...movingSceneIds, payload.destinationSceneId]);
            if (!raid) {
                return;
            }

            const unmovingSceneIds = raid.sceneIds.filter((id) => !movingSceneIds.includes(id));
            let insertIndex = unmovingSceneIds.indexOf(payload.destinationSceneId);
            if (payload.destinationPosition === 'after') {
                insertIndex += 1;
            }

            const newSceneIds = [
                ...unmovingSceneIds.slice(0, insertIndex),
                ...movingSceneIds,
                ...unmovingSceneIds.slice(insertIndex),
            ];
            const newRaid = {
                ...raid,
                sceneIds: newSceneIds,
            };
            dispatch.raids.undoableBatchOperation({
                name: 'Reorder Scenes',
                raidId: raid.id,
                operation: {
                    putMetadata: newRaid,
                },
            });
        },
        reorderSteps(
            payload: {
                stepIds: string[];
                destinationStepId: string;
                destinationPosition: 'before' | 'after';
            },
            state,
        ) {
            const movingStepIds = payload.stepIds.filter((id) => id !== payload.destinationStepId);
            if (movingStepIds.length === 0) {
                return;
            }

            const scene = selectSceneSharedByStepIds(state.raids, [...movingStepIds, payload.destinationStepId]);
            if (!scene) {
                return;
            }

            const unmovingStepIds = scene.stepIds.filter((id) => !movingStepIds.includes(id));
            let insertIndex = unmovingStepIds.indexOf(payload.destinationStepId);
            if (payload.destinationPosition === 'after') {
                insertIndex += 1;
            }

            const newStepIds = [
                ...unmovingStepIds.slice(0, insertIndex),
                ...movingStepIds,
                ...unmovingStepIds.slice(insertIndex),
            ];
            const newScene = {
                ...scene,
                stepIds: newStepIds,
            };
            dispatch.raids.undoableBatchOperation({
                name: 'Reorder Steps',
                raidId: scene.raidId,
                operation: {
                    putScenes: [newScene],
                },
            });
        },
        reorderEntities(
            payload: {
                entityIds: string[];
                destinationEntityId: string;
                destinationPosition: 'before' | 'after';
            },
            state,
        ) {
            // buckle up...

            const movingEntityIds = payload.entityIds.filter((id) => id !== payload.destinationEntityId);
            if (movingEntityIds.length === 0) {
                return;
            }

            const scene = selectSceneSharedByEntityIds(state.raids, [...movingEntityIds, payload.destinationEntityId]);
            if (!scene) {
                return;
            }

            const orderedMovingEntityIds = selectRelativeOrderOfEntityIds(state.raids, movingEntityIds);

            // remove all of the moving entity ids from the scene and their groups
            let newSceneEntityIds = scene.entityIds.filter((id) => !movingEntityIds.includes(id));

            const updatedEntities = new Map<string, RaidEntity>();

            for (const movingEntityId of movingEntityIds) {
                const group = selectGroupByChildId(state.raids, movingEntityId);
                if (!group) {
                    continue;
                }
                const dest = updatedEntities.get(group.id) || group;
                if (dest.properties.type !== 'group') {
                    continue;
                }
                const dp = dest.properties;
                const newChildren = dp.children.filter((id) => id !== movingEntityId);
                if (newChildren.length === dp.children.length) {
                    continue;
                }
                const updatedGroup = {
                    ...group,
                    properties: {
                        ...dp,
                        children: newChildren,
                    },
                };
                updatedEntities.set(group.id, updatedGroup);
            }

            // insert the moving entities at the destination
            const destinationGroup = selectGroupByChildId(state.raids, payload.destinationEntityId);
            let destinationSiblings = newSceneEntityIds;
            if (destinationGroup) {
                const dest = updatedEntities.get(destinationGroup.id) || destinationGroup;
                if (dest && dest.properties.type === 'group') {
                    destinationSiblings = dest.properties.children;
                }
            }
            let insertIndex = destinationSiblings.indexOf(payload.destinationEntityId);
            if (payload.destinationPosition === 'after') {
                insertIndex += 1;
            }
            const newDestinationChildren = [
                ...destinationSiblings.slice(0, insertIndex),
                ...orderedMovingEntityIds,
                ...destinationSiblings.slice(insertIndex),
            ];
            if (destinationGroup && destinationGroup.properties.type === 'group') {
                const newGroup = {
                    ...destinationGroup,
                    properties: {
                        ...destinationGroup.properties,
                        children: newDestinationChildren,
                    },
                };
                updatedEntities.set(destinationGroup.id, newGroup);
            } else {
                newSceneEntityIds = newDestinationChildren;
            }

            // phew! time to commit the updates
            const newScene = {
                ...scene,
                entityIds: newSceneEntityIds,
            };
            dispatch.raids.undoableBatchOperation({
                name: 'Reorder Entities',
                raidId: scene.raidId,
                operation: {
                    putScenes: [newScene],
                    putEntities: Array.from(updatedEntities.values()),
                },
            });
        },
        updateScene(
            payload: {
                id: string;
                name?: string;
                shape?: RaidSceneShape;
                fill?: Material;
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
            const existingScenes = payload.ids.map((id) => state.raids.scenes[id]).filter((s) => !!s);
            if (existingScenes.length === 0) {
                return;
            }

            const raidId = existingScenes[0].raidId;
            if (existingScenes.some((s) => s.raidId !== raidId)) {
                throw new Error('Can only delete scenes from one raid at a time');
            }

            dispatch.raids.undoableBatchOperation({
                name: `Delete Scene${existingScenes.length > 1 ? 's' : ''}`,
                raidId,
                operation: {
                    removeScenes: existingScenes.map((s) => s.id),
                },
            });

            dispatch.workspaces.revalidateSelection({ raidId });
        },
        paste(
            payload: {
                raidId: string;
                sceneId?: string;
                data: Exports;
            },
            state,
        ): {
            sceneIds: string[];
            stepIds: string[];
            entityIds: string[];
        } {
            const op = importOperation(state.raids, payload.raidId, payload.sceneId, payload.data);
            if (!op) {
                return { sceneIds: [], stepIds: [], entityIds: [] };
            }
            dispatch.raids.undoableBatchOperation({
                name: 'Paste',
                raidId: payload.raidId,
                operation: op.operation,
            });
            return {
                sceneIds: op.sceneIds,
                stepIds: op.stepIds,
                entityIds: op.entityIds,
            };
        },
        copy(
            payload: {
                sceneIds?: string[];
                stepIds?: string[];
                entityIds?: string[];
            },
            state,
        ): Exports {
            const sceneExports = [];
            for (const id of payload.sceneIds || []) {
                const exp = selectSceneExport(state.raids, id);
                if (exp) {
                    sceneExports.push(exp);
                }
            }

            const stepExports = [];
            for (const id of payload.stepIds || []) {
                const exp = selectStepExport(state.raids, id);
                if (exp) {
                    stepExports.push(exp);
                }
            }

            const entityExports = [];
            for (const id of payload.entityIds || []) {
                const exp = selectEntityExport(state.raids, id);
                if (exp) {
                    entityExports.push(exp);
                }
            }

            return {
                scenes: sceneExports.length > 0 ? sceneExports : undefined,
                steps: stepExports.length > 0 ? stepExports : undefined,
                entities: entityExports.length > 0 ? entityExports : undefined,
            };
        },
        cut(
            payload: {
                sceneIds?: string[];
                stepIds?: string[];
                entityIds?: string[];
            },
            _state,
        ): Exports {
            const ret = dispatch.raids.copy(payload);
            const raidId =
                ret.scenes?.[0]?.scene.raidId || ret.steps?.[0]?.step.raidId || ret.entities?.[0]?.entities[0].raidId;
            if (!raidId) {
                return ret;
            }

            dispatch.raids.undoableBatchOperation({
                name: 'Cut',
                raidId,
                operation: {
                    removeScenes: payload.sceneIds,
                    removeSteps: payload.stepIds,
                    removeEntities: payload.entityIds,
                },
            });

            dispatch.workspaces.revalidateSelection({ raidId });

            return ret;
        },
        createStep(
            payload: {
                name: string;
                raidId: string;
                sceneId: string;
                afterStepId?: string;
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

            let newStepIds: string[];
            if (payload.afterStepId) {
                const index = scene.stepIds.indexOf(payload.afterStepId) ?? scene.stepIds.length - 1;
                newStepIds = [...scene.stepIds.slice(0, index + 1), newStep.id, ...scene.stepIds.slice(index + 1)];
            } else {
                newStepIds = [...scene.stepIds, newStep.id];
            }

            const newScene = {
                ...scene,
                stepIds: newStepIds,
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
                renderDuration?: number;
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

            dispatch.workspaces.revalidateSelection({ raidId });
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
        addEffects(
            payload: {
                entityId: string;
                effects: Array<{
                    factoryId: string;
                    properties: Partial<RaidEntityProperties>;
                }>;
            },
            state,
        ) {
            const existing = state.raids.entities[payload.entityId];
            if (!existing || existing.properties.type !== 'shape') {
                return;
            }

            const newEntity = {
                ...existing,
                properties: {
                    ...existing.properties,
                    effects: [
                        ...(existing.properties.effects || []),
                        ...payload.effects.map((e) => ({
                            id: crypto.randomUUID(),
                            factoryId: e.factoryId,
                            properties: e.properties,
                        })),
                    ],
                },
            };

            dispatch.raids.undoableBatchOperation({
                name: 'Add Effect',
                raidId: existing.raidId,
                operation: {
                    putEntities: [newEntity],
                },
            });
        },
        updateEntity(payload: RaidEntityUpdate, state) {
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
                } else if (existing.properties.type === 'text' && payload.properties.type === 'text') {
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
        duplicateEntities(
            payload: {
                ids: string[];
            },
            state,
        ): string[] {
            const scene = selectSceneSharedByEntityIds(state.raids, payload.ids);
            if (!scene) {
                return [];
            }

            const newSceneEntityIds = [...scene.entityIds];
            const duplicatedEntityIds: string[] = [];
            const newEntities = [];
            const updatedEntities = new Map<string, RaidEntity>();

            for (const id of payload.ids) {
                const entity = state.raids.entities[id];
                if (!entity) {
                    continue;
                }

                const [clone, newDescendants] = cloneEntityAndChildren(entity, state.raids.entities);
                newEntities.push(clone, ...newDescendants);
                duplicatedEntityIds.push(clone.id);

                const p = selectParentByChildIds(state.raids, [id]);
                if (!p) {
                    continue;
                }
                if (p.type === 'scene') {
                    const idx = newSceneEntityIds.indexOf(id);
                    newSceneEntityIds.splice(idx, 0, clone.id);
                } else if (p.type === 'entity') {
                    const dest = updatedEntities.get(p.entity.id) || p.entity;
                    const dp = dest.properties;
                    if (dp.type === 'group') {
                        const idx = dp.children.indexOf(id);
                        const newChildren = [...dp.children.slice(0, idx), clone.id, ...dp.children.slice(idx)];
                        updatedEntities.set(p.entity.id, {
                            ...dest,
                            properties: {
                                ...dp,
                                children: newChildren,
                            },
                        });
                    }
                }
            }
            for (const e of updatedEntities.values()) {
                newEntities.push(e);
            }

            const newScene = {
                ...scene,
                entityIds: newSceneEntityIds,
            };
            dispatch.raids.undoableBatchOperation({
                name: `Duplicate Entit${payload.ids.length > 1 ? 'ies' : 'y'}`,
                raidId: scene.raidId,
                operation: {
                    putScenes: [newScene],
                    putEntities: newEntities,
                },
            });

            return duplicatedEntityIds;
        },
        duplicateSteps(
            payload: {
                ids: string[];
            },
            state,
        ): string[] {
            const scene = selectSceneSharedByStepIds(state.raids, payload.ids);
            if (!scene) {
                return [];
            }

            const newSceneStepIds = [...scene.stepIds];
            const newSteps = [];
            const idMap = new Map<string, string>(); // old id -> new id

            for (const id of payload.ids) {
                const step = state.raids.steps[id];
                if (!step) {
                    continue;
                }

                const newStep = cloneStep(step);
                const idx = newSceneStepIds.indexOf(id);
                newSceneStepIds.splice(idx + 1, 0, newStep.id);
                idMap.set(id, newStep.id);
                newSteps.push(newStep);
            }

            const entities = selectEntitiesInScene(state.raids, scene.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedEntities = updateKeyedEntitiesValues(entities, (k: Keyable<any>) => {
                const newSteps = { ...k.steps };
                let didChange = false;
                for (const [oldId, newId] of idMap.entries()) {
                    if (oldId in newSteps) {
                        newSteps[newId] = newSteps[oldId];
                        didChange = true;
                    }
                }
                if (didChange) {
                    return {
                        initial: k.initial,
                        steps: newSteps,
                    };
                }
                return k;
            });

            const newScene = {
                ...scene,
                stepIds: newSceneStepIds,
            };

            dispatch.raids.undoableBatchOperation({
                name: `Duplicate Step${payload.ids.length > 1 ? 's' : ''}`,
                raidId: scene.raidId,
                operation: {
                    putScenes: [newScene],
                    putSteps: newSteps,
                    putEntities: updatedEntities,
                },
            });

            return newSteps.map((s) => s.id);
        },
        duplicateScenes(
            payload: {
                ids: string[];
            },
            state,
        ): string[] {
            const raid = selectRaidSharedBySceneIds(state.raids, payload.ids);
            if (!raid) {
                return [];
            }

            const newRaidSceneIds = [...raid.sceneIds];
            const newScenes = [];
            const newSteps = [];
            const newEntities = [];

            for (const id of payload.ids) {
                const scene = state.raids.scenes[id];
                if (scene) {
                    const [newScene, sceneSteps, sceneEntities] = cloneSceneStepsAndEntities(
                        scene,
                        state.raids.steps,
                        state.raids.entities,
                    );
                    const idx = newRaidSceneIds.indexOf(id);
                    newRaidSceneIds.splice(idx + 1, 0, newScene.id);
                    newScenes.push(newScene);
                    newSteps.push(...sceneSteps);
                    newEntities.push(...sceneEntities);
                }
            }

            const newRaid = {
                ...raid,
                sceneIds: newRaidSceneIds,
            };
            dispatch.raids.undoableBatchOperation({
                name: `Duplicate Scene${payload.ids.length > 1 ? 's' : ''}`,
                raidId: raid.id,
                operation: {
                    putMetadata: newRaid,
                    putScenes: newScenes,
                    putSteps: newSteps,
                    putEntities: newEntities,
                },
            });

            return newScenes.map((s) => s.id);
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
                    case 'text':
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
                if (ep.type !== 'shape' && ep.type !== 'text') {
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
        rotateEntities(
            payload: {
                stepId: string;
                entityIds: string[];
                rotation: number;
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

            // this is much simpler than movement since you can't rotate groups

            const updatedEntities: RaidEntity[] = [];
            for (const id of payload.entityIds) {
                const entity = state.raids.entities[id];
                if (!entity) {
                    continue;
                }

                const ep = entity.properties;
                if (ep.type !== 'shape' && ep.type !== 'text') {
                    continue;
                }

                const currentRotation = keyableValueAtStep(ep.rotation || 0, scene.stepIds, payload.stepId);
                let newRotation = (currentRotation + payload.rotation) % (2 * Math.PI);
                if (Math.abs(newRotation) > Math.PI) {
                    newRotation -= Math.sign(newRotation) * 2 * Math.PI;
                }
                const newEntity = {
                    ...entity,
                    properties: {
                        ...ep,
                        rotation: keyableWithValueAtStep(ep.rotation || 0, newRotation, scene.stepIds, payload.stepId),
                    },
                };
                updatedEntities.push(newEntity);
            }

            dispatch.raids.undoableBatchOperation({
                name: `Rotate Entit${payload.entityIds.length > 1 ? 'ies' : 'y'}`,
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

            dispatch.workspaces.revalidateSelection({ raidId });
        },
        groupEntities(
            payload: {
                entityIds: string[];
            },
            state,
        ) {
            const p = selectParentByChildIds(state.raids, payload.entityIds);
            const orderedIds = selectRelativeOrderOfEntityIds(state.raids, payload.entityIds);
            switch (p?.type) {
                case 'scene': {
                    const newGroup: RaidEntity = {
                        id: crypto.randomUUID(),
                        raidId: p.scene.raidId,
                        sceneId: p.scene.id,
                        name: 'Group',
                        creationTime: Date.now(),
                        properties: {
                            type: 'group',
                            children: orderedIds,
                        },
                    };
                    const insertIndex = p.scene.entityIds.findIndex((id) => id === orderedIds[0]);
                    const newEntityIds = [
                        ...p.scene.entityIds.slice(0, insertIndex).filter((id) => !orderedIds.includes(id)),
                        newGroup.id,
                        ...p.scene.entityIds.slice(insertIndex).filter((id) => !orderedIds.includes(id)),
                    ];
                    const newScene = {
                        ...p.scene,
                        entityIds: newEntityIds,
                    };
                    dispatch.raids.undoableBatchOperation({
                        name: 'Group Entities',
                        raidId: p.scene.raidId,
                        operation: {
                            putEntities: [newGroup],
                            putScenes: [newScene],
                        },
                    });
                    break;
                }
                case 'entity': {
                    if (p.entity.properties.type !== 'group') {
                        return;
                    }

                    const newGroup: RaidEntity = {
                        id: crypto.randomUUID(),
                        raidId: p.entity.raidId,
                        sceneId: p.entity.sceneId,
                        name: 'Group',
                        creationTime: Date.now(),
                        properties: {
                            type: 'group',
                            children: orderedIds,
                        },
                    };
                    const insertIndex = p.entity.properties.children.findIndex((id) => id === orderedIds[0]);
                    const newEntityIds = [
                        ...p.entity.properties.children.slice(0, insertIndex).filter((id) => !orderedIds.includes(id)),
                        newGroup.id,
                        ...p.entity.properties.children.slice(insertIndex).filter((id) => !orderedIds.includes(id)),
                    ];
                    const newParentGroup = {
                        ...p.entity,
                        properties: {
                            ...p.entity.properties,
                            children: newEntityIds,
                        },
                    };
                    dispatch.raids.undoableBatchOperation({
                        name: 'Group Entities',
                        raidId: p.entity.raidId,
                        operation: {
                            putEntities: [newGroup, newParentGroup],
                        },
                    });
                    break;
                }
            }
        },
    }),
});
