import { Animated, smoothstep } from '@/animated';
import { LoopDuration, VisualEffect, VisualEffectFactory, VisualEffectRenderParams, loop } from '@/visual-effect';

class LineAttack extends VisualEffect {
    enabled: Animated<number> = new Animated();
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

        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation + properties.direction);

        const { width, length, distance } = properties;
        const left = -width / 2;
        const end = -distance - length;
        const color1 = properties.color1;
        const color2 = properties.color2;

        ctx.beginPath();
        ctx.rect(left, end, width, length);
        ctx.clip();

        ctx.save();
        ctx.globalAlpha = enabled;
        ctx.fillStyle = `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.25)`;
        ctx.fillRect(left, end, width, length);
        ctx.restore();

        const waveAnimationProgress = loop(now - this.enableTime, LoopDuration.D1667);
        const waveIsVisible = waveAnimationProgress < 0.6;
        const waveMovementProgress = Math.min(waveAnimationProgress / 0.6, 1);
        const waveEnd = end + length * (1 - waveMovementProgress);
        const waveOpacity = smoothstep(1 - Math.abs(waveMovementProgress - 0.5) * 2);
        const waveLength = 0.25 * length;
        const waveGradient = ctx.createLinearGradient(0, waveEnd, 0, waveEnd + waveLength);
        waveGradient.addColorStop(0, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0)`);
        waveGradient.addColorStop(0.25, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.3)`);
        waveGradient.addColorStop(0.45, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.3)`);
        waveGradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0)`);

        const edgeGlowSize = Math.min(1, Math.min(width, length) / 5);

        ctx.globalCompositeOperation = 'lighter';

        // edge glow
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'white';
        ctx.shadowColor = `rgba(${color2.r}, ${color2.g}, ${color2.b}, 1)`;
        ctx.shadowBlur = edgeGlowSize * scale;
        ctx.beginPath();
        ctx.rect(left - 1, end - 1, width + 2, length + 2);
        ctx.rect(left, end, width, length);
        ctx.fill('evenodd');

        // wave
        ctx.globalAlpha = waveOpacity * enabled;
        if (waveIsVisible) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = waveGradient;
            ctx.fillRect(left, waveEnd, width, waveLength);
        }
    }
}

interface Properties {
    enabled: boolean;
    width: number;
    length: number;
    direction: number;
    distance: number;
    color1: { r: number; g: number; b: number };
    color2: { r: number; g: number; b: number };
}

export const lineAttack: VisualEffectFactory = {
    name: 'Line Attack',
    description: 'This effect renders a rectangular attack indicator with customizable colors.',
    create: () => new LineAttack(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Width',
            type: 'number',
            key: 'width',
            keyable: true,
            default: 5,
        },
        {
            name: 'Length',
            type: 'number',
            key: 'length',
            keyable: true,
            default: 10,
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
            default: { r: 136, g: 17, b: 0 },
        },
        {
            name: 'Color 2',
            type: 'color',
            key: 'color2',
            keyable: true,
            default: { r: 232, g: 204, b: 138 },
        },
    ],
};
