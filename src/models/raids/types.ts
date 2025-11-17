export interface RaidsState {
    metadata: Record<string, RaidMetadata>;
    scenes: Record<string, RaidScene>;
    steps: Record<string, RaidStep>;
    entities: Record<string, RaidEntity>;
}

export interface ShapeRectangle {
    type: 'rectangle';
    width: number;
    height: number;
    fixedAspectRatio?: boolean;
}

export interface ShapeCircle {
    type: 'circle';
    radius: number;
}

export type Shape = ShapeRectangle | ShapeCircle;

export interface RaidMetadata {
    id: string;
    name: string;
    creationTime: number;

    sceneIds: string[];
}

export type RaidSceneShape = ShapeRectangle | ShapeCircle;

export interface RaidScene {
    id: string;
    raidId: string;

    name: string;
    shape: RaidSceneShape;
    fill?: Material;

    stepIds: string[];
    entityIds: string[];
}

export interface RaidStep {
    id: string;
    raidId: string;
    sceneId: string;

    name: string;
    renderDuration?: number;
}

interface RaidEntityPropertiesGroup {
    type: 'group';
    children: string[];
}

export interface RaidEntityPropertiesText {
    type: 'text';
    shape: ShapeRectangle;
    position: Keyable<{ x: number; y: number }>;
    rotation?: Keyable<number>;
    content: Keyable<string>;
    color: Keyable<{ r: number; g: number; b: number; a: number }>;
    outlineColor: Keyable<{ r: number; g: number; b: number; a: number }>;
    outlineThickness: Keyable<number>;
    fontSize: Keyable<number>;
    horizontalAlignment: Keyable<'left' | 'center' | 'right'>;
    verticalAlignment: Keyable<'top' | 'middle' | 'bottom'>;
}

interface RaidEntityPropertiesShapeEffect {
    id: string;
    factoryId: string;
    properties: AnyProperties;
}

export interface RaidEntityPropertiesShape {
    type: 'shape';
    shape: Shape;
    fill?: Material;
    rotation?: Keyable<number>;
    position: Keyable<{ x: number; y: number }>;
    effects?: RaidEntityPropertiesShapeEffect[];
}

export type RaidEntityType = 'group' | 'shape' | 'text';
export type RaidEntityProperties = RaidEntityPropertiesGroup | RaidEntityPropertiesShape | RaidEntityPropertiesText;

type PartialRaidEntityPropertiesGroup = Partial<Omit<RaidEntityPropertiesGroup, 'type'>> &
    Pick<RaidEntityPropertiesGroup, 'type'>;
type PartialRaidEntityPropertiesShape = Partial<Omit<RaidEntityPropertiesShape, 'type'>> &
    Pick<RaidEntityPropertiesShape, 'type'>;
type PartialRaidEntityPropertiesText = Partial<Omit<RaidEntityPropertiesText, 'type'>> &
    Pick<RaidEntityPropertiesText, 'type'>;
export type PartialRaidEntityProperties =
    | PartialRaidEntityPropertiesGroup
    | PartialRaidEntityPropertiesShape
    | PartialRaidEntityPropertiesText;

export interface RaidEntityUpdate {
    id: string;
    name?: string;
    visible?: Keyable<boolean>;
    properties?: PartialRaidEntityProperties;
}

export interface RaidEntity {
    id: string;
    raidId: string;
    sceneId: string;

    name: string;

    // Defaults to true if not set.
    visible?: Keyable<boolean>;

    properties: RaidEntityProperties;
}

export interface RaidBatchOperation {
    putMetadata?: RaidMetadata;
    putScenes?: RaidScene[];
    removeScenes?: string[];
    putSteps?: RaidStep[];
    removeSteps?: string[];
    putEntities?: RaidEntity[];
    removeEntities?: string[];
}

export interface Keyed<T> {
    initial: T;
    steps: Record<string, T>;
}

export type Keyable<T> = T | Keyed<T>;

export type ResolvedKeyables<T> = {
    [P in keyof T]: T[P] extends Keyable<infer U> ? U : T[P];
};

interface ColorMaterial {
    type: 'color';
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
}

interface ImageMaterial {
    type: 'image';
    url: string;
}

export type Material = ColorMaterial | ImageMaterial;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProperties = { [key: string]: any };

export interface RaidSceneExport {
    scene: RaidScene;
    steps: RaidStep[];
    entities: RaidEntity[];
}

export interface RaidStepExport {
    step: RaidStep;
}

export interface RaidEntityExport {
    id: string;
    entities: RaidEntity[];
}

export interface Exports {
    scenes?: RaidSceneExport[];
    steps?: RaidStepExport[];
    entities?: RaidEntityExport[];
}

export interface PersistedRaid {
    metadata: RaidMetadata;
    scenes: RaidScene[];
    steps: RaidStep[];
    entities: RaidEntity[];
}
