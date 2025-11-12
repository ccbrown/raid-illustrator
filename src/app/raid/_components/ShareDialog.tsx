import { CopyIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { PostSnapshotResponseBody } from '@/app/api/snapshots/route';
import { Button, Dialog } from '@/components';
import { selectPersistedRaid } from '@/models/raids/selectors';
import { store } from '@/store';

import { useRaidId } from '../hooks';

interface Props {
    isOpen?: boolean;
    onClose: () => void;
}

export const ShareDialog = (props: Props) => {
    const raidId = useRaidId();
    const [isBusy, setIsBusy] = useState(false);
    const [shareLink, setShareLink] = useState<string>('');

    const generateShareLink = async () => {
        if (isBusy) {
            return;
        }
        setIsBusy(true);

        try {
            const persisted = selectPersistedRaid(store.getState().raids, raidId);
            const resp = await fetch('/api/snapshots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ raid: persisted }),
            });
            if (!resp.ok) {
                if (resp.status === 400) {
                    throw new Error(await resp.text());
                }
                throw new Error(resp.statusText);
            }
            const data = (await resp.json()) as PostSnapshotResponseBody;
            const link = `${window.location.origin}/raid#s=${data.id}`;
            setShareLink(link);
        } catch (err) {
            alert((err as Error).message || 'An unknown error occurred. Please try again.');
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog isOpen={props.isOpen} onClose={() => props.onClose()} title="Share">
            <div className="flex flex-col gap-4">
                <div className="text-sm">
                    You can share your raid via a temporary link, which will be valid for 24 hours.
                </div>
                <div>
                    {shareLink ? (
                        <div className="flex flex-row items-center gap-2 bg-elevation-1 p-1 rounded-sm">
                            <div className="flex-grow break-all text-xs px-1">{shareLink}</div>
                            <div
                                className="bg-elevation-2 rounded-sm p-1 hover:bg-elevation-3 cursor-pointer"
                                onClick={() => {
                                    navigator.clipboard.writeText(shareLink);
                                }}
                            >
                                <CopyIcon size={16} />
                            </div>
                        </div>
                    ) : (
                        <Button disabled={isBusy} text="Generate Shareable Link" onClick={generateShareLink} />
                    )}
                </div>
            </div>
        </Dialog>
    );
};
