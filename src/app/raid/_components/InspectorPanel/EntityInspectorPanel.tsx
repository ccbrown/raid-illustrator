import { DiamondIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import {
    Button,
    Checkbox,
    CoordinateInput,
    Dropdown,
    NumberInput,
    RGBAInput,
    RGBInput,
    StandaloneTextInput,
} from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSceneWorkspace } from '@/hooks';
import { AnyProperties, Keyable, PartialRaidEntityProperties, RaidEntity, Shape } from '@/models/raids/types';
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
        case 'number':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <NumberInput value={value} onChange={onChange} />
            );
            break;
        case 'color':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <RGBInput value={value} onChange={onChange} />
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
    const dispatch = useDispatch();

    if (!entity) {
        return null;
    }

    const ep = entity.properties;

    const updateShape = (newShape: Shape) => {
        if (ep.type === 'shape') {
            dispatch.raids.updateEntity({ id: entity.id, properties: { type: 'shape', shape: newShape } });
        }
    };

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
                        <div className="flex flex-row gap-2">
                            <Dropdown
                                options={[
                                    { label: 'Circle', key: 'circle' },
                                    { label: 'Rectangle', key: 'rectangle' },
                                ]}
                                label="Shape"
                                selectedOptionKey={ep.shape.type}
                                onChange={(option) => {
                                    switch (ep.shape.type) {
                                        case 'rectangle':
                                            switch (option.key) {
                                                case 'circle':
                                                    // use the smaller of the width or height as the radius
                                                    const radius = Math.min(ep.shape.width, ep.shape.height) / 2;
                                                    updateShape({ type: 'circle', radius });
                                                    return;
                                            }
                                            return;
                                        case 'circle':
                                            switch (option.key) {
                                                case 'rectangle':
                                                    // use the diameter as both width and height
                                                    const diameter = ep.shape.radius * 2;
                                                    updateShape({
                                                        type: 'rectangle',
                                                        width: diameter,
                                                        height: diameter,
                                                    });
                                                    return;
                                            }
                                            return;
                                    }
                                }}
                            />
                            <div className="flex-grow" />
                            {ep.shape.type === 'rectangle' ? (
                                <>
                                    <NumberInput
                                        label="Width (m)"
                                        min={1}
                                        value={ep.shape.width}
                                        onChange={(w) => {
                                            if (ep.shape.type === 'rectangle') {
                                                updateShape({ ...ep.shape, width: w });
                                            }
                                        }}
                                    />
                                    <NumberInput
                                        label="Height (m)"
                                        min={1}
                                        value={ep.shape.height}
                                        onChange={(h) => {
                                            if (ep.shape.type === 'rectangle') {
                                                updateShape({ ...ep.shape, height: h });
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                <NumberInput
                                    label="Radius (m)"
                                    min={1}
                                    value={ep.shape.radius}
                                    onChange={(r) => {
                                        if (ep.shape.type === 'circle') {
                                            updateShape({ ...ep.shape, radius: r });
                                        }
                                    }}
                                />
                            )}
                        </div>

                        <div className="flex flex-row gap-2 items-center">
                            <Dropdown
                                options={[
                                    { label: 'None', key: 'none' },
                                    { label: 'Color', key: 'color' },
                                    { label: 'Image', key: 'image' },
                                ]}
                                label="Fill"
                                selectedOptionKey={ep.fill?.type ?? 'none'}
                                onChange={(option) => {
                                    switch (option.key) {
                                        case 'none':
                                            dispatch.raids.updateEntity({
                                                id: entity.id,
                                                properties: { type: 'shape', fill: undefined },
                                            });
                                            return;
                                        case 'color':
                                            dispatch.raids.updateEntity({
                                                id: entity.id,
                                                properties: {
                                                    type: 'shape',
                                                    fill: { type: 'color', color: { r: 255, g: 255, b: 255, a: 1 } },
                                                },
                                            });
                                            return;
                                        case 'image':
                                            dispatch.raids.updateEntity({
                                                id: entity.id,
                                                properties: { type: 'shape', fill: { type: 'image', url: '' } },
                                            });
                                            return;
                                    }
                                }}
                            />

                            {ep.fill?.type === 'color' && (
                                <RGBAInput
                                    value={ep.fill.color}
                                    onChange={(c) => {
                                        if (ep.fill?.type === 'color') {
                                            dispatch.raids.updateEntity({
                                                id: entity.id,
                                                properties: { type: 'shape', fill: { type: 'color', color: c } },
                                            });
                                        }
                                    }}
                                />
                            )}

                            {ep.fill?.type === 'image' && (
                                <StandaloneTextInput
                                    className="flex-grow"
                                    value={ep.fill.url}
                                    onChange={(url) => {
                                        if (ep.fill?.type === 'image') {
                                            dispatch.raids.updateEntity({
                                                id: entity.id,
                                                properties: { type: 'shape', fill: { type: 'image', url } },
                                            });
                                        }
                                    }}
                                />
                            )}
                        </div>

                        <KeyableEntityPropertyEditor
                            label="Position"
                            value={ep.position}
                            toPartial={(v) => ({ type: 'shape', position: v })}
                            control={CoordinateInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Rotation"
                            value={ep.rotation ?? 0}
                            toPartial={(v) => ({ type: 'shape', rotation: v })}
                            control={NumberInput}
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
