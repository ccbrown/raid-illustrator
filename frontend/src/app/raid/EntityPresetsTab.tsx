import Image from 'next/image';

import { AnyProperties, Shape } from '@/models/raids/types';
import { EntityPresetDragData } from '@/models/workspaces/types';
import { defaultProperties } from '@/property-spec';
import { useDispatch } from '@/store';
import { visualEffectFactories } from '@/visual-effects';

import { ENTITY_PRESET_DRAG_MIME_TYPE } from './Canvas';
import { useRaidId } from './hooks';

interface Preset {
    name: string;
    iconUrl: string;
    generate: () => EntityPresetDragData;
}

const basicImagePreset = (name: string, shape: Shape, imageUrl: string): Preset => {
    return {
        name,
        iconUrl: imageUrl,
        generate: () => ({
            name,
            properties: {
                type: 'shape',
                shape,
                position: { x: 0, y: 0 },
                fill: {
                    type: 'image',
                    url: imageUrl,
                },
            },
        }),
    };
};

const ffxivRoleFramePreset = (name: string, imageName: string): Preset => {
    return basicImagePreset(name, { type: 'rectangle', width: 1, height: 1 }, `/images/ffxiv/role-frames/${imageName}`);
};

const generateBasicEffectEntity = (
    name: string,
    shape: Shape,
    effectFactoryId: string,
    propertyOverrides: AnyProperties,
): EntityPresetDragData => {
    const effectFactory = visualEffectFactories[effectFactoryId];
    if (!effectFactory) {
        throw new Error(`Effect factory with ID ${effectFactoryId} not found`);
    }
    const defaultEffectProperties = defaultProperties(effectFactory.properties || []);
    return {
        name,
        properties: {
            type: 'shape',
            shape,
            position: { x: 0, y: 0 },
            effects: [
                {
                    id: crypto.randomUUID(),
                    factoryId: effectFactoryId,
                    properties: {
                        ...defaultEffectProperties,
                        ...propertyOverrides,
                    },
                },
            ],
        },
    };
};

const presets: Preset[] = [
    {
        name: 'Waymark A',
        iconUrl: '/images/ffxiv/waymarks/icons/a.png',
        generate: () =>
            generateBasicEffectEntity('Waymark A', { type: 'circle', radius: 1 }, 'ffxiv-waymark', { variant: 'a' }),
    },
    {
        name: 'Waymark B',
        iconUrl: '/images/ffxiv/waymarks/icons/b.png',
        generate: () =>
            generateBasicEffectEntity('Waymark B', { type: 'circle', radius: 1 }, 'ffxiv-waymark', { variant: 'b' }),
    },
    {
        name: 'Waymark C',
        iconUrl: '/images/ffxiv/waymarks/icons/c.png',
        generate: () =>
            generateBasicEffectEntity('Waymark C', { type: 'circle', radius: 1 }, 'ffxiv-waymark', { variant: 'c' }),
    },
    {
        name: 'Waymark D',
        iconUrl: '/images/ffxiv/waymarks/icons/d.png',
        generate: () =>
            generateBasicEffectEntity('Waymark D', { type: 'circle', radius: 1 }, 'ffxiv-waymark', { variant: 'd' }),
    },
    {
        name: 'Waymark 1',
        iconUrl: '/images/ffxiv/waymarks/icons/1.png',
        generate: () =>
            generateBasicEffectEntity('Waymark 1', { type: 'rectangle', width: 1, height: 1 }, 'ffxiv-waymark', {
                variant: '1',
            }),
    },
    {
        name: 'Waymark 2',
        iconUrl: '/images/ffxiv/waymarks/icons/2.png',
        generate: () =>
            generateBasicEffectEntity('Waymark 2', { type: 'rectangle', width: 1, height: 1 }, 'ffxiv-waymark', {
                variant: '2',
            }),
    },
    {
        name: 'Waymark 3',
        iconUrl: '/images/ffxiv/waymarks/icons/3.png',
        generate: () =>
            generateBasicEffectEntity('Waymark 3', { type: 'rectangle', width: 1, height: 1 }, 'ffxiv-waymark', {
                variant: '3',
            }),
    },
    {
        name: 'Waymark 4',
        iconUrl: '/images/ffxiv/waymarks/icons/4.png',
        generate: () =>
            generateBasicEffectEntity('Waymark 4', { type: 'rectangle', width: 1, height: 1 }, 'ffxiv-waymark', {
                variant: '4',
            }),
    },
    ffxivRoleFramePreset('DPS', 'dps.png'),
    ffxivRoleFramePreset('Melee DPS', 'melee-dps.png'),
    ffxivRoleFramePreset('Ranged DPS', 'ranged-dps.png'),
    ffxivRoleFramePreset('Physical Ranged DPS', 'physical-ranged-dps.png'),
    ffxivRoleFramePreset('Magical Ranged DPS', 'magical-ranged-dps.png'),
    ffxivRoleFramePreset('Healer', 'healer.png'),
    ffxivRoleFramePreset('Pure Healer', 'pure-healer.png'),
    ffxivRoleFramePreset('Barrier Healer', 'barrier-healer.png'),
    ffxivRoleFramePreset('Tank', 'tank.png'),
    ffxivRoleFramePreset('Multi-Role', 'multi-role.png'),
    ffxivRoleFramePreset('Pet', 'pet.png'),
    ffxivRoleFramePreset('Mount', 'mount.png'),
    ffxivRoleFramePreset('Arcanist', 'arcanist.png'),
    ffxivRoleFramePreset('Archer', 'archer.png'),
    ffxivRoleFramePreset('Astrologian', 'astrologian.png'),
    ffxivRoleFramePreset('Bard', 'bard.png'),
    ffxivRoleFramePreset('Black Mage', 'black-mage.png'),
    ffxivRoleFramePreset('Blue Mage', 'blue-mage.png'),
    ffxivRoleFramePreset('Conjurer', 'conjurer.png'),
    ffxivRoleFramePreset('Dancer', 'dancer.png'),
    ffxivRoleFramePreset('Dark Knight', 'dark-knight.png'),
    ffxivRoleFramePreset('Dragoon', 'dragoon.png'),
    ffxivRoleFramePreset('Gladiator', 'gladiator.png'),
    ffxivRoleFramePreset('Gunbreaker', 'gunbreaker.png'),
    ffxivRoleFramePreset('Lancer', 'lancer.png'),
    ffxivRoleFramePreset('Machinist', 'machinist.png'),
    ffxivRoleFramePreset('Marauder', 'marauder.png'),
    ffxivRoleFramePreset('Monk', 'monk.png'),
    ffxivRoleFramePreset('Ninja', 'ninja.png'),
    ffxivRoleFramePreset('Paladin', 'paladin.png'),
    ffxivRoleFramePreset('Person', 'person.png'),
    ffxivRoleFramePreset('Pictomancer', 'pictomancer.png'),
    ffxivRoleFramePreset('Pugilist', 'pugilist.png'),
    ffxivRoleFramePreset('Reaper', 'reaper.png'),
    ffxivRoleFramePreset('Red-mage', 'red-mage.png'),
    ffxivRoleFramePreset('Rogue', 'rogue.png'),
    ffxivRoleFramePreset('Sage', 'sage.png'),
    ffxivRoleFramePreset('Samurai', 'samurai.png'),
    ffxivRoleFramePreset('Scholar', 'scholar.png'),
    ffxivRoleFramePreset('Summoner', 'summoner.png'),
    ffxivRoleFramePreset('Thaumaturge', 'thaumaturge.png'),
    ffxivRoleFramePreset('Viper', 'viper.png'),
    ffxivRoleFramePreset('Warrior', 'warrior.png'),
    ffxivRoleFramePreset('White Mage', 'white-mage.png'),
    ffxivRoleFramePreset('Blank DPS', 'blank-dps.png'),
    ffxivRoleFramePreset('Blank Healer', 'blank-healer.png'),
    ffxivRoleFramePreset('Blank Tank', 'blank-tank.png'),
    ffxivRoleFramePreset('Blank Multi-Role', 'blank-multi-role.png'),
    ffxivRoleFramePreset('Blank Summon', 'blank-summon.png'),
    ffxivRoleFramePreset('Blank Neutral', 'blank-neutral.png'),
];

const PresetButton = ({ preset }: { preset: Preset }) => {
    const raidId = useRaidId() || '';
    const dispatch = useDispatch();

    return (
        <div
            className="bg-elevation-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-elevation-3 hover:border-1 hover:border-white/70 hover:shadow-md"
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
        <div className="p-2 grid grid-cols-5 gap-1 max-h-[400px] overflow-y-auto">
            {presets.map((preset, idx) => (
                <PresetButton key={idx} preset={preset} />
            ))}
        </div>
    );
};
