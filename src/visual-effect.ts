import { AnyProperties, Shape } from '@/models/raids/types';
import { PropertySpec } from '@/property-spec';

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
