export interface Keyable<T> {
    initial: T;
    steps?: Record<string, T>;
}

export const keyableValueAtStep = <T>(kv: Keyable<T>, sceneStepIds: string[], currentStepId: string): T => {
    if (!kv.steps) {
        return kv.initial;
    }

    // find the closest previous step that has a value
    const currentStepIndex = sceneStepIds.indexOf(currentStepId);
    for (let i = currentStepIndex; i >= 0; i--) {
        const stepId = sceneStepIds[i];
        const value = kv.steps[stepId];
        if (value !== undefined) {
            return value;
        }
    }

    return kv.initial;
};

// Returns a new Keyable with the value set at the given stepId. This does NOT change unkeyed
// Keyables to keyed ones. If the Keyable is unkeyed, it just returns a new unkeyed Keyable with the
// given value.
export const keyableWithValueAtStep = <T>(
    kv: Keyable<T>,
    value: T,
    sceneStepIds: string[],
    stepId: string,
): Keyable<T> => {
    if (!kv.steps) {
        return { initial: value };
    }

    const isFirstStep = sceneStepIds.length > 0 && sceneStepIds[0] === stepId;

    return {
        initial: isFirstStep ? value : kv.initial,
        steps: {
            ...kv.steps,
            [stepId]: value,
        },
    };
};

// Returns a new Keyable where the given stepId is keyed to the current value, converting an unkeyed
// Keyable to a keyed one if necessary.
export const keyableWithKeyedStep = <T>(kv: Keyable<T>, sceneStepIds: string[], stepId: string): Keyable<T> => {
    if (!kv.steps) {
        return {
            initial: kv.initial,
            steps: {
                [stepId]: kv.initial,
            },
        };
    }

    const currentValue = keyableValueAtStep(kv, sceneStepIds, stepId);

    return {
        initial: kv.initial,
        steps: {
            ...kv.steps,
            [stepId]: currentValue,
        },
    };
};

// Returns a new Keyable where the given stepId is removed from the keyed steps. If there are no
// remaining keyed steps, converts to an unkeyed Keyable.
export const keyableWithUnkeyedStep = <T>(kv: Keyable<T>, stepId: string): Keyable<T> => {
    if (!kv.steps) {
        return kv;
    }

    const { [stepId]: _, ...remainingSteps } = kv.steps;
    return {
        initial: kv.initial,
        steps: Object.keys(remainingSteps).length > 0 ? remainingSteps : undefined,
    };
};
