import { useEffect, useState } from 'react';

import { Button, Dialog, Dropdown, NumberInput, TextField } from '@/components';
import { RaidScene } from '@/models/raids/types';
import { useDispatch, useSelector } from '@/store';

interface SceneSettingsProps {
    existing?: RaidScene;
    raidId: string;
    onClose?: () => void;
}

const SceneSettings = (props: SceneSettingsProps) => {
    const dispatch = useDispatch();

    const [populatedFromId, setPopulatedFromId] = useState('');
    const [name, setName] = useState('New Scene');
    const [shape, setShape] = useState<'rectangle' | 'circle'>('rectangle');
    const [rectangleWidth, setRectangleWidth] = useState(40);
    const [rectangleHeight, setRectangleHeight] = useState(40);
    const [circleRadius, setCircleRadius] = useState(25);

    useEffect(() => {
        if (props.existing && props.existing.id !== populatedFromId) {
            setPopulatedFromId(props.existing.id);
            setName(props.existing.name);
            if (props.existing.shape.type === 'rectangle') {
                setShape('rectangle');
                setRectangleWidth(props.existing.shape.width);
                setRectangleHeight(props.existing.shape.height);
            } else if (props.existing.shape.type === 'circle') {
                setShape('circle');
                setCircleRadius(props.existing.shape.radius);
            }
        }
    }, [props.existing, populatedFromId]);

    const hasValidInput =
        !!name.trim() && (shape === 'rectangle' ? rectangleWidth > 0 && rectangleHeight > 0 : circleRadius > 0);

    const submit = () => {
        if (!hasValidInput) {
            return;
        }

        const update = {
            name,
            shape:
                shape === 'rectangle'
                    ? {
                          type: 'rectangle' as const,
                          width: rectangleWidth,
                          height: rectangleHeight,
                      }
                    : {
                          type: 'circle' as const,
                          radius: circleRadius,
                      },
        };
        if (props.existing) {
            dispatch.raids.updateScene({ id: props.existing.id, ...update });
        } else {
            const id = dispatch.raids.createScene({ raidId: props.raidId, ...update });
            dispatch.workspaces.openScene({ id, raidId: props.raidId });
            dispatch.workspaces.select({ raidId: props.raidId, selection: { sceneIds: [id] } });
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
            <div className="grid grid-cols-3 gap-2">
                <Dropdown
                    options={[
                        { label: 'Circle', key: 'circle' },
                        { label: 'Rectangle', key: 'rectangle' },
                    ]}
                    label="Shape"
                    selectedOptionKey={shape}
                    onChange={(option) => setShape(option.key as 'rectangle' | 'circle')}
                />
                {shape === 'rectangle' ? (
                    <>
                        <NumberInput label="Width (m)" value={rectangleWidth} onChange={setRectangleWidth} />
                        <NumberInput label="Height (m)" value={rectangleHeight} onChange={setRectangleHeight} />
                    </>
                ) : (
                    <NumberInput label="Radius (m)" value={circleRadius} onChange={setCircleRadius} />
                )}
            </div>
            <div className="flex flex-row justify-end">
                <Button text={props.existing ? 'Update Scene' : 'Add Scene'} type="submit" disabled={!hasValidInput} />
            </div>
        </form>
    );
};

interface Props {
    isOpen?: boolean;
    raidId: string;
    sceneId?: string | null;
    onClose: () => void;
}

export const SceneSettingsDialog = (props: Props) => {
    const scene = useSelector((state) => state.raids.scenes[props.sceneId || '']);

    return (
        <Dialog
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            title={props.sceneId ? 'Scene Settings' : 'New Scene'}
        >
            {props.raidId && <SceneSettings onClose={() => props.onClose()} raidId={props.raidId} existing={scene} />}
        </Dialog>
    );
};
