import { Animated } from '@/animated';
import { shapeDimensions } from '@/models/raids/utils';
import { Image, LazyImage } from '@/renderer';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

interface Marker {
    imageUrl: string;
    imageScale: { width: number; height: number };
    imageXOffset?: number;
}

type MarkerKey = 'a' | 'b' | 'c' | 'd' | '1' | '2' | '3' | '4' | 'none';

const MARKERS: Record<string, Marker> = {
    a: {
        imageUrl: '/images/ffxiv/waymarks/markers/a.png',
        imageScale: { width: 1.2, height: 1.2 },
    },
    b: {
        imageUrl: '/images/ffxiv/waymarks/markers/b.png',
        imageScale: { width: 1.55, height: 0.8 },
    },
    c: {
        imageUrl: '/images/ffxiv/waymarks/markers/c.png',
        imageScale: { width: 1.3, height: 1.3 },
        imageXOffset: -0.09,
    },
    d: {
        imageUrl: '/images/ffxiv/waymarks/markers/d.png',
        imageScale: { width: 1.35, height: 1.3 },
        imageXOffset: 0.05,
    },
    '1': {
        imageUrl: '/images/ffxiv/waymarks/markers/1.png',
        imageScale: { width: 0.8, height: 0.8 },
    },
    '2': {
        imageUrl: '/images/ffxiv/waymarks/markers/2.png',
        imageScale: { width: 1.2, height: 1 },
    },
    '3': {
        imageUrl: '/images/ffxiv/waymarks/markers/3.png',
        imageScale: { width: 1, height: 0.75 },
    },
    '4': {
        imageUrl: '/images/ffxiv/waymarks/markers/4.png',
        imageScale: { width: 1.3, height: 0.7 },
        imageXOffset: -0.05,
    },
};

class Waymark extends VisualEffect {
    markerKey: string = '';
    markerImage?: Image;
    circleRingImage: LazyImage;
    squareRingImage: LazyImage;
    enabled: Animated<number> = new Animated(0);
    color1: Animated<{ r: number; g: number; b: number }> = new Animated();
    color2: Animated<{ r: number; g: number; b: number }> = new Animated();

    constructor() {
        super();
        this.circleRingImage = new LazyImage('/images/ffxiv/waymarks/circle-ring.png');
        this.squareRingImage = new LazyImage('/images/ffxiv/waymarks/square-ring.png');
    }

    renderGround({ ctx, properties: anyProperties, scale, rotation, shape, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, {
            transitionDuration: 300,
        });
        if (!enabled) {
            return;
        }

        const color1 = this.color1.update(properties.color1, { transitionDuration: 300 });
        const color2 = this.color2.update(properties.color2, { transitionDuration: 300 });

        const marker = MARKERS[properties.marker];
        if (this.markerKey !== properties.marker) {
            this.markerImage = marker ? new Image(marker.imageUrl) : undefined;
            this.markerKey = properties.marker;
        }

        const x = center.x * scale;
        const y = center.y * scale;
        ctx.translate(x, y);
        ctx.rotate(rotation);

        const dims = shapeDimensions(shape);
        const size = Math.max(dims.width, dims.height) * scale;

        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        innerGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.5)`);
        innerGradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.13)`);

        const opaqueColor2 = `rgb(${color2.r}, ${color2.g}, ${color2.b})`;

        const now = Date.now();

        switch (properties.shape) {
            case 'square': {
                {
                    ctx.save();
                    ctx.globalAlpha = enabled;
                    ctx.shadowBlur = 0.5 * scale;
                    ctx.shadowColor = opaqueColor2;
                    ctx.fillStyle = innerGradient;
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                    ctx.restore();
                }

                const ring = this.squareRingImage.get();
                const ringSize = size * 1.1;
                if (ring) {
                    {
                        ctx.save();
                        ctx.globalAlpha = enabled;
                        ctx.shadowBlur = 0.2 * scale;
                        ctx.shadowColor = opaqueColor2;
                        ctx.drawImage(ring, -ringSize / 2, -ringSize / 2, ringSize, ringSize);
                        ctx.restore();
                    }

                    {
                        ctx.save();
                        ctx.globalAlpha = 0.25 * enabled;
                        ctx.globalCompositeOperation = 'lighter';
                        ctx.shadowBlur = 0.1 * scale;
                        ctx.shadowColor = opaqueColor2;
                        ctx.drawImage(ring, -ringSize / 2, -ringSize / 2, ringSize, ringSize);
                        ctx.restore();
                    }

                    for (let i = 0; i < 2; i++) {
                        const growth = (now % 700) / 700;
                        const offset = (i + growth) * size * 0.05;

                        ctx.save();
                        ctx.globalAlpha = (i === 0 ? growth : i === 1 ? 1.0 - growth : 1) * enabled * 0.4;
                        ctx.drawImage(
                            ring,
                            -ringSize / 2 - offset,
                            -ringSize / 2 - offset,
                            ringSize + offset * 2,
                            ringSize + offset * 2,
                        );
                        ctx.restore();
                    }
                }

                break;
            }
            case 'circle': {
                const r = size / 2;

                // inner gradient
                {
                    ctx.save();
                    ctx.shadowBlur = 0.5 * scale;
                    ctx.shadowColor = opaqueColor2;
                    ctx.fillStyle = innerGradient;
                    ctx.globalAlpha = enabled;
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                const ring = this.circleRingImage.get();
                const ringSize = size * 1.26;
                if (ring) {
                    {
                        ctx.save();
                        ctx.globalAlpha = 0.8 * enabled;
                        ctx.shadowBlur = 0.2 * scale;
                        ctx.shadowColor = opaqueColor2;
                        ctx.drawImage(ring, -ringSize / 2, -ringSize / 2, ringSize, ringSize);
                        ctx.restore();
                    }

                    {
                        ctx.save();
                        ctx.globalAlpha = 0.1 * enabled;
                        ctx.globalCompositeOperation = 'lighter';
                        ctx.shadowBlur = 0;
                        ctx.drawImage(ring, -ringSize / 2, -ringSize / 2, ringSize, ringSize);
                        ctx.restore();
                    }
                }

                const beamRadius = r * 0.4;
                const beamGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, beamRadius);
                beamGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.8)`);
                beamGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.1)`);
                beamGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                ctx.fillStyle = beamGradient;

                for (let i = 0; i < 11; i++) {
                    const rads = (i / 11) * Math.PI * 2 - ((now % 12000) / 12000) * (Math.PI * 2);
                    ctx.save();
                    ctx.globalAlpha = enabled * 0.5;
                    ctx.rotate(rads);
                    ctx.translate(r, 0);
                    ctx.scale(0.3, 0.8);
                    ctx.beginPath();
                    ctx.arc(0, 0, beamRadius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.scale(0.5, 0.8);
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.beginPath();
                    ctx.arc(0, 0, beamRadius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.restore();
                }

                break;
            }
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = enabled;

        const img = this.markerImage?.get();
        if (marker && img) {
            const floatHeight = 0.1 * Math.sin(((now % 5000) / 5000) * Math.PI * 2) * scale;

            const imgHeight = size * 1.3 * marker.imageScale.height;
            const imgWidth = size * 1.3 * 0.5 * marker.imageScale.width;
            ctx.drawImage(
                img,
                -imgWidth / 2 + (marker.imageXOffset || 0) * scale,
                -imgHeight / 2 - floatHeight,
                imgWidth,
                imgHeight,
            );
        }
    }
}

interface Properties {
    enabled: boolean;
    marker: MarkerKey;
    shape: 'circle' | 'square';
    color1: { r: number; g: number; b: number };
    color2: { r: number; g: number; b: number };
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
            name: 'Shape',
            type: 'enum',
            key: 'shape',
            keyable: true,
            default: 'square',
            choices: [
                { value: 'circle', label: 'Circle' },
                { value: 'square', label: 'Square' },
            ],
        },
        {
            name: 'Marker',
            type: 'enum',
            key: 'marker',
            keyable: true,
            default: '1',
            choices: [
                { value: 'none', label: 'None' },
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
        {
            name: 'Color 1',
            type: 'color',
            key: 'color1',
            keyable: true,
            default: {
                r: 255,
                g: 182,
                b: 179,
            },
        },
        {
            name: 'Color 2',
            type: 'color',
            key: 'color2',
            keyable: true,
            default: { r: 255, g: 155, b: 241 },
        },
    ],
};
