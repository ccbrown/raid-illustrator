import { Animated, smoothstep } from '@/animated';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class LineAttack extends VisualEffect {
    enabled: Animated<number> = new Animated(0);
    enableTime?: number;

    renderGround({ ctx, properties: anyProperties, rotation, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, {
            transitionDuration: 300,
        });
        if (!enabled) {
            this.enableTime = undefined;
            return;
        }

        const now = Date.now();
        if (this.enableTime === undefined) {
            this.enableTime = now;
        }

        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation + Math.PI + properties.rotation);

        const { width, length, distance } = properties;
        const left = -width / 2;
        const end = -distance - length;

        ctx.beginPath();
        ctx.rect(left, end, width, length);
        ctx.clip();

        ctx.save();
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'rgba(136, 17, 0, 0.25)';
        ctx.fillRect(left, end, width, length);
        ctx.restore();

        const waveAnimationProgress = ((now - this.enableTime) % 1600) / 1600;
        const waveIsVisible = waveAnimationProgress < 0.6;
        const waveMovementProgress = Math.min(waveAnimationProgress / 0.6, 1);
        const waveEnd = end + length * (1 - waveMovementProgress);
        const waveOpacity = smoothstep(1 - Math.abs(waveMovementProgress - 0.5) * 2);
        const waveLength = 0.25 * length;
        const waveGradient = ctx.createLinearGradient(0, waveEnd, 0, waveEnd + waveLength);
        waveGradient.addColorStop(0, 'rgba(232, 204, 138, 0)');
        waveGradient.addColorStop(0.25, 'rgba(232, 204, 138, 0.3)');
        waveGradient.addColorStop(0.45, 'rgba(232, 204, 138, 0.3)');
        waveGradient.addColorStop(1, 'rgba(232, 204, 138, 0)');

        // edge glow
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(232, 204, 138, 1)';
        ctx.shadowBlur = 1 * scale;
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

        ctx.globalCompositeOperation = 'lighter';

        // edge glow
        ctx.globalAlpha = enabled;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(232, 204, 138, 1)';
        ctx.shadowBlur = 1 * scale;
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
    rotation: number;
    distance: number;
}

export const lineAttack: VisualEffectFactory = {
    name: 'Line Attack',
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
            name: 'Rotation',
            type: 'angle',
            key: 'rotation',
            keyable: true,
            default: 0,
        },
        {
            name: 'Distance',
            type: 'number',
            key: 'distance',
            keyable: true,
            default: 0,
        },
    ],
};
