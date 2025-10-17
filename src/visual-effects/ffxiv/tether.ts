import { Animated } from '@/animated';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams, loop } from '@/visual-effect';

class Tether extends VisualEffect {
    enabled: Animated<number> = new Animated();

    renderAboveGround({ ctx, properties: anyProperties, scale, center, renderer, now }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, now, {
            transitionDuration: 300,
        });
        if (!enabled) {
            return;
        }

        const target = renderer.getEntityPositionByName(properties.target);
        if (!target) {
            return;
        }

        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y);

        const color1 = properties.color1;
        const color2 = properties.color2;

        const angle = Math.atan2(target.y - center.y, target.x - center.x);
        ctx.rotate(angle);

        const lineWidth = 0.15;
        const distance = Math.hypot(target.x - center.x, target.y - center.y);

        ctx.beginPath();
        ctx.rect(0, -lineWidth * 2, distance, lineWidth * 4);
        ctx.clip();

        {
            const gradient = ctx.createLinearGradient(0, -lineWidth * 0.5, 0, lineWidth * 0.5);
            gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
            gradient.addColorStop(0.5, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.05 * enabled})`);
            gradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
            ctx.shadowColor = `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${enabled})`;
            ctx.shadowBlur = lineWidth * scale;
            ctx.fillStyle = gradient;
            ctx.fillRect(0, -lineWidth / 2, distance, lineWidth);
        }

        ctx.globalCompositeOperation = 'lighter';

        const orbMovement = loop(now, 1000);
        const orbSpacing = 1;
        const orbRadius = lineWidth * 0.7;
        const orbGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius);
        orbGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.5 * enabled})`);
        orbGradient.addColorStop(0.3, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.4 * enabled})`);
        orbGradient.addColorStop(0.8, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${0.3 * enabled})`);
        orbGradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0)`);
        ctx.fillStyle = orbGradient;
        for (let i = -1; ; i++) {
            const x = orbSpacing * i + orbSpacing * orbMovement;
            if (x - orbSpacing > distance) {
                break;
            }

            ctx.save();
            ctx.translate(x, 0);
            ctx.scale(6, 1);
            ctx.beginPath();
            ctx.arc(0, 0, orbRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.scale(0.8, 0.8);
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(0, 0, orbRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }
}

interface Properties {
    enabled: boolean;
    target: string;
    color1: { r: number; g: number; b: number };
    color2: { r: number; g: number; b: number };
}

export const tether: VisualEffectFactory = {
    name: 'Tether',
    description: 'This effect draws a line effect linking two entities together.',
    create: () => new Tether(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Target',
            type: 'text',
            key: 'target',
            keyable: true,
            default: '',
        },
        {
            name: 'Color 1',
            type: 'color',
            key: 'color1',
            keyable: true,
            default: { r: 0, g: 0, b: 255 },
        },
        {
            name: 'Color 2',
            type: 'color',
            key: 'color2',
            keyable: true,
            default: { r: 50, g: 150, b: 200 },
        },
    ],
};
