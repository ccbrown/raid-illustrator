import { createSelector } from 'reselect';

import {
    PersistedRaid,
    RaidEntity,
    RaidEntityExport,
    RaidMetadata,
    RaidScene,
    RaidSceneExport,
    RaidStep,
    RaidStepExport,
    RaidsState,
} from './types';

// Sorts entity ids based on their relative order in the scene.
export const selectRelativeOrderOfEntityIds = (state: RaidsState, entityIds: string[]): string[] => {
    const scene = selectSceneSharedByEntityIds(state, entityIds);
    if (!scene) {
        return [];
    }

    const ret = [];
    const toFind = new Set(entityIds);

    const searchStack = [...scene.entityIds].reverse();
    while (searchStack.length > 0 && toFind.size > 0) {
        const currentId = searchStack.pop()!;
        if (toFind.has(currentId)) {
            ret.push(currentId);
            toFind.delete(currentId);
        }
        const currentEntity = state.entities[currentId];
        if (!currentEntity) {
            continue;
        }
        if (currentEntity.properties.type === 'group') {
            searchStack.push(...[...currentEntity.properties.children].reverse());
        }
    }
    return ret;
};

const selectGroupByChild = (state: RaidsState, entity: RaidEntity): RaidEntity | undefined => {
    const scene = state.scenes[entity.sceneId];
    if (!scene) {
        return undefined;
    }

    const searchStack = [...scene.entityIds].reverse();
    while (searchStack.length > 0) {
        const currentId = searchStack.pop()!;
        const currentEntity = state.entities[currentId];
        if (!currentEntity) {
            continue;
        }
        if (currentEntity.properties.type === 'group' && currentEntity.properties.children.includes(entity.id)) {
            return currentEntity;
        }
        if (currentEntity.properties.type === 'group') {
            searchStack.push(...currentEntity.properties.children);
        }
    }
    return undefined;
};

export const selectGroupByChildId = (state: RaidsState, entityId: string): RaidEntity | undefined => {
    const entity = state.entities[entityId];
    if (!entity) {
        return undefined;
    }
    return selectGroupByChild(state, entity);
};

const selectSceneIdSharedByEntityIds = (state: RaidsState, entityIds: string[]): string | undefined => {
    let sharedSceneId: string | undefined = undefined;
    for (const entityId of entityIds) {
        const entity = state.entities[entityId];
        if (!entity) {
            return undefined;
        }
        if (sharedSceneId === undefined) {
            sharedSceneId = entity.sceneId;
        } else if (sharedSceneId !== entity.sceneId) {
            return undefined;
        }
    }
    return sharedSceneId;
};

export const selectSceneSharedByEntityIds = (state: RaidsState, entityIds: string[]): RaidScene | undefined => {
    const sceneId = selectSceneIdSharedByEntityIds(state, entityIds);
    if (!sceneId) {
        return undefined;
    }
    return state.scenes[sceneId];
};

type Parent =
    | {
          type: 'entity';
          entity: RaidEntity;
      }
    | {
          type: 'scene';
          scene: RaidScene;
      };

// The parent must have ALL the given entity ids as direct descendants (not just some of them).
export const selectParentByChildIds = createSelector(
    [
        selectSceneSharedByEntityIds,
        (state: RaidsState, entityIds: string[]) => selectGroupByChildId(state, entityIds[0] || ''),
        (_state: RaidsState, entityIds: string[]) => entityIds,
    ],
    (scene, group, entityIds): Parent | undefined => {
        if (!scene) {
            return undefined;
        }
        if (entityIds.every((id) => scene.entityIds.includes(id))) {
            return { type: 'scene', scene };
        }

        if (!group || group.properties.type !== 'group') {
            return undefined;
        }
        for (let i = 1; i < entityIds.length; i++) {
            if (!group.properties.children.includes(entityIds[i])) {
                return undefined;
            }
        }
        return { type: 'entity', entity: group };
    },
);

export const selectParentByChildId = createSelector(
    [
        (state: RaidsState, id: string) => selectSceneSharedByEntityIds(state, [id]),
        (state: RaidsState, id: string) => selectGroupByChildId(state, id),
        (_state: RaidsState, id: string) => id,
    ],
    (scene, group, id): Parent | undefined => {
        if (!scene) {
            return undefined;
        }
        if (scene.entityIds.includes(id)) {
            return { type: 'scene', scene };
        }
        if (!group || group.properties.type !== 'group') {
            return undefined;
        }
        if (!group.properties.children.includes(id)) {
            return undefined;
        }
        return { type: 'entity', entity: group };
    },
);

const selectSceneIdSharedByStepIds = (state: RaidsState, stepIds: string[]): string | undefined => {
    let sharedSceneId: string | undefined = undefined;
    for (const stepId of stepIds) {
        const step = state.steps[stepId];
        if (!step) {
            return undefined;
        }
        if (sharedSceneId === undefined) {
            sharedSceneId = step.sceneId;
        } else if (sharedSceneId !== step.sceneId) {
            return undefined;
        }
    }
    return sharedSceneId;
};

export const selectSceneSharedByStepIds = (state: RaidsState, stepIds: string[]): RaidScene | undefined => {
    const sceneId = selectSceneIdSharedByStepIds(state, stepIds);
    if (!sceneId) {
        return undefined;
    }
    return state.scenes[sceneId];
};

export const selectRaidIdSharedBySceneIds = (state: RaidsState, sceneIds: string[]): string | undefined => {
    let sharedRaidId: string | undefined = undefined;
    for (const sceneId of sceneIds) {
        const scene = state.scenes[sceneId];
        if (!scene) {
            return undefined;
        }
        if (sharedRaidId === undefined) {
            sharedRaidId = scene.raidId;
        } else if (sharedRaidId !== scene.raidId) {
            return undefined;
        }
    }
    return sharedRaidId;
};

export const selectRaidSharedBySceneIds = (state: RaidsState, sceneIds: string[]): RaidMetadata | undefined => {
    const raidId = selectRaidIdSharedBySceneIds(state, sceneIds);
    if (!raidId) {
        return undefined;
    }
    return state.metadata[raidId];
};

export const selectStepsInScene = (state: RaidsState, sceneId: string): RaidStep[] => {
    return Object.values(state.steps).filter((s) => s.sceneId === sceneId);
};

export const selectEntitiesInScene = (state: RaidsState, sceneId: string): RaidEntity[] => {
    return Object.values(state.entities).filter((e) => e.sceneId === sceneId);
};

export const selectEntityAndDescendants = (state: RaidsState, entityId: string): RaidEntity[] => {
    const entity = state.entities[entityId];
    if (!entity) {
        return [];
    }
    const ret = [entity];
    if (entity.properties.type === 'group') {
        for (const childId of entity.properties.children) {
            ret.push(...selectEntityAndDescendants(state, childId));
        }
    }
    return ret;
};

export const selectSceneExport = (state: RaidsState, sceneId: string): RaidSceneExport | undefined => {
    const scene = state.scenes[sceneId];
    if (!scene) {
        return undefined;
    }
    const steps = selectStepsInScene(state, sceneId);
    const entities = selectEntitiesInScene(state, sceneId);
    return {
        scene,
        steps,
        entities,
    };
};

export const selectStepExport = (state: RaidsState, stepId: string): RaidStepExport | undefined => {
    const step = state.steps[stepId];
    if (!step) {
        return undefined;
    }
    return {
        step,
    };
};

export const selectEntityExport = (state: RaidsState, entityId: string): RaidEntityExport | undefined => {
    const entities = selectEntityAndDescendants(state, entityId);
    if (entities.length === 0) {
        return undefined;
    }
    return {
        id: entityId,
        entities,
    };
};

const selectScenesInRaid = createSelector(
    [
        (state: RaidsState) => state.scenes,
        (_state: RaidsState, raidId: string) => raidId,
    ],
    (scenes, raidId) => Object.values(scenes).filter((scene) => scene.raidId === raidId),
);

const selectStepsInRaid = createSelector(
    [
        (state: RaidsState) => state.steps,
        (_state: RaidsState, raidId: string) => raidId,
    ],
    (steps, raidId) => Object.values(steps).filter((step) => step.raidId === raidId),
);

const selectEntitiesInRaid = createSelector(
    [
        (state: RaidsState) => state.entities,
        (_state: RaidsState, raidId: string) => raidId,
    ],
    (entities, raidId) => Object.values(entities).filter((entity) => entity.raidId === raidId),
);

export const selectPersistedRaid = createSelector(
    [
        (state: RaidsState, raidId: string) => state.metadata[raidId],
        selectScenesInRaid,
        selectStepsInRaid,
        selectEntitiesInRaid,
    ],
    (metadata, scenes, steps, entities): PersistedRaid | undefined => {
        if (!metadata) {
            return undefined;
        }
        return {
            metadata,
            scenes,
            steps,
            entities,
        };
    },
);
