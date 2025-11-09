type AnimatableType = number | { [key: string]: number };

const equals = <T extends AnimatableType>(a: T, b: T): boolean => {
    if (typeof a !== typeof b) {
        return false;
    } else if (a === b) {
        return true;
    }

    if (typeof a === 'object' && a && b) {
        const aKeys = Object.keys(a) as (keyof typeof a)[];
        const bKeys = Object.keys(b) as (keyof typeof b)[];

        if (aKeys.length !== bKeys.length) {
            return false;
        }

        for (const key of aKeys) {
            if (a[key] !== b[key]) {
                return false;
            }
        }

        return true;
    }

    return false;
};

const interpolate = <T extends AnimatableType>(from: T, to: T, progress: number): T => {
    if (typeof from === 'number' && typeof to === 'number') {
        return (from + (to - from) * progress) as T;
    } else if (typeof from === 'object' && from !== null && typeof to === 'object' && to !== null) {
        const result: { [key: string]: number } = {};
        const keys = new Set([...Object.keys(from), ...Object.keys(to)]);

        keys.forEach((key) => {
            const fromValue = from[key] ?? 0;
            const toValue = to[key] ?? 0;
            result[key] = fromValue + (toValue - fromValue) * progress;
        });

        return result as T;
    }
    return to;
};

type EasingFunction = (t: number) => number;

export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);
export const smoothstep: EasingFunction = (t) => t * t * (3 - 2 * t);

interface UpdateParams {
    easingFunction?: EasingFunction;
    transitionDuration?: number;
}

export class Animated<T extends AnimatableType> {
    private previousValue?: T;
    private latestValue?: T;
    private latestUpdateTime?: number;
    private transitionStartTime?: number;
    private transitionDuration?: number;
    private easingFunction?: EasingFunction;

    update(currentValue: T, now: number, params?: UpdateParams): T {
        if (this.latestValue === undefined) {
            this.latestValue = currentValue;
            return currentValue;
        } else if (!equals(this.latestValue, currentValue)) {
            this.previousValue = this.get(now);
            this.latestValue = currentValue;
            // for more reasonable behavior when the animation is suspended and later resumed, use
            // the last update time as the transition start time
            this.transitionStartTime = this.latestUpdateTime ?? now;
            this.transitionDuration = params?.transitionDuration;
            this.easingFunction = params?.easingFunction;
        }
        this.latestUpdateTime = now;
        return this.get(now)!;
    }

    private ease(t: number): number {
        if (this.easingFunction) {
            return this.easingFunction(t);
        }
        return easeOutCubic(t);
    }

    get(now: number): T | undefined {
        if (this.latestValue === undefined) {
            return undefined;
        }

        if (this.previousValue === undefined || !this.transitionStartTime) {
            return this.latestValue;
        }

        const elapsed = now - this.transitionStartTime;
        const progress = this.ease(Math.min(elapsed / (this.transitionDuration ?? 300), 1));

        if (progress >= 1) {
            this.previousValue = undefined;
            this.transitionStartTime = undefined;
            return this.latestValue;
        }

        return interpolate(this.previousValue, this.latestValue, progress);
    }
}
