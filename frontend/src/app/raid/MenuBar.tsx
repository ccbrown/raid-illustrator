'use client';

import {
    ArrowFatLeftIcon,
    ArrowFatRightIcon,
    ArrowUUpLeftIcon,
    ArrowUUpRightIcon,
    Icon,
    PlusIcon,
    SparkleIcon,
    TrashIcon,
    XIcon,
} from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { Menubar as PrimeMenuBar } from 'primereact/menubar';
import { MenuItem as PrimeMenuItem } from 'primereact/menuitem';

import { EditableText } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

import { Command, HotKey, useCommands } from './commands';

interface MenuItem extends PrimeMenuItem {
    icon?: Icon;
    hotKey?: HotKey;
}

interface TopLevelMenuItem extends MenuItem {
    items: MenuItem[];
}

const KEY_STRINGS: { [key: string]: string } = {
    ArrowRight: '→',
    ArrowLeft: '←',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Backspace: '⌫',
};

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
                    {KEY_STRINGS[item.hotKey.key] || item.hotKey.key.toUpperCase()}
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
    const raidId = useHashParam('id');
    const raid = useSelector((state) => state.raids.metadata[raidId || '']);

    const dispatch = useDispatch();

    const saveName = (newName: string) => {
        const trimmedName = newName.trim();
        if (raidId && raid && trimmedName && trimmedName !== raid.name) {
            dispatch.raids.update({ id: raidId, name: trimmedName });
        }
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
                menuItemForCommand(commands.delete, TrashIcon),
            ],
        },
        {
            label: 'Scene',
            items: [menuItemForCommand(commands.newScene, PlusIcon)],
        },
        {
            label: 'Step',
            items: [
                menuItemForCommand(commands.newStep, PlusIcon),
                menuItemForCommand(commands.openNextStep, ArrowFatRightIcon),
                menuItemForCommand(commands.openPreviousStep, ArrowFatLeftIcon),
            ],
        },
        {
            label: 'Entity',
            items: [
                menuItemForCommand(commands.newEntity, PlusIcon),
                menuItemForCommand(commands.addEntityEffect, SparkleIcon),
            ],
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
                    <EditableText
                        value={raid?.name || ''}
                        onChange={saveName}
                        className="text-xl font-bold hover:bg-black/20"
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
