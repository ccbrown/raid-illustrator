import {
    Exports,
    Keyable,
    Keyed,
    RaidBatchOperation,
    RaidEntity,
    RaidMetadata,
    RaidScene,
    RaidStep,
    RaidsState,
    ResolvedKeyables,
    Shape,
} from './types';

export const shapeDimensions = (shape: Shape) => {
    switch (shape.type) {
        case 'rectangle':
            return { width: shape.width, height: shape.height };
        case 'circle':
            return { width: shape.radius * 2, height: shape.radius * 2 };
    }
};

// Used by the utility functions here to make it easier to work with Keyables.
interface normalizedKeyable<T> {
    initial: T;
    steps?: Record<string, T>;
}

export const normalizeKeyable = <T>(k: Keyable<T>): normalizedKeyable<T> => {
    if (typeof k === 'object' && k !== null && 'initial' in k && 'steps' in k) {
        return {
            initial: k.initial,
            steps: k.steps,
        };
    } else {
        return {
            initial: k as T,
        };
    }
};

export const keyableIsKeyed = <T>(k: Keyable<T>): boolean => {
    return typeof k === 'object' && k !== null && 'steps' in k;
};

export const keyableIsKeyedAtStep = <T>(k: Keyable<T>, stepId: string): boolean => {
    const norm = normalizeKeyable(k);
    return norm.steps ? stepId in norm.steps : false;
};

export const keyableValueAtStep = <T>(k: Keyable<T>, sceneStepIds: string[], currentStepId: string): T => {
    const norm = normalizeKeyable(k);
    if (!norm.steps) {
        return norm.initial;
    }

    // find the closest previous step that has a value
    const currentStepIndex = sceneStepIds.indexOf(currentStepId);
    for (let i = currentStepIndex; i >= 0; i--) {
        const stepId = sceneStepIds[i];
        const value = norm.steps[stepId];
        if (value !== undefined) {
            return value;
        }
    }

    return norm.initial;
};

// Returns a new Keyable with the value set at the given stepId. This does NOT change unkeyed
// Keyables to keyed ones. If the Keyable is unkeyed, it just returns a new unkeyed Keyable with the
// given value.
export const keyableWithValueAtStep = <T>(
    k: Keyable<T>,
    value: T,
    sceneStepIds: string[],
    stepId: string,
): Keyable<T> => {
    const norm = normalizeKeyable(k);
    if (!norm.steps) {
        return value;
    }

    const isFirstStep = sceneStepIds.length > 0 && sceneStepIds[0] === stepId;

    return {
        initial: isFirstStep ? value : norm.initial,
        steps: {
            ...norm.steps,
            [stepId]: value,
        },
    };
};

// Returns a new Keyable where the given stepId is keyed to the current value, converting an unkeyed
// Keyable to a keyed one if necessary.
export const keyableWithKeyedStep = <T>(k: Keyable<T>, sceneStepIds: string[], stepId: string): Keyable<T> => {
    const norm = normalizeKeyable(k);
    if (!norm.steps) {
        return {
            initial: norm.initial,
            steps: {
                [stepId]: norm.initial,
            },
        };
    }

    const currentValue = keyableValueAtStep(k, sceneStepIds, stepId);

    return {
        initial: norm.initial,
        steps: {
            ...norm.steps,
            [stepId]: currentValue,
        },
    };
};

// Returns a new Keyable where the given stepId is removed from the keyed steps. If there are no
// remaining keyed steps, converts to an unkeyed Keyable.
//
// If the given stepId is not keyed in the Keyable, just returns the original Keyable.
export const keyableWithUnkeyedStep = <T>(k: Keyable<T>, stepId: string): Keyable<T> => {
    return keyableWithUnkeyedSteps(k, [stepId]);
};

// Like keyableWithUnkeyedStep, but removes all keyed steps for the given stepId.
export const keyableWithUnkeyedSteps = <T>(k: Keyable<T>, stepIds: string[]): Keyable<T> => {
    const norm = normalizeKeyable(k);
    if (!norm.steps) {
        return norm.initial;
    }

    let changed = false;
    const remainingSteps = { ...norm.steps };
    for (const stepId of stepIds) {
        if (stepId in remainingSteps) {
            delete remainingSteps[stepId];
            changed = true;
        }
    }
    if (!changed) {
        return k;
    }
    return Object.keys(remainingSteps).length > 0
        ? {
              initial: norm.initial,
              steps: remainingSteps,
          }
        : norm.initial;
};

// Returns a new entity with its id(s) changed.
const cloneEntity = (entity: RaidEntity): RaidEntity => {
    const newEntity = structuredClone(entity);
    newEntity.id = crypto.randomUUID();
    newEntity.creationTime = Date.now();
    const ep = newEntity.properties;

    switch (ep.type) {
        case 'shape': {
            // also generate new effect ids
            if (ep.effects) {
                ep.effects = ep.effects.map((effect) => ({
                    ...effect,
                    id: crypto.randomUUID(),
                }));
            }
            break;
        }
    }

    return newEntity;
};

// Clones an entity, returning it and its new children (if any), returning the cloned entity and an array of its descendants.
export const cloneEntityAndChildren = (
    entity: RaidEntity,
    allEntities: Record<string, RaidEntity>,
): [RaidEntity, RaidEntity[]] => {
    const clone = cloneEntity(entity);
    const ep = clone.properties;

    const descendants: RaidEntity[] = [];
    if (ep.type === 'group') {
        const newChildren: string[] = [];
        for (const childId of ep.children) {
            const child = allEntities[childId];
            if (child) {
                const [newChild, newDescendants] = cloneEntityAndChildren(child, allEntities);
                newChildren.push(newChild.id);
                descendants.push(newChild, ...newDescendants);
            }
        }
        ep.children = newChildren;
    }

    return [clone, descendants];
};

export const cloneStep = (stepId: RaidStep): RaidStep => {
    const newStep = structuredClone(stepId);
    newStep.id = crypto.randomUUID();
    newStep.creationTime = Date.now();
    return newStep;
};

const cloneScene = (scene: RaidScene): RaidScene => {
    const newScene = structuredClone(scene);
    newScene.id = crypto.randomUUID();
    newScene.creationTime = Date.now();
    return newScene;
};

// Clones a scene, its steps, and its entities (and their children), returning the new scene, steps, and entities.
export const cloneSceneStepsAndEntities = (
    scene: RaidScene,
    allSteps: Record<string, RaidStep>,
    allEntities: Record<string, RaidEntity>,
): [RaidScene, RaidStep[], RaidEntity[]] => {
    const newSteps = [];
    let newEntities = [];

    // old id -> new id
    const entityIdMap = new Map<string, string>();
    const stepIdMap = new Map<string, string>();

    // clone entities
    const sceneEntities = Object.values(allEntities).filter((e) => e.sceneId === scene.id);
    for (const entity of sceneEntities) {
        const [newEntity, newDescendants] = cloneEntityAndChildren(entity, allEntities);
        newEntities.push(newEntity, ...newDescendants);
        entityIdMap.set(entity.id, newEntity.id);
    }

    // clone steps
    for (const stepId of scene.stepIds) {
        const step = allSteps[stepId];
        if (step) {
            const newStep = cloneStep(step);
            newSteps.push(newStep);
            stepIdMap.set(step.id, newStep.id);
        }
    }

    // clone scene
    const newScene = cloneScene(scene);

    // update scene's step and entity ids
    {
        const newSceneStepIds: string[] = [];
        for (const stepId of scene.stepIds) {
            const newStepId = stepIdMap.get(stepId);
            if (newStepId) {
                newSceneStepIds.push(newStepId);
            }
        }
        newScene.stepIds = newSceneStepIds;

        const newSceneEntityIds: string[] = [];
        for (const entityId of scene.entityIds) {
            const newEntityId = entityIdMap.get(entityId);
            if (newEntityId) {
                newSceneEntityIds.push(newEntityId);
            }
        }
        newScene.entityIds = newSceneEntityIds;
    }

    // update steps' sceneId
    for (const step of newSteps) {
        step.sceneId = newScene.id;
    }

    // update entities' sceneId and keyed steps
    for (const entity of newEntities) {
        entity.sceneId = newScene.id;
    }
    newEntities = newEntities.map((entity) =>
        updateKeyedEntityValues(entity, (k) => {
            const newSteps: Record<string, unknown> = {};
            for (const [stepId, value] of Object.entries(k.steps)) {
                const newStepId = stepIdMap.get(stepId);
                if (newStepId) {
                    newSteps[newStepId] = value;
                }
            }
            return {
                initial: k.initial,
                steps: newSteps,
            };
        }),
    );

    return [newScene, newSteps, newEntities];
};

const updateKeyedValuesImpl = (thing: unknown, update: (k: Keyed<unknown>) => Keyable<unknown>): unknown => {
    if (thing === null || thing === undefined) {
        return thing;
    } else if (Array.isArray(thing)) {
        const ret = [];
        let changed = false;
        for (const item of thing) {
            const newItem = updateKeyedValuesImpl(item, update);
            ret.push(newItem);
            if (newItem !== item) {
                changed = true;
            }
        }
        return changed ? ret : thing;
    } else if (typeof thing === 'object') {
        const obj = thing as Record<string, unknown>;
        // if initial and steps are the only keys, it's a Keyed
        if (Object.keys(obj).length <= 2 && 'initial' in obj && 'steps' in obj) {
            const newKeyable = update(thing as Keyed<unknown>);
            if (newKeyable !== thing) {
                return newKeyable;
            }
            return thing;
        }

        let changed = false;
        const newObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const newValue = updateKeyedValuesImpl(value, update);
            newObj[key] = newValue;
            if (newValue !== value) {
                changed = true;
            }
        }
        return changed ? newObj : thing;
    } else {
        return thing;
    }
};

// Returns a new version of the given thing where all Keyed Keyables have been resolved to their value.
export const resolveKeyedValues = <T>(thing: T, sceneStepIds: string[], currentStepId: string): ResolvedKeyables<T> => {
    return updateKeyedValuesImpl(thing, (k) => {
        return keyableValueAtStep(k, sceneStepIds, currentStepId);
    }) as ResolvedKeyables<T>;
};

// Invokes the given function for all Keyed Keyables in the entity, which can return a new Keyable to replace the old one.
//
// The function should NOT mutate the given Keyable, but instead return a new one if it wants to make a change.
//
// If any changes are made, returns a new RaidEntity with the changes. Otherwise, returns the original entity.
export const updateKeyedEntityValues = (
    entity: RaidEntity,
    update: (k: Keyed<unknown>) => Keyable<unknown>,
): RaidEntity => {
    return updateKeyedValuesImpl(entity, update) as RaidEntity;
};

// Invokes the given function for all Keyed Keyables in all entities, which can return a new Keyable to replace the old one.
//
// The function should NOT mutate the given Keyable, but instead return a new one if it wants to make a change.
//
// Returns an array of all entities that were changed. If no entities were changed, returns an empty array.
export const updateKeyedEntitiesValues = (
    entities: RaidEntity[],
    update: (k: Keyed<unknown>) => Keyable<unknown>,
): RaidEntity[] => {
    const updatedEntities: RaidEntity[] = [];
    for (const entity of entities) {
        const updated = updateKeyedEntityValues(entity, update);
        if (updated !== entity) {
            updatedEntities.push(updated);
        }
    }
    return updatedEntities;
};

interface ImportOperation {
    sceneIds: string[];
    stepIds: string[];
    entityIds: string[];
    operation: RaidBatchOperation;
}

export const importOperation = (
    state: RaidsState,
    raidId: string,
    sceneId: string | undefined,
    data: Exports,
): ImportOperation | undefined => {
    const raid = state.metadata[raidId];
    if (!raid || (!data.scenes?.length && (!sceneId || (!data.steps?.length && !data.entities?.length)))) {
        return undefined;
    }

    const pastedStepIds = [];
    const newSteps: RaidStep[] = [];
    const pastedEntityIds = [];
    let newEntities: RaidEntity[] = [];
    const newScenes = [];
    let updatedScene: RaidScene | undefined = undefined;
    let updatedRaid: RaidMetadata | undefined = undefined;
    const pastedSceneIds = [];

    if (sceneId) {
        const scene = state.scenes[sceneId];
        if (scene) {
            // steps are the easiest, start with them
            const stepIdMap = new Map<string, string>();
            for (const stepExport of data.steps || []) {
                const newStep = cloneStep(stepExport.step);
                pastedStepIds.push(newStep.id);
                newStep.raidId = raidId;
                newStep.sceneId = sceneId;
                newSteps.push(newStep);
                stepIdMap.set(stepExport.step.id, newStep.id);
            }
            if (pastedStepIds.length > 0) {
                // update the scene to include the new steps
                updatedScene = {
                    ...(updatedScene || scene),
                    stepIds: [...scene.stepIds, ...pastedStepIds],
                };
            }

            // next are entities
            for (const entityExport of data.entities || []) {
                const allEntities: Record<string, RaidEntity> = {};
                for (const e of entityExport.entities) {
                    allEntities[e.id] = e;
                }
                const original = allEntities[entityExport.id];
                if (original) {
                    const [clone, descendants] = cloneEntityAndChildren(original, allEntities);
                    pastedEntityIds.push(clone.id);
                    newEntities.push(clone, ...descendants);
                }
            }
            for (const e of newEntities) {
                e.raidId = raidId;
                e.sceneId = sceneId;
                // add the new entities to the beginning of the scene's entity list
                updatedScene = {
                    ...(updatedScene || scene),
                    entityIds: [e.id, ...(updatedScene || scene).entityIds],
                };
            }
            // now update any keyed values to point to the new step ids or remove them if
            // the step doesn't exist in this scene
            newEntities = newEntities.map((entity) =>
                updateKeyedEntityValues(entity, (k) => {
                    const newSteps: Record<string, unknown> = {};
                    for (const [stepId, value] of Object.entries(k.steps)) {
                        if (state.steps[stepId]?.sceneId === sceneId) {
                            newSteps[stepId] = value;
                        } else {
                            const newStepId = stepIdMap.get(stepId);
                            if (newStepId) {
                                newSteps[newStepId] = value;
                            }
                        }
                    }
                    return Object.keys(newSteps).length > 0
                        ? {
                              initial: k.initial,
                              steps: newSteps,
                          }
                        : k.initial;
                }),
            );
        }
    }

    // lastly, bring in new scenes
    for (const scene of data.scenes || []) {
        const allSteps: Record<string, RaidStep> = {};
        for (const step of scene.steps || []) {
            allSteps[step.id] = step;
        }

        const allEntities: Record<string, RaidEntity> = {};
        for (const entity of scene.entities || []) {
            allEntities[entity.id] = entity;
        }

        const [newScene, steps, entities] = cloneSceneStepsAndEntities(scene.scene, allSteps, allEntities);
        newScene.raidId = raidId;
        for (const step of steps) {
            step.raidId = raidId;
        }
        for (const entity of entities) {
            entity.raidId = raidId;
        }
        newScenes.push(newScene);
        newSteps.push(...steps);
        newEntities.push(...entities);
        pastedSceneIds.push(newScene.id);
    }

    if (pastedSceneIds.length > 0) {
        updatedRaid = {
            ...raid,
            sceneIds: [...raid.sceneIds, ...pastedSceneIds],
        };
    }

    if (updatedScene) {
        newScenes.push(updatedScene);
    }

    return {
        sceneIds: pastedSceneIds,
        stepIds: pastedStepIds,
        entityIds: pastedEntityIds,
        operation: {
            putScenes: newScenes,
            putSteps: newSteps,
            putEntities: newEntities,
            putMetadata: updatedRaid,
        },
    };
};
