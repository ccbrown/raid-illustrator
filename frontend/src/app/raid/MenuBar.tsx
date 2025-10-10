'use client';

import { ArrowUUpRightIcon, ArrowUUpLeftIcon, Icon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { Menubar as PrimeMenuBar } from 'primereact/menubar';
import { MenuItem as PrimeMenuItem } from 'primereact/menuitem';
import { useState } from 'react';
import { clsx } from 'clsx';

import { Command, HotKey, useCommands } from './commands';
import { disablePasswordManagers } from '@/components/TextField';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

interface MenuItem extends PrimeMenuItem {
    icon?: Icon;
    hotKey?: HotKey;
}

interface TopLevelMenuItem extends MenuItem {
    items: MenuItem[];
}

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

const menuItemForCommand = (command: Command, icon: Icon): MenuItem => ({
    label: command.name,
    disabled: command.disabled,
    hotKey: command.hotKey,
    icon,
    template: menuItemRenderer,
    command: () => {
        command.execute();
    },
});

export const MenuBar = () => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const raidId = useHashParam('id');
    const raid = useSelector((state) => state.raids.metadata[raidId || '']);

    const dispatch = useDispatch();

    const saveName = () => {
        const trimmedName = editedName.trim();
        if (raidId && raid && trimmedName && trimmedName !== raid.name) {
            dispatch.raids.update({ id: raidId, name: trimmedName });
        }
        setIsEditingName(false);
    };

    const commands = useCommands();

    const menuItems: TopLevelMenuItem[] = [
        {
            label: 'File',
            items: [menuItemForCommand(commands.close, XIcon)],
        },
        {
            label: 'Edit',
            items: [
                menuItemForCommand(commands.undo, ArrowUUpLeftIcon),
                menuItemForCommand(commands.redo, ArrowUUpRightIcon),
            ],
        },
        {
            label: 'Scene',
            items: [menuItemForCommand(commands.newScene, PlusIcon)],
        },
        {
            label: 'Step',
            items: [menuItemForCommand(commands.newStep, PlusIcon)],
        },
        {
            label: 'Entity',
            items: [menuItemForCommand(commands.newEntity, PlusIcon)],
        },
        {
            label: 'View',
            items: [
                menuItemForCommand(commands.zoomIn, ArrowUUpLeftIcon),
                menuItemForCommand(commands.zoomOut, ArrowUUpRightIcon),
            ],
        },
    ];

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
                                className: 'flex flex-row outline-none z-100',
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
