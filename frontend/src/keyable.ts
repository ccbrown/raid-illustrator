interface KeyedValue<T> {
    keyed: true;
    steps: Record<string, T>;
}

interface UnkeyedValue<T> {
    keyed: false;
    value: T;
}

export type Keyable<T> = KeyedValue<T> | UnkeyedValue<T>;

export const keyableValueAtStep = <T>(kv: Keyable<T>, sceneStepIds: string[], currentStepId: string): T => {
    if (!kv.keyed) {
        return kv.value;
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

    // fallback to the first step that has a value, even if it's in a future step
    for (let i = currentStepIndex + 1; i < sceneStepIds.length; i++) {
        const stepId = sceneStepIds[i];
        const value = kv.steps[stepId];
        if (value !== undefined) {
            return value;
        }
    }

    throw new Error('No value found for keyed value');
};

export const keyableWithValueAtStep = <T>(kv: Keyable<T>, value: T, stepId: string): Keyable<T> => {
    if (!kv.keyed) {
        return { keyed: false, value };
    }

    return {
        keyed: true,
        steps: {
            ...kv.steps,
            [stepId]: value,
        },
    };
};
