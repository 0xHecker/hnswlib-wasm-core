/***************** GENERATED FILE ********************/
import type * as module from './hnswlib-wasm';
import type factory from './hnswlib-wasm';
export type HierarchicalNSW = module.HierarchicalNSW;
export type BruteforceSearch = module.BruteforceSearch;
export type L2Space = module.L2Space;
export type InnerProductSpace = module.InnerProductSpace;
export type VectorFloat = module.VectorFloat;
export type VectorInt = module.VectorInt;
export type SearchResult = module.SearchResult;
export type HnswModuleFactory = typeof factory;
export type normalizePoint = HnswlibModule['normalizePoint'];
export * from './constants';
export interface HnswlibModule extends EmscriptenModule {
    normalizePoint(vec: number[]): number[];
    L2Space: new (dim: number) => module.L2Space;
    InnerProductSpace: new (dim: number) => module.InnerProductSpace;
    BruteforceSearch: new (space: 'l2' | 'ip' | 'cosine', dim: number) => module.BruteforceSearch;
    HierarchicalNSW: new (space: 'l2' | 'ip' | 'cosine', dim: number) => module.HierarchicalNSW & {
        readIndexFromBuffer: (buffer: Uint8Array) => void;
        writeIndexToBuffer: () => Uint8Array;
    };
    VectorFloat: new () => module.VectorFloat;
    VectorInt: new () => module.VectorInt;
}
/**
 * Load the HNSW library in node or browser
 */
export declare const loadHnswlib: () => Promise<HnswlibModule>;
/***************** GENERATED FILE ********************/
