import { ClipboardIcon, CopyIcon, DiamondIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useCallback } from 'react';

import {
    AngleInput,
    Button,
    Checkbox,
    CoordinateInput,
    Dropdown,
    MultilineTextInput,
    NumberInput,
    RGBAInput,
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
    keyableIsKeyed,
    keyableIsKeyedAtStep,
    keyableValueAtStep,
    keyableWithKeyedStep,
    keyableWithUnkeyedStep,
    keyableWithValueAtStep,
} from '@/models/raids/utils';
import { PropertySpec } from '@/property-spec';
import { useDispatch } from '@/store';
import { readVisualEffectFromClipboard, writeVisualEffectToClipboard } from '@/visual-effect';
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
                className={`${keyableIsKeyed(value) ? 'text-yellow-400' : 'text-white/40'} cursor-pointer`}
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
    value?: unknown;
    onChange: (newValue: unknown) => void;
}

const PropertySpecPropertyEditor = ({
    onChange,
    spec,
    sceneStepIds,
    stepId,
    value,
}: PropertySpecPropertyEditorProps) => {
    const currentValue: unknown = value !== undefined ? value : spec.default;

    let control = null;
    switch (spec.type) {
        case 'boolean':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <Checkbox checked={value as boolean} onChange={onChange} />
            );
            break;
        case 'enum':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <Dropdown
                    selectedOptionKey={value as string}
                    onChange={(o) => onChange(o.key)}
                    options={spec.choices.map((c) => ({ key: c.value, label: c.label }))}
                />
            );
            break;
        case 'number':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <NumberInput value={value as number} onChange={onChange} />
            );
            break;
        case 'angle':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <AngleInput value={value as number} onChange={onChange} />
            );
            break;
        case 'color':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <RGBInput value={value as { r: number; g: number; b: number }} onChange={onChange} />
            );
            break;
        case 'coordinate':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <CoordinateInput value={value as { x: number; y: number }} onChange={onChange} />
            );
            break;
        case 'text':
            control = ({ value, onChange }: PropertyControlProps<unknown>) => (
                <StandaloneTextInput value={value as string} onChange={onChange} />
            );
            break;
        case 'array':
            return (
                <>
                    <div className="flex flex-row items-center gap-2">
                        <div className="text-sm text-gray-300">{spec.name}</div>
                        <div className="flex-grow" />
                        <Button
                            icon={PlusIcon}
                            size="extra-small"
                            onClick={() => {
                                const newItem: AnyProperties = {};
                                for (const itemSpec of spec.itemProperties) {
                                    newItem[itemSpec.key] = itemSpec.default;
                                }
                                onChange([...(currentValue as AnyProperties[]), newItem]);
                            }}
                            title="Add Effect"
                        />
                    </div>
                    {(currentValue as AnyProperties[]).map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 border border-1 border-elevation-2 p-2 rounded">
                            <div className="flex flex-row items-center gap-2">
                                <div className="text-xs font-semibold">Item {index + 1}</div>
                                <div className="flex-grow" />
                                <button
                                    className="subtle"
                                    onClick={() => {
                                        const newArray = (currentValue as AnyProperties[]).filter(
                                            (_, i) => i !== index,
                                        );
                                        onChange(newArray);
                                    }}
                                >
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                            <PropertySpecPropertyEditors
                                specs={spec.itemProperties}
                                properties={item}
                                sceneStepIds={sceneStepIds}
                                stepId={stepId}
                                onChange={(newProperties) => {
                                    const newArray = (currentValue as AnyProperties[]).map((p, i) =>
                                        i === index ? newProperties : p,
                                    );
                                    onChange(newArray);
                                }}
                            />
                        </div>
                    ))}
                </>
            );
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
                        writeVisualEffectToClipboard([{ factoryId: effect.factoryId, properties: effect.properties }]);
                    }}
                >
                    <CopyIcon size={16} />
                </button>
                <button
                    className="subtle"
                    onClick={(e) => {
                        e.stopPropagation();
                        const pasteEffect = async () => {
                            const data = await readVisualEffectFromClipboard();
                            if (!data) {
                                alert('No effect data found in clipboard.');
                                return;
                            }
                            for (const effectData of data) {
                                if (effectData.factoryId === effect.factoryId) {
                                    updateEffectProperties(effectData.properties);
                                    return;
                                }
                            }
                            alert('No matching effect data found in clipboard.');
                        };
                        pasteEffect();
                    }}
                >
                    <ClipboardIcon size={16} />
                </button>
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

const toShapePositionUpdate = (v: Keyable<{ x: number; y: number }>): PropertiesUpdate => ({
    properties: {
        type: 'shape',
        position: v,
    },
});
const toShapeRotationUpdate = (v: Keyable<number>): PropertiesUpdate => ({
    properties: { type: 'shape', rotation: v },
});
const toTextPositionUpdate = (v: Keyable<{ x: number; y: number }>): PropertiesUpdate => ({
    properties: {
        type: 'text',
        position: v,
    },
});
const toTextRotationUpdate = (v: Keyable<number>): PropertiesUpdate => ({ properties: { type: 'text', rotation: v } });
const toTextContentUpdate = (v: Keyable<string>): PropertiesUpdate => ({ properties: { type: 'text', content: v } });
const toTextHorizontalAlignmentUpdate = (v: Keyable<'left' | 'center' | 'right'>): PropertiesUpdate => ({
    properties: { type: 'text', horizontalAlignment: v },
});
const toTextVerticalAlignmentUpdate = (v: Keyable<'top' | 'middle' | 'bottom'>): PropertiesUpdate => ({
    properties: { type: 'text', verticalAlignment: v },
});
const toTextFontSizeUpdate = (v: Keyable<number>): PropertiesUpdate => ({
    properties: { type: 'text', fontSize: v },
});
const toTextColorUpdate = (v: Keyable<{ r: number; g: number; b: number; a: number }>): PropertiesUpdate => ({
    properties: { type: 'text', color: v },
});
const toTextOutlineColorUpdate = (v: Keyable<{ r: number; g: number; b: number; a: number }>): PropertiesUpdate => ({
    properties: { type: 'text', outlineColor: v },
});
const toTextOutlineThicknessUpdate = (v: Keyable<number>): PropertiesUpdate => ({
    properties: { type: 'text', outlineThickness: v },
});

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

    // We explicitly key the outer div with entity.id to ensure that no state is preserved when
    // switching between entities.
    const key = entity.id;

    return (
        <div className="bg-elevation-1 rounded-lg shadow-lg py-2 flex flex-col h-full overflow-auto" key={key}>
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
                {ep.type === 'text' && (
                    <>
                        <KeyableEntityPropertyEditor
                            label="Position"
                            value={ep.position}
                            toUpdate={toTextPositionUpdate}
                            control={CoordinateInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Rotation"
                            value={ep.rotation ?? 0}
                            toUpdate={toTextRotationUpdate}
                            control={AngleInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Content"
                            value={ep.content}
                            toUpdate={toTextContentUpdate}
                            control={(props) => <MultilineTextInput {...props} className="grow" />}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Font Size"
                            value={ep.fontSize}
                            toUpdate={toTextFontSizeUpdate}
                            control={NumberInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Color"
                            value={ep.color}
                            toUpdate={toTextColorUpdate}
                            control={RGBAInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Horizontal Alignment"
                            value={ep.horizontalAlignment}
                            toUpdate={toTextHorizontalAlignmentUpdate}
                            control={({ value, onChange }: PropertyControlProps<'left' | 'center' | 'right'>) => (
                                <Dropdown
                                    selectedOptionKey={value}
                                    onChange={(o) => onChange(o.key as 'left' | 'center' | 'right')}
                                    options={[
                                        { key: 'left', label: 'Left' },
                                        { key: 'center', label: 'Center' },
                                        { key: 'right', label: 'Right' },
                                    ]}
                                />
                            )}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Vertical Alignment"
                            value={ep.verticalAlignment}
                            toUpdate={toTextVerticalAlignmentUpdate}
                            control={({ value, onChange }: PropertyControlProps<'top' | 'middle' | 'bottom'>) => (
                                <Dropdown
                                    selectedOptionKey={value}
                                    onChange={(o) => onChange(o.key as 'top' | 'middle' | 'bottom')}
                                    options={[
                                        { key: 'top', label: 'Top' },
                                        { key: 'middle', label: 'Middle' },
                                        { key: 'bottom', label: 'Bottom' },
                                    ]}
                                />
                            )}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Outline Thickness"
                            value={ep.outlineThickness}
                            toUpdate={toTextOutlineThicknessUpdate}
                            control={NumberInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Outline Color"
                            value={ep.outlineColor}
                            toUpdate={toTextOutlineColorUpdate}
                            control={RGBAInput}
                            {...kpeProps}
                        />
                    </>
                )}
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
                            toUpdate={toShapePositionUpdate}
                            control={CoordinateInput}
                            {...kpeProps}
                        />
                        <KeyableEntityPropertyEditor
                            label="Rotation"
                            value={ep.rotation ?? 0}
                            toUpdate={toShapeRotationUpdate}
                            control={AngleInput}
                            {...kpeProps}
                        />
                        <div className="flex flex-row items-center gap-2 py-2">
                            <div className="text-sm font-semibold">Effects</div>
                            <div className="flex-grow" />
                            <Button
                                icon={CopyIcon}
                                size="small"
                                onClick={() => {
                                    if (ep.effects && ep.effects.length > 0) {
                                        const data = ep.effects.map((effect) => ({
                                            factoryId: effect.factoryId,
                                            properties: effect.properties,
                                        }));
                                        writeVisualEffectToClipboard(data);
                                    }
                                }}
                                title="Copy Effects to Clipboard"
                            />
                            <Button
                                icon={ClipboardIcon}
                                size="small"
                                onClick={() => {
                                    const pasteEffects = async () => {
                                        const data = await readVisualEffectFromClipboard();
                                        if (!data) {
                                            alert('No effect data found in clipboard.');
                                            return;
                                        }
                                        dispatch.raids.addEffects({
                                            entityId: entity.id,
                                            effects: data,
                                        });
                                    };
                                    pasteEffects();
                                }}
                                title="Paste Effects from Clipboard"
                            />
                            <Button
                                icon={PlusIcon}
                                size="small"
                                onClick={() => {
                                    commands.addEntityEffect.execute();
                                }}
                                title="Add Effect"
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
