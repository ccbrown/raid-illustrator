import { shapeDimensions } from '@/models/raids/utils';
import { Image } from '@/renderer';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class StatusEffects extends VisualEffect {
    images: Map<number, Image> = new Map();

    renderOverlay({ ctx, properties: anyProperties, shape, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;

        // load new images if needed
        for (const statusEffect of properties.statusEffects) {
            if (statusEffect.imageId && !this.images.has(statusEffect.imageId)) {
                // e.g. https://xivapi.com/i/217000/217242_hr1.png
                const image = new Image(
                    `https://xivapi.com/i/${Math.floor(statusEffect.imageId / 1000) * 1000}/${statusEffect.imageId}_hr1.png`,
                );
                this.images.set(statusEffect.imageId, image);
            }
        }

        // remove images that are no longer needed
        for (const imageId of this.images.keys()) {
            if (!properties.statusEffects.find((se) => se.imageId === imageId)) {
                this.images.delete(imageId);
            }
        }

        if (!properties.enabled) {
            return;
        }

        const entityDimensions = shapeDimensions(shape);

        ctx.scale(scale, scale);
        ctx.translate(
            center.x - 0.5 * entityDimensions.width + properties.offset.x,
            center.y - 0.5 * entityDimensions.height + properties.offset.y,
        );
        ctx.scale(properties.scale, properties.scale);

        const imageHeight = 1;
        const imageWidth = imageHeight * (48 / 64);
        const imageGap = imageWidth * 0.1;
        const fontSize = 0.4;

        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = fontSize / 5;
        ctx.lineJoin = 'round';

        let x = 0;

        for (let i = 0; i < properties.statusEffects.length; i++) {
            const statusEffect = properties.statusEffects[i];
            if (!statusEffect.enabled) {
                continue;
            }

            const image = this.images.get(statusEffect.imageId)?.get();
            if (image) {
                ctx.drawImage(image, x, 0, imageWidth, imageHeight);
                if (statusEffect.text) {
                    const cx = x + imageWidth / 2;
                    const ty = imageHeight - 0.1;
                    ctx.strokeText(statusEffect.text, cx, ty);
                    ctx.fillText(statusEffect.text, cx, ty);
                }
                x += imageWidth + imageGap;
            }
        }
    }
}

interface StatusEffect {
    enabled: boolean;
    imageId: number;
    text: string;
}

interface Properties {
    enabled: boolean;
    scale: number;
    offset: { x: number; y: number };
    statusEffects: StatusEffect[];
}

export const statusEffects: VisualEffectFactory = {
    name: 'Status Effects',
    description: 'This renders one or more status effect icons on top of the entity using XIVAPI.',
    create: () => new StatusEffects(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Scale',
            type: 'number',
            key: 'scale',
            default: 0.5,
        },
        {
            name: 'Offset',
            type: 'coordinate',
            key: 'offset',
            default: { x: 0, y: 0 },
        },
        {
            name: 'Status Effects',
            type: 'array',
            key: 'statusEffects',
            itemProperties: [
                {
                    name: 'Enabled',
                    type: 'boolean',
                    key: 'enabled',
                    keyable: true,
                    default: true,
                },
                {
                    name: 'Image Id',
                    type: 'number',
                    key: 'imageId',
                    default: 0,
                },
                {
                    name: 'Text',
                    type: 'text',
                    key: 'text',
                    default: '',
                    keyable: true,
                },
            ],
            default: [],
        },
    ],
};
