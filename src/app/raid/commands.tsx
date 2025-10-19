import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useState } from 'react';

import {
    useCopyEvents,
    useCutEvents,
    useEntity,
    useKeyDownEvents,
    useKeyPressEvents,
    usePasteEvents,
    useRaidWorkspace,
    useScene,
    useSceneWorkspace,
    useSelection,
} from '@/hooks';
import { selectParentByChildIds } from '@/models/raids/selectors';
import { Exports } from '@/models/raids/types';
import { Selection } from '@/models/workspaces/types';
import { useDispatch, useSelector } from '@/store';
import { visualEffectDataFromClipboardElement } from '@/visual-effect';

import { EffectSelectionDialog } from './_components/EffectSelectionDialog';
import { EntitySettingsDialog } from './_components/EntitySettingsDialog';
import { RenderDialog } from './_components/RenderDialog';
import { useRaidId } from './hooks';

export interface HotKey {
    key: string;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    control?: boolean;
}

export interface Command {
    name: string;
    disabled?: boolean;
    hotKey?: HotKey;
    fakeHotKey?: HotKey;
    additionalHotKeys?: HotKey[];
    execute: () => void;
}

interface Commands {
    close: Command;
    undo: Command;
    redo: Command;
    cut: Command;
    copy: Command;
    paste: Command;
    duplicate: Command;
    delete: Command;
    render: Command;
    zoomIn: Command;
    zoomOut: Command;
    newScene: Command;
    newStep: Command;
    openNextStep: Command;
    openPreviousStep: Command;
    newEntity: Command;
    addEntityEffect: Command;
    groupEntities: Command;
}

const findCommandByHotKey = (commands: Commands, hotKey: HotKey): Command | null => {
    for (const key in commands) {
        const command = commands[key as keyof Commands];
        if (command.hotKey) {
            const hk = command.hotKey;
            if (
                hk.key.toLowerCase() === hotKey.key.toLowerCase() &&
                !!hk.alt === !!hotKey.alt &&
                !!hk.shift === !!hotKey.shift &&
                !!hk.meta === !!hotKey.meta &&
                !!hk.control === !!hotKey.control
            ) {
                return command;
            }
        }
        for (const additionalHotKey of command.additionalHotKeys || []) {
            if (
                additionalHotKey.key.toLowerCase() === hotKey.key.toLowerCase() &&
                !!additionalHotKey.alt === !!hotKey.alt &&
                !!additionalHotKey.shift === !!hotKey.shift &&
                !!additionalHotKey.meta === !!hotKey.meta &&
                !!additionalHotKey.control === !!hotKey.control
            ) {
                return command;
            }
        }
    }
    return null;
};

const CommandsContext = createContext<Commands | null>(null);

interface CommandProviderProps {
    children: React.ReactNode;
}

const shouldUseMacLikeHotKeys = () => window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const CommandsProvider = (props: CommandProviderProps) => {
    const raidId = useRaidId();
    const router = useRouter();
    const dispatch = useDispatch();
    const useMacLikeHotKeys = shouldUseMacLikeHotKeys();
    const raidWorkspace = useRaidWorkspace(raidId || '');

    const sceneId = raidWorkspace?.openSceneId;
    const scene = useScene(sceneId || '');
    const sceneWorkspace = useSceneWorkspace(sceneId || '');
    const selection = useSelection(raidId || '');
    const selectedEntity = useEntity(selection?.entityIds?.[0] || '');

    const [newEntityDialogOpen, setNewEntityDialogOpen] = useState(false);
    const [effectSelectionDialogOpen, setEffectSelectionDialogOpen] = useState(false);
    const [renderDialogOpen, setRenderDialogOpen] = useState(false);

    const undoAction = raidWorkspace?.undoStack?.slice(-1)[0];
    const redoAction = raidWorkspace?.redoStack?.slice(-1)[0];

    const openStepIndex = scene?.stepIds.indexOf(sceneWorkspace?.openStepId || '');
    const nextStepId = scene?.stepIds[openStepIndex === undefined ? 0 : openStepIndex + 1];
    const previousStepId = scene?.stepIds[openStepIndex === undefined ? scene?.stepIds.length - 1 : openStepIndex - 1];
    const selectedEntitiesHaveCommonParent = useSelector(
        (state) => !!selectParentByChildIds(state.raids, selection?.entityIds || []),
    );

    const writeClipboard = useCallback((e: ClipboardEvent | undefined, data: Exports) => {
        const serializedData = btoa(JSON.stringify(data));
        const clipboardItem = new ClipboardItem({
            ['text/html']: `<div id="raid-illustrator-clipboard" data-raid-illustrator="${serializedData}">Raid Illustrator Clipping</div>`,
        });
        navigator.clipboard.write([clipboardItem]);
        e?.preventDefault();
    }, []);

    const copy = useCallback(
        (e?: ClipboardEvent) => {
            if (selection) {
                const data = dispatch.raids.copy(selection);
                writeClipboard(e, data);
            }
        },
        [dispatch, selection, writeClipboard],
    );

    const cut = useCallback(
        (e?: ClipboardEvent) => {
            if (selection) {
                const data = dispatch.raids.cut(selection);
                writeClipboard(e, data);
            }
        },
        [dispatch, selection, writeClipboard],
    );

    const paste = useCallback(
        async (e?: ClipboardEvent) => {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                if (item.types.includes('text/html')) {
                    const blob = await item.getType('text/html');
                    const text = await blob.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const div = doc.getElementById('raid-illustrator-clipboard');
                    if (div) {
                        const effects = visualEffectDataFromClipboardElement(div);
                        if (effects) {
                            if (selection?.entityIds?.length) {
                                // apply the visual effects to the entities
                                for (const id of selection.entityIds) {
                                    dispatch.raids.addEffects({
                                        entityId: id,
                                        effects,
                                    });
                                }
                            }
                        } else {
                            const serializedData = div.getAttribute('data-raid-illustrator');
                            if (raidId && serializedData) {
                                const data: Exports = JSON.parse(atob(serializedData));
                                const pastedIds = dispatch.raids.paste({
                                    raidId,
                                    sceneId,
                                    data,
                                });
                                if (pastedIds.sceneIds.length > 0) {
                                    // switch to one of the new scenes
                                    dispatch.workspaces.openScene({ id: pastedIds.sceneIds[0], raidId });
                                } else if (sceneId && pastedIds.stepIds.length > 0) {
                                    // switch to one of the new steps
                                    dispatch.workspaces.openStep({ id: pastedIds.stepIds[0], sceneId });
                                }
                                // select the pasted items
                                dispatch.workspaces.select({
                                    raidId,
                                    selection: {
                                        sceneIds: pastedIds.sceneIds,
                                        stepIds: pastedIds.stepIds,
                                        entityIds: pastedIds.entityIds,
                                    },
                                });
                            }
                        }
                        e?.preventDefault();
                    }
                }
            }
        },
        [dispatch, raidId, sceneId, selection],
    );

    const hotKeyBase = useMacLikeHotKeys
        ? {
              meta: true,
          }
        : {
              control: true,
          };

    const commands: Commands = {
        close: {
            name: 'Close',
            execute: () => {
                router.push('/');
            },
        },
        undo: {
            name: `Undo ${undoAction?.name || ''}`,
            disabled: !undoAction,
            hotKey: {
                ...hotKeyBase,
                key: 'z',
            },
            execute: () => {
                if (raidId) {
                    dispatch.workspaces.undo({ raidId });
                }
            },
        },
        redo: {
            name: `Redo ${redoAction?.name || ''}`,
            disabled: !redoAction,
            hotKey: useMacLikeHotKeys
                ? {
                      ...hotKeyBase,
                      key: 'z',
                      shift: true,
                  }
                : {
                      ...hotKeyBase,
                      key: 'y',
                  },
            execute: () => {
                if (raidId) {
                    dispatch.workspaces.redo({ raidId });
                }
            },
        },
        cut: {
            name: 'Cut',
            disabled: !selection?.entityIds?.length && !selection?.stepIds?.length && !selection?.sceneIds?.length,
            fakeHotKey: {
                ...hotKeyBase,
                key: 'x',
            },
            execute: cut,
        },
        copy: {
            name: 'Copy',
            disabled: !selection?.entityIds?.length && !selection?.stepIds?.length && !selection?.sceneIds?.length,
            fakeHotKey: {
                ...hotKeyBase,
                key: 'c',
            },
            execute: copy,
        },
        paste: {
            name: 'Paste',
            disabled: !raidId,
            fakeHotKey: {
                ...hotKeyBase,
                key: 'v',
            },
            execute: paste,
        },
        duplicate: {
            name: 'Duplicate',
            disabled: !selection?.entityIds?.length && !selection?.stepIds?.length && !selection?.sceneIds?.length,
            hotKey: {
                ...hotKeyBase,
                key: 'd',
            },
            execute: () => {
                const newSelection: Selection = {};
                if (selection?.entityIds?.length) {
                    newSelection.entityIds = dispatch.raids.duplicateEntities({ ids: selection.entityIds });
                }
                if (selection?.stepIds?.length) {
                    newSelection.stepIds = dispatch.raids.duplicateSteps({ ids: selection.stepIds });
                }
                if (selection?.sceneIds?.length) {
                    newSelection.sceneIds = dispatch.raids.duplicateScenes({ ids: selection.sceneIds });
                }
                dispatch.workspaces.select({ raidId: raidId || '', selection: newSelection });
            },
        },
        delete: {
            name: 'Delete',
            disabled: !selection?.entityIds?.length && !selection?.stepIds?.length && !selection?.sceneIds?.length,
            hotKey: {
                key: 'Backspace',
            },
            additionalHotKeys: [
                {
                    ...hotKeyBase,
                    key: 'Backspace',
                },
            ],
            execute: () => {
                dispatch.raids.deleteEntities({ ids: selection?.entityIds || [] });
                dispatch.raids.deleteSteps({ ids: selection?.stepIds || [] });
                dispatch.raids.deleteScenes({ ids: selection?.sceneIds || [] });
            },
        },
        newScene: {
            name: 'New Scene',
            disabled: !raidId,
            execute: () => {
                if (raidId) {
                    const newScene = dispatch.raids.createScene({
                        raidId,
                        name: 'New Scene',
                        shape: scene
                            ? scene.shape
                            : {
                                  type: 'rectangle',
                                  width: 40,
                                  height: 40,
                              },
                        fill: scene
                            ? scene.fill
                            : {
                                  type: 'color',
                                  color: {
                                      r: 40,
                                      g: 42,
                                      b: 54,
                                      a: 1,
                                  },
                              },
                        afterSceneId: raidWorkspace?.openSceneId,
                    });
                    dispatch.workspaces.openScene({ id: newScene.id, raidId });
                    if (newScene.stepIds[0]) {
                        dispatch.workspaces.openStep({ sceneId: newScene.id, id: newScene.stepIds[0] });
                    }
                    dispatch.workspaces.select({ raidId, selection: { sceneIds: [newScene.id] } });
                }
            },
        },
        newStep: {
            name: 'New Step',
            disabled: !sceneId,
            hotKey: {
                key: 'n',
                shift: true,
            },
            execute: () => {
                if (raidId && sceneId) {
                    const id = dispatch.raids.createStep({
                        raidId,
                        sceneId,
                        name: 'New Step',
                        afterStepId: sceneWorkspace?.openStepId,
                    });
                    dispatch.workspaces.openStep({ id, sceneId });
                    dispatch.workspaces.select({ raidId, selection: { stepIds: [id] } });
                }
            },
        },
        openNextStep: {
            name: 'Next Step',
            disabled: !nextStepId,
            hotKey: {
                key: 'ArrowRight',
            },
            execute: () => {
                if (raidId && sceneId && nextStepId) {
                    dispatch.workspaces.openStep({ sceneId, id: nextStepId });
                }
            },
        },
        openPreviousStep: {
            name: 'Previous Step',
            disabled: !previousStepId,
            hotKey: {
                key: 'ArrowLeft',
            },
            execute: () => {
                if (raidId && sceneId && previousStepId) {
                    dispatch.workspaces.openStep({ sceneId, id: previousStepId });
                }
            },
        },
        newEntity: {
            name: 'New Entity',
            disabled: !sceneId,
            execute: () => {
                setNewEntityDialogOpen(true);
            },
        },
        addEntityEffect: {
            name: 'Add Effect',
            disabled: !selectedEntity || selectedEntity.properties.type !== 'shape',
            execute: () => {
                setEffectSelectionDialogOpen(true);
            },
        },
        groupEntities: {
            name: 'Group Entities',
            disabled: (selection?.entityIds?.length || 0) < 2 || !selectedEntitiesHaveCommonParent,
            hotKey: {
                ...hotKeyBase,
                key: 'g',
            },
            execute: () => {
                dispatch.raids.groupEntities({ entityIds: selection?.entityIds || [] });
            },
        },
        render: {
            name: 'Render',
            disabled: !sceneId,
            hotKey: {
                key: 'Enter',
                shift: true,
            },
            execute: () => {
                setRenderDialogOpen(true);
            },
        },
        zoomIn: {
            name: 'Zoom In',
            disabled: !sceneWorkspace || (sceneWorkspace.zoom || 1) >= 4,
            hotKey: {
                ...hotKeyBase,
                key: '+',
            },
            additionalHotKeys: [
                {
                    ...hotKeyBase,
                    key: '=',
                },
                {
                    ...hotKeyBase,
                    key: '=',
                    shift: true,
                },
            ],
            execute: () => {
                if (sceneWorkspace) {
                    const newZoom = Math.min((sceneWorkspace.zoom || 1) * 1.2, 4);
                    dispatch.workspaces.updateScene({ id: sceneWorkspace.id, zoom: newZoom });
                }
            },
        },
        zoomOut: {
            name: 'Zoom Out',
            disabled: !sceneWorkspace || (sceneWorkspace.zoom || 1) <= 0.1,
            hotKey: {
                ...hotKeyBase,
                key: '-',
            },
            additionalHotKeys: [
                {
                    ...hotKeyBase,
                    key: '-',
                    shift: true,
                },
            ],
            execute: () => {
                if (sceneWorkspace) {
                    const newZoom = Math.max((sceneWorkspace.zoom || 1) / 1.2, 0.1);
                    dispatch.workspaces.updateScene({ id: sceneWorkspace.id, zoom: newZoom });
                }
            },
        },
    };

    const handleKeyEvent = (e: KeyboardEvent) => {
        const command = findCommandByHotKey(commands, {
            key: e.key,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            control: e.ctrlKey,
        });
        if (!command) {
            return;
        }

        // don't steal the key press if we're focused on an input
        const target = e.target as HTMLElement;
        const targetTagName = target.tagName?.toLowerCase();
        if (targetTagName === 'input' || targetTagName === 'textarea' || target.isContentEditable) {
            return;
        }

        e.preventDefault();

        if (!command.disabled) {
            command.execute();
        }
    };

    const KEY_DOWN_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    useKeyPressEvents((e) => {
        if (!KEY_DOWN_KEYS.includes(e.key)) {
            handleKeyEvent(e);
        }
    });

    useKeyDownEvents((e) => {
        if (KEY_DOWN_KEYS.includes(e.key)) {
            handleKeyEvent(e);
        }
    });

    useCutEvents(cut);
    useCopyEvents(copy);
    usePasteEvents(paste);

    return (
        <CommandsContext.Provider value={commands}>
            {raidId && sceneId && (
                <EntitySettingsDialog
                    isOpen={newEntityDialogOpen}
                    onClose={() => setNewEntityDialogOpen(false)}
                    raidId={raidId}
                    sceneId={sceneId}
                />
            )}

            {selectedEntity && (
                <EffectSelectionDialog
                    isOpen={effectSelectionDialogOpen}
                    onClose={() => setEffectSelectionDialogOpen(false)}
                    entity={selectedEntity}
                />
            )}

            {sceneId && (
                <RenderDialog isOpen={renderDialogOpen} onClose={() => setRenderDialogOpen(false)} sceneId={sceneId} />
            )}

            {props.children}
        </CommandsContext.Provider>
    );
};

export const useCommands = () => {
    const context = useContext(CommandsContext);
    if (!context) {
        throw new Error('useCommands must be used within a CommandProvider');
    }
    return context;
};
