import { describe, expect, it } from 'vitest';

import { Exports, Keyed, RaidEntity, RaidScene, RaidStep, RaidsState } from './types';
import {
    cloneEntityAndChildren,
    cloneStep,
    importOperation,
    keyableIsKeyed,
    keyableIsKeyedAtStep,
    keyableValueAtStep,
    keyableWithKeyedStep,
    keyableWithUnkeyedStep,
    keyableWithUnkeyedSteps,
    keyableWithValueAtStep,
    normalizeKeyable,
    resolveKeyedValues,
    shapeDimensions,
    updateKeyedEntitiesValues,
    updateKeyedEntityValues,
} from './utils';

describe('shapeDimensions', () => {
    it('should return width and height for rectangle', () => {
        expect(shapeDimensions({ type: 'rectangle', width: 100, height: 50 })).toEqual({
            width: 100,
            height: 50,
        });
    });

    it('should return diameter as width and height for circle', () => {
        expect(shapeDimensions({ type: 'circle', radius: 25 })).toEqual({
            width: 50,
            height: 50,
        });
    });
});

describe('normalizeKeyable', () => {
    it('should normalize a non-keyed value', () => {
        const result = normalizeKeyable(42);
        expect(result).toEqual({ initial: 42 });
    });

    it('should normalize a keyed value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 20 } };
        const result = normalizeKeyable(keyed);
        expect(result).toEqual({ initial: 10, steps: { step1: 20 } });
    });
});

describe('keyableIsKeyed', () => {
    it('should return false for non-keyed value', () => {
        expect(keyableIsKeyed(42)).toBe(false);
    });

    it('should return true for keyed value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 20 } };
        expect(keyableIsKeyed(keyed)).toBe(true);
    });
});

describe('keyableIsKeyedAtStep', () => {
    it('should return false for non-keyed value', () => {
        expect(keyableIsKeyedAtStep(42, 'step1')).toBe(false);
    });

    it('should return true when step exists in keyed value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 20 } };
        expect(keyableIsKeyedAtStep(keyed, 'step1')).toBe(true);
    });

    it('should return false when step does not exist in keyed value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 20 } };
        expect(keyableIsKeyedAtStep(keyed, 'step2')).toBe(false);
    });
});

describe('keyableValueAtStep', () => {
    const sceneStepIds = ['step1', 'step2', 'step3'];

    it('should return the value for non-keyed keyable', () => {
        expect(keyableValueAtStep(42, sceneStepIds, 'step2')).toBe(42);
    });

    it('should return initial value when no steps are keyed', () => {
        const keyed: Keyed<number> = { initial: 10, steps: {} };
        expect(keyableValueAtStep(keyed, sceneStepIds, 'step2')).toBe(10);
    });

    it('should return the exact step value when keyed at current step', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step2: 20 } };
        expect(keyableValueAtStep(keyed, sceneStepIds, 'step2')).toBe(20);
    });

    it('should return the most recent previous step value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15, step2: 20 } };
        expect(keyableValueAtStep(keyed, sceneStepIds, 'step3')).toBe(20);
    });

    it('should return initial value for first step when not keyed', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step2: 20 } };
        expect(keyableValueAtStep(keyed, sceneStepIds, 'step1')).toBe(10);
    });
});

describe('keyableWithValueAtStep', () => {
    const sceneStepIds = ['step1', 'step2', 'step3'];

    it('should return the value directly for non-keyed keyable', () => {
        expect(keyableWithValueAtStep(42, 100, sceneStepIds, 'step2')).toBe(100);
    });

    it('should update the step value for keyed keyable', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15 } };
        const result = keyableWithValueAtStep(keyed, 25, sceneStepIds, 'step2') as Keyed<number>;
        expect(result).toEqual({
            initial: 10,
            steps: { step1: 15, step2: 25 },
        });
    });

    it('should update initial value when setting first step', () => {
        const keyed: Keyed<number> = { initial: 10, steps: {} };
        const result = keyableWithValueAtStep(keyed, 20, sceneStepIds, 'step1') as Keyed<number>;
        expect(result).toEqual({
            initial: 20,
            steps: { step1: 20 },
        });
    });
});

describe('keyableWithKeyedStep', () => {
    const sceneStepIds = ['step1', 'step2', 'step3'];

    it('should convert non-keyed to keyed', () => {
        const result = keyableWithKeyedStep(42, sceneStepIds, 'step2') as Keyed<number>;
        expect(result).toEqual({
            initial: 42,
            steps: { step2: 42 },
        });
    });

    it('should add step key with current value', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15 } };
        const result = keyableWithKeyedStep(keyed, sceneStepIds, 'step2') as Keyed<number>;
        expect(result).toEqual({
            initial: 10,
            steps: { step1: 15, step2: 15 },
        });
    });
});

describe('keyableWithUnkeyedStep', () => {
    it('should return same value for non-keyed keyable', () => {
        const result = keyableWithUnkeyedStep(42, 'step1');
        expect(result).toBe(42);
    });

    it('should remove step and convert to non-keyed when last step', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15 } };
        const result = keyableWithUnkeyedStep(keyed, 'step1');
        expect(result).toBe(10);
    });

    it('should remove step but keep other steps', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15, step2: 20 } };
        const result = keyableWithUnkeyedStep(keyed, 'step1') as Keyed<number>;
        expect(result).toEqual({
            initial: 10,
            steps: { step2: 20 },
        });
    });

    it('should return same object when step not found', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15 } };
        const result = keyableWithUnkeyedStep(keyed, 'step2');
        expect(result).toBe(keyed);
    });
});

describe('keyableWithUnkeyedSteps', () => {
    it('should remove multiple steps', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15, step2: 20, step3: 25 } };
        const result = keyableWithUnkeyedSteps(keyed, ['step1', 'step3']) as Keyed<number>;
        expect(result).toEqual({
            initial: 10,
            steps: { step2: 20 },
        });
    });

    it('should convert to non-keyed when all steps removed', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15, step2: 20 } };
        const result = keyableWithUnkeyedSteps(keyed, ['step1', 'step2']);
        expect(result).toBe(10);
    });

    it('should return same object when no matching steps', () => {
        const keyed: Keyed<number> = { initial: 10, steps: { step1: 15 } };
        const result = keyableWithUnkeyedSteps(keyed, ['step2', 'step3']);
        expect(result).toBe(keyed);
    });
});

describe('cloneEntityAndChildren', () => {
    it('should clone a simple entity with new ID', () => {
        const entity: RaidEntity = {
            id: 'entity1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test Entity',
            properties: {
                type: 'shape',
                shape: { type: 'rectangle', width: 100, height: 50 },
                position: { x: 0, y: 0 },
            },
        };

        const [clone, descendants] = cloneEntityAndChildren(entity, { entity1: entity });

        expect(clone.id).not.toBe(entity.id);
        expect(clone.name).toBe(entity.name);
        expect(clone.raidId).toBe(entity.raidId);
        expect(descendants).toEqual([]);
    });

    it('should clone a group entity with children', () => {
        const child: RaidEntity = {
            id: 'child1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Child',
            properties: {
                type: 'shape',
                shape: { type: 'circle', radius: 25 },
                position: { x: 0, y: 0 },
            },
        };

        const group: RaidEntity = {
            id: 'group1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Group',
            properties: {
                type: 'group',
                children: ['child1'],
            },
        };

        const [clone, descendants] = cloneEntityAndChildren(group, { group1: group, child1: child });

        expect(clone.id).not.toBe(group.id);
        expect(descendants.length).toBe(1);
        expect(descendants[0].id).not.toBe(child.id);
        expect(clone.properties.type).toBe('group');
        if (clone.properties.type === 'group') {
            expect(clone.properties.children).toEqual([descendants[0].id]);
        }
    });

    it('should clone effects with new IDs', () => {
        const entity: RaidEntity = {
            id: 'entity1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Entity with Effects',
            properties: {
                type: 'shape',
                shape: { type: 'rectangle', width: 100, height: 50 },
                position: { x: 0, y: 0 },
                effects: [
                    {
                        id: 'effect1',
                        factoryId: 'blur',
                        properties: { amount: 10 },
                    },
                ],
            },
        };

        const [clone] = cloneEntityAndChildren(entity, { entity1: entity });

        if (clone.properties.type === 'shape' && clone.properties.effects) {
            expect(clone.properties.effects[0].id).not.toBe('effect1');
            expect(clone.properties.effects[0].factoryId).toBe('blur');
        }
    });
});

describe('cloneStep', () => {
    it('should clone a step with new ID', () => {
        const step: RaidStep = {
            id: 'step1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test Step',
            renderDuration: 1000,
        };

        const clone = cloneStep(step);

        expect(clone.id).not.toBe(step.id);
        expect(clone.name).toBe(step.name);
        expect(clone.renderDuration).toBe(step.renderDuration);
    });
});

describe('resolveKeyedValues', () => {
    const sceneStepIds = ['step1', 'step2', 'step3'];

    it('should resolve non-keyed values', () => {
        const obj = { a: 42, b: 'test' };
        const result = resolveKeyedValues(obj, sceneStepIds, 'step2');
        expect(result).toEqual(obj);
    });

    it('should resolve keyed values to current step value', () => {
        const obj = {
            value: { initial: 10, steps: { step1: 15, step2: 20 } } as Keyed<number>,
        };
        const result = resolveKeyedValues(obj, sceneStepIds, 'step2');
        expect(result).toEqual({ value: 20 });
    });

    it('should resolve nested keyed values', () => {
        const obj = {
            outer: {
                inner: { initial: 10, steps: { step1: 15 } } as Keyed<number>,
            },
        };
        const result = resolveKeyedValues(obj, sceneStepIds, 'step2');
        expect(result).toEqual({ outer: { inner: 15 } });
    });

    it('should resolve keyed values in arrays', () => {
        const obj = {
            values: [{ initial: 10, steps: { step1: 15 } } as Keyed<number>, 42],
        };
        const result = resolveKeyedValues(obj, sceneStepIds, 'step1');
        expect(result).toEqual({ values: [15, 42] });
    });
});

describe('updateKeyedEntityValues', () => {
    it('should update keyed values in entity', () => {
        const entity: RaidEntity = {
            id: 'entity1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test',
            properties: {
                type: 'shape',
                shape: { type: 'rectangle', width: 100, height: 50 },
                position: { initial: { x: 0, y: 0 }, steps: { step1: { x: 10, y: 10 } } },
            },
        };

        const updated = updateKeyedEntityValues(entity, (k) => {
            if (typeof k.initial === 'object' && k.initial !== null && 'x' in k.initial) {
                return { initial: { x: 100, y: 100 }, steps: {} };
            }
            return k;
        });

        expect(updated.properties.type).toBe('shape');
        if (updated.properties.type === 'shape') {
            expect(updated.properties.position).toEqual({ initial: { x: 100, y: 100 }, steps: {} });
        }
    });

    it('should return same entity when no changes', () => {
        const entity: RaidEntity = {
            id: 'entity1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test',
            properties: {
                type: 'shape',
                shape: { type: 'rectangle', width: 100, height: 50 },
                position: { initial: { x: 0, y: 0 }, steps: { step1: { x: 10, y: 10 } } },
            },
        };

        const updated = updateKeyedEntityValues(entity, (k) => k);

        expect(updated).toBe(entity);
    });
});

describe('updateKeyedEntitiesValues', () => {
    it('should return only changed entities', () => {
        const entity1: RaidEntity = {
            id: 'entity1',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test1',
            properties: {
                type: 'shape',
                shape: { type: 'rectangle', width: 100, height: 50 },
                position: { initial: { x: 0, y: 0 }, steps: { step1: { x: 10, y: 10 } } },
            },
        };

        const entity2: RaidEntity = {
            id: 'entity2',
            raidId: 'raid1',
            sceneId: 'scene1',
            name: 'Test2',
            properties: {
                type: 'shape',
                shape: { type: 'circle', radius: 25 },
                position: { x: 50, y: 50 },
            },
        };

        const updated = updateKeyedEntitiesValues([entity1, entity2], (k) => {
            return { initial: k.initial, steps: {} };
        });

        expect(updated.length).toBe(1);
        expect(updated[0].id).toBe('entity1');
    });
});

describe('importOperation', () => {
    const createBasicState = (): RaidsState => ({
        metadata: {
            raid1: {
                id: 'raid1',
                name: 'Test Raid',
                creationTime: Date.now(),
                sceneIds: ['scene1'],
            },
        },
        scenes: {
            scene1: {
                id: 'scene1',
                raidId: 'raid1',
                name: 'Scene 1',
                shape: { type: 'rectangle', width: 40, height: 40 },
                stepIds: ['step1'],
                entityIds: [],
            },
        },
        steps: {
            step1: {
                id: 'step1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 1',
            },
        },
        entities: {},
    });

    describe('returns undefined', () => {
        it('when raid does not exist', () => {
            const state = createBasicState();
            const data: Exports = { scenes: [] };
            const result = importOperation(state, 'nonexistent-raid', undefined, data);
            expect(result).toBeUndefined();
        });

        it('when no scenes and no sceneId provided', () => {
            const state = createBasicState();
            const data: Exports = {};
            const result = importOperation(state, 'raid1', undefined, data);
            expect(result).toBeUndefined();
        });

        it('when sceneId provided but no steps or entities in data', () => {
            const state = createBasicState();
            const data: Exports = {};
            const result = importOperation(state, 'raid1', 'scene1', data);
            expect(result).toBeUndefined();
        });
    });

    describe('importing steps', () => {
        it('should import steps into a scene with new IDs', () => {
            const state = createBasicState();
            const stepToImport: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 2',
                renderDuration: 1000,
            };

            const data: Exports = {
                steps: [{ step: stepToImport }],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result).toBeDefined();
            expect(result!.stepIds).toHaveLength(1);
            expect(result!.stepIds[0]).not.toBe('original-step-2');
            expect(result!.operation.putSteps).toHaveLength(1);
            expect(result!.operation.putSteps![0].id).toBe(result!.stepIds[0]);
            expect(result!.operation.putSteps![0].name).toBe('Step 2');
            expect(result!.operation.putSteps![0].renderDuration).toBe(1000);
            expect(result!.operation.putSteps![0].sceneId).toBe('scene1');
        });

        it('should add imported steps to scene stepIds', () => {
            const state = createBasicState();
            const stepToImport: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 2',
            };

            const data: Exports = {
                steps: [{ step: stepToImport }],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result!.operation.putScenes).toHaveLength(1);
            const updatedScene = result!.operation.putScenes![0];
            expect(updatedScene.stepIds).toContain('step1');
            expect(updatedScene.stepIds).toContain(result!.stepIds[0]);
            expect(updatedScene.stepIds).toHaveLength(2);
        });

        it('should import multiple steps', () => {
            const state = createBasicState();
            const data: Exports = {
                steps: [
                    { step: { id: 'step2', raidId: 'raid1', sceneId: 'scene1', name: 'Step 2' } },
                    { step: { id: 'step3', raidId: 'raid1', sceneId: 'scene1', name: 'Step 3' } },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result!.stepIds).toHaveLength(2);
            expect(result!.operation.putSteps).toHaveLength(2);
            expect(result!.stepIds[0]).not.toBe('step2');
            expect(result!.stepIds[1]).not.toBe('step3');
        });
    });

    describe('importing entities', () => {
        it('should import entities with new IDs', () => {
            const state = createBasicState();
            const entityToImport: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Test Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: { x: 10, y: 20 },
                },
            };

            const data: Exports = {
                entities: [
                    {
                        id: 'original-entity-1',
                        entities: [entityToImport],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result).toBeDefined();
            expect(result!.entityIds).toHaveLength(1);
            expect(result!.entityIds[0]).not.toBe('original-entity-1');
            expect(result!.operation.putEntities).toBeDefined();

            const importedEntity = result!.operation.putEntities!.find((e) => e.id === result!.entityIds[0]);
            expect(importedEntity).toBeDefined();
            expect(importedEntity!.name).toBe('Test Entity');
            expect(importedEntity!.sceneId).toBe('scene1');
            expect(importedEntity!.raidId).toBe('raid1');
        });

        it('should add imported entities to the beginning of scene entityIds', () => {
            const state = createBasicState();
            state.scenes.scene1.entityIds = ['existing-entity-1'];
            state.entities['existing-entity-1'] = {
                id: 'existing-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Existing',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 10 },
                    position: { x: 0, y: 0 },
                },
            };

            const entityToImport: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Imported',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: { x: 10, y: 20 },
                },
            };

            const data: Exports = {
                entities: [
                    {
                        id: 'original-entity-1',
                        entities: [entityToImport],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            const updatedScene = result!.operation.putScenes![0];
            expect(updatedScene.entityIds[0]).toBe(result!.entityIds[0]);
            expect(updatedScene.entityIds[1]).toBe('existing-entity-1');
        });

        it('should import group entities with children', () => {
            const state = createBasicState();

            const child: RaidEntity = {
                id: 'original-child-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Child',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 25 },
                    position: { x: 0, y: 0 },
                },
            };

            const group: RaidEntity = {
                id: 'original-group-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Group',
                properties: {
                    type: 'group',
                    children: ['original-child-1'],
                },
            };

            const data: Exports = {
                entities: [
                    {
                        id: 'original-group-1',
                        entities: [group, child],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result!.entityIds).toHaveLength(1);
            expect(result!.operation.putEntities).toHaveLength(2); // group + child

            const importedGroup = result!.operation.putEntities!.find((e) => e.id === result!.entityIds[0]);
            expect(importedGroup).toBeDefined();
            expect(importedGroup!.properties.type).toBe('group');

            if (importedGroup!.properties.type === 'group') {
                expect(importedGroup!.properties.children).toHaveLength(1);
                const childId = importedGroup!.properties.children[0];
                expect(childId).not.toBe('original-child-1');

                const importedChild = result!.operation.putEntities!.find((e) => e.id === childId);
                expect(importedChild).toBeDefined();
                expect(importedChild!.name).toBe('Child');
            }
        });

        it('should import entity with effects', () => {
            const state = createBasicState();

            const entityWithEffects: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Entity with Effects',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: { x: 0, y: 0 },
                    effects: [
                        {
                            id: 'original-effect-1',
                            factoryId: 'blur',
                            properties: { amount: 10 },
                        },
                    ],
                },
            };

            const data: Exports = {
                entities: [
                    {
                        id: 'original-entity-1',
                        entities: [entityWithEffects],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            const importedEntity = result!.operation.putEntities!.find((e) => e.id === result!.entityIds[0]);
            expect(importedEntity!.properties.type).toBe('shape');

            if (importedEntity!.properties.type === 'shape' && importedEntity!.properties.effects) {
                expect(importedEntity!.properties.effects).toHaveLength(1);
                expect(importedEntity!.properties.effects[0].id).not.toBe('original-effect-1');
                expect(importedEntity!.properties.effects[0].factoryId).toBe('blur');
                expect(importedEntity!.properties.effects[0].properties.amount).toBe(10);
            }
        });
    });

    describe('importing with keyed values', () => {
        it('should remap keyed values to new step IDs when importing steps with entities', () => {
            const state = createBasicState();

            const stepToImport: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 2',
            };

            const entityToImport: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Test Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: {
                        initial: { x: 0, y: 0 },
                        steps: {
                            'original-step-2': { x: 100, y: 100 },
                        },
                    },
                },
            };

            const data: Exports = {
                steps: [{ step: stepToImport }],
                entities: [
                    {
                        id: 'original-entity-1',
                        entities: [entityToImport],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            const newStepId = result!.stepIds[0];
            const importedEntity = result!.operation.putEntities!.find((e) => e.id === result!.entityIds[0]);

            expect(importedEntity!.properties.type).toBe('shape');
            if (importedEntity!.properties.type === 'shape') {
                const position = importedEntity!.properties.position;
                expect(position).toHaveProperty('initial');
                expect(position).toHaveProperty('steps');

                if (typeof position === 'object' && 'steps' in position) {
                    expect(position.steps).toHaveProperty(newStepId);
                    expect(position.steps[newStepId]).toEqual({ x: 100, y: 100 });
                    expect(position.steps).not.toHaveProperty('original-step-2');
                }
            }
        });

        it('should preserve keyed values for existing steps in the scene', () => {
            const state = createBasicState();

            const entityToImport: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Test Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 100, height: 50 },
                    position: {
                        initial: { x: 0, y: 0 },
                        steps: {
                            step1: { x: 50, y: 50 }, // step1 exists in the scene
                        },
                    },
                },
            };

            const data: Exports = {
                entities: [
                    {
                        id: 'original-entity-1',
                        entities: [entityToImport],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            const importedEntity = result!.operation.putEntities!.find((e) => e.id === result!.entityIds[0]);

            if (importedEntity!.properties.type === 'shape') {
                const position = importedEntity!.properties.position;
                if (typeof position === 'object' && 'steps' in position) {
                    expect(position.steps).toHaveProperty('step1');
                    expect(position.steps.step1).toEqual({ x: 50, y: 50 });
                }
            }
        });

        it('should add new step keys to existing entities when duplicating steps', () => {
            const state = createBasicState();

            // Add an existing entity with keyed value for step1
            state.entities['existing-entity'] = {
                id: 'existing-entity',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Existing Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 10 },
                    position: {
                        initial: { x: 0, y: 0 },
                        steps: {
                            step1: { x: 10, y: 10 },
                        },
                    },
                },
            };

            // Import a copy of step1 (as if we're duplicating it)
            const stepToImport: RaidStep = {
                id: 'step1', // Same ID as existing step
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 1 Copy',
            };

            const data: Exports = {
                steps: [{ step: stepToImport }],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            const newStepId = result!.stepIds[0];

            // Find the updated existing entity in the operation
            const updatedEntity = result!.operation.putEntities!.find((e) => e.id === 'existing-entity');

            expect(updatedEntity).toBeDefined();
            if (updatedEntity!.properties.type === 'shape') {
                const position = updatedEntity!.properties.position;
                if (typeof position === 'object' && 'steps' in position) {
                    expect(position.steps).toHaveProperty('step1');
                    expect(position.steps).toHaveProperty(newStepId);
                    // The duplicated step should have the same value as step1
                    expect(position.steps[newStepId]).toEqual({ x: 10, y: 10 });
                }
            }
        });

        it('should handle entities without keyed values when importing steps', () => {
            const state = createBasicState();

            // Add an existing entity without keyed values
            state.entities['existing-entity'] = {
                id: 'existing-entity',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Existing Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 10 },
                    position: { x: 0, y: 0 }, // Not keyed
                },
            };

            const stepToImport: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Step 2',
            };

            const data: Exports = {
                steps: [{ step: stepToImport }],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            // The existing entity should not be in putEntities since it has no keyed values
            const updatedEntity = result!.operation.putEntities!.find((e) => e.id === 'existing-entity');
            expect(updatedEntity).toBeUndefined();
        });
    });

    describe('importing scenes', () => {
        it('should import a scene with new IDs', () => {
            const state = createBasicState();

            const sceneToImport: RaidScene = {
                id: 'original-scene-2',
                raidId: 'raid1',
                name: 'Scene 2',
                shape: { type: 'circle', radius: 20 },
                stepIds: ['original-step-2'],
                entityIds: [],
            };

            const stepInScene: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'original-scene-2',
                name: 'Step 2',
            };

            const data: Exports = {
                scenes: [
                    {
                        scene: sceneToImport,
                        steps: [stepInScene],
                        entities: [],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', undefined, data);

            expect(result).toBeDefined();
            expect(result!.sceneIds).toHaveLength(1);
            expect(result!.sceneIds[0]).not.toBe('original-scene-2');

            const importedScene = result!.operation.putScenes!.find((s) => s.id === result!.sceneIds[0]);
            expect(importedScene).toBeDefined();
            expect(importedScene!.name).toBe('Scene 2');
            expect(importedScene!.raidId).toBe('raid1');
        });

        it('should import scene steps with new IDs and update scene stepIds', () => {
            const state = createBasicState();

            const sceneToImport: RaidScene = {
                id: 'original-scene-2',
                raidId: 'raid1',
                name: 'Scene 2',
                shape: { type: 'circle', radius: 20 },
                stepIds: ['original-step-2', 'original-step-3'],
                entityIds: [],
            };

            const stepsInScene: RaidStep[] = [
                {
                    id: 'original-step-2',
                    raidId: 'raid1',
                    sceneId: 'original-scene-2',
                    name: 'Step 2',
                },
                {
                    id: 'original-step-3',
                    raidId: 'raid1',
                    sceneId: 'original-scene-2',
                    name: 'Step 3',
                },
            ];

            const data: Exports = {
                scenes: [
                    {
                        scene: sceneToImport,
                        steps: stepsInScene,
                        entities: [],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', undefined, data);

            const importedScene = result!.operation.putScenes!.find((s) => s.id === result!.sceneIds[0]);
            expect(importedScene!.stepIds).toHaveLength(2);
            expect(importedScene!.stepIds[0]).not.toBe('original-step-2');
            expect(importedScene!.stepIds[1]).not.toBe('original-step-3');

            const importedSteps = result!.operation.putSteps!.filter((s) => s.sceneId === importedScene!.id);
            expect(importedSteps).toHaveLength(2);
        });

        it('should import scene entities with new IDs and remap keyed values', () => {
            const state = createBasicState();

            const sceneToImport: RaidScene = {
                id: 'original-scene-2',
                raidId: 'raid1',
                name: 'Scene 2',
                shape: { type: 'circle', radius: 20 },
                stepIds: ['original-step-2'],
                entityIds: ['original-entity-1'],
            };

            const stepInScene: RaidStep = {
                id: 'original-step-2',
                raidId: 'raid1',
                sceneId: 'original-scene-2',
                name: 'Step 2',
            };

            const entityInScene: RaidEntity = {
                id: 'original-entity-1',
                raidId: 'raid1',
                sceneId: 'original-scene-2',
                name: 'Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'rectangle', width: 50, height: 50 },
                    position: {
                        initial: { x: 0, y: 0 },
                        steps: {
                            'original-step-2': { x: 100, y: 100 },
                        },
                    },
                },
            };

            const data: Exports = {
                scenes: [
                    {
                        scene: sceneToImport,
                        steps: [stepInScene],
                        entities: [entityInScene],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', undefined, data);

            const importedScene = result!.operation.putScenes!.find((s) => s.id === result!.sceneIds[0]);
            expect(importedScene!.entityIds).toHaveLength(1);

            const importedEntity = result!.operation.putEntities!.find((e) => e.sceneId === importedScene!.id);
            expect(importedEntity).toBeDefined();

            if (importedEntity!.properties.type === 'shape') {
                const position = importedEntity!.properties.position;
                if (typeof position === 'object' && 'steps' in position) {
                    // The step ID should be remapped
                    expect(position.steps).not.toHaveProperty('original-step-2');
                    const newStepId = importedScene!.stepIds[0];
                    expect(position.steps).toHaveProperty(newStepId);
                    expect(position.steps[newStepId]).toEqual({ x: 100, y: 100 });
                }
            }
        });

        it('should add imported scene to raid sceneIds', () => {
            const state = createBasicState();

            const sceneToImport: RaidScene = {
                id: 'original-scene-2',
                raidId: 'raid1',
                name: 'Scene 2',
                shape: { type: 'circle', radius: 20 },
                stepIds: [],
                entityIds: [],
            };

            const data: Exports = {
                scenes: [
                    {
                        scene: sceneToImport,
                        steps: [],
                        entities: [],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', undefined, data);

            expect(result!.operation.putMetadata).toBeDefined();
            expect(result!.operation.putMetadata!.sceneIds).toContain('scene1');
            expect(result!.operation.putMetadata!.sceneIds).toContain(result!.sceneIds[0]);
        });

        it('should import multiple scenes', () => {
            const state = createBasicState();

            const data: Exports = {
                scenes: [
                    {
                        scene: {
                            id: 'scene2',
                            raidId: 'raid1',
                            name: 'Scene 2',
                            shape: { type: 'circle', radius: 20 },
                            stepIds: [],
                            entityIds: [],
                        },
                        steps: [],
                        entities: [],
                    },
                    {
                        scene: {
                            id: 'scene3',
                            raidId: 'raid1',
                            name: 'Scene 3',
                            shape: { type: 'rectangle', width: 30, height: 30 },
                            stepIds: [],
                            entityIds: [],
                        },
                        steps: [],
                        entities: [],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', undefined, data);

            expect(result!.sceneIds).toHaveLength(2);
            expect(result!.operation.putScenes).toHaveLength(2);
            expect(result!.operation.putMetadata!.sceneIds).toHaveLength(3); // original + 2 new
        });
    });

    describe('mixed imports', () => {
        it('should handle importing both scenes and entities into a scene', () => {
            const state = createBasicState();

            const entityToImport: RaidEntity = {
                id: 'entity-for-scene1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Entity for Scene 1',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 5 },
                    position: { x: 0, y: 0 },
                },
            };

            const sceneToImport: RaidScene = {
                id: 'new-scene',
                raidId: 'raid1',
                name: 'New Scene',
                shape: { type: 'rectangle', width: 20, height: 20 },
                stepIds: [],
                entityIds: [],
            };

            const data: Exports = {
                scenes: [
                    {
                        scene: sceneToImport,
                        steps: [],
                        entities: [],
                    },
                ],
                entities: [
                    {
                        id: 'entity-for-scene1',
                        entities: [entityToImport],
                    },
                ],
            };

            const result = importOperation(state, 'raid1', 'scene1', data);

            expect(result!.sceneIds).toHaveLength(1);
            expect(result!.entityIds).toHaveLength(1);
            expect(result!.operation.putScenes).toHaveLength(2); // updated scene1 + new scene
            expect(result!.operation.putEntities).toHaveLength(1);
        });
    });
});
