'use client';

import { GithubLogoIcon, SwordIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components';
import { PersistedRaid } from '@/models/raids/types';
import { useDispatch, useSelector } from '@/store';

export const WelcomePanel = () => {
    const raids = Object.values(useSelector((state) => state.raids.metadata));
    const raidWorkspaces = Object.values(useSelector((state) => state.workspaces.raids));
    const dispatch = useDispatch();
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);

    const createProject = () => {
        setIsBusy(true);
        const id = dispatch.raids.create({ name: 'Untitled Raid' });
        router.push(`/raid#id=${id}`);
    };

    const sortedRaids = raids.slice().sort((a, b) => {
        const aWorkspace = raidWorkspaces.find((rw) => rw.id === a.id);
        const bWorkspace = raidWorkspaces.find((rw) => rw.id === b.id);
        const aTime = aWorkspace?.lastActivityTime || 0;
        const bTime = bWorkspace?.lastActivityTime || 0;
        return bTime - aTime;
    });

    const importRaid = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                return;
            }
            const text = await file.text();
            try {
                const data = JSON.parse(text) as PersistedRaid;
                if (!data.metadata.id) {
                    alert('Invalid raid file.');
                } else {
                    const raid = dispatch.raids.importPersistedRaid(data);
                    router.push(`/raid#id=${raid.id}`);
                }
            } catch (err) {
                alert('Failed to import raid: ' + (err as Error).message);
            }
        };
        input.click();
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl">
            <div className="flex flex-row justify-end items-center gap-2 self-end pr-8">
                <Link href="https://github.com/ccbrown/raid-illustrator" target="_blank" rel="noopener noreferrer">
                    <GithubLogoIcon
                        size={24}
                        weight="fill"
                        className="text-elevation-3 hover:text-white hover:animate-wiggle"
                    />
                </Link>
            </div>
            <div className="bg-elevation-1 rounded-lg w-full shadow-lg p-6 flex flex-col gap-4">
                <div className="flex flex-row gap-8">
                    <div className="flex flex-col gap-4 flex-1">
                        <h1>Welcome!</h1>
                        {raids.length > 0 ? (
                            <div>Select a raid or create a new one.</div>
                        ) : (
                            <div>Create a raid to get started.</div>
                        )}
                    </div>
                    {sortedRaids.length > 0 && (
                        <div className="flex flex-col">
                            <div className="px-6 font-semibold text-sm text-white/70">
                                My Raids ({sortedRaids.length})
                            </div>
                            <div className="flex flex-col border-l border-white/10 px-4 overflow-y-auto max-h-64">
                                {sortedRaids.map((raid) => {
                                    const workspace = raidWorkspaces.find((rw) => rw.id === raid.id);
                                    return (
                                        <Link
                                            key={raid.id}
                                            href={`/raid#id=${raid.id}`}
                                            className="text-sm hover:bg-white/5 rounded-md p-2"
                                        >
                                            {raid.name}
                                            {workspace?.lastActivityTime && (
                                                <div className="text-xs text-white/50">
                                                    Last Activity:{' '}
                                                    {new Date(workspace.lastActivityTime).toLocaleString()}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-row justify-end">
                    <Button disabled={isBusy} text="New Raid" icon={SwordIcon} onClick={createProject} />
                </div>
            </div>
            <div className="flex flex-row justify-center mt-4">
                <div className="text-xs text-white/50 underline cursor-pointer" onClick={importRaid}>
                    Import Raid
                </div>
            </div>
        </div>
    );
};
