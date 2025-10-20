import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class Text extends VisualEffect {
    renderOverlay({ ctx, properties: anyProperties, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        if (!properties.enabled || !properties.content) {
            return;
        }

        ctx.scale(scale, scale);
        ctx.translate(center.x + properties.offset.x, center.y + properties.offset.y);

        const { alignment, content, fontSize } = properties;

        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = alignment;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = fontSize / 5;
        ctx.lineJoin = 'round';
        ctx.strokeText(content, 0, 0);
        ctx.fillText(content, 0, 0);
    }
}

interface Properties {
    enabled: boolean;
    content: string;
    fontSize: number;
    alignment: 'left' | 'center' | 'right';
    offset: { x: number; y: number };
}

export const text: VisualEffectFactory = {
    name: 'Text',
    description: 'This effect attaches a text label to the entity.',
    create: () => new Text(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Content',
            type: 'text',
            key: 'content',
            keyable: true,
            default: '1',
        },
        {
            name: 'Alignment',
            type: 'enum',
            key: 'alignment',
            keyable: true,
            default: 'center',
            choices: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ],
        },
        {
            name: 'Offset',
            type: 'coordinate',
            key: 'offset',
            keyable: true,
            default: { x: 0, y: 0.25 },
        },
        {
            name: 'Font Size',
            type: 'number',
            key: 'fontSize',
            keyable: true,
            default: 0.7,
        },
    ],
};
