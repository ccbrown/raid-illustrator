import { describe, expect, it } from 'vitest';

import {
    selectEntitiesInScene,
    selectEntityAndDescendants,
    selectEntityExport,
    selectGroupByChildId,
    selectParentByChildId,
    selectParentByChildIds,
    selectPersistedRaid,
    selectRaidIdSharedBySceneIds,
    selectRaidSharedBySceneIds,
    selectRelativeOrderOfEntityIds,
    selectSceneExport,
    selectSceneSharedByEntityIds,
    selectSceneSharedByStepIds,
    selectStepExport,
    selectStepsInScene,
} from './selectors';
import { RaidEntity, RaidsState } from './types';

describe('raids selectors', () => {
    const createTestState = (): RaidsState => ({
        metadata: {
            raid1: {
                id: 'raid1',
                name: 'Test Raid',
                creationTime: Date.now(),
                sceneIds: ['scene1', 'scene2'],
            },
        },
        scenes: {
            scene1: {
                id: 'scene1',
                raidId: 'raid1',
                name: 'Scene 1',
                shape: { type: 'rectangle', width: 1920, height: 1080 },
                stepIds: ['step1', 'step2'],
                entityIds: ['entity1', 'group1'],
            },
            scene2: {
                id: 'scene2',
                raidId: 'raid1',
                name: 'Scene 2',
                shape: { type: 'circle', radius: 500 },
                stepIds: ['step3'],
                entityIds: ['entity3'],
            },
        },
        steps: {
            step1: {
                id: 'step1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 1',
            },
            step2: {
                id: 'step2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 2',
            },
            step3: {
                id: 'step3',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Step 3',
            },
        },
        entities: {
            entity1: {
                id: 'entity1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Entity 1',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: { x: 0, y: 0 },
                },
            },
            group1: {
                id: 'group1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Group 1',
                properties: {
                    type: 'group',
                    children: ['child1', 'child2'],
                },
            },
            child1: {
                id: 'child1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Child 1',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 25 },
                    position: { x: 10, y: 10 },
                },
            },
            child2: {
                id: 'child2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Child 2',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 50, height: 50 },
                    position: { x: 20, y: 20 },
                },
            },
            entity3: {
                id: 'entity3',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Entity 3',
                properties: {
                    type: 'text',
                    shape: { type: 'rectangle', width: 200, height: 100 },
                    position: { x: 0, y: 0 },
                    content: 'Hello',
                    color: { r: 255, g: 255, b: 255, a: 1 },
                    outlineColor: { r: 0, g: 0, b: 0, a: 1 },
                    outlineThickness: 0,
                    fontSize: 16,
                    horizontalAlignment: 'center',
                    verticalAlignment: 'middle',
                },
            },
        },
    });

    describe('selectRelativeOrderOfEntityIds', () => {
        it('should return entities in scene order', () => {
            const state = createTestState();
            const result = selectRelativeOrderOfEntityIds(state, ['child2', 'entity1', 'child1']);
            // Order: entity1, then group children in their original order (child1, child2)
            expect(result).toEqual(['entity1', 'child1', 'child2']);
        });

        it('should return empty array when entities are not in same scene', () => {
            const state = createTestState();
            const result = selectRelativeOrderOfEntityIds(state, ['entity1', 'entity3']);
            expect(result).toEqual([]);
        });

        it('should handle entities in groups', () => {
            const state = createTestState();
            const result = selectRelativeOrderOfEntityIds(state, ['child1', 'child2']);
            // Group children should maintain their original order
            expect(result).toEqual(['child1', 'child2']);
        });
    });

    describe('selectGroupByChildId', () => {
        it('should return group containing child', () => {
            const state = createTestState();
            const result = selectGroupByChildId(state, 'child1');
            expect(result?.id).toBe('group1');
        });

        it('should return undefined for non-child entity', () => {
            const state = createTestState();
            const result = selectGroupByChildId(state, 'entity1');
            expect(result).toBeUndefined();
        });

        it('should return undefined for non-existent entity', () => {
            const state = createTestState();
            const result = selectGroupByChildId(state, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('selectSceneSharedByEntityIds', () => {
        it('should return scene when all entities are in same scene', () => {
            const state = createTestState();
            const result = selectSceneSharedByEntityIds(state, ['entity1', 'group1']);
            expect(result?.id).toBe('scene1');
        });

        it('should return undefined when entities are in different scenes', () => {
            const state = createTestState();
            const result = selectSceneSharedByEntityIds(state, ['entity1', 'entity3']);
            expect(result).toBeUndefined();
        });

        it('should return undefined when any entity does not exist', () => {
            const state = createTestState();
            const result = selectSceneSharedByEntityIds(state, ['entity1', 'nonexistent']);
            expect(result).toBeUndefined();
        });
    });

    describe('selectParentByChildIds', () => {
        it('should return scene when entities are direct children of scene', () => {
            const state = createTestState();
            const result = selectParentByChildIds(state, ['entity1', 'group1']);
            expect(result?.type).toBe('scene');
            if (result?.type === 'scene') {
                expect(result.scene.id).toBe('scene1');
            }
        });

        it('should return group when entities are children of group', () => {
            const state = createTestState();
            const result = selectParentByChildIds(state, ['child1', 'child2']);
            expect(result?.type).toBe('entity');
            if (result?.type === 'entity') {
                expect(result.entity.id).toBe('group1');
            }
        });

        it('should return undefined when entities have different parents', () => {
            const state = createTestState();
            const result = selectParentByChildIds(state, ['entity1', 'child1']);
            expect(result).toBeUndefined();
        });
    });

    describe('selectParentByChildId', () => {
        it('should return scene for top-level entity', () => {
            const state = createTestState();
            const result = selectParentByChildId(state, 'entity1');
            expect(result?.type).toBe('scene');
        });

        it('should return group for child entity', () => {
            const state = createTestState();
            const result = selectParentByChildId(state, 'child1');
            expect(result?.type).toBe('entity');
            if (result?.type === 'entity') {
                expect(result.entity.id).toBe('group1');
            }
        });
    });

    describe('selectSceneSharedByStepIds', () => {
        it('should return scene when all steps are in same scene', () => {
            const state = createTestState();
            const result = selectSceneSharedByStepIds(state, ['step1', 'step2']);
            expect(result?.id).toBe('scene1');
        });

        it('should return undefined when steps are in different scenes', () => {
            const state = createTestState();
            const result = selectSceneSharedByStepIds(state, ['step1', 'step3']);
            expect(result).toBeUndefined();
        });

        it('should return undefined when any step does not exist', () => {
            const state = createTestState();
            const result = selectSceneSharedByStepIds(state, ['step1', 'nonexistent']);
            expect(result).toBeUndefined();
        });
    });

    describe('selectRaidIdSharedBySceneIds', () => {
        it('should return raid id when all scenes are in same raid', () => {
            const state = createTestState();
            const result = selectRaidIdSharedBySceneIds(state, ['scene1', 'scene2']);
            expect(result).toBe('raid1');
        });

        it('should return undefined when any scene does not exist', () => {
            const state = createTestState();
            const result = selectRaidIdSharedBySceneIds(state, ['scene1', 'nonexistent']);
            expect(result).toBeUndefined();
        });
    });

    describe('selectRaidSharedBySceneIds', () => {
        it('should return raid when all scenes are in same raid', () => {
            const state = createTestState();
            const result = selectRaidSharedBySceneIds(state, ['scene1', 'scene2']);
            expect(result?.id).toBe('raid1');
        });

        it('should return undefined when raid id is not found', () => {
            const state = createTestState();
            const result = selectRaidSharedBySceneIds(state, ['nonexistent']);
            expect(result).toBeUndefined();
        });
    });

    describe('selectStepsInScene', () => {
        it('should return all steps in scene', () => {
            const state = createTestState();
            const result = selectStepsInScene(state, 'scene1');
            expect(result.length).toBe(2);
            expect(result.map((s) => s.id)).toEqual(['step1', 'step2']);
        });

        it('should return empty array for scene with no steps', () => {
            const state = createTestState();
            state.scenes.emptyScene = {
                id: 'emptyScene',
                raidId: 'raid1',
                name: 'Empty',
                shape: { type: 'rectangle', width: 100, height: 100 },
                stepIds: [],
                entityIds: [],
            };
            const result = selectStepsInScene(state, 'emptyScene');
            expect(result).toEqual([]);
        });
    });

    describe('selectEntitiesInScene', () => {
        it('should return all entities in scene', () => {
            const state = createTestState();
            const result = selectEntitiesInScene(state, 'scene1');
            expect(result.length).toBe(4);
            expect(result.map((e) => e.id)).toContain('entity1');
            expect(result.map((e) => e.id)).toContain('group1');
            expect(result.map((e) => e.id)).toContain('child1');
            expect(result.map((e) => e.id)).toContain('child2');
        });

        it('should return empty array for scene with no entities', () => {
            const state = createTestState();
            const result = selectEntitiesInScene(state, 'nonexistent');
            expect(result).toEqual([]);
        });
    });

    describe('selectEntityAndDescendants', () => {
        it('should return single entity when no children', () => {
            const state = createTestState();
            const result = selectEntityAndDescendants(state, 'entity1');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('entity1');
        });

        it('should return entity and all descendants', () => {
            const state = createTestState();
            const result = selectEntityAndDescendants(state, 'group1');
            expect(result.length).toBe(3);
            expect(result[0].id).toBe('group1');
            expect(result.map((e) => e.id)).toContain('child1');
            expect(result.map((e) => e.id)).toContain('child2');
        });

        it('should return empty array for non-existent entity', () => {
            const state = createTestState();
            const result = selectEntityAndDescendants(state, 'nonexistent');
            expect(result).toEqual([]);
        });

        it('should handle nested groups', () => {
            const state = createTestState();
            const nestedGroup: RaidEntity = {
                id: 'nestedGroup',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Nested Group',
                properties: {
                    type: 'group',
                    children: ['nestedChild'],
                },
            };
            const nestedChild: RaidEntity = {
                id: 'nestedChild',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Nested Child',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 10 },
                    position: { x: 0, y: 0 },
                },
            };
            state.entities.nestedGroup = nestedGroup;
            state.entities.nestedChild = nestedChild;
            state.entities.group1.properties = {
                type: 'group',
                children: ['child1', 'nestedGroup'],
            };

            const result = selectEntityAndDescendants(state, 'group1');
            expect(result.length).toBe(4);
            expect(result.map((e) => e.id)).toContain('group1');
            expect(result.map((e) => e.id)).toContain('child1');
            expect(result.map((e) => e.id)).toContain('nestedGroup');
            expect(result.map((e) => e.id)).toContain('nestedChild');
        });
    });

    describe('selectSceneExport', () => {
        it('should return scene with its steps and entities', () => {
            const state = createTestState();
            const result = selectSceneExport(state, 'scene1');
            expect(result).toBeDefined();
            expect(result?.scene.id).toBe('scene1');
            expect(result?.steps.length).toBe(2);
            expect(result?.entities.length).toBe(4);
        });

        it('should return undefined for non-existent scene', () => {
            const state = createTestState();
            const result = selectSceneExport(state, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('selectStepExport', () => {
        it('should return step export', () => {
            const state = createTestState();
            const result = selectStepExport(state, 'step1');
            expect(result).toBeDefined();
            expect(result?.step.id).toBe('step1');
        });

        it('should return undefined for non-existent step', () => {
            const state = createTestState();
            const result = selectStepExport(state, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('selectEntityExport', () => {
        it('should return entity and its descendants', () => {
            const state = createTestState();
            const result = selectEntityExport(state, 'group1');
            expect(result).toBeDefined();
            expect(result?.id).toBe('group1');
            expect(result?.entities.length).toBe(3);
        });

        it('should return undefined for non-existent entity', () => {
            const state = createTestState();
            const result = selectEntityExport(state, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('selectPersistedRaid', () => {
        it('should return raid with all its data', () => {
            const state = createTestState();
            const result = selectPersistedRaid(state, 'raid1');
            expect(result).toBeDefined();
            expect(result?.metadata.id).toBe('raid1');
            expect(result?.scenes.length).toBe(2);
            expect(result?.steps.length).toBe(3);
            expect(result?.entities.length).toBe(5);
        });

        it('should return undefined for non-existent raid', () => {
            const state = createTestState();
            const result = selectPersistedRaid(state, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });
});
