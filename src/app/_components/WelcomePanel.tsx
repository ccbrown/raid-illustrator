'use client';

import { SwordIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components';
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

    return (
        <div className="bg-elevation-1 rounded-lg w-full max-w-3xl shadow-lg p-6">
            <div className="flex flex-row gap-8">
                <div className="flex flex-col gap-4 flex-1">
                    <h1>Welcome!</h1>
                    {raids.length > 0 ? (
                        <div>Select a raid or create a new one.</div>
                    ) : (
                        <div>Create a raid to get started.</div>
                    )}
                    <div>
                        <Button disabled={isBusy} text="New Raid" icon={SwordIcon} onClick={createProject} />
                    </div>
                </div>
                {sortedRaids.length > 0 && (
                    <div className="flex flex-col border-l border-white/10 pl-4 overflow-y-auto max-h-48">
                        {sortedRaids.map((raid) => (
                            <Link
                                key={raid.id}
                                href={`/raid#id=${raid.id}`}
                                className="hover:bg-white/5 rounded-md p-2"
                            >
                                {raid.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
