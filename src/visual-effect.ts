import { AnyProperties, Shape } from '@/models/raids/types';
import { PropertySpec } from '@/property-spec';

// To allow for seamless loops, all looping visual effect animations should use these durations or factors thereof.
export enum LoopDuration {
    D15000 = 15000,
    D7500 = D15000 / 2,
    D5000 = D15000 / 3,
    D3750 = D15000 / 4,
    D3000 = D15000 / 5,
    D2500 = D15000 / 6,
    D1875 = D15000 / 8,
    D1667 = D15000 / 9,
    D1500 = D15000 / 10,
    D1250 = D15000 / 12,
    D1000 = D15000 / 15,
    D750 = D15000 / 20,
    D600 = D15000 / 25,
    D500 = D15000 / 30,
}

export const loop = (now: number, duration: LoopDuration): number => {
    return (now % duration) / duration;
};

interface VisualEffectRenderParamsRenderer {
    getEntityPositionByName: (name: string) => { x: number; y: number } | undefined;
}

export interface VisualEffectRenderParams {
    ctx: CanvasRenderingContext2D;
    shape: Shape;
    scale: number;
    center: { x: number; y: number };
    rotation: number;
    properties: AnyProperties;
    renderer: VisualEffectRenderParamsRenderer;
    now: number;
}

export abstract class VisualEffect {
    renderGround?(params: VisualEffectRenderParams): void;
    renderAboveGround?(params: VisualEffectRenderParams): void;
    renderOverlay?(params: VisualEffectRenderParams): void;
}

export interface VisualEffectFactory {
    name: string;
    description: string;
    properties?: PropertySpec[];
    create: () => VisualEffect;
}
