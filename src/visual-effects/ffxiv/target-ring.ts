import { Animated } from '@/animated';
import { shapeDimensions } from '@/models/raids/utils';
import { Image, LazyImage } from '@/renderer';
import { VisualEffect, VisualEffectFactory, VisualEffectRenderParams } from '@/visual-effect';

class TargetRing extends VisualEffect {
    enabled: Animated<number> = new Animated(0);
    color: Animated<{ r: number; g: number; b: number }> = new Animated();
    sideMarkImage: Image;
    sideMarkGlowImage: Image;
    frontMarkImage: LazyImage;
    frontMarkGlowImage: LazyImage;
    ddFrontMarkImage: LazyImage;
    ddFrontMarkGlowImage: LazyImage;

    constructor() {
        super();
        this.sideMarkImage = new Image('/images/ffxiv/target-ring/side-mark.png');
        this.sideMarkGlowImage = new Image('/images/ffxiv/target-ring/side-mark-glow.png');
        this.frontMarkImage = new LazyImage('/images/ffxiv/target-ring/front-mark.png');
        this.frontMarkGlowImage = new LazyImage('/images/ffxiv/target-ring/front-mark-glow.png');
        this.ddFrontMarkImage = new LazyImage('/images/ffxiv/target-ring/dd-front-mark.png');
        this.ddFrontMarkGlowImage = new LazyImage('/images/ffxiv/target-ring/dd-front-mark-glow.png');
    }

    renderGround({ ctx, properties: anyProperties, shape, rotation, scale, center }: VisualEffectRenderParams) {
        const properties = anyProperties as Properties;
        const enabled = this.enabled.update(properties.enabled ? 1 : 0, {
            transitionDuration: 300,
        });
        if (!enabled) {
            return;
        }

        ctx.translate(center.x * scale, center.y * scale);
        ctx.rotate(rotation);

        const entityDimensions = shapeDimensions(shape);
        const entityRadius = Math.max(entityDimensions.width, entityDimensions.height) / 2;

        const outerRadius = (entityRadius + properties.padding) * scale;
        const outerThickness = outerRadius * 0.04;
        const innerRadius = outerRadius * 0.8;
        const innerThickness = outerThickness * 0.3;

        const arcStart = properties.directionalDisregard ? 0 : Math.PI * -0.25;
        const arcEnd = properties.directionalDisregard ? 2 * Math.PI : Math.PI * 1.25;

        const color = this.color.update(properties.color);

        // glows

        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;

        ctx.save();
        ctx.globalAlpha = enabled;
        ctx.shadowBlur = 2 * innerThickness;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, arcStart, arcEnd);
        ctx.lineWidth = innerThickness;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = enabled;
        ctx.shadowBlur = 2 * outerThickness;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, arcStart, arcEnd);
        ctx.lineWidth = outerThickness;
        ctx.stroke();
        ctx.restore();

        // arrows

        const frontMarkImage = properties.directionalDisregard
            ? this.ddFrontMarkImage.get()
            : this.frontMarkImage.get();
        const frontMarkGlowImage = properties.directionalDisregard
            ? this.ddFrontMarkGlowImage.get()
            : this.frontMarkGlowImage.get();
        const frontMarkOffset = outerRadius * 1.31;
        const frontMarkImageSize = (outerRadius - innerRadius) * 3.0;

        if (frontMarkImage && frontMarkGlowImage) {
            ctx.save();
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
            ctx.shadowBlur = 4 * outerThickness;
            ctx.rotate(Math.PI);
            ctx.globalAlpha = 0.4 * enabled;
            ctx.drawImage(
                frontMarkGlowImage,
                -frontMarkImageSize / 2,
                -frontMarkOffset,
                frontMarkImageSize,
                frontMarkImageSize,
            );
            ctx.restore();
        }

        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
        ctx.shadowBlur = 2 * innerThickness;

        const sideMarkImage = this.sideMarkImage.get();
        const sideMarkGlowImage = this.sideMarkGlowImage.get();
        const sideMarkImageSize = (outerRadius - innerRadius) * 1.6;

        if (sideMarkImage && sideMarkGlowImage) {
            ctx.save();
            ctx.globalAlpha = 0.8 * enabled;
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(
                sideMarkGlowImage,
                -sideMarkImageSize / 2,
                outerRadius - sideMarkImageSize,
                sideMarkImageSize,
                sideMarkImageSize,
            );
            ctx.scale(1, -1);
            ctx.drawImage(
                sideMarkGlowImage,
                -sideMarkImageSize / 2,
                outerRadius - sideMarkImageSize,
                sideMarkImageSize,
                sideMarkImageSize,
            );
            ctx.restore();
        }

        // highlights

        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = enabled;

        const outerGradient = ctx.createRadialGradient(
            0,
            0,
            outerRadius - 0.5 * outerThickness,
            0,
            0,
            outerRadius + 0.5 * outerThickness,
        );
        outerGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        outerGradient.addColorStop(0.3, `rgba(255, 255, 255, 0.7)`);
        outerGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.7)`);
        outerGradient.addColorStop(1, `rgba(255, 255, 255, 0.2)`);

        ctx.strokeStyle = outerGradient;

        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, arcStart, arcEnd);
        ctx.lineWidth = outerThickness;
        ctx.stroke();

        const innerGradient = ctx.createRadialGradient(
            0,
            0,
            innerRadius - 0.5 * innerThickness,
            0,
            0,
            innerRadius + 0.5 * innerThickness,
        );
        innerGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        innerGradient.addColorStop(0.3, `rgba(255, 255, 255, 0.7)`);
        innerGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.7)`);
        innerGradient.addColorStop(1, `rgba(255, 255, 255, 0.2)`);

        ctx.strokeStyle = innerGradient;

        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, arcStart, arcEnd);
        ctx.lineWidth = innerThickness;
        ctx.stroke();

        // arrows

        if (sideMarkImage && sideMarkGlowImage) {
            ctx.save();
            ctx.globalAlpha = 0.8 * enabled;
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(
                sideMarkImage,
                -sideMarkImageSize / 2,
                outerRadius - sideMarkImageSize,
                sideMarkImageSize,
                sideMarkImageSize,
            );
            ctx.scale(1, -1);
            ctx.drawImage(
                sideMarkImage,
                -sideMarkImageSize / 2,
                outerRadius - sideMarkImageSize,
                sideMarkImageSize,
                sideMarkImageSize,
            );
            ctx.restore();
        }

        if (frontMarkImage && frontMarkGlowImage) {
            ctx.save();
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
            ctx.shadowBlur = 4 * outerThickness;
            ctx.rotate(Math.PI);
            ctx.globalAlpha = (properties.directionalDisregard ? 0.35 : 0.45) * enabled;
            ctx.drawImage(
                frontMarkImage,
                -frontMarkImageSize / 2,
                -frontMarkOffset,
                frontMarkImageSize,
                frontMarkImageSize,
            );
            ctx.restore();
        }

        // swirls

        ctx.rotate(-((Date.now() % 3000) / 3000) * 2 * Math.PI);

        {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.8 * enabled;
            const g = ctx.createLinearGradient(-outerRadius, 0, outerRadius, 0);
            g.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`);
            g.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.0)`);
            g.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`);
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
            ctx.shadowBlur = outerThickness;
            ctx.lineWidth = innerThickness;
            ctx.strokeStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius * 0.95, 0, Math.PI * 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius * 0.95, Math.PI, Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
        }

        {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.8 * enabled;
            const g = ctx.createLinearGradient(-outerRadius, 0, outerRadius, 0);
            g.addColorStop(0, `rgba(255, 255, 255, 0.7)`);
            g.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
            g.addColorStop(1, `rgba(255, 255, 255, 0.7)`);
            ctx.shadowColor = `rgba(255, 255, 255, 0.5)`;
            ctx.shadowBlur = outerThickness;
            ctx.lineWidth = 0.5 * innerThickness;
            ctx.strokeStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius * 0.95, 0, Math.PI * 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius * 0.95, Math.PI, Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
        }
    }
}

interface Properties {
    enabled: boolean;
    directionalDisregard: boolean;
    padding: number;
    color: { r: number; g: number; b: number };
}

export const targetRing: VisualEffectFactory = {
    name: 'Target Ring',
    create: () => new TargetRing(),
    properties: [
        {
            name: 'Enabled',
            type: 'boolean',
            key: 'enabled',
            keyable: true,
            default: true,
        },
        {
            name: 'Color',
            type: 'color',
            key: 'color',
            keyable: true,
            default: { r: 255, g: 20, b: 20 },
        },
        {
            name: 'Padding',
            type: 'number',
            key: 'padding',
            keyable: true,
            default: 1,
        },
        {
            name: 'Directional Disregard',
            type: 'boolean',
            key: 'directionalDisregard',
            keyable: true,
            default: false,
        },
    ],
};
