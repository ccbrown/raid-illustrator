import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimationFrame } from 'motion/react';

import { useRaidId } from './hooks';
import { useRaidWorkspace, useSceneWorkspace, useScene, useSelection } from '@/hooks';
import { shapeDimensions } from '@/shapes';
import { useDispatch } from '@/store';
import { useSceneRenderer } from '@/renderer';

const PIXELS_PER_METER = 100;

export const Canvas = () => {
    const raidId = useRaidId();
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const scene = useScene(raidWorkspace?.openSceneId || '');
    const sceneWorkspace = useSceneWorkspace(scene?.id || '');
    const stepId = sceneWorkspace?.openStepId;

    const dispatch = useDispatch();
    const selection = useSelection(raidId || '');

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

    const renderer = useSceneRenderer(scene?.id || '', stepId || '');

    const zoom = sceneWorkspace?.zoom || 1;
    const center = useMemo(() => sceneWorkspace?.center || { x: 0, y: 0 }, [sceneWorkspace]);
    const pixelsPerMeterZoomed = zoom * PIXELS_PER_METER;
    const sceneDimensions = scene ? shapeDimensions(scene.shape) : { width: 0, height: 0 };

    const mouseDown = useRef<{
        brokeDragThreshold: boolean;
        hitEntity: boolean;
        scenePosition: { x: number; y: number };
        pixelPosition: { x: number; y: number };
    } | null>(null);

    const pixelToSceneCoordinate = useCallback(
        ({ x, y }: { x: number; y: number }) => {
            return {
                x: (x - 0.5 * canvasWidth) / pixelsPerMeterZoomed + center.x,
                y: (0.5 * canvasHeight - y) / pixelsPerMeterZoomed + center.y,
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
            const entity = renderer.hitTest(pos);

            mouseDown.current = {
                brokeDragThreshold: false,
                hitEntity: !!entity,
                scenePosition: pos,
                pixelPosition: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
            };

            // select the clicked entity
            if (entity) {
                const isSelected = selection?.entityIds?.includes(entity.id);
                if (!isSelected) {
                    dispatch.workspaces.select({ raidId: raidId || '', selection: { entityIds: [entity.id] } });
                }
            }
        },
        [renderer, pixelToSceneCoordinate, dispatch, raidId, selection],
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

                // apply drag movement for selected entities
                if (mouseDown.current.hitEntity && selection?.entityIds && selection.entityIds.length > 0) {
                    for (const entityId of selection.entityIds) {
                        renderer.setEntityDragMovement(entityId, movement);
                    }
                }

                // apply drag movement for scene panning
                if (!mouseDown.current.hitEntity) {
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

                // apply the drag movement to the entities' positions
                if (mouseDown.current.hitEntity) {
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

                // apply the drag movement to the scene's center
                if (!mouseDown.current.hitEntity) {
                    if (movement.x !== 0 || movement.y !== 0) {
                        const newCenter = {
                            x: center.x - movement.x,
                            y: center.y - movement.y,
                        };
                        dispatch.workspaces.updateScene({ id: scene?.id || '', center: newCenter });
                    }
                }
            } else if (!mouseDown.current.hitEntity) {
                // click on empty space clears selection
                dispatch.workspaces.select({ raidId: raidId || '', selection: undefined });
            }

            renderer.resetDragMovement();
            mouseDown.current = null;
        },
        [renderer, pixelToSceneCoordinate, selection, dispatch, stepId, center, scene, raidId],
    );

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={mouseDownHandler}
                onMouseMove={mouseMoveHandler}
                onMouseUp={mouseUpHandler}
            />
            <div className="absolute bottom-0 w-full flex flex-row justify-center pointer-events-none">
                <div className="px-6 py-1 bg-elevation-1/80 rounded-t-md text-xs text-white/80 backdrop-blur-sm pointer-events-auto">
                    Scene: {sceneDimensions.width}m × {sceneDimensions.height}m, Zoom:{' '}
                    {Math.round(pixelsPerMeterZoomed)}px/m
                </div>
            </div>
        </div>
    );
};
