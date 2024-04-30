import type { IconType } from '@/enums/IconTypes';

export function cleanHistory(piece: IconType, playHistory: MoveRecord[]): MoveRecord[] {
    const sortedHistory = playHistory.sort(sortByPosition);
    return sortedHistory.filter((item) => item.piece === piece);
}
export function rangeWithLeap(start: number, end: number, step: number): number[] {
    return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => start + i * step);
}

export function sortByPosition(recordOne: MoveRecord, recordTwo: MoveRecord): number {
    if (recordOne.position < recordTwo.position) {
        return -1;
    }

    if (recordOne.position > recordTwo.position) {
        return 1;
    }

    return 0;
}

