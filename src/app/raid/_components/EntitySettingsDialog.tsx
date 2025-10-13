import { useEffect, useState } from 'react';

import { Button, Dialog, Dropdown, TextField } from '@/components';
import { useEntity } from '@/hooks';
import { RaidEntity, RaidEntityType } from '@/models/raids/types';
import { useDispatch } from '@/store';

interface EntitySettingsProps {
    existing?: RaidEntity;
    raidId: string;
    sceneId: string;
    onClose?: () => void;
}

const EntitySettings = (props: EntitySettingsProps) => {
    const dispatch = useDispatch();

    const [populatedFromId, setPopulatedFromId] = useState('');
    const [name, setName] = useState('New Entity');
    const [entityType, setEntityType] = useState<RaidEntityType>('shape');
    const [shapeType, setShapeType] = useState<'rectangle' | 'circle'>('rectangle');
    const [rectangleWidth, setRectangleWidth] = useState('1');
    const [rectangleHeight, setRectangleHeight] = useState('1');
    const [circleRadius, setCircleRadius] = useState('0.5');

    useEffect(() => {
        const existing = props.existing;
        if (existing && existing.id !== populatedFromId) {
            setName(existing.name);
            setEntityType(existing.properties.type);
            if (existing.properties.type === 'shape') {
                const shape = existing.properties.shape;
                if (shape.type === 'rectangle') {
                    setShapeType('rectangle');
                    setRectangleWidth(shape.width.toString());
                    setRectangleHeight(shape.height.toString());
                } else if (shape.type === 'circle') {
                    setShapeType('circle');
                    setCircleRadius(shape.radius.toString());
                }
            }
            setPopulatedFromId(existing.id);
        }
    }, [props.existing, populatedFromId]);

    const hasValidInput = !!name.trim();

    const submit = () => {
        if (!hasValidInput) {
            return;
        }

        if (entityType === 'shape') {
            const shape =
                shapeType === 'rectangle'
                    ? {
                          type: 'rectangle' as const,
                          width: parseFloat(rectangleWidth),
                          height: parseFloat(rectangleHeight),
                      }
                    : {
                          type: 'circle' as const,
                          radius: parseFloat(circleRadius),
                      };

            const update = {
                name,
                properties: {
                    type: 'shape' as const,
                    shape,
                },
            };

            if (props.existing) {
                dispatch.raids.updateEntity({ id: props.existing.id, ...update });
            } else {
                const entity = {
                    raidId: props.raidId,
                    sceneId: props.sceneId,
                    ...{
                        ...update,
                        properties: {
                            ...update.properties,
                            position: { x: 0.0, y: 0.0 },
                        },
                    },
                };
                const id = dispatch.raids.createEntity(entity);
                dispatch.workspaces.select({ raidId: props.raidId, selection: { entityIds: [id] } });
            }
        } else if (props.existing) {
            dispatch.raids.updateEntity({ id: props.existing.id, name });
        }

        if (props.onClose) {
            props.onClose();
        }
    };

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <TextField label="Name" value={name} onChange={setName} />
            <Dropdown
                options={[{ label: 'Shape', key: 'shape' }]}
                disabled={props.existing !== undefined}
                label="Type"
                selectedOptionKey={entityType}
                onChange={(option) => setEntityType(option.key as RaidEntityType)}
            />
            {entityType === 'shape' && (
                <div className="grid grid-cols-3 gap-2">
                    <Dropdown
                        options={[
                            { label: 'Circle', key: 'circle' },
                            { label: 'Rectangle', key: 'rectangle' },
                        ]}
                        label="Shape"
                        selectedOptionKey={shapeType}
                        onChange={(option) => setShapeType(option.key as 'rectangle' | 'circle')}
                    />
                    {shapeType === 'rectangle' ? (
                        <>
                            <TextField
                                label="Width (m)"
                                type="number"
                                value={rectangleWidth}
                                onChange={setRectangleWidth}
                            />
                            <TextField
                                label="Height (m)"
                                type="number"
                                value={rectangleHeight}
                                onChange={setRectangleHeight}
                            />
                        </>
                    ) : (
                        <TextField label="Radius (m)" type="number" value={circleRadius} onChange={setCircleRadius} />
                    )}
                </div>
            )}
            <div className="flex flex-row justify-end">
                <Button
                    text={props.existing ? 'Update Entity' : 'Add Entity'}
                    type="submit"
                    disabled={!hasValidInput}
                />
            </div>
        </form>
    );
};

interface Props {
    isOpen?: boolean;
    raidId: string;
    sceneId: string;
    entityId?: string | null;
    onClose: () => void;
}

export const EntitySettingsDialog = (props: Props) => {
    const entity = useEntity(props.entityId || '');

    return (
        <Dialog
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            title={props.entityId ? 'Entity Settings' : 'New Entity'}
        >
            {props.raidId && (
                <EntitySettings
                    onClose={() => props.onClose()}
                    raidId={props.raidId}
                    sceneId={props.sceneId}
                    existing={entity}
                />
            )}
        </Dialog>
    );
};
