import { AnyProperties, Keyable } from '@/models/raids/types';

import { keyableValueAtStep } from './models/raids/utils';

interface PropertySpecBase {
    name: string;
    key: string;
    keyable?: boolean;
}

interface PropertySpecArray extends PropertySpecBase {
    type: 'array';
    default: AnyProperties[];
    itemProperties: PropertySpec[];
}

interface PropertySpecText extends PropertySpecBase {
    type: 'text';
    default: string;
}

interface PropertySpecBoolean extends PropertySpecBase {
    type: 'boolean';
    default: boolean;
}

interface PropertySpecAngle extends PropertySpecBase {
    type: 'angle';
    default: number;
}

interface PropertySpecNumber extends PropertySpecBase {
    type: 'number';
    default: number;
}

interface PropertySpecEnumChoice {
    value: string;
    label: string;
}

interface PropertySpecEnum extends PropertySpecBase {
    type: 'enum';
    default: string;
    choices: PropertySpecEnumChoice[];
}

interface PropertySpecColor extends PropertySpecBase {
    type: 'color';
    default: { r: number; g: number; b: number };
}

interface PropertySpecCoordinate extends PropertySpecBase {
    type: 'coordinate';
    default: { x: number; y: number };
}

// PropertySpec is used for run-time defined properties, e.g. for visual effects.
export type PropertySpec =
    | PropertySpecBoolean
    | PropertySpecText
    | PropertySpecEnum
    | PropertySpecColor
    | PropertySpecNumber
    | PropertySpecAngle
    | PropertySpecCoordinate
    | PropertySpecArray;

// Returns the properties for the current step, resolving keyable values and adding defaults as needed.
export const resolveProperties = (
    properties: AnyProperties,
    specs: PropertySpec[],
    sceneStepIds: string[],
    currentStepId: string,
): AnyProperties => {
    const result: AnyProperties = {};
    for (const spec of specs) {
        const v = properties[spec.key];
        if (v === undefined) {
            result[spec.key] = spec.default;
            continue;
        }

        let currentValue = spec.keyable ? keyableValueAtStep(v as Keyable<unknown>, sceneStepIds, currentStepId) : v;
        if (spec.type === 'array' && Array.isArray(currentValue)) {
            const itemSpecs = spec.itemProperties;
            const resolvedArray: AnyProperties[] = [];
            for (const item of currentValue) {
                const resolvedItem = resolveProperties(item as AnyProperties, itemSpecs, sceneStepIds, currentStepId);
                resolvedArray.push(resolvedItem);
            }
            currentValue = resolvedArray;
        }
        result[spec.key] = currentValue;
    }
    return result;
};

export const defaultProperties = (specs: PropertySpec[]): AnyProperties => {
    const result: AnyProperties = {};
    for (const spec of specs) {
        result[spec.key] = spec.default;
    }
    return result;
};
