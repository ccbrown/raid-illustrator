import { Animated, smoothstep } from '@/animated';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams, loop } from '@/visual-effect';

type ClusterFormation = 'dot' | 'horizontal-pair' | 'upward-triangle' | 'downward-triangle' | 'square';

interface Variant {
    cluster1: ClusterFormation;
    cluster2?: ClusterFormation;
    color: { r: number; g: number; b: number };
}

type VariantKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

const BLUE_COLOR = { r: 20, g: 50, b: 255 };
const RED_COLOR = { r: 255, g: 20, b: 20 };

const VARIANTS: Record<VariantKey, Variant> = {
    '1': { cluster1: 'dot', color: BLUE_COLOR },
    '2': { cluster1: 'horizontal-pair', color: RED_COLOR },
    '3': { cluster1: 'upward-triangle', color: BLUE_COLOR },
    '4': { cluster1: 'square', color: RED_COLOR },
    '5': { cluster1: 'dot', cluster2: 'square', color: BLUE_COLOR },
    '6': { cluster1: 'upward-triangle', cluster2: 'downward-triangle', color: RED_COLOR },
    '7': { cluster1: 'upward-triangle', cluster2: 'square', color: BLUE_COLOR },
    '8': { cluster1: 'square', cluster2: 'square', color: RED_COLOR },
};

const BASE_HORIZONTAL_DOT_SPACING = 0.9;
const BASE_DOT_RADIUS = 0.3;
const BASE_CLUSTER_SPACING = BASE_HORIZONTAL_DOT_SPACING * 2;
const OFFSET_Y = -1.8;

class LimitCut extends VisualEffect {
    enabled: Animated<number> = new Animated();

    renderOverlay({ ctx, properties: anyProperties, scale, center, now }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, now, {
            easingFunction: smoothstep,
            transitionDuration: 500,
        });
        if (!enabled) {
            return;
        }

        const variant = VARIANTS[properties.variant];
        const color = variant.color;

        ctx.translate(center.x * scale, (center.y + OFFSET_Y) * scale);

        const spreadLoop = loop(now, 1875);
        const spread = smoothstep(spreadLoop >= 0.5 ? 1 - (spreadLoop - 0.5) / 0.5 : spreadLoop / 0.5) * 0.3;
        const dotRadius = BASE_DOT_RADIUS * enabled;

        if (variant.cluster2) {
            const offsetX = BASE_CLUSTER_SPACING / 2 + spread;
            this.drawCluster(ctx, { x: -offsetX, y: 0 }, scale, color, dotRadius, spread, variant.cluster1);
            this.drawCluster(ctx, { x: offsetX, y: 0 }, scale, color, dotRadius, spread, variant.cluster2);
        } else {
            this.drawCluster(ctx, { x: 0, y: 0 }, scale, color, dotRadius, spread, variant.cluster1);
        }
    }

    private drawDot(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        r: number,
        color: { r: number; g: number; b: number },
    ) {
        ctx.shadowBlur = r;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;

        const nearWhite = {
            r: Math.min(255, color.r + 200),
            g: Math.min(255, color.g + 200),
            b: Math.min(255, color.b + 200),
        };

        const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        dotGradient.addColorStop(0, '#ffffff');
        dotGradient.addColorStop(0.5, '#ffffff');
        dotGradient.addColorStop(1, `rgba(${nearWhite.r}, ${nearWhite.g}, ${nearWhite.b}, 1.0)`);
        ctx.fillStyle = dotGradient;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = r;

        const hGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
        hGradient.addColorStop(0, `rgba(${nearWhite.r}, ${nearWhite.g}, ${nearWhite.b}, 0.8)`);
        hGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.1)`);
        hGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = hGradient;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(x, y);
        ctx.scale(1.0, 0.1);
        ctx.beginPath();
        ctx.arc(0, 0, r * 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        const vGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4);
        vGradient.addColorStop(0, `rgba(${nearWhite.r}, ${nearWhite.g}, ${nearWhite.b}, 1.0)`);
        vGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.1)`);
        vGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = vGradient;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(x, y);
        ctx.scale(0.05, 1.0);
        ctx.beginPath();
        ctx.arc(0, 0, r * 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    private drawCluster(
        ctx: CanvasRenderingContext2D,
        center: { x: number; y: number },
        scale: number,
        color: { r: number; g: number; b: number },
        dotRadius: number,
        spread: number,
        formation: ClusterFormation,
    ) {
        const x = center.x * scale;
        const y = center.y * scale;
        const r = dotRadius * scale;

        const dotSpacing = BASE_HORIZONTAL_DOT_SPACING + spread;

        switch (formation) {
            case 'dot':
                this.drawDot(ctx, x, y, r, color);
                break;
            case 'horizontal-pair':
                this.drawDot(ctx, x - (dotSpacing / 2) * scale, y, r, color);
                this.drawDot(ctx, x + (dotSpacing / 2) * scale, y, r, color);
                break;
            case 'upward-triangle':
            case 'downward-triangle': {
                const direction = formation === 'upward-triangle' ? 1 : -1;
                this.drawDot(ctx, x, y - direction * (dotSpacing / 2) * scale, r, color);
                this.drawDot(ctx, x - (dotSpacing / 2) * scale, y + direction * (dotSpacing / 2) * scale, r, color);
                this.drawDot(ctx, x + (dotSpacing / 2) * scale, y + direction * (dotSpacing / 2) * scale, r, color);
                break;
            }
            case 'square':
                this.drawDot(ctx, x - (dotSpacing / 2) * scale, y - (dotSpacing / 2) * scale, r, color);
                this.drawDot(ctx, x + (dotSpacing / 2) * scale, y - (dotSpacing / 2) * scale, r, color);
                this.drawDot(ctx, x - (dotSpacing / 2) * scale, y + (dotSpacing / 2) * scale, r, color);
                this.drawDot(ctx, x + (dotSpacing / 2) * scale, y + (dotSpacing / 2) * scale, r, color);
                break;
        }
    }
}

interface Properties {
    enabled: boolean;
    variant: VariantKey;
}

export const limitCut: VisualEffectFactory = {
    name: 'Limit Cut',
    description: 'This effect renders one of eight numbers above the entity in the FFXIV limit cut style.',
    create: () => new LimitCut(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Variant',
            type: 'enum',
            key: 'variant',
            keyable: false,
            default: '1',
            choices: [
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
                { value: '6', label: '6' },
                { value: '7', label: '7' },
                { value: '8', label: '8' },
            ],
        },
    ],
};
