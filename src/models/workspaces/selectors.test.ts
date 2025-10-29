import { describe, expect, it } from 'vitest';

import { selectPersistedRaidWorkspace } from './selectors';
import { WorkspacesState } from './types';

describe('workspaces selectors', () => {
    const createTestState = (): WorkspacesState => ({
        raids: {
            raid1: {
                id: 'raid1',
                lastActivityTime: Date.now(),
                openSceneId: 'scene1',
                entitiesPanelTab: 'entities',
                selection: {
                    entityIds: ['entity1', 'entity2'],
                },
            },
            raid2: {
                id: 'raid2',
                lastActivityTime: Date.now(),
            },
        },
        scenes: {
            scene1: {
                id: 'scene1',
                raidId: 'raid1',
                openStepId: 'step1',
                expandedGroupIds: ['group1'],
                zoom: 1.5,
                center: { x: 100, y: 200 },
            },
            scene2: {
                id: 'scene2',
                raidId: 'raid1',
                openStepId: 'step2',
            },
            scene3: {
                id: 'scene3',
                raidId: 'raid2',
            },
        },
    });

    describe('selectPersistedRaidWorkspace', () => {
        it('should return raid workspace with its scenes', () => {
            const state = createTestState();
            const result = selectPersistedRaidWorkspace(state, 'raid1');

            expect(result).toBeDefined();
            expect(result?.raid.id).toBe('raid1');
            expect(result?.scenes.length).toBe(2);
            expect(result?.scenes.map((s) => s.id)).toContain('scene1');
            expect(result?.scenes.map((s) => s.id)).toContain('scene2');
        });

        it('should return raid workspace with no scenes if none exist', () => {
            const state = createTestState();
            const result = selectPersistedRaidWorkspace(state, 'raid2');

            expect(result).toBeDefined();
            expect(result?.raid.id).toBe('raid2');
            expect(result?.scenes.length).toBe(1);
            expect(result?.scenes[0].id).toBe('scene3');
        });

        it('should return undefined for non-existent raid', () => {
            const state = createTestState();
            const result = selectPersistedRaidWorkspace(state, 'nonexistent');

            expect(result).toBeUndefined();
        });

        it('should preserve raid workspace properties', () => {
            const state = createTestState();
            const result = selectPersistedRaidWorkspace(state, 'raid1');

            expect(result?.raid.openSceneId).toBe('scene1');
            expect(result?.raid.entitiesPanelTab).toBe('entities');
            expect(result?.raid.selection?.entityIds).toEqual(['entity1', 'entity2']);
        });

        it('should preserve scene workspace properties', () => {
            const state = createTestState();
            const result = selectPersistedRaidWorkspace(state, 'raid1');

            const scene1 = result?.scenes.find((s) => s.id === 'scene1');
            expect(scene1?.openStepId).toBe('step1');
            expect(scene1?.expandedGroupIds).toEqual(['group1']);
            expect(scene1?.zoom).toBe(1.5);
            expect(scene1?.center).toEqual({ x: 100, y: 200 });
        });
    });
});
