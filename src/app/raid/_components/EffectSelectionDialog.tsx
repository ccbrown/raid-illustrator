import clsx from 'clsx';
import { useState } from 'react';

import { Button, Dialog } from '@/components';
import { RaidEntity } from '@/models/raids/types';
import { defaultProperties } from '@/property-spec';
import { useDispatch } from '@/store';
import { visualEffectFactories } from '@/visual-effects';

interface Props {
    isOpen?: boolean;
    onClose: () => void;
    entity: RaidEntity;
}

export const EffectSelectionDialog = (props: Props) => {
    const options = Object.keys(visualEffectFactories).map((key) => {
        const f = visualEffectFactories[key];
        return {
            label: f.name,
            description: f.description,
            key,
        };
    });
    options.sort((a, b) => a.label.localeCompare(b.label));

    const [selectedFactoryId, setSelectedFactoryId] = useState('');
    const selectedFactory = visualEffectFactories[selectedFactoryId];

    const dispatch = useDispatch();

    const ep = props.entity.properties;

    return (
        <Dialog isOpen={props.isOpen} onClose={() => props.onClose()} title="Effects">
            <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (ep.type === 'shape') {
                        dispatch.raids.updateEntity({
                            id: props.entity.id,
                            properties: {
                                type: 'shape',
                                effects: [
                                    ...(ep.effects || []),
                                    {
                                        id: crypto.randomUUID(),
                                        factoryId: selectedFactoryId,
                                        properties: defaultProperties(selectedFactory?.properties || []),
                                    },
                                ],
                            },
                        });
                        props.onClose();
                    }
                }}
            >
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto bg-elevation-1 rounded-sm">
                    {options.map((option) => (
                        <div
                            key={option.key}
                            className={clsx('flex flex-col cursor-pointer px-4 py-2', {
                                'bg-indigo-500': selectedFactoryId === option.key,
                                'hover:bg-white/3': selectedFactoryId !== option.key,
                            })}
                            onClick={() => setSelectedFactoryId(option.key)}
                        >
                            <div className="font-semibold text-sm">{option.label}</div>
                            <div className="text-xs text-white/70">{option.description}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-row justify-end">
                    <Button text="Add Effect" type="submit" disabled={!selectedFactoryId} />
                </div>
            </form>
        </Dialog>
    );
};
