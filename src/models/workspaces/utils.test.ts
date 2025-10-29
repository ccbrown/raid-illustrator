import { describe, expect, it } from 'vitest';

import { fillSelectionRange } from './utils';

describe('fillSelectionRange', () => {
    const allIds = ['id1', 'id2', 'id3', 'id4', 'id5', 'id6'];

    it('should return empty array when selectedIds is empty', () => {
        const result = fillSelectionRange(allIds, [], 'id3');
        expect(result).toEqual([]);
    });

    it('should return empty array when fillToId is not in allIds', () => {
        const result = fillSelectionRange(allIds, ['id1'], 'id99');
        expect(result).toEqual([]);
    });

    it('should fill from selected id before fillToId', () => {
        const result = fillSelectionRange(allIds, ['id2'], 'id4');
        expect(result).toEqual(['id2', 'id3', 'id4']);
    });

    it('should fill from selected id after fillToId', () => {
        const result = fillSelectionRange(allIds, ['id5'], 'id3');
        expect(result).toEqual(['id5', 'id3', 'id4']);
    });

    it('should fill between two selected ids when fillToId is between them', () => {
        const result = fillSelectionRange(allIds, ['id2', 'id5'], 'id3');
        // Fills from id2 to id3 AND from id3 to id5
        expect(result).toEqual(['id2', 'id5', 'id3', 'id4']);
    });

    it('should fill from closest selected id before', () => {
        const result = fillSelectionRange(allIds, ['id1', 'id3'], 'id5');
        expect(result).toEqual(['id1', 'id3', 'id4', 'id5']);
    });

    it('should fill from closest selected id after', () => {
        const result = fillSelectionRange(allIds, ['id4', 'id6'], 'id2');
        expect(result).toEqual(['id4', 'id6', 'id2', 'id3']);
    });

    it('should not duplicate existing selected ids', () => {
        const result = fillSelectionRange(allIds, ['id2', 'id3', 'id4'], 'id4');
        // Should not duplicate id2, id3, id4
        expect(result).toEqual(['id2', 'id3', 'id4']);
    });

    it('should handle fillToId that is already selected', () => {
        const result = fillSelectionRange(allIds, ['id1', 'id3'], 'id3');
        expect(result).toEqual(['id1', 'id3', 'id2']);
    });

    it('should fill when selected id is at the start', () => {
        const result = fillSelectionRange(allIds, ['id1'], 'id3');
        expect(result).toEqual(['id1', 'id2', 'id3']);
    });

    it('should fill when selected id is at the end', () => {
        const result = fillSelectionRange(allIds, ['id6'], 'id4');
        expect(result).toEqual(['id6', 'id4', 'id5']);
    });

    it('should handle multiple selected ids spanning fillToId', () => {
        const result = fillSelectionRange(allIds, ['id1', 'id3', 'id6'], 'id4');
        expect(result).toEqual(['id1', 'id3', 'id6', 'id4', 'id5']);
    });

    it('should ignore selected ids not in allIds', () => {
        const result = fillSelectionRange(allIds, ['id99', 'id2'], 'id4');
        expect(result).toEqual(['id99', 'id2', 'id3', 'id4']);
    });
});
