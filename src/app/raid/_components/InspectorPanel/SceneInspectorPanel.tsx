import { Dropdown, NumberInput } from '@/components';
import { useScene } from '@/hooks';
import { RaidSceneShape } from '@/models/raids/types';
import { useDispatch } from '@/store';

interface Props {
    id: string;
}

export const SceneInspectorPanel = ({ id }: Props) => {
    const scene = useScene(id);
    const dispatch = useDispatch();

    if (!scene) {
        return null;
    }

    const updateShape = (newShape: RaidSceneShape) => {
        dispatch.raids.updateScene({ id: scene.id, shape: newShape });
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{scene.name}</div>
                <Dropdown
                    options={[
                        { label: 'Circle', key: 'circle' },
                        { label: 'Rectangle', key: 'rectangle' },
                    ]}
                    label="Shape"
                    selectedOptionKey={scene.shape.type}
                    onChange={(option) => {
                        switch (scene.shape.type) {
                            case 'rectangle':
                                switch (option.key) {
                                    case 'circle':
                                        // use the smaller of the width or height as the radius
                                        const radius = Math.min(scene.shape.width, scene.shape.height) / 2;
                                        updateShape({ type: 'circle', radius });
                                        return;
                                }
                                return;
                            case 'circle':
                                switch (option.key) {
                                    case 'rectangle':
                                        // use the diameter as both width and height
                                        const diameter = scene.shape.radius * 2;
                                        updateShape({ type: 'rectangle', width: diameter, height: diameter });
                                        return;
                                }
                                return;
                        }
                    }}
                />
                <div className="grid grid-cols-2 gap-2">
                    {scene.shape.type === 'rectangle' ? (
                        <>
                            <NumberInput
                                label="Width (m)"
                                min={1}
                                value={scene.shape.width}
                                onChange={(w) => {
                                    if (scene.shape.type === 'rectangle') {
                                        updateShape({ ...scene.shape, width: w });
                                    }
                                }}
                            />
                            <NumberInput
                                label="Height (m)"
                                min={1}
                                value={scene.shape.height}
                                onChange={(h) => {
                                    if (scene.shape.type === 'rectangle') {
                                        updateShape({ ...scene.shape, height: h });
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <NumberInput
                            label="Radius (m)"
                            min={1}
                            value={scene.shape.radius}
                            onChange={(r) => {
                                if (scene.shape.type === 'circle') {
                                    updateShape({ ...scene.shape, radius: r });
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
