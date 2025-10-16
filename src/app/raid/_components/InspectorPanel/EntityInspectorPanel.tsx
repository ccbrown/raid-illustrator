import { DiamondIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useCallback } from 'react';

import {
    AngleInput,
    Button,
    Checkbox,
    CoordinateInput,
    Dropdown,
    NumberInput,
    RGBInput,
    StandaloneTextInput,
} from '@/components';
import { useEntity, useRaidWorkspace, useScene, useSceneWorkspace } from '@/hooks';
import {
    AnyProperties,
    Keyable,
    Material,
    PartialRaidEntityProperties,
    RaidEntity,
    RaidEntityUpdate,
    Shape,
} from '@/models/raids/types';
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
import { MaterialEditor } from './MaterialEditor';
import { ShapeEditor } from './ShapeEditor';

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
    const controlOnChange = useCallback(
        (newValue: T) => {
            onChange(keyableWithValueAtStep(value, newValue, sceneStepIds, stepId));
        },
        [onChange, value, sceneStepIds, stepId],
    );

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
                onChange: controlOnChange,
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
    toUpdate: (newValue: Keyable<T>) => Omit<RaidEntityUpdate, 'id'>;
    control: (props: PropertyControlProps<T>) => React.ReactNode;
}

const KeyableEntityPropertyEditor = <T,>({
    entityId,
    label,
    value,
    sceneStepIds,
    stepId,
    toUpdate,
    control,
}: KeyableEntityPropertyEditorProps<T>) => {
    const dispatch = useDispatch();

    const update = useCallback(
        (nextValue: Keyable<T>) => {
            const update = toUpdate(nextValue);
            dispatch.raids.updateEntity({ id: entityId, ...update });
        },
        [dispatch, entityId, toUpdate],
    );

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
        case 'angle':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <AngleInput value={value} onChange={onChange} />
            );
            break;
        case 'color':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <RGBInput value={value} onChange={onChange} />
            );
            break;
        case 'text':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control = ({ value, onChange }: PropertyControlProps<any>) => (
                <StandaloneTextInput value={value} onChange={onChange} />
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

interface PropertiesUpdate {
    properties: PartialRaidEntityProperties;
}

const toPositionUpdate = (v: Keyable<{ x: number; y: number }>): PropertiesUpdate => ({
    properties: {
        type: 'shape',
        position: v,
    },
});

const toRotationUpdate = (v: Keyable<number>): PropertiesUpdate => ({ properties: { type: 'shape', rotation: v } });

const toVisibleUpdate = (v: Keyable<boolean>): { visible: Keyable<boolean> } => ({ visible: v });

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

    const updateFill = (newFill?: Material) => {
        if (ep.type === 'shape') {
            dispatch.raids.updateEntity({
                id: entity.id,
                properties: {
                    type: 'shape',
                    fill: newFill,
                },
            });
        }
    };

    const kpeProps = {
        entityId: entity.id,
        sceneStepIds,
        stepId,
    };

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col h-full overflow-auto">
            <div className="flex flex-col gap-2 px-4">
                <div className="font-semibold">{entity.name}</div>
                <KeyableEntityPropertyEditor
                    label="Visible"
                    value={entity.visible ?? true}
                    toUpdate={toVisibleUpdate}
                    control={({ value, onChange }: PropertyControlProps<boolean>) => (
                        <Checkbox checked={value} onChange={onChange} />
                    )}
                    {...kpeProps}
                />
                {ep.type === 'shape' && (
                    <>
                        <ShapeEditor value={ep.shape} onChange={updateShape} />
                        <MaterialEditor
                            label="Fill"
                            value={ep.fill}
                            onChange={updateFill}
                            defaultColor={{
                                r: 150,
                                g: 150,
                                b: 150,
                                a: 1,
                            }}
                        />

                        <KeyableEntityPropertyEditor
                            label="Position"
                            value={ep.position}
                            toUpdate={toPositionUpdate}
                            control={CoordinateInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Rotation"
                            value={ep.rotation ?? 0}
                            toUpdate={toRotationUpdate}
                            control={AngleInput}
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
