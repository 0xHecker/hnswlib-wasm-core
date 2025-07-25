/***************** GENERATED FILE ********************/ 
/**
 * hnswlib-node provides Node.js bindings for Hnswlib.
 *
 * Copyright (c) 2022-2023 Atsushi Tatsuma
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EmscriptenModule, EmscriptenModuleFactory } from '@types/emscripten/index';

// Define your specific Emscripten

/** @packageDocumentation */

// define type aliases for various native number types
type Char = number;
type SignedChar = number;
type UnsignedChar = number;
type Short = number;
type UnsignedShort = number;
type Int = number;
type UnsignedInt = number;
type Long = number;
type UnsignedLong = number;
type Float = number;
type Double = number;

/** Distance for search index. `l2`: sum((x_i - y_i)^2), `ip`: 1 - sum(x_i * y_i), `cosine`: 1 - sum(x_i * y_i) / norm(x) * norm(y). */
export type SpaceName = 'l2' | 'ip' | 'cosine';

/** Searh result object. */
export interface SearchResult {
  /** The disances of the nearest negihbors found. */
  distances: number[];
  /** The indices of the nearest neighbors found. */
  neighbors: number[];
}

/** Function for filtering elements by its labels. */
export type FilterFunction = (label: number) => boolean;

/**
 * L2 space object.
 * @param {number} numDimensions The dimensionality of space.
 */
export class L2Space {
  constructor(numDimensions: number);
  /**
   * calculates the squared Euclidean distance between two data points.
   * @param {number[]} pointA The data point vector.
   * @param {number[]} pointB The data point vector.
   * @return {number} The distance between data points.
   */
  distance(pointA: number[], pointB: number[]): number;
  /**
   * returns the dimensionality of space.
   * @return {number} The dimensionality of space.
   */
  getNumDimensions(): number;
}

/**
 * Inner product space object.
 * @param {number} numDimensions The dimensionality of space.
 */
export class InnerProductSpace {
  constructor(numDimensions: number);
  /**
   * calculates the one minus inner product between two data points.
   * @param {number[]} pointA The data point vector.
   * @param {number[]} pointB The data point vector.
   * @return {number} The distance between data points.
   */
  distance(pointA: number[], pointB: number[]): number;
  /**
   * returns the dimensionality of space.
   * @return {number} The dimensionality of space.
   */
  getNumDimensions(): number;
}

/**
 * Nearest-neighbor search index object based on brute-force search.
 *
 * ```typescript
 * const numDimensions = 5;
 * const maxElements = 1000;
 *
 * index = new BruteforceSearch('l2', numDimensions);
 * index.initIndex(maxElements);
 *
 * index.addPoint([0, 1, 2, 3, 4], 0, false);
 * index.addPoint([1, 2, 3, 4, 5], 1, false);
 * index.addPoint([3, 4, 5, 6, 6], 2, false);
 *
 * const numNeighbors = 3;
 * const result = index.searchKnn([1, 4, 2, 3, 4], numNeighbors);
 *
 * console.table(result);
 * ```
 */
export class BruteforceSearch {
  /**
   * @param {SpaceName} spaceName The metric space to create for the index ('l2', 'ip', or 'cosine').
   * @param {number} numDimensions The dimensionality of data points.
   */
  constructor(spaceName: SpaceName, numDimensions: number);

  /** is index initialized */
  isIndexInitialized(): boolean;

  /**
   * initializes search index.
   * @param {number} maxElements The maximum number of data points.
   */
  initIndex(maxElements: number): void;
  /**
   * loads the search index from an ArrayBuffer.
   * @param {ArrayBuffer} buffer The buffer to read from.
   */
  readIndexFromBuffer(buffer: ArrayBuffer): void;
  /**
   * saves the search index to an ArrayBuffer.
   * @return {ArrayBuffer} The buffer containing the index data.
   */
  writeIndexToBuffer(): ArrayBuffer;
  /**
   * adds a datum point to the search index.
   * @param {Float32Array | number[]} point The datum point to be added to the search index.
   * @param {number} label The index of the datum point to be added.
   */
  addPoint(point: Float32Array | number[], label: number): void;
  /**
   * removes the datum point from the search index.
   * @param {number} label The index of the datum point to be removed.
   */
  removePoint(label: number): void;
  /**
   * returns `numNeighbors` closest items for a given query point.
   * @param {Float32Array | number[]} queryPoint The query point vector.
   * @param {number} numNeighbors The number of nearest neighbors to search for.
   * @param {FilterFunction} filter The function filters elements by its labels.
   * @return {SearchResult} The search result object consists of distances and indices of the nearest neighbors found.
   */
  searchKnn(
    queryPoint: Float32Array | number[],
    numNeighbors: number,
    filter: FilterFunction | undefined
  ): SearchResult;
  /**
   * returns the maximum number of data points that can be indexed.
   * @return {numbers} The maximum number of data points that can be indexed.
   */
  getMaxElements(): number;
  /**
   * returns the number of data points currently indexed.
   * @return {numbers} The number of data points currently indexed.
   */
  getCurrentCount(): number;
  /**
   * returns the dimensionality of data points.
   * @return {number} The dimensionality of data points.
   */
  getNumDimensions(): number;
}

/**
 * Approximate nearest-neighbor search index object based on Hierarchical navigable small world graphs.
 *
 * ```typescript
 * const numDimensions = 5;
 * const maxElements = 1000;
 *
 * index = new HierarchicalNSW('l2', numDimensions);
 * index.initIndex(maxElements, 16, 200, 100);
 *
 * index.addPoint([0, 1, 2, 3, 4], 0, false);
 * index.addPoint([1, 2, 3, 4, 5], 1, false);
 * index.addPoint([3, 4, 5, 6, 6], 2, false);
 *
 * const numNeighbors = 3;
 * const result = index.searchKnn([1, 4, 2, 3, 4], numNeighbors);
 *
 * console.table(result);
 * ```
 */
export class HierarchicalNSW {
  /**
   * @param {SpaceName} spaceName The metric space to create for the index ('l2', 'ip', or 'cosine').
   * @param {number} numDimensions The dimesionality of metric space.
   */
  constructor(spaceName: SpaceName, numDimensions: number);
  /**
   * Initialize index.
   * @param {number} maxElements The maximum number of elements.
   * @param {number} m The maximum number of outgoing connections on the graph (default: 16).
   * @param {number} efConstruction The parameter that controls speed/accuracy trade-off during the index construction (default: 200).
   * @param {number} randomSeed The seed value of random number generator (default: 100).
   */
  initIndex(maxElements: number, m: number, efConstruction: number, randomSeed: number): void;

  /** is index initialized */
  isIndexInitialized(): boolean;

  /**
   * loads the search index from an ArrayBuffer.
   * @param {ArrayBuffer} buffer The buffer to read from.
   */
  readIndexFromBuffer(buffer: ArrayBuffer | Uint8Array): void;
  /**
   * saves the search index to an ArrayBuffer.
   * @return {ArrayBuffer} The buffer containing the index data.
   */
  writeIndexToBuffer(): Uint8Array;

  /**
   * resizes the search index.
   * @param {number} newMaxElements The new maximum number of data points.
   */
  resizeIndex(newMaxElements: number): void;
  /**
   * adds a datum point to the search index.
   * @param {VectorFloat | number[]} point The datum point to be added to the search index.
   * @param {number} label The index of the datum point to be added.
   * @param {boolean} replaceDeleted The flag to replace a deleted element (default: false).
   */
  addPoint(point: VectorFloat | number[], label: number, replaceDeleted?: boolean): void;

  /**
   * adds a datum point array to the search index.
   * @param {VectorFloat[] | number[][]} items The datum array to be added to the search index.
   * @param {VectorInt | number[]} labels The index array of the datum array to be added.
   * @param {boolean} replaceDeleted The flag to replace a deleted element (default: false).
   */
  addPoints(items: VectorFloat[] | number[][], labels: VectorInt | number[], replaceDeleted?: boolean): void;

  /**
   * Recommended approach to add items.  It will generate its own labels and has logic to reuse labels from deleted items.  It returns an ordered array of labels correspoinding to the items added.
   * @param {VectorFloat[] | number[][]} items The datum array to be added to the search index.
   * @param {boolean} replaceDeleted The flag to replace a deleted element (default: false).
   */
  addItems(items: VectorFloat[] | number[][], replaceDeleted?: boolean): VectorInt;

  // /**
  //  * adds a datum point to the search index.
  //  * @param {Float32Array[] | number[][]} items The datum array to be added to the search index.
  //  * @param {number} labels The index array of the datum array to be added.
  //  * @param {boolean} replaceDeleted The flag to replace a deleted element (default: false).
  //  */
  // addItemsWithPtr(
  //   vecData: Float32Array | number[],
  //   vecSize: number,
  //   idVecData: Uint32Array | number[],
  //   idVecSize: number,
  //   replaceDeleted?: boolean
  // ): void;
  /**
   * marks the element as deleted. The marked element does not appear on the search result.
   * @param {number} label The index of the datum point to be marked.
   */
  markDelete(label: number): void;
  /**
   * marks the element as deleted. The marked element does not appear on the search result.
   * @param {VectorInt | number[]} labels The index of the datum point to be marked.
   */
  markDeleteItems(labels: VectorInt | number[]): void;
  /**
   * unmarks the element as deleted.
   * @param {number} label The index of the datum point to be unmarked.
   */
  unmarkDelete(label: number): void;
  /**
   * returns `numNeighbors` closest items for a given query point.
   * @param {VectorFloat | number[]} queryPoint The query point vector.
   * @param {number} numNeighbors The number of nearest neighbors to search for.
   * @param {FilterFunction} filter The function filters elements by its labels.
   * @return {SearchResult} The search result object consists of distances and indices of the nearest neighbors found.
   */
  searchKnn(
    queryPoint: VectorFloat | number[],
    numNeighbors: number,
    filter?: FilterFunction | undefined
  ): SearchResult;
  /**
   * returns a list of all used labels
   * @return {VectorInt} The list of indices.
   */
  getUsedLabels(): VectorInt;
  /**
   * returns a list of all deleted labels
   * @return {VectorInt} The list of indices.
   */
  getDeletedLabels(): VectorInt;
  /**
   * returns the datum point vector specified by label.
   * @param {number} label The index of the datum point.
   * @return {number[]} The datum point vector.
   */
  getPoint(label: number): number[];
  /**
   * returns the maximum number of data points that can be indexed.
   * @return {numbers} The maximum number of data points that can be indexed.
   */
  getMaxElements(): number;
  /**
   * returns the number of data points currently indexed.
   * @return {numbers} The number of data points currently indexed.
   */
  getCurrentCount(): number;
  /**
   * returns the dimensionality of data points.
   * @return {number} The dimensionality of data points.
   */
  getNumDimensions(): number;
  /**
   * returns the `ef` parameter.
   * @return {number} The `ef` parameter value.
   */
  getEfSearch(): number;
  /**
   * sets the `ef` parameter.
   * @param {number} ef The size of the dynamic list for the nearest neighbors.
   */
  setEfSearch(ef: number): void;
}

export class VectorFloat {
  get(index: number): number;
  push_back(value: number): void;
  resize(new_size: number, value: number): void;
  set(index: number, value: number): void;
  size(): number;
  delete(): void;
}

export class VectorInt {
  get(index: number): number;
  push_back(value: number): void;
  resize(new_size: number, value: number): void;
  set(index: number, value: number): void;
  size(): number;
  delete(): void;
}

declare const factory: EmscriptenModuleFactory<HnswlibModule>;
export default factory;
 
/***************** GENERATED FILE ********************/ 
