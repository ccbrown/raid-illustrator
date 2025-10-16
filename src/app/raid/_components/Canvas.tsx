import { useAnimationFrame } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { snapAngle } from '@/components/AngleInput';
import { useRaidWorkspace, useScene, useSceneWorkspace, useSelection } from '@/hooks';
import { EntityPresetDragData } from '@/models/workspaces/types';
import { Hit, useSceneRenderer } from '@/renderer';
import { useDispatch } from '@/store';

import { useRaidId } from '../hooks';

const PIXELS_PER_METER = 100;

export const ENTITY_PRESET_DRAG_MIME_TYPE = 'application/x-raid-illustrator-new-shape-entity';

const angle = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
    return Math.atan2(b.y - a.y, b.x - a.x);
};

export const Canvas = () => {
    const raidId = useRaidId();
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const scene = useScene(raidWorkspace?.openSceneId || '');
    const sceneId = scene?.id;
    const sceneWorkspace = useSceneWorkspace(sceneId || '');
    const stepId = sceneWorkspace?.openStepId;

    const dispatch = useDispatch();
    const selection = useSelection(raidId || '');

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

    const renderer = useSceneRenderer(sceneId || '', stepId || '');

    const zoom = sceneWorkspace?.zoom || 1;
    const center = useMemo(() => sceneWorkspace?.center || { x: 0, y: 0 }, [sceneWorkspace]);
    const pixelsPerMeterZoomed = zoom * PIXELS_PER_METER;
    const entityPresetDragData = raidWorkspace?.entityPresetDragData;

    const mouseDown = useRef<{
        brokeDragThreshold: boolean;
        hit?: Hit;
        scenePosition: { x: number; y: number };
        pixelPosition: { x: number; y: number };
    } | null>(null);

    const pixelToSceneCoordinate = useCallback(
        ({ x, y }: { x: number; y: number }) => {
            return {
                x: (x - 0.5 * canvasWidth) / pixelsPerMeterZoomed + center.x,
                y: (y - 0.5 * canvasHeight) / pixelsPerMeterZoomed + center.y,
            };
        },
        [canvasWidth, canvasHeight, pixelsPerMeterZoomed, center],
    );

    useAnimationFrame(() => {
        if (canvasContext) {
            if (canvasRef.current && canvasWidth !== canvasRef.current.width) {
                canvasRef.current.width = canvasWidth * window.devicePixelRatio;
            }
            if (canvasRef.current && canvasHeight !== canvasRef.current.height) {
                canvasRef.current.height = canvasHeight * window.devicePixelRatio;
            }
            renderer.render(canvasContext, pixelsPerMeterZoomed * window.devicePixelRatio, center);
        }
    });

    useEffect(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            setCanvasContext(context);
        }
    }, []);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasWidth(containerRef.current.clientWidth);
                setCanvasHeight(containerRef.current.clientHeight);
            }
        };
        setTimeout(updateSize, 0);
        window.addEventListener('resize', updateSize);
        return () => {
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    const mouseDownHandler = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) {
                return;
            }

            const pos = pixelToSceneCoordinate({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
            const hit = renderer.hitTest(pos, pixelsPerMeterZoomed * window.devicePixelRatio);

            mouseDown.current = {
                brokeDragThreshold: false,
                hit,
                scenePosition: pos,
                pixelPosition: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
            };

            // select the clicked entity
            if (hit && hit.type === 'entity') {
                const entity = hit.entity;
                const isSelected = selection?.entityIds?.includes(entity.id);
                if (e.shiftKey || e.ctrlKey) {
                    // toggle this entity, leave others as they are
                    if (isSelected) {
                        const others = selection?.entityIds?.filter((id) => id !== entity.id) || [];
                        dispatch.workspaces.select({
                            raidId: raidId || '',
                            selection: { ...selection, entityIds: others.length > 0 ? others : undefined },
                        });
                    } else {
                        dispatch.workspaces.select({
                            raidId: raidId || '',
                            selection: { ...selection, entityIds: [...(selection?.entityIds || []), entity.id] },
                        });
                    }
                } else if (!isSelected) {
                    dispatch.workspaces.select({ raidId: raidId || '', selection: { entityIds: [entity.id] } });
                }
            }
        },
        [renderer, pixelToSceneCoordinate, dispatch, raidId, selection, pixelsPerMeterZoomed],
    );

    const mouseMoveHandler = useCallback(
        (e: React.MouseEvent) => {
            if (e.buttons === 1 && mouseDown.current) {
                if (!mouseDown.current.brokeDragThreshold) {
                    // figure out if we've moved enough to start a drag
                    const xPixelDistance = e.nativeEvent.offsetX - mouseDown.current.pixelPosition.x;
                    const yPixelDistance = e.nativeEvent.offsetY - mouseDown.current.pixelPosition.y;
                    const distanceSquared = xPixelDistance * xPixelDistance + yPixelDistance * yPixelDistance;
                    if (distanceSquared >= 4) {
                        mouseDown.current.brokeDragThreshold = true;
                    } else {
                        return;
                    }
                }

                const pos = pixelToSceneCoordinate({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
                const movement = {
                    x: pos.x - mouseDown.current.scenePosition.x,
                    y: pos.y - mouseDown.current.scenePosition.y,
                };
                if (e.shiftKey) {
                    if (Math.abs(movement.x) > Math.abs(movement.y)) {
                        movement.y = 0;
                    } else {
                        movement.x = 0;
                    }
                }

                // apply drag movement for selected entities
                if (
                    mouseDown.current.hit?.type === 'entity' &&
                    selection?.entityIds &&
                    selection.entityIds.length > 0
                ) {
                    for (const entityId of selection.entityIds) {
                        renderer.setEntityDragMovement(entityId, movement);
                    }
                }

                // apply drag rotation for selected entities
                if (
                    mouseDown.current.hit?.type === 'rotation-handle' &&
                    selection?.entityIds &&
                    selection.entityIds.length > 0
                ) {
                    const startAngle = angle(mouseDown.current.scenePosition, mouseDown.current.hit.pivot);
                    const currentAngle = angle(pos, mouseDown.current.hit.pivot);
                    const rotation = e.shiftKey ? snapAngle(currentAngle - startAngle) : currentAngle - startAngle;
                    for (const entityId of selection.entityIds) {
                        renderer.setEntityDragRotation(entityId, rotation);
                    }
                }

                // apply drag movement for scene panning
                if (!mouseDown.current.hit) {
                    renderer.setSceneDragMovement(movement);
                }
            }
        },
        [selection, pixelToSceneCoordinate, renderer],
    );

    const mouseUpHandler = useCallback(
        (e: React.MouseEvent) => {
            if (!mouseDown.current) {
                return;
            }

            if (mouseDown.current.brokeDragThreshold) {
                const pos = pixelToSceneCoordinate({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
                const movement = {
                    x: pos.x - mouseDown.current.scenePosition.x,
                    y: pos.y - mouseDown.current.scenePosition.y,
                };
                if (e.shiftKey) {
                    if (Math.abs(movement.x) > Math.abs(movement.y)) {
                        movement.y = 0;
                    } else {
                        movement.x = 0;
                    }
                }

                // apply the drag movement to the entities' positions
                if (mouseDown.current.hit?.type === 'entity') {
                    if (
                        selection?.entityIds &&
                        selection.entityIds.length > 0 &&
                        (movement.x !== 0 || movement.y !== 0)
                    ) {
                        dispatch.raids.moveEntities({
                            stepId: stepId || '',
                            entityIds: selection.entityIds,
                            offset: movement,
                        });
                    }
                }

                // apply the drag rotation to the entities' rotations
                if (
                    mouseDown.current.hit?.type === 'rotation-handle' &&
                    selection?.entityIds &&
                    selection.entityIds.length > 0
                ) {
                    const startAngle = angle(mouseDown.current.scenePosition, mouseDown.current.hit.pivot);
                    const currentAngle = angle(pos, mouseDown.current.hit.pivot);
                    const rotation = e.shiftKey ? snapAngle(currentAngle - startAngle) : currentAngle - startAngle;
                    if (rotation) {
                        dispatch.raids.rotateEntities({
                            stepId: stepId || '',
                            entityIds: selection.entityIds,
                            rotation,
                        });
                    }
                }

                // apply the drag movement to the scene's center
                if (!mouseDown.current.hit) {
                    if (movement.x !== 0 || movement.y !== 0) {
                        const newCenter = {
                            x: center.x - movement.x,
                            y: center.y - movement.y,
                        };
                        dispatch.workspaces.updateScene({ id: sceneId || '', center: newCenter });
                    }
                }
            } else if (!mouseDown.current.hit) {
                // click on empty space clears selection
                dispatch.workspaces.select({ raidId: raidId || '', selection: undefined });
            }

            renderer.resetDragMovementAndRotation();
            mouseDown.current = null;
        },
        [renderer, pixelToSceneCoordinate, selection, dispatch, stepId, center, sceneId, raidId],
    );

    const dragOverHandler = useCallback(
        (e: React.DragEvent) => {
            if (e.dataTransfer.types.includes(ENTITY_PRESET_DRAG_MIME_TYPE)) {
                // By default, the drop event is not allowed. We have to preventDefault to indicate that we will handle it.
                e.preventDefault();

                const pos = pixelToSceneCoordinate({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });

                // For security reasons, browsers don't let us see the drag data during dragover.
                // See if we put data in the store - otherwise, fall back to a square indicator.
                const shape = entityPresetDragData
                    ? entityPresetDragData.properties.shape
                    : { type: 'rectangle' as const, width: 1, height: 1 };

                renderer.showDropIndicator({ position: pos, shape });
            }
        },
        [pixelToSceneCoordinate, renderer, entityPresetDragData],
    );

    const dropHandler = useCallback(
        (e: React.DragEvent) => {
            const dataString = e.dataTransfer.getData(ENTITY_PRESET_DRAG_MIME_TYPE);
            if (dataString) {
                const pos = pixelToSceneCoordinate({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
                const data = JSON.parse(dataString) as EntityPresetDragData;

                dispatch.raids.createEntity({
                    name: data.name,
                    raidId: raidId || '',
                    sceneId: sceneId || '',
                    properties: {
                        ...data.properties,
                        position: pos,
                    },
                });

                e.dataTransfer.clearData(ENTITY_PRESET_DRAG_MIME_TYPE);
            }

            renderer.hideDropIndicator();
        },
        [renderer, pixelToSceneCoordinate, dispatch, raidId, sceneId],
    );

    return (
        <div className="w-full h-full" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={mouseDownHandler}
                onMouseMove={mouseMoveHandler}
                onMouseUp={mouseUpHandler}
                onDragOver={dragOverHandler}
                onDragLeave={() => renderer.hideDropIndicator()}
                onDrop={dropHandler}
            />
        </div>
    );
};
