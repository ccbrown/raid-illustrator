import { createModel } from '@rematch/core';

import { RootModel } from '..';
import {
    selectGroupByChildId,
    selectParentByChildIds,
    selectRaidSharedBySceneIds,
    selectRelativeOrderOfEntityIds,
    selectSceneSharedByEntityIds,
    selectSceneSharedByStepIds,
} from './selectors';
import {
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
import { cloneEntityAndChildren } from './utils';
import { keyableValueAtStep, keyableWithValueAtStep } from './utils';

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

            const metadata = state.raids.metadata[raidId];
            const newMetadata = {
                ...metadata,
                sceneIds: metadata.sceneIds.filter((id) => !payload.ids.includes(id)),
            };

            dispatch.raids.undoableBatchOperation({
                name: `Delete Scene${existingScenes.length > 1 ? 's' : ''}`,
                raidId,
                operation: {
                    putMetadata: newMetadata,
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

            const sceneId = existingSteps[0].sceneId;
            if (existingSteps.some((s) => s.sceneId !== sceneId)) {
                throw new Error('Can only delete steps from one scene at a time');
            }

            const scene = state.raids.scenes[sceneId];
            const newScene = {
                ...scene,
                stepIds: scene.stepIds.filter((id) => !payload.ids.includes(id)),
            };

            dispatch.raids.undoableBatchOperation({
                name: `Delete Step${existingSteps.length > 1 ? 's' : ''}`,
                raidId,
                operation: {
                    putScenes: [newScene],
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
                if (ep.type !== 'shape') {
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

            const sceneId = existingEntities[0].sceneId;
            if (existingEntities.some((e) => e.sceneId !== sceneId)) {
                throw new Error('Can only delete entities from one scene at a time');
            }

            const scene = state.raids.scenes[sceneId];
            const newScene = {
                ...scene,
                entityIds: scene.entityIds.filter((id) => !payload.ids.includes(id)),
            };

            dispatch.raids.undoableBatchOperation({
                name: `Delete Entit${existingEntities.length > 1 ? 'ies' : 'y'}`,
                raidId,
                operation: {
                    putScenes: [newScene],
                    removeEntities: existingEntities.map((e) => e.id),
                },
            });

            dispatch.workspaces.removeEntitiesFromSelection({ raidId, entityIds: payload.ids });
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
