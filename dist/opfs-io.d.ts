/***************** GENERATED FILE ********************/
import { HierarchicalNSW } from './index';
export declare const saveIndexToOpfs: (index: HierarchicalNSW & {
    writeIndexToBuffer: () => Uint8Array;
}) => Promise<void>;
export declare const loadIndexFromOpfs: (index: import("./hnswlib-wasm").HierarchicalNSW & {
    readIndexFromBuffer: (buffer: Uint8Array) => void;
    initIndex: (maxElements: number) => void;
}, maxElements: number) => Promise<void>;
/***************** GENERATED FILE ********************/
