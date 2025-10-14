import { AnyProperties, Shape } from '@/models/raids/types';
import { PropertySpec } from '@/property-spec';

export interface VisualEffectRenderParams {
    ctx: CanvasRenderingContext2D;
    shape: Shape;
    scale: number;
    center: { x: number; y: number };
    rotation: number;
    properties: AnyProperties;
}

export abstract class VisualEffect {
    renderGround?(params: VisualEffectRenderParams): void;
    renderOverlay?(params: VisualEffectRenderParams): void;
}

export interface VisualEffectFactory {
    name: string;
    properties?: PropertySpec[];
    create: () => VisualEffect;
}
