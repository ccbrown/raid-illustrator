import { Keyable, Shape } from './types';

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
export const keyableWithUnkeyedStep = <T>(k: Keyable<T>, stepId: string): Keyable<T> => {
    const norm = normalizeKeyable(k);
    if (!norm.steps) {
        return norm.initial;
    }

    const { [stepId]: _, ...remainingSteps } = norm.steps;
    return Object.keys(remainingSteps).length > 0
        ? {
              initial: norm.initial,
              steps: remainingSteps,
          }
        : norm.initial;
};
