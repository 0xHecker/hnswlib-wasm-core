/***************** GENERATED FILE ********************/ 
import type * as module from './hnswlib-wasm';
import type factory from './hnswlib-wasm';
// import './hnswlib.mjs';

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

let library: HnswlibModule;

/**
 * Load the HNSW library in node or browser
 */
export const loadHnswlib = async (): Promise<HnswlibModule> => {
  try {
    // @ts-expect-error - hnswlib can be a global variable in the browser
    if (typeof hnswlib !== 'undefined' && hnswlib !== null) {
      // @ts-expect-error - hnswlib can be a global variable in the browser
      const lib = hnswlib();
      if (lib != null) return lib;
    }

    if (!library) {
      const factoryFunc = (await import('../lib/hnswlib.mjs')).default;
      library = (await factoryFunc()) as HnswlibModule;
    }
    return library;
  } catch (err) {
    console.error('----------------------------------------');
    console.error('Error initializing the library:', err);
    throw err;
  }
};

// disabled due to lack of perfomance improvemant and additional complexity

// /**
//  * Adds items and their corresponding labels to the HierarchicalNSW index using memory pointers.
//  * This function handles the memory allocation for the Emscripten Module, and properly frees the memory after use.  its a wrapper around {@link HierarchicalNSW#addItemsWithPtrs}
//  *
//  * ⛔️ This function is only 1.02x faster than vectors for 10k points version which are easier to use.  The sole advantage is memory savings
//  *
//  * @async
//  * @param {HnswlibModule} Module - The Emscripten HNSWLIB Module object.
//  * @param {HierarchicalNSW} index - The HierarchicalNSW index object.
//  * @param {Float32Array[] | number[][]} items - An array of item vectors to be added to the search index. Each item should be a Float32Array or an array of numbers.
//  * @param {number[]} labels - An array of numeric labels corresponding to the items. The length of the labels array should match the length of the items array.
//  * @param {boolean} replaceDeleted - A flag to determine if deleted elements should be replaced (default: false).
//  * @returns {Promise<void>} A promise that resolves once the items and labels have been added to the index.
//  */
// export const addItemsWithPtrsHelper = async (
//   Module: HnswlibModule,
//   index: HierarchicalNSW,
//   items: Float32Array[] | number[][],
//   labels: number[],
//   replaceDeleted: boolean
// ): Promise<void> => {
//   const itemCount = items.length;
//   const dim = items[0].length;

//   // Flatten the items array into a Float32Array
//   const flatItems = new Float32Array(itemCount * dim);
//   items.forEach((vec, i) => {
//     flatItems.set(vec, i * dim);
//   });

//   // Convert labels to a Uint32Array
//   const labelsArray = new Uint32Array(labels);

//   const vecDataPtr = Module.asm.malloc(flatItems.length * Float32Array.BYTES_PER_ELEMENT);
//   const labelVecDataPtr = Module.asm.malloc(labelsArray.length * Uint32Array.BYTES_PER_ELEMENT);

//   if (vecDataPtr === 0) {
//     throw new Error('Failed to allocate memory for vecDataPtr.');
//   }

//   if (labelVecDataPtr === 0) {
//     throw new Error('Failed to allocate memory for labelVecDataPtr.');
//   }

//   Module.HEAPF32.set(flatItems, vecDataPtr / Float32Array.BYTES_PER_ELEMENT);
//   Module.HEAPU32.set(labelsArray, labelVecDataPtr / Uint32Array.BYTES_PER_ELEMENT);

//   await index.addItemsWithPtr(
//     Module.HEAPF32.subarray(
//       Math.floor(vecDataPtr / Float32Array.BYTES_PER_ELEMENT),
//       Math.floor(vecDataPtr / Float32Array.BYTES_PER_ELEMENT) + itemCount * dim
//     ),
//     itemCount * dim,
//     Module.HEAPU32.subarray(
//       Math.floor(labelVecDataPtr / Uint32Array.BYTES_PER_ELEMENT),
//       Math.floor(labelVecDataPtr / Uint32Array.BYTES_PER_ELEMENT) + itemCount
//     ),
//     itemCount,
//     replaceDeleted
//   );

//   Module.asm.free(vecDataPtr);
//   Module.asm.free(labelVecDataPtr);
// };
 
/***************** GENERATED FILE ********************/ 
