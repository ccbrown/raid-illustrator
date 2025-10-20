import { shapeDimensions } from '@/models/raids/utils';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class NameText extends VisualEffect {
    renderOverlay({ ctx, properties: anyProperties, name, shape, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        if (!properties.enabled) {
            return;
        }

        const entityDimensions = shapeDimensions(shape);
        const fontSize = Math.min(entityDimensions.height * 0.5, 1);

        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y + 0.5 * entityDimensions.height + fontSize * 0.85);

        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = fontSize / 5;
        ctx.lineJoin = 'round';
        ctx.strokeText(name, 0, 0);
        ctx.fillText(name, 0, 0);
    }
}

interface Properties {
    enabled: boolean;
}

export const nameText: VisualEffectFactory = {
    name: 'Name Text',
    description: "This is a specialized version of the text effect which shows the entity's name below it.",
    create: () => new NameText(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
    ],
};
