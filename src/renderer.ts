import { useRef } from 'react';

import { useScene, useSelection } from '@/hooks';
import {
    AnyProperties,
    Material,
    RaidEntity,
    RaidEntityPropertiesShape,
    RaidEntityPropertiesText,
    RaidScene,
    ResolvedKeyables,
    Shape,
    ShapeRectangle,
} from '@/models/raids/types';
import { keyableValueAtStep, resolveKeyedValues, shapeDimensions } from '@/models/raids/utils';
import { Selection } from '@/models/workspaces/types';
import { resolveProperties } from '@/property-spec';
import { useSelector } from '@/store';
import { VisualEffect } from '@/visual-effect';
import { visualEffectFactories } from '@/visual-effects';

interface RendererEntityVisualEffect {
    id: string;
    visualEffect: VisualEffect;
}

interface RenderEntityStep {
    id: string;
    properties: ResolvedKeyables<RaidEntityPropertiesText> | ResolvedKeyables<RaidEntityPropertiesShape>;
    bounds: { x: number; y: number; width: number; height: number };
    effectProperties: Record<string, AnyProperties>;
}

class RendererEntity {
    entity: RaidEntity;
    visualEffects: RendererEntityVisualEffect[] = [];

    private currentStep: RenderEntityStep;
    private previousStep?: RenderEntityStep;
    private stepChangeTime?: number;

    dragMovement: { x: number; y: number } = { x: 0, y: 0 };
    dragRotation: number = 0;

    constructor(entity: RaidEntity, sceneStepIds: string[], currentStepId: string) {
        this.entity = entity;
        this.currentStep = this.step(entity, sceneStepIds, currentStepId);
        this.createVisualEffects();
    }

    update(entity: RaidEntity, sceneStepIds: string[], currentStepId: string, now: number) {
        this.entity = entity;
        const currentStep = this.step(entity, sceneStepIds, currentStepId);
        if (currentStep.id !== this.currentStep.id) {
            this.previousStep = this.currentStep;
            this.stepChangeTime = now;
        }
        this.currentStep = currentStep;
        this.createVisualEffects();
    }

    hitTestPriority(): number {
        const ep = this.entity.properties;
        switch (ep.type) {
            case 'shape':
                if (!ep.fill) {
                    // if the shape is invisible, prioritize visible shapes over it
                    return -1;
                }
                break;
        }
        return 0;
    }

    private step(entity: RaidEntity, sceneStepIds: string[], currentStepId: string): RenderEntityStep {
        const ep = entity.properties;
        if (ep.type !== 'shape' && ep.type !== 'text') {
            throw new Error('RendererEntity can only handle shape and text entities');
        }

        const resolved = resolveKeyedValues(ep, sceneStepIds, currentStepId);

        const dimensions = shapeDimensions(ep.shape);
        const position = resolved.position;
        const bounds = {
            x: position.x - dimensions.width / 2,
            y: position.y - dimensions.height / 2,
            width: dimensions.width,
            height: dimensions.height,
        };

        const effectProperties: Record<string, AnyProperties> = {};
        if (ep.type === 'shape') {
            for (const effect of ep.effects || []) {
                const factory = visualEffectFactories[effect.factoryId];
                if (factory) {
                    effectProperties[effect.id] = resolveProperties(
                        effect.properties,
                        factory.properties || [],
                        sceneStepIds,
                        currentStepId,
                    );
                }
            }
        }

        return { id: currentStepId, properties: resolved, bounds, effectProperties };
    }

    private createVisualEffects() {
        const ep = this.entity.properties;
        if (ep.type !== 'shape') {
            this.visualEffects = [];
            return;
        }

        const newEffects: RendererEntityVisualEffect[] = [];
        for (const e of ep.effects || []) {
            const existing = this.visualEffects.find((e2) => e2.id === e.id);
            if (existing) {
                newEffects.push(existing);
            } else {
                const factory = visualEffectFactories[e.factoryId];
                if (factory) {
                    newEffects.push({
                        id: e.id,
                        visualEffect: factory.create(),
                    });
                }
            }
        }
        this.visualEffects = newEffects;
    }

    renderEffectProperties(effectId: string): AnyProperties | undefined {
        return this.currentStep.effectProperties[effectId];
    }

    stepTransitionProgress(now: number): number {
        if (!this.stepChangeTime) {
            return 1;
        }
        const linear = Math.min(1, (now - this.stepChangeTime) / 300);
        return linear * linear * (3 - 2 * linear);
    }

    renderPosition(now: number): { x: number; y: number } {
        if (!this.previousStep || !this.stepChangeTime) {
            return {
                x: this.currentStep.properties.position.x + this.dragMovement.x,
                y: this.currentStep.properties.position.y + this.dragMovement.y,
            };
        }

        const transitionProgress = this.stepTransitionProgress(now);
        return {
            x:
                this.previousStep.properties.position.x +
                (this.currentStep.properties.position.x - this.previousStep.properties.position.x) *
                    transitionProgress +
                this.dragMovement.x,
            y:
                this.previousStep.properties.position.y +
                (this.currentStep.properties.position.y - this.previousStep.properties.position.y) *
                    transitionProgress +
                this.dragMovement.y,
        };
    }

    properties(): ResolvedKeyables<RaidEntityPropertiesText> | ResolvedKeyables<RaidEntityPropertiesShape> {
        return this.currentStep.properties;
    }

    renderRotation(now: number): number {
        const ep = this.entity.properties;
        if ((ep.type !== 'shape' && ep.type !== 'text') || !ep.rotation) {
            return this.dragRotation;
        }

        if (!this.previousStep || !this.stepChangeTime) {
            return (this.currentStep.properties.rotation ?? 0) + this.dragRotation;
        }

        const transitionProgress = this.stepTransitionProgress(now);
        return (
            (this.previousStep.properties.rotation ?? 0) +
            ((this.currentStep.properties.rotation ?? 0) - (this.previousStep.properties.rotation ?? 0)) *
                transitionProgress +
            this.dragRotation
        );
    }

    renderBounds(now: number): { x: number; y: number; width: number; height: number } {
        if (!this.previousStep || !this.stepChangeTime) {
            return {
                x: this.currentStep.bounds.x + this.dragMovement.x,
                y: this.currentStep.bounds.y + this.dragMovement.y,
                width: this.currentStep.bounds.width,
                height: this.currentStep.bounds.height,
            };
        }

        const transitionProgress = this.stepTransitionProgress(now);
        return {
            x:
                this.previousStep.bounds.x +
                (this.currentStep.bounds.x - this.previousStep.bounds.x) * transitionProgress +
                this.dragMovement.x,
            y:
                this.previousStep.bounds.y +
                (this.currentStep.bounds.y - this.previousStep.bounds.y) * transitionProgress +
                this.dragMovement.y,
            width:
                this.previousStep.bounds.width +
                (this.currentStep.bounds.width - this.previousStep.bounds.width) * transitionProgress,
            height:
                this.previousStep.bounds.height +
                (this.currentStep.bounds.height - this.previousStep.bounds.height) * transitionProgress,
        };
    }
}

export class Image {
    private broken?: boolean;
    private img: HTMLImageElement;

    constructor(url: string) {
        this.img = document.createElement('img');
        this.img.src = url;
        this.img.onerror = () => {
            console.error(`failed to load image: ${url}`);
            this.broken = true;
        };
    }

    get(): HTMLImageElement | undefined {
        if (this.broken || !this.img.complete) {
            return undefined;
        }
        return this.img;
    }
}

// Like Image but does nothing until the image is first requested.
export class LazyImage {
    private image?: Image;
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    get(): HTMLImageElement | undefined {
        if (!this.image) {
            this.image = new Image(this.url);
        }
        return this.image.get();
    }
}

interface ImageManagerImage {
    used: boolean;
    image: Image;
}

class ImageManager {
    private images: Map<string, ImageManagerImage> = new Map();

    use(url: string): HTMLImageElement | undefined {
        if (!url) {
            return undefined;
        }

        let entry = this.images.get(url);
        if (!entry) {
            entry = { used: true, image: new Image(url) };
            this.images.set(url, entry);
        } else {
            entry.used = true;
        }
        return entry.image.get();
    }

    cleanup() {
        for (const [url, entry] of this.images) {
            if (!entry.used) {
                this.images.delete(url);
            } else {
                entry.used = false;
            }
        }
    }
}

const ROTATION_HANDLE_RADIUS = 10;
const ROTATION_HANDLE_DISTANCE = 40;

export type Hit =
    | { type: 'entity'; entity: RaidEntity }
    | { type: 'rotation-handle'; entity: RaidEntity; pivot: { x: number; y: number } };

interface RenderParams {
    now?: number;
    center?: { x: number; y: number };
    backgroundColor?: { r: number; g: number; b: number };
}

class Renderer {
    allEntities: Record<string, RaidEntity> = {};
    scene?: RaidScene;
    selection?: Selection;

    private images = new ImageManager();
    private sceneDragMovement: { x: number; y: number } = { x: 0, y: 0 };
    private entities: Map<string, RendererEntity> = new Map();
    private entityIdsByName: Map<string, string[]> = new Map();
    private entityDrawOrder: string[] = [];
    private now: number = Date.now();

    // When a preset is being dragged over the canvas, this can be used to render an indicator.
    private dropIndicator?: { position: { x: number; y: number }; shape: Shape };

    getEntityPositionByName(name: string): { x: number; y: number } | undefined {
        for (const e of this.entityIdsByName.get(name) || []) {
            const entity = this.entities.get(e);
            if (entity) {
                return entity.renderPosition(this.now);
            }
        }
        return undefined;
    }

    render(ctx: CanvasRenderingContext2D, scale: number, params?: RenderParams) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (params?.backgroundColor) {
            ctx.fillStyle = `rgb(${params.backgroundColor.r}, ${params.backgroundColor.g}, ${params.backgroundColor.b})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        const now = params?.now ?? Date.now();
        this.now = now;

        const center = params?.center || { x: 0, y: 0 };

        ctx.translate(
            0.5 * ctx.canvas.width - (center.x - this.sceneDragMovement.x) * scale,
            0.5 * ctx.canvas.height - (center.y - this.sceneDragMovement.y) * scale,
        );

        if (this.scene) {
            this.drawShape(ctx, scale, { x: 0, y: 0 }, 0, { shape: this.scene.shape, fill: this.scene.fill });
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const pos = entity.renderPosition(now);
            for (const { id, visualEffect } of entity.visualEffects) {
                const ep = entity.entity.properties;
                if (ep.type !== 'shape' || !visualEffect.renderGround) {
                    continue;
                }

                const rot = entity.renderRotation(now);
                ctx.save();
                visualEffect.renderGround({
                    ctx,
                    name: entity.entity.name,
                    properties: entity.renderEffectProperties(id) || {},
                    shape: ep.shape,
                    scale,
                    center: pos,
                    rotation: rot || 0,
                    renderer: this,
                    now,
                });
                ctx.restore();
            }
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const pos = entity.renderPosition(now);
            for (const { id, visualEffect } of entity.visualEffects) {
                const ep = entity.entity.properties;
                if (ep.type !== 'shape' || !visualEffect.renderAboveGround) {
                    continue;
                }

                const rot = entity.renderRotation(now);
                ctx.save();
                visualEffect.renderAboveGround({
                    ctx,
                    name: entity.entity.name,
                    properties: entity.renderEffectProperties(id) || {},
                    shape: ep.shape,
                    scale,
                    center: pos,
                    rotation: rot || 0,
                    renderer: this,
                    now,
                });
                ctx.restore();
            }
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const ep = entity.properties();
            const pos = entity.renderPosition(now);
            const rot = entity.renderRotation(now);
            switch (ep.type) {
                case 'text': {
                    this.drawText(ctx, scale, pos, rot, ep);
                    break;
                }
                case 'shape': {
                    this.drawShape(ctx, scale, pos, rot, ep);
                    break;
                }
            }
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const pos = entity.renderPosition(now);
            for (const { id, visualEffect } of entity.visualEffects) {
                const ep = entity.entity.properties;
                if (ep.type !== 'shape' || !visualEffect.renderOverlay) {
                    continue;
                }

                const rot = entity.renderRotation(now);
                ctx.save();
                visualEffect.renderOverlay({
                    ctx,
                    name: entity.entity.name,
                    properties: entity.renderEffectProperties(id) || {},
                    shape: ep.shape,
                    scale,
                    center: pos,
                    rotation: rot || 0,
                    renderer: this,
                    now,
                });
                ctx.restore();
            }
        }

        if (this.selection?.entityIds) {
            ctx.globalCompositeOperation = 'difference';
            for (const entityId of this.selection.entityIds) {
                const entity = this.entities.get(entityId);
                if (!entity) {
                    continue;
                }

                const ep = entity.entity.properties;
                switch (ep.type) {
                    case 'text':
                    case 'shape': {
                        const pos = entity.renderPosition(now);
                        const rot = entity.renderRotation(now);

                        ctx.save();
                        ctx.translate(pos.x * scale, pos.y * scale);
                        ctx.rotate(rot);

                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = window.devicePixelRatio * 2;
                        switch (ep.shape.type) {
                            case 'rectangle': {
                                ctx.strokeRect(
                                    (-ep.shape.width / 2) * scale,
                                    (-ep.shape.height / 2) * scale,
                                    ep.shape.width * scale,
                                    ep.shape.height * scale,
                                );
                                break;
                            }
                            case 'circle': {
                                ctx.beginPath();
                                ctx.arc(0, 0, ep.shape.radius * scale, 0, Math.PI * 2);
                                ctx.stroke();
                                break;
                            }
                        }

                        // rotation handle
                        const topDistance =
                            (ep.shape.type === 'rectangle' ? ep.shape.height / 2 : ep.shape.radius) * scale;
                        ctx.beginPath();
                        ctx.moveTo(0, -topDistance);
                        ctx.lineTo(0, -topDistance - ROTATION_HANDLE_DISTANCE * window.devicePixelRatio);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(
                            0,
                            -topDistance -
                                (ROTATION_HANDLE_DISTANCE + ROTATION_HANDLE_RADIUS) * window.devicePixelRatio,
                            ROTATION_HANDLE_RADIUS * window.devicePixelRatio,
                            0,
                            Math.PI * 2,
                        );
                        ctx.stroke();

                        ctx.restore();
                        break;
                    }
                    default: {
                        const bounds = entity.renderBounds(now);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = window.devicePixelRatio * 2;
                        ctx.strokeRect(bounds.x * scale, bounds.y * scale, bounds.width * scale, bounds.height * scale);
                        break;
                    }
                }
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        if (this.selection?.sceneIds && this.scene && this.selection.sceneIds.includes(this.scene.id)) {
            ctx.globalCompositeOperation = 'difference';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = window.devicePixelRatio * 2;
            switch (this.scene.shape.type) {
                case 'rectangle': {
                    ctx.strokeRect(
                        (-this.scene.shape.width / 2) * scale,
                        (-this.scene.shape.height / 2) * scale,
                        this.scene.shape.width * scale,
                        this.scene.shape.height * scale,
                    );
                    break;
                }
                case 'circle': {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.scene.shape.radius * scale, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                }
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        if (this.dropIndicator) {
            this.drawShape(ctx, scale, this.dropIndicator.position, 0, {
                shape: this.dropIndicator.shape,
                fill: {
                    type: 'color',
                    color: {
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 0.5,
                    },
                },
            });
        }

        this.images.cleanup();
    }

    showDropIndicator(indicator?: { position: { x: number; y: number }; shape: Shape }) {
        this.dropIndicator = indicator;
    }

    hideDropIndicator() {
        this.dropIndicator = undefined;
    }

    setSceneDragMovement(movement: { x: number; y: number }) {
        this.sceneDragMovement = movement;
    }

    setEntityDragMovement(entityId: string, movement: { x: number; y: number }) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.dragMovement = movement;
        }
    }

    setEntityDragRotation(entityId: string, rotation: number) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.dragRotation = rotation;
        }
    }

    resetDragMovementAndRotation() {
        this.sceneDragMovement = { x: 0, y: 0 };
        for (const entity of this.entities.values()) {
            entity.dragMovement = { x: 0, y: 0 };
            entity.dragRotation = 0;
        }
    }

    private entityHitTest(entity: RendererEntity, position: { x: number; y: number }): boolean {
        const ep = entity.entity.properties;
        switch (ep.type) {
            case 'text':
            case 'shape': {
                const shape = ep.shape;
                const entityPosition = entity.renderPosition(this.now);
                switch (shape.type) {
                    case 'rectangle': {
                        const rot = entity.renderRotation(this.now);
                        const cos = Math.cos(-rot);
                        const sin = Math.sin(-rot);
                        const dx = position.x - entityPosition.x;
                        const dy = position.y - entityPosition.y;
                        const rx = dx * cos - dy * sin;
                        const ry = dx * sin + dy * cos;
                        return (
                            rx >= -shape.width / 2 &&
                            rx <= shape.width / 2 &&
                            ry >= -shape.height / 2 &&
                            ry <= shape.height / 2
                        );
                    }
                    case 'circle': {
                        const dx = position.x - entityPosition.x;
                        const dy = position.y - entityPosition.y;
                        return dx * dx + dy * dy < shape.radius * shape.radius;
                    }
                }
            }
        }

        const bounds = entity.renderBounds(this.now);
        return (
            position.x >= bounds.x &&
            position.x <= bounds.x + bounds.width &&
            position.y >= bounds.y &&
            position.y <= bounds.y + bounds.height
        );
    }

    private entityHits(position: { x: number; y: number }): RendererEntity[] {
        const ret = [];
        for (const entityId of this.entityDrawOrder.slice().reverse()) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }
            if (this.entityHitTest(entity, position)) {
                ret.push(entity);
            }
        }
        return ret;
    }

    hitTest(position: { x: number; y: number }, scale: number): Hit | undefined {
        if (this.selection?.entityIds) {
            // prioritize rotation handles
            for (const entityId of this.selection.entityIds) {
                const entity = this.entities.get(entityId);
                if (!entity) {
                    continue;
                }
                const ep = entity.entity.properties;
                if (ep.type !== 'shape' && ep.type !== 'text') {
                    continue;
                }
                const topDistance = ep.shape.type === 'rectangle' ? ep.shape.height / 2 : ep.shape.radius;
                const handleCenterDistance =
                    topDistance +
                    ((ROTATION_HANDLE_DISTANCE + ROTATION_HANDLE_RADIUS) / scale) * window.devicePixelRatio;
                const entityPosition = entity.renderPosition(this.now);
                const rot = entity.renderRotation(this.now);
                const handleCenterX = entityPosition.x + Math.sin(rot) * handleCenterDistance;
                const handleCenterY = entityPosition.y - Math.cos(rot) * handleCenterDistance;
                const dx = position.x - handleCenterX;
                const dy = position.y - handleCenterY;
                if (dx * dx + dy * dy < ((ROTATION_HANDLE_RADIUS / scale) * window.devicePixelRatio) ** 2) {
                    return { type: 'rotation-handle', entity: entity.entity, pivot: entityPosition };
                }
            }
        }

        const entityHits = this.entityHits(position);

        // prioritize selected entities
        if (this.selection?.entityIds) {
            for (const entity of entityHits) {
                if (this.selection.entityIds.includes(entity.entity.id)) {
                    return { type: 'entity', entity: entity.entity };
                }
            }
        }

        entityHits.sort((a, b) => b.hitTestPriority() - a.hitTestPriority());
        if (entityHits.length > 0) {
            return { type: 'entity', entity: entityHits[0].entity };
        }

        return undefined;
    }

    private drawText(
        ctx: CanvasRenderingContext2D,
        scale: number,
        center: { x: number; y: number },
        rotation: number | undefined,
        params: {
            shape: ShapeRectangle;
            position: { x: number; y: number };
            rotation?: number;
            content: string;
            color: { r: number; g: number; b: number; a: number };
            outlineColor: { r: number; g: number; b: number; a: number };
            outlineThickness: number;
            fontSize: number;
            horizontalAlignment: 'left' | 'center' | 'right';
            verticalAlignment: 'top' | 'middle' | 'bottom';
        },
    ) {
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(center.x, center.y);
        if (rotation) {
            ctx.rotate(rotation);
        }

        ctx.fillStyle = `rgba(${params.color.r}, ${params.color.g}, ${params.color.b}, ${params.color.a})`;
        ctx.font = `${params.fontSize}px sans-serif`;
        ctx.lineWidth = params.outlineThickness;
        ctx.strokeStyle = `rgba(${params.outlineColor.r}, ${params.outlineColor.g}, ${params.outlineColor.b}, ${params.outlineColor.a})`;
        ctx.lineJoin = 'round';

        const lines = params.content.split('\n');
        const wrappedLines = [];

        const { horizontalAlignment, verticalAlignment, shape } = params;
        const { width, height } = shape;

        for (const line of lines) {
            const words = line.split(' ');
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > width && currentLine) {
                    wrappedLines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }

        const textMetrics = ctx.measureText('A');
        const lineHeight = textMetrics.actualBoundingBoxAscent;
        const lineSpacing = lineHeight * 1.5;
        const contentHeight = (wrappedLines.length - 1) * lineSpacing + lineHeight;

        ctx.textAlign = horizontalAlignment;
        const x = horizontalAlignment === 'left' ? -width / 2 : horizontalAlignment === 'center' ? 0 : width / 2;

        let y =
            (verticalAlignment === 'top'
                ? -height / 2
                : verticalAlignment === 'middle'
                  ? -contentHeight / 2
                  : height / 2 - contentHeight) + lineHeight;

        for (const line of wrappedLines) {
            if (line.trim()) {
                if (params.outlineThickness > 0) {
                    ctx.strokeText(line, x, y);
                }
                ctx.fillText(line, x, y);
            }

            y += lineSpacing;
        }

        ctx.restore();
    }

    private drawShape(
        ctx: CanvasRenderingContext2D,
        scale: number,
        center: { x: number; y: number },
        rotation: number | undefined,
        params: {
            shape: Shape;
            fill?: Material;
        },
    ) {
        const { shape, fill } = params;
        if (fill) {
            ctx.save();
            ctx.translate(center.x * scale, center.y * scale);
            if (rotation) {
                ctx.rotate(rotation);
            }

            switch (fill.type) {
                case 'color': {
                    ctx.fillStyle = `rgba(${fill.color.r}, ${fill.color.g}, ${fill.color.b}, ${fill.color.a})`;

                    switch (shape.type) {
                        case 'rectangle': {
                            ctx.fillRect(
                                (-shape.width / 2) * scale,
                                (-shape.height / 2) * scale,
                                shape.width * scale,
                                shape.height * scale,
                            );
                            break;
                        }
                        case 'circle': {
                            ctx.beginPath();
                            ctx.arc(0, 0, shape.radius * scale, 0, Math.PI * 2);
                            ctx.fill();
                            break;
                        }
                    }
                    break;
                }
                case 'image': {
                    const img = this.images.use(fill.url);
                    if (img) {
                        ctx.save();

                        const dimensions = shapeDimensions(shape);
                        switch (shape.type) {
                            case 'circle': {
                                ctx.beginPath();
                                ctx.arc(0, 0, shape.radius * scale, 0, Math.PI * 2);
                                ctx.clip();
                                break;
                            }
                        }
                        ctx.drawImage(
                            img,
                            -(dimensions.width / 2) * scale,
                            -(dimensions.height / 2) * scale,
                            dimensions.width * scale,
                            dimensions.height * scale,
                        );

                        ctx.restore();
                    }
                    break;
                }
            }

            ctx.restore();
        }
    }

    private updateEntitiesImpl(
        entitiesToUpdate: string[],
        entitiesToRemove: Set<string>,
        stepIds: string[],
        currentStepId: string,
        now: number,
        visible: boolean,
    ) {
        for (const id of entitiesToUpdate) {
            const entity = this.allEntities[id];
            if (!entity) {
                continue;
            }
            entitiesToRemove.delete(id);

            const entityIsVisible = visible && (keyableValueAtStep(entity.visible, stepIds, currentStepId) ?? true);

            const ep = entity.properties;
            switch (ep.type) {
                case 'text':
                case 'shape': {
                    const existing = this.entities.get(id);
                    if (existing) {
                        existing.update(entity, stepIds, currentStepId, now);
                    } else {
                        this.entities.set(id, new RendererEntity(entity, stepIds, currentStepId));
                    }

                    if (entityIsVisible) {
                        this.entityDrawOrder.push(id);
                        this.entityIdsByName.set(
                            entity.name,
                            (this.entityIdsByName.get(entity.name) || []).concat([id]),
                        );
                    }
                    break;
                }
                case 'group': {
                    this.updateEntitiesImpl(
                        ep.children,
                        entitiesToRemove,
                        stepIds,
                        currentStepId,
                        now,
                        entityIsVisible,
                    );
                    break;
                }
            }
        }
    }

    update(currentStepId: string, now?: number) {
        const entitiesToUpdate = this.scene?.entityIds || [];
        const stepIds = this.scene?.stepIds || [];
        const entitiesToRemove = new Set(this.entities.keys());
        this.entityDrawOrder = [];
        this.entityIdsByName.clear();
        this.updateEntitiesImpl(entitiesToUpdate, entitiesToRemove, stepIds, currentStepId, now ?? Date.now(), true);
        this.entityDrawOrder.reverse();
        for (const id of entitiesToRemove) {
            this.entities.delete(id);
        }
    }
}

export const useSceneRenderer = (sceneId: string, stepId?: string): Renderer => {
    const rendererRef = useRef(new Renderer());
    const renderer = rendererRef.current;

    const scene = useScene(sceneId);
    const entities = useSelector((state) => state.raids.entities);

    const selection = useSelection(scene?.raidId || '');

    renderer.allEntities = entities;
    renderer.scene = scene;
    renderer.selection = selection;
    if (stepId) {
        renderer.update(stepId);
    }

    return renderer;
};
