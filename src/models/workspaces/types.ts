import { RaidBatchOperation, RaidEntityPropertiesShape } from '@/models/raids/types';

export interface WorkspacesState {
    raids: Record<string, RaidWorkspace>;
    scenes: Record<string, SceneWorkspace>;
}

export interface SceneWorkspace {
    id: string;
    raidId: string;

    openStepId?: string;

    expandedGroupIds?: string[];

    zoom?: number;
    center?: {
        x: number;
        y: number;
    };
}

export interface UndoRedoStackAction {
    name: string;
    operation: RaidBatchOperation;
}

export interface Selection {
    entityIds?: string[];
    sceneIds?: string[];
    stepIds?: string[];
}

export interface EntityPresetDragData {
    name: string;
    properties: RaidEntityPropertiesShape;
}

export interface RaidWorkspace {
    id: string;
    lastActivityTime: number;

    openSceneId?: string;
    entitiesPanelTab?: 'entities' | 'presets';
    selection?: Selection;
    entityPresetDragData?: EntityPresetDragData;

    undoStack?: UndoRedoStackAction[];
    redoStack?: UndoRedoStackAction[];
}

export interface PersistedRaidWorkspace {
    raid: RaidWorkspace;
    scenes: SceneWorkspace[];
}
