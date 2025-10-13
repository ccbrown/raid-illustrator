import { AnyProperties, Keyable } from '@/models/raids/types';

import { keyableValueAtStep } from './models/raids/utils';

interface PropertySpecBase {
    name: string;
    key: string;
    keyable?: boolean;
}

interface PropertySpecBoolean extends PropertySpecBase {
    type: 'boolean';
    default: boolean;
}

// PropertySpec is used for run-time defined properties, e.g. for visual effects.
export type PropertySpec = PropertySpecBoolean;

export const resolveKeyableProperties = (
    properties: AnyProperties,
    specs: PropertySpec[],
    sceneStepIds: string[],
    currentStepId: string,
): AnyProperties => {
    const result: AnyProperties = {};
    for (const spec of specs) {
        const v = properties[spec.key];
        if (!v) {
            continue;
        }

        if (!spec.keyable) {
            result[spec.key] = v;
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentValue = keyableValueAtStep(v as Keyable<any>, sceneStepIds, currentStepId);
        result[spec.key] = currentValue;
    }
    return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultProperty = (spec: PropertySpec): any => {
    switch (spec.type) {
        case 'boolean':
            if (spec.keyable) {
                return { initial: spec.default };
            } else {
                return spec.default;
            }
    }
};

export const defaultProperties = (specs: PropertySpec[]): AnyProperties => {
    const result: AnyProperties = {};
    for (const spec of specs) {
        result[spec.key] = defaultProperty(spec);
    }
    return result;
};
