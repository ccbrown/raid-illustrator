import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

interface WaymarkParams {
    markerImageUrl: string;
    markerImageScale: { width: number; height: number };
    markerImageXOffset?: number;
    colors: string[];
    shape: 'square' | 'circle';
}

// Waymarks are always 2x2 meters.
const WAYMARK_SIZE = 2.0;

class Waymark extends VisualEffect {
    colors: string[];
    shape: 'square' | 'circle';
    markerImage?: HTMLImageElement;
    markerImageScale: { width: number; height: number };
    markerImageXOffset: number;

    constructor(params: WaymarkParams) {
        super();
        this.colors = params.colors;
        this.shape = params.shape;

        const img = new Image();
        img.src = params.markerImageUrl;
        this.markerImage = img;
        this.markerImage.onerror = () => {
            console.log(`failed to load waymark image: ${params.markerImageUrl}`);
            this.markerImage = undefined;
        };
        this.markerImageScale = params.markerImageScale;
        this.markerImageXOffset = params.markerImageXOffset ?? 0;
    }

    renderGround({ ctx, properties: anyProperties, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        if (!properties.enabled) {
            return;
        }

        const x = center.x * scale;
        const y = center.y * scale;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, (WAYMARK_SIZE / 2) * scale);
        gradient.addColorStop(0, this.colors[0] + '80');
        gradient.addColorStop(1, this.colors[1] + '20');
        ctx.shadowBlur = 0.5 * scale;
        ctx.shadowColor = this.colors[1];
        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.colors[0];
        ctx.lineWidth = 0.05 * scale;

        const now = Date.now();

        switch (this.shape) {
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
                ctx.fillStyle = this.colors[0];

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

        if (this.markerImage?.complete) {
            const floatHeight = 0.1 * Math.sin(((now % 5000) / 5000) * Math.PI * 2) * scale;

            const imgHeight = WAYMARK_SIZE * 1.3 * scale * this.markerImageScale.height;
            const imgWidth = WAYMARK_SIZE * 1.3 * 0.5 * scale * this.markerImageScale.width;
            ctx.drawImage(
                this.markerImage,
                x - imgWidth / 2 + this.markerImageXOffset * scale,
                y - imgHeight / 2 - floatHeight,
                imgWidth,
                imgHeight,
            );
        }
    }
}

interface Properties {
    enabled: boolean;
}

const factory = (name: string, params: WaymarkParams): VisualEffectFactory => ({
    name,
    create: () => new Waymark(params),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
    ],
});

export const waymarkA = factory('Waymark A', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/a.png',
    colors: ['#ffb6b3', '#ff73f1'],
    shape: 'circle',
    markerImageScale: { width: 1.2, height: 1.2 },
});

export const waymarkB = factory('Waymark B', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/b.png',
    colors: ['#ffdc61', '#ffb383'],
    shape: 'circle',
    markerImageScale: { width: 1.55, height: 0.8 },
});

export const waymarkC = factory('Waymark C', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/c.png',
    colors: ['#c6cfff', '#73f5ff'],
    shape: 'circle',
    markerImageScale: { width: 1.3, height: 1.3 },
    markerImageXOffset: -0.1,
});

export const waymarkD = factory('Waymark D', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/d.png',
    colors: ['#c6cfff', '#a65dff'],
    shape: 'circle',
    markerImageScale: { width: 1.35, height: 1.3 },
    markerImageXOffset: 0.05,
});

export const waymark1 = factory('Waymark 1', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/1.png',
    colors: ['#ffb6b3', '#ff73f1'],
    shape: 'square',
    markerImageScale: { width: 0.8, height: 0.8 },
});

export const waymark2 = factory('Waymark 2', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/2.png',
    colors: ['#ffdc61', '#ffb383'],
    shape: 'square',
    markerImageScale: { width: 1.2, height: 1 },
});

export const waymark3 = factory('Waymark 3', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/3.png',
    colors: ['#c6cfff', '#73f5ff'],
    shape: 'square',
    markerImageScale: { width: 1, height: 0.75 },
});

export const waymark4 = factory('Waymark 4', {
    markerImageUrl: '/images/ffxiv/waymarks/markers/4.png',
    colors: ['#c6cfff', '#a65dff'],
    shape: 'square',
    markerImageScale: { width: 1.3, height: 0.7 },
    markerImageXOffset: -0.05,
});
