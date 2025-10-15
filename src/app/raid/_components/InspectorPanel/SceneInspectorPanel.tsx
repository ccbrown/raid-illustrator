import { useScene } from '@/hooks';
import { Material, RaidSceneShape } from '@/models/raids/types';
import { useDispatch } from '@/store';

import { MaterialEditor } from './MaterialEditor';
import { ShapeEditor } from './ShapeEditor';

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

    const updateFill = (newFill?: Material) => {
        dispatch.raids.updateScene({ id: scene.id, fill: newFill });
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col h-full overflow-auto">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{scene.name}</div>
                <ShapeEditor value={scene.shape} onChange={updateShape} />
                <MaterialEditor
                    label="Fill"
                    value={scene.fill}
                    onChange={updateFill}
                    defaultColor={{
                        r: 40,
                        g: 42,
                        b: 54,
                        a: 1,
                    }}
                />
            </div>
        </div>
    );
};
