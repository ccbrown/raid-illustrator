import { DiamondIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import { Button, Checkbox, ColorInput, CoordinateInput, Dropdown } from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSceneWorkspace } from '@/hooks';
import { AnyProperties, Keyable, PartialRaidEntityProperties, RaidEntity } from '@/models/raids/types';
import {
    keyableIsKeyedAtStep,
    keyableValueAtStep,
    keyableWithKeyedStep,
    keyableWithUnkeyedStep,
    keyableWithValueAtStep,
} from '@/models/raids/utils';
import { PropertySpec } from '@/property-spec';
import { useDispatch } from '@/store';
import { visualEffectFactories } from '@/visual-effects';

import { useCommands } from '../../commands';

type PropertyControlProps<T> = {
    value: T;
    onChange: (newValue: T) => void;
};

interface UnkeyablePropertyEditorProps<T> {
    label: string;
    value: T;
    onChange: (newValue: T) => void;
    control: (props: PropertyControlProps<T>) => React.ReactNode;
}

const UnkeyablePropertyEditor = <T,>({ label, value, onChange, control }: UnkeyablePropertyEditorProps<T>) => {
    return (
        <div className="flex flex-row items-center gap-2">
            <div className="text-sm text-gray-300">{label}</div>
            <div className="flex-grow" />
            {control({
                value,
                onChange,
            })}
        </div>
    );
};

interface KeyablePropertyEditorProps<T> {
    label: string;
    sceneStepIds: string[];
    stepId: string;
    value: Keyable<T>;
    onChange: (newValue: Keyable<T>) => void;
    control: (props: PropertyControlProps<T>) => React.ReactNode;
}

const KeyablePropertyEditor = <T,>({
    label,
    value,
    sceneStepIds,
    stepId,
    onChange,
    control,
}: KeyablePropertyEditorProps<T>) => {
    const currentStepIsKeyed = keyableIsKeyedAtStep(value, stepId);
    const currentValue = keyableValueAtStep(value, sceneStepIds, stepId);

    return (
        <div className="flex flex-row items-center gap-2">
            <div className="text-sm text-gray-300">{label}</div>
            <DiamondIcon
                size={12}
                className="text-yellow-400 cursor-pointer"
                weight={currentStepIsKeyed ? 'fill' : 'regular'}
                onClick={() => {
                    if (currentStepIsKeyed) {
                        onChange(keyableWithUnkeyedStep(value, stepId));
                    } else {
                        onChange(keyableWithKeyedStep(value, sceneStepIds, stepId));
                    }
                }}
            />
            <div className="flex-grow" />
            {control({
                value: currentValue,
                onChange: (newValue) => {
                    onChange(keyableWithValueAtStep(value, newValue, sceneStepIds, stepId));
                },
            })}
        </div>
    );
};

interface KeyableEntityPropertyEditorProps<T> {
    entityId: string;
    label: string;
    sceneStepIds: string[];
    stepId: string;
    value: Keyable<T>;
    toPartial: (newValue: Keyable<T>) => PartialRaidEntityProperties;
    control: (props: PropertyControlProps<T>) => React.ReactNode;
}

const KeyableEntityPropertyEditor = <T,>({
    entityId,
    label,
    value,
    sceneStepIds,
    stepId,
    toPartial,
    control,
}: KeyableEntityPropertyEditorProps<T>) => {
    const dispatch = useDispatch();

    const update = (nextValue: Keyable<T>) => {
        const partial = toPartial(nextValue);
        dispatch.raids.updateEntity({ id: entityId, properties: partial });
    };

    return (
        <KeyablePropertyEditor
            label={label}
            value={value}
            sceneStepIds={sceneStepIds}
            stepId={stepId}
            onChange={update}
            control={control}
        />
    );
};

interface PropertySpecPropertyEditorProps {
    spec: PropertySpec;
    sceneStepIds: string[];
    stepId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (newValue: any) => void;
}

const PropertySpecPropertyEditor = ({
    onChange,
    spec,
    sceneStepIds,
    stepId,
    value,
}: PropertySpecPropertyEditorProps) => {
    const currentValue = value !== undefined ? value : spec.default;

    let control = null;
    switch (spec.type) {
        case 'boolean':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <Checkbox checked={value} onChange={onChange} />
            );
            break;
        case 'enum':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <Dropdown
                    selectedOptionKey={value}
                    onChange={(o) => onChange(o.key)}
                    options={spec.choices.map((c) => ({ key: c.value, label: c.label }))}
                />
            );
            break;
        case 'color':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <ColorInput value={value} onChange={onChange} />
            );
            break;
        default:
            control = () => null;
    }

    if (!spec.keyable) {
        return <UnkeyablePropertyEditor label={spec.name} value={currentValue} onChange={onChange} control={control} />;
    }

    return (
        <KeyablePropertyEditor
            label={spec.name}
            sceneStepIds={sceneStepIds}
            stepId={stepId}
            value={currentValue}
            onChange={onChange}
            control={control}
        />
    );
};

interface PropertySpecPropertyEditorsProps {
    specs: PropertySpec[];
    properties: AnyProperties;
    onChange: (newProperties: AnyProperties) => void;
    sceneStepIds: string[];
    stepId: string;
}

const PropertySpecPropertyEditors = ({
    onChange,
    specs,
    properties,
    sceneStepIds,
    stepId,
}: PropertySpecPropertyEditorsProps) => {
    return (
        <div className="flex flex-col gap-2">
            {specs.map((spec) => {
                const value = properties[spec.key];
                return (
                    <PropertySpecPropertyEditor
                        key={spec.key}
                        spec={spec}
                        value={value}
                        sceneStepIds={sceneStepIds}
                        stepId={stepId}
                        onChange={(newValue) => {
                            onChange({ ...properties, [spec.key]: newValue });
                        }}
                    />
                );
            })}
        </div>
    );
};

interface EffectEditorProps {
    entity: RaidEntity;
    index: number;
    sceneStepIds: string[];
    stepId: string;
}

const EffectEditor = ({ entity, index, sceneStepIds, stepId }: EffectEditorProps) => {
    const dispatch = useDispatch();

    const ep = entity.properties;
    if (ep.type !== 'shape' || !ep.effects || index >= ep.effects.length) {
        return null;
    }

    const effect = ep.effects[index];
    const visualEffectFactory = visualEffectFactories[effect.factoryId];
    if (!visualEffectFactory) {
        return null;
    }

    const deleteEffect = () => {
        if (ep.type === 'shape' && ep.effects) {
            const newEffects = ep.effects.filter((_, i) => i !== index);
            dispatch.raids.updateEntity({ id: entity.id, properties: { type: 'shape', effects: newEffects } });
        }
    };

    const updateEffectProperties = (newProperties: AnyProperties) => {
        if (ep.type === 'shape' && ep.effects) {
            const newEffects = ep.effects.map((e, i) => (i === index ? { ...e, properties: newProperties } : e));
            dispatch.raids.updateEntity({ id: entity.id, properties: { type: 'shape', effects: newEffects } });
        }
    };

    return (
        <div className="flex flex-col gap-2 border border-1 border-elevation-2 p-2 rounded">
            <div className="flex flex-row items-center gap-2">
                <div className="text-xs font-semibold">{visualEffectFactory.name}</div>
                <div className="flex-grow" />
                <button
                    className="subtle"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteEffect();
                    }}
                >
                    <TrashIcon size={16} />
                </button>
            </div>
            <PropertySpecPropertyEditors
                specs={visualEffectFactory.properties || []}
                properties={effect.properties}
                sceneStepIds={sceneStepIds}
                stepId={stepId}
                onChange={updateEffectProperties}
            />
        </div>
    );
};

interface Props {
    id: string;
}

export const EntityInspectorPanel = ({ id }: Props) => {
    const entity = useEntity(id);
    const raidId = entity?.raidId;
    const raidWorkspace = useRaidWorkspace(raidId || '');
    const scene = useScene(raidWorkspace?.openSceneId || '');
    const sceneWorkspace = useSceneWorkspace(scene?.id || '');
    const stepId = sceneWorkspace?.openStepId || '';
    const sceneStepIds = scene?.stepIds || [];
    const commands = useCommands();

    if (!entity) {
        return null;
    }

    const ep = entity.properties;

    const kpeProps = {
        entityId: entity.id,
        sceneStepIds,
        stepId,
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{entity.name}</div>
                {ep.type === 'shape' && (
                    <>
                        <KeyableEntityPropertyEditor
                            label="Position"
                            value={ep.position}
                            toPartial={(v) => ({ type: 'shape', position: v })}
                            control={CoordinateInput}
                            {...kpeProps}
                        />
                        <div className="flex flex-row items-center gap-2 py-2">
                            <div className="text-sm font-semibold">Effects</div>
                            <div className="flex-grow" />
                            <Button
                                icon={PlusIcon}
                                size="small"
                                onClick={() => {
                                    commands.addEntityEffect.execute();
                                }}
                            />
                        </div>
                        {ep.effects &&
                            ep.effects.map((_effect, idx) => (
                                <EffectEditor
                                    entity={entity}
                                    key={idx}
                                    index={idx}
                                    sceneStepIds={sceneStepIds}
                                    stepId={stepId}
                                />
                            ))}
                    </>
                )}
            </div>
        </div>
    );
};
