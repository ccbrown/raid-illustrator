// This returns an array of all ids from `allIds` that are between `fillToId` and its closed
// selected ids, inclusive.
//
// This provides the logic for shift-click selection in lists.
export const fillSelectionRange = (allIds: string[], selectedIds: string[], fillToId: string): string[] => {
    if (selectedIds.length === 0) {
        return [];
    }
    const fillToIndex = allIds.indexOf(fillToId);
    if (fillToIndex === -1) {
        return [];
    }

    // find the closest selected id before and after fillToId
    let closestBeforeIndex = -1;
    let closestAfterIndex = allIds.length;
    for (const selectedId of selectedIds) {
        const selectedIndex = allIds.indexOf(selectedId);
        if (selectedIndex === -1) {
            continue;
        }
        if (selectedIndex < fillToIndex && selectedIndex > closestBeforeIndex) {
            closestBeforeIndex = selectedIndex;
        }
        if (selectedIndex > fillToIndex && selectedIndex < closestAfterIndex) {
            closestAfterIndex = selectedIndex;
        }
    }

    const ret = selectedIds.slice();
    if (closestBeforeIndex !== -1) {
        for (let i = closestBeforeIndex; i <= fillToIndex; i++) {
            const id = allIds[i];
            if (!ret.includes(id)) {
                ret.push(id);
            }
        }
    }
    if (closestAfterIndex !== allIds.length) {
        for (let i = fillToIndex; i <= closestAfterIndex; i++) {
            const id = allIds[i];
            if (!ret.includes(id)) {
                ret.push(id);
            }
        }
    }
    return ret;
};
