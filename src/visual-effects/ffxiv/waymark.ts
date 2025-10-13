import { Animated } from '@/animated';
import { Image } from '@/renderer';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

interface Variant {
    markerImageUrl: string;
    markerImageScale: { width: number; height: number };
    markerImageXOffset?: number;
    colors: string[];
    shape: 'square' | 'circle';
}

// Waymarks are always 2x2 meters.
const WAYMARK_SIZE = 2.0;

type VariantKey = 'a' | 'b' | 'c' | 'd' | '1' | '2' | '3' | '4';

const VARIANTS: Record<VariantKey, Variant> = {
    a: {
        markerImageUrl: '/images/ffxiv/waymarks/markers/a.png',
        colors: ['#ffb6b3', '#ff73f1'],
        shape: 'circle',
        markerImageScale: { width: 1.2, height: 1.2 },
    },
    b: {
        markerImageUrl: '/images/ffxiv/waymarks/markers/b.png',
        colors: ['#ffdc61', '#ffb383'],
        shape: 'circle',
        markerImageScale: { width: 1.55, height: 0.8 },
    },
    c: {
        markerImageUrl: '/images/ffxiv/waymarks/markers/c.png',
        colors: ['#c6cfff', '#73f5ff'],
        shape: 'circle',
        markerImageScale: { width: 1.3, height: 1.3 },
        markerImageXOffset: -0.1,
    },
    d: {
        markerImageUrl: '/images/ffxiv/waymarks/markers/d.png',
        colors: ['#c6cfff', '#a65dff'],
        shape: 'circle',
        markerImageScale: { width: 1.35, height: 1.3 },
        markerImageXOffset: 0.05,
    },
    '1': {
        markerImageUrl: '/images/ffxiv/waymarks/markers/1.png',
        colors: ['#ffb6b3', '#ff73f1'],
        shape: 'square',
        markerImageScale: { width: 0.8, height: 0.8 },
    },
    '2': {
        markerImageUrl: '/images/ffxiv/waymarks/markers/2.png',
        colors: ['#ffdc61', '#ffb383'],
        shape: 'square',
        markerImageScale: { width: 1.2, height: 1 },
    },
    '3': {
        markerImageUrl: '/images/ffxiv/waymarks/markers/3.png',
        colors: ['#c6cfff', '#73f5ff'],
        shape: 'square',
        markerImageScale: { width: 1, height: 0.75 },
    },
    '4': {
        markerImageUrl: '/images/ffxiv/waymarks/markers/4.png',
        colors: ['#c6cfff', '#a65dff'],
        shape: 'square',
        markerImageScale: { width: 1.3, height: 0.7 },
        markerImageXOffset: -0.05,
    },
};

class Waymark extends VisualEffect {
    variantKey: string = '';
    markerImage?: Image;
    enabled: Animated<number> = new Animated(0);

    renderGround({ ctx, properties: anyProperties, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, {
            transitionDuration: 300,
        });
        if (!enabled) {
            return;
        }

        ctx.globalAlpha = enabled;

        const variant = VARIANTS[properties.variant];
        if (this.variantKey !== properties.variant) {
            this.markerImage = new Image(variant.markerImageUrl);
            this.variantKey = properties.variant;
        }

        const x = center.x * scale;
        const y = center.y * scale;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, (WAYMARK_SIZE / 2) * scale);
        gradient.addColorStop(0, variant.colors[0] + '80');
        gradient.addColorStop(1, variant.colors[1] + '20');
        ctx.shadowBlur = 0.5 * scale;
        ctx.shadowColor = variant.colors[1];
        ctx.fillStyle = gradient;
        ctx.strokeStyle = variant.colors[0];
        ctx.lineWidth = 0.05 * scale;

        const now = Date.now();

        switch (variant.shape) {
            case 'square': {
                ctx.fillRect(
                    (center.x - WAYMARK_SIZE / 2) * scale,
                    (center.y - WAYMARK_SIZE / 2) * scale,
                    WAYMARK_SIZE * scale,
                    WAYMARK_SIZE * scale,
                );
                ctx.strokeRect(
                    (center.x - WAYMARK_SIZE / 2) * scale,
                    (center.y - WAYMARK_SIZE / 2) * scale,
                    WAYMARK_SIZE * scale,
                    WAYMARK_SIZE * scale,
                );

                for (let i = 0; i < 3; i++) {
                    const growth = (now % 700) / 700;
                    const offset = i * 0.1 + growth * 0.1;

                    if (i === 2) {
                        ctx.globalAlpha = 1.0 - growth;
                    }
                    ctx.lineWidth = 0.02 * scale;
                    ctx.strokeRect(
                        (center.x - WAYMARK_SIZE / 2 - offset) * scale,
                        (center.y - WAYMARK_SIZE / 2 - offset) * scale,
                        (WAYMARK_SIZE + offset * 2) * scale,
                        (WAYMARK_SIZE + offset * 2) * scale,
                    );
                    ctx.globalAlpha = 1.0;
                }

                break;
            }
            case 'circle': {
                ctx.beginPath();
                ctx.arc(x, y, WAYMARK_SIZE * 0.5 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.lineWidth = 0.01 * scale;
                ctx.fillStyle = variant.colors[0];

                for (let i = 0; i < 11; i++) {
                    const rads = (i / 11) * Math.PI * 2 - ((now % 12000) / 12000) * (Math.PI * 2);
                    ctx.beginPath();
                    ctx.moveTo(
                        x + Math.cos(rads) * (WAYMARK_SIZE / 2 - 0.2) * scale,
                        y + Math.sin(rads) * (WAYMARK_SIZE / 2 - 0.2) * scale,
                    );
                    ctx.lineTo(
                        x + Math.cos(rads + 0.02) * (WAYMARK_SIZE / 2) * scale,
                        y + Math.sin(rads + 0.02) * (WAYMARK_SIZE / 2) * scale,
                    );
                    ctx.lineTo(
                        x + Math.cos(rads) * (WAYMARK_SIZE / 2 + 0.2) * scale,
                        y + Math.sin(rads) * (WAYMARK_SIZE / 2 + 0.2) * scale,
                    );
                    ctx.lineTo(
                        x + Math.cos(rads - 0.02) * (WAYMARK_SIZE / 2) * scale,
                        y + Math.sin(rads - 0.02) * (WAYMARK_SIZE / 2) * scale,
                    );
                    ctx.closePath();
                    ctx.fill();
                }

                break;
            }
        }

        ctx.shadowBlur = 0;

        const img = this.markerImage?.get();
        if (img) {
            const floatHeight = 0.1 * Math.sin(((now % 5000) / 5000) * Math.PI * 2) * scale;

            const imgHeight = WAYMARK_SIZE * 1.3 * scale * variant.markerImageScale.height;
            const imgWidth = WAYMARK_SIZE * 1.3 * 0.5 * scale * variant.markerImageScale.width;
            ctx.drawImage(
                img,
                x - imgWidth / 2 + (variant.markerImageXOffset || 0) * scale,
                y - imgHeight / 2 - floatHeight,
                imgWidth,
                imgHeight,
            );
        }
    }
}

interface Properties {
    enabled: boolean;
    variant: VariantKey;
}

export const waymark: VisualEffectFactory = {
    name: 'Waymark',
    create: () => new Waymark(),
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
            default: 'a',
            choices: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
            ],
        },
    ],
};
