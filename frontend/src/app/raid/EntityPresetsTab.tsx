import Image from 'next/image';

import { visualEffectFactories } from '@/visual-effects';
import { useRaidId } from './hooks';
import { ENTITY_PRESET_DRAG_MIME_TYPE } from './Canvas';
import { defaultProperties } from '@/property-spec';
import { Shape } from '@/shapes';
import { EntityPresetDragData } from '@/models/workspaces';
import { useDispatch } from '@/store';

interface Preset {
    name: string;
    iconUrl: string;
    generate: () => EntityPresetDragData;
}

const generateBasicEffectEntity = (name: string, shape: Shape, effectFactoryId: string): EntityPresetDragData => {
    const effectFactory = visualEffectFactories[effectFactoryId];
    if (!effectFactory) {
        throw new Error(`Effect factory with ID ${effectFactoryId} not found`);
    }
    const effectProperties = defaultProperties(effectFactory.properties || []);
    return {
        name,
        properties: {
            type: 'shape',
            shape,
            position: { initial: { x: 0, y: 0 } },
            effects: [
                {
                    id: crypto.randomUUID(),
                    factoryId: effectFactoryId,
                    properties: effectProperties,
                },
            ],
        },
    };
};

const presets: Preset[] = [
    {
        name: 'Waymark A',
        iconUrl: '/images/ffxiv/waymarks/icons/a.png',
        generate: () => generateBasicEffectEntity('Waymark A', { type: 'circle', radius: 1 }, 'ffxiv-waymark-a'),
    },
    {
        name: 'Waymark B',
        iconUrl: '/images/ffxiv/waymarks/icons/b.png',
        generate: () => generateBasicEffectEntity('Waymark B', { type: 'circle', radius: 1 }, 'ffxiv-waymark-b'),
    },
    {
        name: 'Waymark C',
        iconUrl: '/images/ffxiv/waymarks/icons/c.png',
        generate: () => generateBasicEffectEntity('Waymark C', { type: 'circle', radius: 1 }, 'ffxiv-waymark-c'),
    },
    {
        name: 'Waymark D',
        iconUrl: '/images/ffxiv/waymarks/icons/d.png',
        generate: () => generateBasicEffectEntity('Waymark D', { type: 'circle', radius: 1 }, 'ffxiv-waymark-d'),
    },
    {
        name: 'Waymark 1',
        iconUrl: '/images/ffxiv/waymarks/icons/1.png',
        generate: () => generateBasicEffectEntity('Waymark 1', { type: 'circle', radius: 1 }, 'ffxiv-waymark-1'),
    },
    {
        name: 'Waymark 2',
        iconUrl: '/images/ffxiv/waymarks/icons/2.png',
        generate: () => generateBasicEffectEntity('Waymark 2', { type: 'circle', radius: 1 }, 'ffxiv-waymark-2'),
    },
    {
        name: 'Waymark 3',
        iconUrl: '/images/ffxiv/waymarks/icons/3.png',
        generate: () => generateBasicEffectEntity('Waymark 3', { type: 'circle', radius: 1 }, 'ffxiv-waymark-3'),
    },
    {
        name: 'Waymark 4',
        iconUrl: '/images/ffxiv/waymarks/icons/4.png',
        generate: () => generateBasicEffectEntity('Waymark 4', { type: 'circle', radius: 1 }, 'ffxiv-waymark-4'),
    },
];

const PresetButton = ({ preset }: { preset: Preset }) => {
    const raidId = useRaidId() || '';
    const dispatch = useDispatch();

    return (
        <div
            className="bg-elevation-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-elevation-3 hover:shadow-md"
            draggable="true"
            onDragStart={(e) => {
                const data = preset.generate();
                dispatch.workspaces.putEntityPresetDragData({ raidId, data });
                e.dataTransfer.setData(ENTITY_PRESET_DRAG_MIME_TYPE, JSON.stringify(data));
            }}
            onDragEnd={() => {
                dispatch.workspaces.putEntityPresetDragData({ raidId, data: undefined });
            }}
        >
            <Image src={preset.iconUrl} alt={preset.name} width={48} height={48} />
        </div>
    );
};

export const EntityPresetsTab = () => {
    return (
        <div className="p-2 grid grid-cols-5 gap-1">
            {presets.map((preset, idx) => (
                <PresetButton key={idx} preset={preset} />
            ))}
        </div>
    );
};
