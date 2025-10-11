import { useRef } from 'react';

import { useScene, useSelection } from '@/hooks';
import { useSelector } from '@/store';
import { RaidEntity, RaidScene } from '@/models/raids';
import { Selection } from '@/models/workspaces';
import { shapeDimensions, Shape } from '@/shapes';
import { keyableValueAtStep } from '@/keyable';

class RendererEntity {
    entity: RaidEntity;
    position: { x: number; y: number };
    bounds: { x: number; y: number; width: number; height: number };

    dragMovement: { x: number; y: number } = { x: 0, y: 0 };

    constructor(
        entity: RaidEntity,
        position: { x: number; y: number },
        bounds: { x: number; y: number; width: number; height: number },
    ) {
        this.entity = entity;
        this.position = position;
        this.bounds = bounds;
    }

    update(
        entity: RaidEntity,
        position: { x: number; y: number },
        bounds: { x: number; y: number; width: number; height: number },
    ) {
        // TODO: animate the update?
        this.entity = entity;
        this.position = position;
        this.bounds = bounds;
    }

    renderPosition(): { x: number; y: number } {
        return {
            x: this.position.x + this.dragMovement.x,
            y: this.position.y + this.dragMovement.y,
        };
    }

    renderBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.bounds.x + this.dragMovement.x,
            y: this.bounds.y + this.dragMovement.y,
            width: this.bounds.width,
            height: this.bounds.height,
        };
    }
}

interface ColorMaterial {
    type: 'color';
    color: string;
}

type Material = ColorMaterial;

class Renderer {
    scene?: RaidScene;
    sceneDragMovement: { x: number; y: number } = { x: 0, y: 0 };
    selection?: Selection;
    entities: Map<string, RendererEntity> = new Map();
    entityDrawOrder: string[] = [];

    render(ctx: CanvasRenderingContext2D, scale: number, center: { x: number; y: number }) {
        ctx.setTransform(1, 0, 0, -1, 0, ctx.canvas.height);
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
                        {
                            type: 'color',
                            color: '#ffffff',
                        },
                    );
                    break;
                }
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
                            const dx = position.x - entity.position.x;
                            const dy = position.y - entity.position.y;
                            if (dx * dx + dy * dy < shape.radius * shape.radius) {
                                return entity.entity;
                            }
                            continue;
                        }
                    }
                }
            }

            if (
                position.x >= entity.bounds.x &&
                position.x <= entity.bounds.x + entity.bounds.width &&
                position.y >= entity.bounds.y &&
                position.y <= entity.bounds.y + entity.bounds.height
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
        material: Material,
    ) {
        switch (material.type) {
            case 'color':
                ctx.fillStyle = material.color;
                break;
        }

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
                    const dimensions = shapeDimensions(ep.shape);
                    const position = keyableValueAtStep(ep.position, stepIds, currentStepId);
                    const bounds = {
                        x: position.x - dimensions.width / 2,
                        y: position.y - dimensions.height / 2,
                        width: dimensions.width,
                        height: dimensions.height,
                    };

                    const existing = this.entities.get(id);
                    if (existing) {
                        existing.update(entity, position, bounds);
                    } else {
                        this.entities.set(id, new RendererEntity(entity, position, bounds));
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
