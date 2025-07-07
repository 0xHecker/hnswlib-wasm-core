/***************** GENERATED FILE ********************/
import { HierarchicalNSW } from './index';
export declare const saveIndexToOpfs: (index: HierarchicalNSW & {
    writeIndexToBuffer: () => Uint8Array;
}) => Promise<void>;
export declare const loadIndexFromOpfs: (index: HierarchicalNSW, maxElements: number) => Promise<void>;
/***************** GENERATED FILE ********************/
