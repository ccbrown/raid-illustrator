import { Animated, smoothstep } from '@/animated';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class RadialAttack extends VisualEffect {
    enabled: Animated<number> = new Animated(0);
    enableTime?: number;

    renderGround({ ctx, properties: anyProperties, rotation, scale, center, now }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, now, {
            transitionDuration: 300,
        });
        if (!enabled) {
            this.enableTime = undefined;
            return;
        }

        if (this.enableTime === undefined) {
            this.enableTime = now;
        }

        const { distance, direction, innerRadius, outerRadius, degrees } = properties;

        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation + direction);
        ctx.translate(0, -distance);

        const color1 = properties.color1;
        const color2 = properties.color2;
        const rads = degrees * (Math.PI / 180);
        const ccwAngle = -rads / 2 - Math.PI / 2;
        const cwAngle = ccwAngle + rads;

        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, ccwAngle, cwAngle);
        ctx.arc(0, 0, innerRadius, cwAngle, ccwAngle, true);
        ctx.clip();

        ctx.save();
        ctx.globalAlpha = enabled;
        ctx.fillStyle = `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.10)`;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const edgeGlowSize = Math.min(1, (outerRadius - innerRadius) / 5);

        const waveAnimationProgress = ((now - this.enableTime) % 1600) / 1600;
        const waveIsVisible = waveAnimationProgress < 0.6;
        const waveMovementProgress = Math.min(waveAnimationProgress / 0.6, 1);
        const waveOpacity = smoothstep(1 - Math.abs(waveMovementProgress - 0.5) * 2);
        const ringWidth = outerRadius - innerRadius;
        const waveRadius = innerRadius + ringWidth * waveMovementProgress;
        const waveGradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, waveRadius);
        waveGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.05)`);
        waveGradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.2)`);

        // edge glow
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'white';
        ctx.shadowColor = `rgba(${color2.r}, ${color2.g}, ${color2.b}, 1)`;
        ctx.shadowBlur = edgeGlowSize * scale;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius + 1, 0, Math.PI * 2);
        ctx.moveTo(Math.cos(ccwAngle) * outerRadius, Math.sin(ccwAngle) * outerRadius);
        ctx.arc(0, 0, outerRadius, ccwAngle, cwAngle);
        ctx.arc(0, 0, innerRadius, cwAngle, ccwAngle, true);
        if (innerRadius > 1) {
            ctx.moveTo(0, innerRadius - 1);
            ctx.arc(0, 0, innerRadius - 1, 0, Math.PI * 2);
        }
        ctx.fill('evenodd');

        // wave
        ctx.globalAlpha = waveOpacity * enabled;
        if (waveIsVisible) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = waveGradient;
            ctx.beginPath();
            ctx.arc(0, 0, waveRadius, ccwAngle, cwAngle);
            ctx.arc(0, 0, innerRadius, cwAngle, ccwAngle, true);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'lighter';

        // edge glow
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'white';
        ctx.shadowColor = `rgba(${color2.r}, ${color2.g}, ${color2.b}, 1)`;
        ctx.shadowBlur = edgeGlowSize * scale;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius + 1, 0, Math.PI * 2);
        ctx.moveTo(Math.cos(ccwAngle) * outerRadius, Math.sin(ccwAngle) * outerRadius);
        ctx.arc(0, 0, outerRadius, ccwAngle, cwAngle);
        ctx.arc(0, 0, innerRadius, cwAngle, ccwAngle, true);
        if (innerRadius > 1) {
            ctx.moveTo(0, innerRadius - 1);
            ctx.arc(0, 0, innerRadius - 1, 0, Math.PI * 2);
        }
        ctx.fill('evenodd');

        // wave
        ctx.globalAlpha = waveOpacity * enabled;
        if (waveIsVisible) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = waveGradient;
            ctx.beginPath();
            ctx.arc(0, 0, waveRadius, ccwAngle, cwAngle);
            ctx.arc(0, 0, innerRadius, cwAngle, ccwAngle, true);
            ctx.fill();
        }
    }
}

interface Properties {
    enabled: boolean;
    degrees: number;
    innerRadius: number;
    outerRadius: number;
    direction: number;
    distance: number;
    color1: { r: number; g: number; b: number };
    color2: { r: number; g: number; b: number };
}

export const radialAttack: VisualEffectFactory = {
    name: 'Radial Attack',
    description: 'This effect renders a circular, conal, or donut-shaped attack indicator with customizable colors.',
    create: () => new RadialAttack(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Degrees',
            type: 'number',
            key: 'degrees',
            keyable: true,
            default: 90,
        },
        {
            name: 'Inner Radius',
            type: 'number',
            key: 'innerRadius',
            keyable: true,
            default: 0,
        },
        {
            name: 'Outer Radius',
            type: 'number',
            key: 'outerRadius',
            keyable: true,
            default: 5,
        },
        {
            name: 'Direction',
            type: 'angle',
            key: 'direction',
            keyable: true,
            default: Math.PI,
        },
        {
            name: 'Distance',
            type: 'number',
            key: 'distance',
            keyable: true,
            default: 0,
        },
        {
            name: 'Color 1',
            type: 'color',
            key: 'color1',
            keyable: true,
            default: { r: 150, g: 50, b: 0 },
        },
        {
            name: 'Color 2',
            type: 'color',
            key: 'color2',
            keyable: true,
            default: { r: 255, g: 180, b: 100 },
        },
    ],
};
