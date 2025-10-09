import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button, Dialog, Dropdown, TextField } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';
import { RaidScene } from '@/models/raids';

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
    const [rectangleWidth, setRectangleWidth] = useState('40');
    const [rectangleHeight, setRectangleHeight] = useState('40');
    const [circleRadius, setCircleRadius] = useState('25');

    useEffect(() => {
        if (props.existing && props.existing.id !== populatedFromId) {
            setPopulatedFromId(props.existing.id);
            setName(props.existing.name);
            if (props.existing.shape.type === 'rectangle') {
                setShape('rectangle');
                setRectangleWidth(props.existing.shape.width.toString());
                setRectangleHeight(props.existing.shape.height.toString());
            } else if (props.existing.shape.type === 'circle') {
                setShape('circle');
                setCircleRadius(props.existing.shape.radius.toString());
            }
        }
    }, [props.existing, populatedFromId]);

    const hasValidInput =
        !!name.trim() &&
        (shape === 'rectangle'
            ? !!(parseFloat(rectangleWidth) > 0 && parseFloat(rectangleHeight) > 0)
            : !!(parseFloat(circleRadius) > 0));

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
                          width: parseFloat(rectangleWidth),
                          height: parseFloat(rectangleHeight),
                      }
                    : {
                          type: 'circle' as const,
                          radius: parseFloat(circleRadius),
                      },
        };
        if (props.existing) {
            dispatch.raids.updateScene({ id: props.existing.id, ...update });
        } else {
            const id = dispatch.raids.createScene({ raidId: props.raidId, ...update });
            dispatch.workspaces.openScene({ id, raidId: props.raidId });
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
                options={[
                    { label: 'Circle', key: 'circle' },
                    { label: 'Rectangle', key: 'rectangle' },
                ]}
                label="Shape"
                selectedOptionKey={shape}
                onChange={(option) => setShape(option.key as 'rectangle' | 'circle')}
            />
            <div className="grid grid-cols-2 gap-2">
                {shape === 'rectangle' ? (
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
            <div className="flex flex-row justify-end">
                <Button text={props.existing ? 'Update Scene' : 'Add Scene'} type="submit" disabled={!hasValidInput} />
            </div>
        </form>
    );
};

export const ScenesPanel = () => {
    const raidId = useHashParam('id');
    const scenes = Object.values(useSelector((state) => state.raids.scenes)).filter((scene) => scene.raidId === raidId);
    scenes.sort((a, b) => a.name.localeCompare(b.name));

    const workspace = useSelector((state) => (raidId ? state.workspaces.raids[raidId] : undefined));

    const [settingsDialogSceneId, setSettingsDialogSceneId] = useState<string | null>(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    const settingsDialogScene = settingsDialogSceneId ? scenes.find((s) => s.id === settingsDialogSceneId) : undefined;

    const dispatch = useDispatch();

    const openScene = (id: string) => {
        if (raidId) {
            dispatch.workspaces.openScene({ id, raidId });
        }
    };

    const deleteScene = (id: string) => {
        if (confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
            dispatch.raids.deleteScene({ id });
        }
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            <Dialog
                isOpen={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                title={settingsDialogSceneId ? 'Scene Settings' : 'New Scene'}
            >
                {raidId && (
                    <SceneSettings
                        onClose={() => setSettingsDialogOpen(false)}
                        raidId={raidId}
                        existing={settingsDialogScene}
                    />
                )}
            </Dialog>
            <div className="flex flex-row items-center mb-2">
                <div className="px-4 font-semibold">Scenes</div>
                <div className="flex-grow" />
                <div className="px-4">
                    <Button
                        icon={PlusIcon}
                        size="small"
                        onClick={() => {
                            setSettingsDialogSceneId(null);
                            setSettingsDialogOpen(true);
                        }}
                    />
                </div>
            </div>
            {scenes.map((scene) => (
                <div
                    key={scene.id}
                    className={`flex flex-row gap-2 px-4 py-2 transition ${scene.id === workspace?.openSceneId ? 'bg-indigo-500' : 'hover:bg-white/10 cursor-pointer'}`}
                    onClick={() => {
                        openScene(scene.id);
                    }}
                >
                    <div className="pr-2">{scene.name}</div>
                    <div className="flex-grow" />
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDialogSceneId(scene.id);
                            setSettingsDialogOpen(true);
                        }}
                    >
                        <GearSixIcon size={18} />
                    </button>
                    <button
                        className="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteScene(scene.id);
                        }}
                    >
                        <TrashIcon size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};
