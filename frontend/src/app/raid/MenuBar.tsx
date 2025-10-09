import { CheckIcon, PencilSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { TextField } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

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

    return (
        <div className="w-full bg-elevation-1 shadow-lg flex items-center py-2 px-4">
            {isEditingName ? (
                <form
                    className="flex items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveName();
                    }}
                >
                    <TextField value={editedName} onChange={setEditedName} />
                    <button
                        type="button"
                        className="ml-2 text-green-500 hover:text-green-300 transition"
                        onClick={saveName}
                        title="Save"
                    >
                        <CheckIcon size={20} />
                    </button>
                    <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-300 transition"
                        onClick={() => setIsEditingName(false)}
                        title="Cancel"
                    >
                        <XIcon size={20} />
                    </button>
                </form>
            ) : (
                <>
                    <h1 className="text-xl font-bold">{raid?.name}</h1>
                    <button
                        className="ml-2 subtle"
                        onClick={() => {
                            if (raid) {
                                setEditedName(raid.name);
                                setIsEditingName(true);
                            }
                        }}
                        title="Edit Raid Name"
                    >
                        <PencilSimpleIcon size={20} />
                    </button>
                </>
            )}
        </div>
    );
};
