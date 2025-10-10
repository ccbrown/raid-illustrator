import React, { useCallback, useEffect, useRef, useState } from 'react';
import Draggable, { DraggableEventHandler } from 'react-draggable';

import { useRaidId } from './hooks';
import { useRaidWorkspace, useSceneWorkspace, useScene } from '@/hooks';
import { useDispatch, useSelector } from '@/store';
import { Shape as ShapeDef, shapeDimensions } from '@/shapes';

const PIXELS_PER_METER = 100;

interface GroupProps {
    children: React.ReactNode;
    scale?: number;
    translation?: { x: number; y: number };
}

const Group = ({ children, scale = 1, translation = { x: 0, y: 0 } }: GroupProps) => {
    return (
        <div
            className="absolute origin-top-left"
            style={{
                transform: `scale(${scale}) translate(${translation.x * PIXELS_PER_METER}px, ${translation.y * PIXELS_PER_METER}px)`,
            }}
        >
            {children}
        </div>
    );
};

interface ShapeProps {
    shape: ShapeDef;
    fill?: string;
}

const Shape = ({ shape, fill }: ShapeProps) => {
    switch (shape.type) {
        case 'rectangle':
            return (
                <div
                    style={{
                        width: shape.width * PIXELS_PER_METER,
                        height: shape.height * PIXELS_PER_METER,
                        backgroundColor: fill,
                    }}
                />
            );
        case 'circle':
            return (
                <div
                    style={{
                        width: shape.radius * 2 * PIXELS_PER_METER,
                        height: shape.radius * 2 * PIXELS_PER_METER,
                        backgroundColor: fill,
                        borderRadius: '50%',
                    }}
                />
            );
        default:
            return null;
    }
};

interface EntityProps {
    id: string;
    zoom: number;
}

const Entity = ({ id, zoom }: EntityProps) => {
    const entity = useSelector((state) => state.raids.entities[id]);
    const nodeRef = useRef(null);
    const dispatch = useDispatch();

    const isSelected = useSelector((state) => {
        const sceneWorkspace = state.workspaces.scenes[entity?.sceneId || ''];
        return !!sceneWorkspace?.selectedEntityIds?.includes(id);
    });

    const handleMouseDown = useCallback(() => {
        if (entity) {
            dispatch.workspaces.selectEntities({ sceneId: entity.sceneId, ids: [entity.id] });
        }
    }, [entity, dispatch]);

    const handleDragStop = useCallback<DraggableEventHandler>(
        (_e, data) => {
            if (entity) {
                dispatch.raids.updateEntity({
                    id: entity.id,
                    properties: {
                        type: entity.properties.type,
                        position: { unkeyed: { x: data.x / PIXELS_PER_METER, y: data.y / PIXELS_PER_METER } },
                    },
                });
            }
        },
        [dispatch, entity],
    );

    if (!entity) {
        return null;
    }

    const ep = entity.properties;
    const position = entity.properties.position.unkeyed;

    return (
        <Draggable
            nodeRef={nodeRef}
            onMouseDown={handleMouseDown}
            onStop={handleDragStop}
            scale={zoom}
            position={{ x: position.x * PIXELS_PER_METER, y: position.y * PIXELS_PER_METER }}
        >
            <div ref={nodeRef} className="relative inline-block">
                {isSelected && (
                    <div className="absolute inset-0 inline-block outline outline-4 outline-offset-2 outline-cyan-500" />
                )}
                {ep.type === 'shape' && <Shape shape={ep.shape} fill="#ff79c6" />}
            </div>
        </Draggable>
    );
};

interface EntitiesProps {
    ids: string[];
    zoom: number;
}

const Entities = ({ ids, zoom }: EntitiesProps) => {
    return (
        <>
            {ids.map((id) => (
                <Entity key={id} id={id} zoom={zoom} />
            ))}
        </>
    );
};

export const Canvas = () => {
    const raidId = useRaidId();
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const scene = useScene(raidWorkspace?.openSceneId || '');
    const sceneWorkspace = useSceneWorkspace(scene?.id || '');

    const containerRef = useRef<HTMLDivElement>(null);

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

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

    const zoom = sceneWorkspace?.zoom || 1;
    const center = sceneWorkspace?.center || { x: 0, y: 0 };

    if (!raidWorkspace || !scene || !sceneWorkspace) {
        return null;
    }

    const pixelsPerMeterZoomed = PIXELS_PER_METER * zoom;

    const canvasWidthMeters = canvasWidth / pixelsPerMeterZoomed;
    const canvasHeightMeters = canvasHeight / pixelsPerMeterZoomed;
    const sceneDimensions = shapeDimensions(scene.shape);

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <Group
                scale={zoom}
                translation={{ x: -center.x + canvasWidthMeters / 2, y: -center.y + canvasHeightMeters / 2 }}
            >
                <Group translation={{ x: -sceneDimensions.width * 0.5, y: -sceneDimensions.height * 0.5 }}>
                    <Shape shape={scene.shape} fill="#44475a" />
                </Group>
                <Entities ids={scene.entityIds} zoom={zoom} />
            </Group>
            <div className="absolute bottom-0 w-full flex flex-row justify-center">
                <div className="px-6 py-1 bg-elevation-1/80 rounded-t-md text-xs text-white/80 backdrop-blur-sm">
                    Scene: {sceneDimensions.width}m × {sceneDimensions.height}m, Zoom:{' '}
                    {Math.round(pixelsPerMeterZoomed)}px/m, Center: ({center.x.toFixed(1)}m, {center.y.toFixed(1)}m)
                </div>
            </div>
        </div>
    );
};
