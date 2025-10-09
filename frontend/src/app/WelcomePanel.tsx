'use client';

import { SwordIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Link from 'next/link';

import { Panel, PanelButton } from '@/components';
import { useDispatch, useSelector } from '@/store';

export const WelcomePanel = () => {
    const raids = Object.values(useSelector((state) => state.raids.metadata));
    const dispatch = useDispatch();
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);

    const createProject = () => {
        setIsBusy(true);
        const id = dispatch.raids.create({ name: 'Untitled Raid' });
        router.push(`/raid#id=${id}`);
    };

    return (
        <Panel>
            <div className="flex flex-row gap-8">
                <div className="flex flex-col gap-4 flex-1">
                    <h1>Welcome!</h1>
                    {raids.length > 0 ? (
                        <div>Select a raid or create a new one.</div>
                    ) : (
                        <div>Create a raid to get started.</div>
                    )}
                    <div>
                        <PanelButton disabled={isBusy} text="New Raid" icon={SwordIcon} onClick={createProject} />
                    </div>
                </div>
                {raids.length > 0 && (
                    <div className="flex flex-col border-l border-white/10 pl-4 gap-4">
                        {raids.map((raid) => (
                            <Link key={raid.id} href={`/raid#id=${raid.id}`}>
                                {raid.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Panel>
    );
};
