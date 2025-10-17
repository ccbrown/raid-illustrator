import { RaidEntity, RaidMetadata, RaidScene, RaidsState } from './types';

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
            searchStack.push(...currentEntity.properties.children);
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

// The parent must have ALL the given entity ids as direct descendants (not just some of them).
export const selectParentByChildIds = (
    state: RaidsState,
    entityIds: string[],
):
    | {
          type: 'entity';
          entity: RaidEntity;
      }
    | {
          type: 'scene';
          scene: RaidScene;
      }
    | undefined => {
    if (entityIds.length === 0) {
        return undefined;
    }

    const scene = selectSceneSharedByEntityIds(state, entityIds);
    if (!scene) {
        return undefined;
    }
    if (entityIds.every((id) => scene.entityIds.includes(id))) {
        return { type: 'scene', scene };
    }

    const group = selectGroupByChildId(state, entityIds[0]);
    if (!group || group.properties.type !== 'group') {
        return undefined;
    }
    for (let i = 1; i < entityIds.length; i++) {
        if (!group.properties.children.includes(entityIds[i])) {
            return undefined;
        }
    }
    return { type: 'entity', entity: group };
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

export const selectEntitiesInScene = (state: RaidsState, sceneId: string): RaidEntity[] => {
    return Object.values(state.entities).filter((e) => e.sceneId === sceneId);
};
