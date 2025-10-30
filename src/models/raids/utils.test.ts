import { describe, expect, it } from 'vitest';

import { Keyed, RaidEntity, RaidStep } from './types';
import {
    cloneEntityAndChildren,
    cloneStep,
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
