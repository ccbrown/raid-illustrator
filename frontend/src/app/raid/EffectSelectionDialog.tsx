import { useState } from 'react';

import { Button, Dialog, Dropdown } from '@/components';
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
    const options = Object.keys(visualEffectFactories).map((key) => ({
        label: visualEffectFactories[key].name,
        key,
    }));
    options.sort((a, b) => a.label.localeCompare(b.label));

    const [selectedFactoryId, setSelectedFactoryId] = useState(options[0]?.key || '');
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
                <Dropdown
                    options={options}
                    label="Effect"
                    selectedOptionKey={selectedFactoryId}
                    onChange={(option) => setSelectedFactoryId(option.key)}
                />
                <div className="flex flex-row justify-end">
                    <Button text="Add Effect" type="submit" disabled={!selectedFactoryId} />
                </div>
            </form>
        </Dialog>
    );
};
