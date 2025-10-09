'use client';

import { ArrowUUpRightIcon, ArrowUUpLeftIcon, Icon, XIcon } from '@phosphor-icons/react';
import { Menubar as PrimeMenuBar } from 'primereact/menubar';
import { MenuItem as PrimeMenuItem } from 'primereact/menuitem';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

import { disablePasswordManagers } from '@/components/TextField';
import { useHashParam, useKeyPressEvents } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

interface HotKey {
    key: string;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    control?: boolean;
}

interface MenuItem extends PrimeMenuItem {
    icon?: Icon;
    hotKey?: {
        key: string;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
        control?: boolean;
    };
}

interface TopLevelMenuItem extends MenuItem {
    items: MenuItem[];
}

const findMenuItemByHotKey = (items: MenuItem[] | MenuItem[][], hotKey: HotKey): MenuItem | null => {
    for (const item of items) {
        if (Array.isArray(item)) {
            const found = findMenuItemByHotKey(item, hotKey);
            if (found) {
                return found;
            }
        } else {
            if (item.hotKey) {
                const matches =
                    item.hotKey.key.toLowerCase() === hotKey.key.toLowerCase() &&
                    !!item.hotKey.alt === !!hotKey.alt &&
                    !!item.hotKey.shift === !!hotKey.shift &&
                    !!item.hotKey.meta === !!hotKey.meta &&
                    !!item.hotKey.control === !!hotKey.control;
                if (matches) {
                    return item;
                }
            }
            if (item.items) {
                const found = findMenuItemByHotKey(item.items, hotKey);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
};

const shouldUseMacLikeHotKeys = () => window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const menuItemRenderer = (item: MenuItem) => {
    return (
        <div className="flex flex-row relative p-2 items-center gap-2">
            {item.icon && <item.icon size={16} className="inline-block" />}
            <div className="text-sm whitespace-nowrap">{item.label}</div>
            <div className="flex-grow" />
            {item.hotKey && (
                <div className="ml-4 text-xs text-white/50">
                    {item.hotKey.control ? '⌃' : ''}
                    {item.hotKey.alt ? '⌥' : ''}
                    {item.hotKey.shift ? '⇧' : ''}
                    {item.hotKey.meta ? '⌘' : ''}
                    {item.hotKey.key.toUpperCase()}
                </div>
            )}
        </div>
    );
};

export const MenuBar = () => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const raidId = useHashParam('id');
    const raid = useSelector((state) => state.raids.metadata[raidId || '']);
    const raidWorkspace = useSelector((state) => state.workspaces.raids[raidId || '']);

    const dispatch = useDispatch();

    const router = useRouter();

    const saveName = () => {
        const trimmedName = editedName.trim();
        if (raidId && raid && trimmedName && trimmedName !== raid.name) {
            dispatch.raids.update({ id: raidId, name: trimmedName });
        }
        setIsEditingName(false);
    };

    const undoAction = raidWorkspace?.undoStack?.slice(-1)[0];
    const redoAction = raidWorkspace?.redoStack?.slice(-1)[0];

    const useMacLikeHotKeys = shouldUseMacLikeHotKeys();
    const hotKeyBase = useMacLikeHotKeys
        ? {
              meta: true,
          }
        : {
              control: true,
          };

    const menuItems: TopLevelMenuItem[] = [
        {
            label: 'File',
            items: [
                {
                    label: 'Close',
                    icon: XIcon,
                    template: menuItemRenderer,
                    command: () => {
                        router.push('/');
                    },
                },
            ],
        },
        {
            label: 'Edit',
            items: [
                {
                    label: `Undo ${undoAction?.name || ''}`,
                    disabled: !undoAction,
                    icon: ArrowUUpLeftIcon,
                    hotKey: { ...hotKeyBase, key: 'z' },
                    template: menuItemRenderer,
                    command: () => {
                        if (raidId) {
                            dispatch.workspaces.undo({ raidId });
                        }
                    },
                },
                {
                    label: `Redo ${redoAction?.name || ''}`,
                    disabled: !redoAction,
                    icon: ArrowUUpRightIcon,
                    hotKey: useMacLikeHotKeys ? { ...hotKeyBase, key: 'z', shift: true } : { ...hotKeyBase, key: 'y' },
                    template: menuItemRenderer,
                    command: () => {
                        if (raidId) {
                            dispatch.workspaces.redo({ raidId });
                        }
                    },
                },
            ],
        },
    ];

    useKeyPressEvents((e) => {
        const item = findMenuItemByHotKey(menuItems, {
            key: e.key,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            control: e.ctrlKey,
        });
        if (!item) {
            return;
        }

        // don't steal the key press if we're focused on an input
        const target = e.target as HTMLElement;
        const targetTagName = target.tagName?.toLowerCase();
        if (targetTagName === 'input' || targetTagName === 'textarea' || target.isContentEditable) {
            return;
        }

        e.preventDefault();

        if (item.disabled) {
            return;
        }

        if (item.command) {
            item.command({
                // XXX: this isn't quite right, but it's pretty close and we don't actually use the
                // event in our commands
                originalEvent: e as unknown as React.SyntheticEvent,
                item,
            });
        }
    });

    return (
        <div className="w-full bg-elevation-1 shadow-lg flex items-center py-2 px-4">
            <div className="flex flex-col">
                <div className="flex flex-row items-center">
                    <input
                        className={`border-0 text-xl font-bold rounded-md shadow-none px-2 py-1 hover:bg-black/20 focus:bg-black/20 focus:outline-1 outline-cyan-500 ring-none`}
                        autoComplete="off"
                        type="text"
                        onFocus={() => {
                            setEditedName(raid?.name || '');
                            setIsEditingName(true);
                        }}
                        onChange={(e) => {
                            setEditedName(e.target.value);
                        }}
                        onBlur={() => {
                            saveName();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                saveName();
                                e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setIsEditingName(false);
                                e.currentTarget.blur();
                            }
                        }}
                        value={isEditingName ? editedName : raid?.name || ''}
                        {...disablePasswordManagers}
                    />
                </div>
                <div className="flex flex-row">
                    <PrimeMenuBar
                        model={menuItems}
                        pt={{
                            button: {
                                className: 'hidden',
                            },
                            menu: {
                                className: 'flex flex-row outline-none',
                            },
                            menuitem: (options) => {
                                // see: https://github.com/primefaces/primereact/issues/8330
                                const context = options!.context as {
                                    active: boolean;
                                    disabled: boolean;
                                    focused: boolean;
                                    level: number;
                                };
                                return {
                                    className: clsx({
                                        'flex flex-row relative py-1 px-2 items-center gap-2 hover:bg-black/20 rounded-md':
                                            context.level === 0,
                                        'bg-black/20': context.level === 0 && (context.focused || context.active),
                                        'bg-white/10': context.level > 0 && context.focused,
                                        'opacity-50': context.disabled,
                                        'cursor-pointer': !context.disabled,
                                        'cursor-default': context.disabled,
                                    }),
                                };
                            },
                            popupIcon: {
                                className: 'hidden',
                            },
                            root: {
                                className: 'flex flex-row outline-none',
                            },
                            submenu: {
                                className:
                                    'absolute left-0 top-full flex flex-col bg-elevation-3 shadow-md rounded-sm outline-none',
                            },
                            submenuIcon: {
                                className: 'hidden',
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
