import { useRef } from 'react';

import { useScene, useSelection } from '@/hooks';
import { AnyProperties, Material, RaidEntity, RaidScene, Shape } from '@/models/raids/types';
import { keyableValueAtStep, shapeDimensions } from '@/models/raids/utils';
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
    position: { x: number; y: number };
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

    constructor(entity: RaidEntity, sceneStepIds: string[], currentStepId: string) {
        this.entity = entity;
        this.currentStep = this.step(entity, sceneStepIds, currentStepId);
        this.createVisualEffects();
    }

    update(entity: RaidEntity, sceneStepIds: string[], currentStepId: string) {
        this.entity = entity;
        const currentStep = this.step(entity, sceneStepIds, currentStepId);
        if (currentStep.id !== this.currentStep.id) {
            this.previousStep = this.currentStep;
            this.stepChangeTime = Date.now();
        }
        this.currentStep = currentStep;
        this.createVisualEffects();
    }

    private step(entity: RaidEntity, sceneStepIds: string[], currentStepId: string): RenderEntityStep {
        const ep = entity.properties;
        if (ep.type !== 'shape') {
            throw new Error('RendererEntity can only handle shape entities');
        }

        const dimensions = shapeDimensions(ep.shape);
        const position = keyableValueAtStep(ep.position, sceneStepIds, currentStepId);
        const bounds = {
            x: position.x - dimensions.width / 2,
            y: position.y - dimensions.height / 2,
            width: dimensions.width,
            height: dimensions.height,
        };

        const effectProperties: Record<string, AnyProperties> = {};
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

        return { id: currentStepId, position, bounds, effectProperties };
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

    stepTransitionProgress(): number {
        if (!this.stepChangeTime) {
            return 1;
        }
        const linear = Math.min(1, (Date.now() - this.stepChangeTime) / 300);
        return linear * linear * (3 - 2 * linear);
    }

    renderPosition(): { x: number; y: number } {
        if (!this.previousStep || !this.stepChangeTime) {
            return {
                x: this.currentStep.position.x + this.dragMovement.x,
                y: this.currentStep.position.y + this.dragMovement.y,
            };
        }

        const transitionProgress = this.stepTransitionProgress();
        return {
            x:
                this.previousStep.position.x +
                (this.currentStep.position.x - this.previousStep.position.x) * transitionProgress +
                this.dragMovement.x,
            y:
                this.previousStep.position.y +
                (this.currentStep.position.y - this.previousStep.position.y) * transitionProgress +
                this.dragMovement.y,
        };
    }

    renderBounds(): { x: number; y: number; width: number; height: number } {
        if (!this.previousStep || !this.stepChangeTime) {
            return {
                x: this.currentStep.bounds.x + this.dragMovement.x,
                y: this.currentStep.bounds.y + this.dragMovement.y,
                width: this.currentStep.bounds.width,
                height: this.currentStep.bounds.height,
            };
        }

        const transitionProgress = this.stepTransitionProgress();
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

class Renderer {
    scene?: RaidScene;
    selection?: Selection;

    private images = new ImageManager();
    private sceneDragMovement: { x: number; y: number } = { x: 0, y: 0 };
    private entities: Map<string, RendererEntity> = new Map();
    private entityDrawOrder: string[] = [];

    // When a preset is being dragged over the canvas, this can be used to render an indicator.
    private dropIndicator?: { position: { x: number; y: number }; shape: Shape };

    render(ctx: CanvasRenderingContext2D, scale: number, center: { x: number; y: number }) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.translate(
            0.5 * ctx.canvas.width - (center.x - this.sceneDragMovement.x) * scale,
            0.5 * ctx.canvas.height - (center.y - this.sceneDragMovement.y) * scale,
        );

        if (this.scene) {
            this.drawShape(
                this.scene.shape,
                ctx,
                scale,
                { x: 0, y: 0 },
                {
                    type: 'color',
                    color: '#282a36',
                },
            );
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const pos = entity.renderPosition();
            for (const { id, visualEffect } of entity.visualEffects) {
                const ep = entity.entity.properties;
                if (ep.type !== 'shape') {
                    continue;
                }

                ctx.save();
                visualEffect.renderGround?.({
                    ctx,
                    properties: entity.renderEffectProperties(id) || {},
                    shape: ep.shape,
                    scale,
                    center: pos,
                });
                ctx.restore();
            }
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const ep = entity.entity.properties;
            const pos = entity.renderPosition();
            switch (ep.type) {
                case 'shape': {
                    this.drawShape(
                        ep.shape,
                        ctx,
                        scale,
                        {
                            x: pos.x,
                            y: pos.y,
                        },
                        ep.fill,
                    );
                    break;
                }
            }
        }

        for (const entityId of this.entityDrawOrder) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            const pos = entity.renderPosition();
            for (const { id, visualEffect } of entity.visualEffects) {
                const ep = entity.entity.properties;
                if (ep.type !== 'shape') {
                    continue;
                }

                ctx.save();
                visualEffect.renderOverlay?.({
                    ctx,
                    properties: entity.renderEffectProperties(id) || {},
                    shape: ep.shape,
                    scale,
                    center: pos,
                });
                ctx.restore();
            }
        }

        if (this.selection?.entityIds) {
            for (const entityId of this.selection.entityIds) {
                const entity = this.entities.get(entityId);
                if (!entity) {
                    continue;
                }

                const bounds = entity.renderBounds();
                ctx.strokeStyle = '#00b8db';
                ctx.lineWidth = window.devicePixelRatio * 2;
                ctx.strokeRect(
                    bounds.x * scale - 2 * window.devicePixelRatio,
                    bounds.y * scale - 2 * window.devicePixelRatio,
                    bounds.width * scale + window.devicePixelRatio * 4,
                    bounds.height * scale + window.devicePixelRatio * 4,
                );
            }
        }

        if (this.dropIndicator) {
            this.drawShape(this.dropIndicator.shape, ctx, scale, this.dropIndicator.position, {
                type: 'color',
                color: '#ffffff80',
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

    resetDragMovement() {
        this.sceneDragMovement = { x: 0, y: 0 };
        for (const entity of this.entities.values()) {
            entity.dragMovement = { x: 0, y: 0 };
        }
    }

    hitTest(position: { x: number; y: number }): RaidEntity | undefined {
        for (const entityId of this.entityDrawOrder.slice().reverse()) {
            const entity = this.entities.get(entityId);
            if (!entity) {
                continue;
            }

            // if we can do a more precise hit test, do that
            const ep = entity.entity.properties;
            switch (ep.type) {
                case 'shape': {
                    const shape = ep.shape;
                    switch (shape.type) {
                        case 'circle': {
                            const entityPosition = entity.renderPosition();
                            const dx = position.x - entityPosition.x;
                            const dy = position.y - entityPosition.y;
                            if (dx * dx + dy * dy < shape.radius * shape.radius) {
                                return entity.entity;
                            }
                            continue;
                        }
                    }
                }
            }

            const bounds = entity.renderBounds();
            if (
                position.x >= bounds.x &&
                position.x <= bounds.x + bounds.width &&
                position.y >= bounds.y &&
                position.y <= bounds.y + bounds.height
            ) {
                return entity.entity;
            }
        }

        return undefined;
    }

    private drawShape(
        shape: Shape,
        ctx: CanvasRenderingContext2D,
        scale: number,
        center: { x: number; y: number },
        fill?: Material,
    ) {
        if (fill) {
            switch (fill.type) {
                case 'color': {
                    ctx.fillStyle = fill.color;

                    switch (shape.type) {
                        case 'rectangle': {
                            ctx.fillRect(
                                (center.x - shape.width / 2) * scale,
                                (center.y - shape.height / 2) * scale,
                                shape.width * scale,
                                shape.height * scale,
                            );
                            break;
                        }
                        case 'circle': {
                            ctx.beginPath();
                            ctx.arc(center.x * scale, center.y * scale, shape.radius * scale, 0, Math.PI * 2);
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
                                ctx.arc(center.x * scale, center.y * scale, shape.radius * scale, 0, Math.PI * 2);
                                ctx.clip();
                                break;
                            }
                        }
                        ctx.drawImage(
                            img,
                            (center.x - dimensions.width / 2) * scale,
                            (center.y - dimensions.height / 2) * scale,
                            dimensions.width * scale,
                            dimensions.height * scale,
                        );

                        ctx.restore();
                    }
                    break;
                }
            }
        }
    }

    private updateEntitiesImpl(
        allEntities: Record<string, RaidEntity>,
        entitiesToUpdate: string[],
        stepIds: string[],
        currentStepId: string,
    ) {
        for (const id of entitiesToUpdate) {
            const entity = allEntities[id];
            if (!entity) {
                continue;
            }

            const ep = entity.properties;
            switch (ep.type) {
                case 'shape': {
                    const existing = this.entities.get(id);
                    if (existing) {
                        existing.update(entity, stepIds, currentStepId);
                    } else {
                        this.entities.set(id, new RendererEntity(entity, stepIds, currentStepId));
                    }

                    this.entityDrawOrder.push(id);
                    break;
                }
                case 'group': {
                    this.updateEntitiesImpl(allEntities, ep.children, stepIds, currentStepId);
                    break;
                }
            }
        }
    }

    updateEntities(
        allEntities: Record<string, RaidEntity>,
        entitiesToUpdate: string[],
        stepIds: string[],
        currentStepId: string,
    ) {
        this.entityDrawOrder = [];
        this.updateEntitiesImpl(allEntities, entitiesToUpdate, stepIds, currentStepId);
    }
}

export const useSceneRenderer = (sceneId: string, stepId: string): Renderer => {
    const rendererRef = useRef(new Renderer());
    const renderer = rendererRef.current;

    const scene = useScene(sceneId);
    const entities = useSelector((state) => state.raids.entities);

    const selection = useSelection(scene?.raidId || '');

    renderer.scene = scene;
    renderer.selection = selection;
    renderer.updateEntities(entities, scene?.entityIds || [], scene?.stepIds || [], stepId);

    return renderer;
};
