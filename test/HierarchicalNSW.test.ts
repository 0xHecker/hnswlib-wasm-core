import { defaultParams, HierarchicalNSW, hnswParamsForAda, syncFileSystem } from '~dist/hnswlib';
import { createVectorData, generateMetadata, ItemMetadata, sleep, testErrors } from '~test/testHelpers';
import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { expect } from 'vitest';
import console from 'console';

describe('hnswlib.HierarchicalNSW', () => {
  afterAll(() => {
    process.stdout.write('');
  });

  it('loads the class', () => {
    expect(testHnswlibModule.HierarchicalNSW).toBeDefined();
  });

  describe('#constructor', () => {
    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        new testHnswlibModule.HierarchicalNSW();
      }).toThrow(/Tried to invoke ctor of HierarchicalNSW with invalid number of parameters/);
    });

    it('throws an error if given a non-String object to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new testHnswlibModule.HierarchicalNSW(1, 3);
      }).toThrow('Cannot pass non-string to std::string');
    });

    it('throws an error if given a non-Number object to second argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new testHnswlibModule.HierarchicalNSW('l2', '3');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if given a String that is neither "l2", "ip", nor "cosine" to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new testHnswlibModule.HierarchicalNSW('coss', 3);
      }).toThrow(/invalid space should be expected l2, ip, or cosine/);
    });
  });

  describe('#initIndex', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('isIndexInitialized is false before init', () => {
      expect(index.isIndexInitialized()).toBe(false);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.initIndex();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.initIndex('5', 16, 200, 1);
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('initIndex it is true if initialized with defaults', () => {
      index.initIndex(5, ...defaultParams.initIndex);
      expect(index.isIndexInitialized()).toBe(true);
    });

    it('initIndex it is true if initialized', () => {
      index.initIndex(5, 16, 200, 1);
      expect(index.isIndexInitialized()).toBe(true);
    });
  });

  describe('#resizeIndex', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.resizeIndex();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.resizeIndex('0');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.resizeIndex(5);
      }).toThrow(/Search index has not been initialized, call `initIndex` in advance./);
    });

    it('resize, marks the element as deleted', () => {
      index.initIndex(2, ...defaultParams.initIndex);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([2, 3, 4], 1, false);
      expect(() => {
        index.addPoint([3, 4, 5], 2, false);
      }).toThrow(testErrors.indexSize);
      index.resizeIndex(3);
      index.addPoint([3, 4, 5], 2, false);
      expect(index.getMaxElements()).toBe(3);
    });
  });

  describe('#getUsedLabels', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('returns an empty array if called before the index is initialized', () => {
      expect(index.getUsedLabels()).toMatchObject([]);
    });

    it('returns an array consists of label id', async () => {
      index.initIndex(5, ...defaultParams.initIndex);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([2, 3, 4], 1, false);
      await sleep(100);
      expect(index.getUsedLabels()).toEqual(expect.arrayContaining([0, 1]));
    });
  });

  describe('#getDeletedLabels', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('returns an empty array if called before the index is initialized', () => {
      expect(index.getDeletedLabels()).toMatchObject([]);
    });

    it('usedLabel only returns valid ids and deletedLabels returns deleted labels', () => {
      index.initIndex(5, 32, 128, 100);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([2, 3, 4], 1, false);
      index.addPoint([2, 3, 4], 2, false);
      index.addPoint([2, 3, 4], 3, false);
      index.markDeleteItems([1, 3]);
      expect(index.getUsedLabels()).toEqual(expect.arrayContaining([0, 2]));
      expect(index.getDeletedLabels()).toEqual(expect.arrayContaining([1, 3]));
    });
  });

  describe('#getPoint', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('when the index is not initialized, then throws when an empty array if called before the index is initialized', () => {
      expect(() => index.getPoint(0)).toThrow(testErrors.indexNotInitalized);
    });

    describe('when the index has some data points', () => {
      beforeAll(() => {
        index.initIndex(3, ...defaultParams.initIndex);
        index.addPoint([1, 2, 3], 0, false);
        index.addPoint([2, 3, 4], 1, false);
        index.addPoint([3, 4, 5], 2, false);
      });

      it('throws an error if no arguments are given', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.getPoint();
        }).toThrow(testErrors.arugmentCount);
      });

      it('throws an error if given a non-Number argument', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.getPoint('0');
        }).toThrow(testErrors.unsignedIntArgument);
      });

      it('throws an error if specified a non-existent datum point', () => {
        expect(() => {
          index.getPoint(3);
        }).toThrow('HNSWLIB ERROR: Label not found');
        index.resizeIndex(4);
        index.addPoint([4, 5, 6], 3, false);
        index.markDelete(3);
        expect(() => {
          index.getPoint(3);
        }).toThrow('HNSWLIB ERROR: Label not found');
      });

      it('returns stored datum point', () => {
        expect(index.getPoint(0)).toMatchObject([1, 2, 3]);
        expect(index.getPoint(1)).toMatchObject([2, 3, 4]);
        expect(index.getPoint(2)).toMatchObject([3, 4, 5]);
      });
    });
  });

  describe('#getMaxElements', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws if called before the index is initialized', () => {
      expect(() => index.getMaxElements()).toThrow(testErrors.indexNotInitalized);
    });

    it('returns maximum number of elements', () => {
      index.initIndex(10, ...defaultParams.initIndex);
      expect(index.getMaxElements()).toBe(10);
    });
  });

  describe('#getCurrentCount', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws error if called before the index is initialized', () => {
      expect(() => index.getCurrentCount()).toThrow(testErrors.indexNotInitalized);
    });

    it('returns current number of elements', () => {
      index.initIndex(5, ...defaultParams.initIndex);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([2, 3, 4], 1, false);
      expect(index.getCurrentCount()).toBe(2);
    });
  });

  describe('#getNumDimensions', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('returns number of dimensions', () => {
      expect(index.getNumDimensions()).toBe(3);
    });
  });

  describe('#getEf', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.getEfSearch();
      }).toThrow('Search index has not been initialized, call `initIndex` in advance.');
    });

    it('returns ef parameter value', () => {
      index.initIndex(3, ...defaultParams.initIndex);
      expect(index.getEfSearch()).toBe(10);
    });
  });

  describe('#setEf', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.setEfSearch();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.setEfSearch('0');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.setEfSearch(123);
      }).toThrow('Search index has not been initialized, call `initIndex` in advance.');
    });

    it('sets ef parameter value', () => {
      index.initIndex(3, ...defaultParams.initIndex);
      index.setEfSearch(123);
      expect(index.getEfSearch()).toBe(123);
    });
  });

  describe('#addPoint', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.addPoint();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Array object to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.addPoint('[1, 2, 3]', 0, false);
      }).toThrow(testErrors.vectorArgument);
    });

    it('throws an error if given a non-Number object to second argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.addPoint([1, 2, 3], '0');
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.addPoint([1, 2, 3], 0, false);
      }).toThrow('Search index has not been initialized, call `initIndex` in advance.');
    });

    it('throws an error if given an array with a length different from the number of dimensions', () => {
      index.initIndex(1, ...defaultParams.initIndex);
      expect(() => {
        index.addPoint([1, 2, 3, 4, 5], 0, false);
      }).toThrow(testErrors.vectorSize);
    });

    it('throws an error if more element is added than the maximum number of elements.', () => {
      index.initIndex(1, ...defaultParams.initIndex);
      index.addPoint([1, 2, 3], 0, false);
      expect(() => {
        index.addPoint([1, 2, 3], 1, false);
      }).toThrow(testErrors.indexSize);
    });
  });

  describe('#markDelete', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.markDelete();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.markDelete('0');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.markDelete(0);
      }).toThrow(testErrors.indexNotInitalized);
    });

    it('marks the element as deleted and deleted element does not show in search', () => {
      index.initIndex(2, 32, 128, 100);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([1, 2, 4], 1, false);
      index.markDelete(1);
      expect(index.searchKnn([1, 2, 4], 1, undefined).neighbors).toEqual([0]);
      expect(index.getDeletedLabels()).toEqual(expect.arrayContaining([1]));
    });
  });

  describe('#unmarkDelete', () => {
    let index: HierarchicalNSW;
    beforeAll(() => {
      index = new testHnswlibModule.HierarchicalNSW('l2', 3);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.unmarkDelete();
      }).toThrow(testErrors.arugmentCount);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.unmarkDelete('0');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.unmarkDelete(0);
      }).toThrow(/Search index has not been initialized, call `initIndex` in advance./);
    });

    it('unmarks the element as deleted', () => {
      index.initIndex(2, ...defaultParams.initIndex);
      index.addPoint([1, 2, 3], 0, false);
      index.addPoint([1, 2, 4], 1, false);
      index.markDelete(1);
      expect(index.searchKnn([1, 2, 4], 1, undefined).neighbors).toEqual([0]);
      index.unmarkDelete(1);
      expect(index.searchKnn([1, 2, 4], 1, undefined).neighbors).toEqual([1]);
    });
  });

  describe('#searchKnn', () => {
    describe('when metric space is "l2"', () => {
      let index: HierarchicalNSW;
      beforeAll(() => {
        index = new testHnswlibModule.HierarchicalNSW('l2', 3);
      });

      beforeAll(() => {
        index.initIndex(3, ...defaultParams.initIndex);
        index.addPoint([1, 2, 3], 0, false);
        index.addPoint([2, 3, 4], 1, false);
        index.addPoint([3, 4, 5], 2, false);
      });

      it('throws an error if no arguments are given', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn();
        }).toThrow(testErrors.arugmentCount);
      });

      it('throws an error if given a non-Array object to first argument', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn('[1, 2, 3]', 2, undefined);
        }).toThrow(testErrors.vectorArgument);
      });

      it('throws an error if given a non-Number object to second argument', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn([1, 2, 3], '2', undefined);
        }).toThrow(testErrors.unsignedIntArgument);
      });

      it('throws an error if given a non-Function to third argument', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn([1, 2, 3], 2, 'fnc');
        }).toThrow(testErrors.isNotFunction);
      });

      it('throws an error if given the number of neighborhoods exceeding the maximum number of elements', () => {
        expect(() => {
          index.searchKnn([1, 2, 5], 4, undefined);
        }).toThrow(
          'Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: 3).'
        );
      });

      it('throws an error if given an array with a length different from the number of dimensions', () => {
        expect(() => {
          index.searchKnn([1, 2, 5, 4], 2, undefined);
        }).toThrow('Invalid the given array length (expected 3, but got 4).');
      });

      it('returns search results based on squared Euclidean distance', () => {
        expect(index.searchKnn([1, 2, 5], 2, undefined)).toMatchObject({
          distances: [3, 4],
          neighbors: [1, 0],
        });
      });
    });

    describe('when metric space is "ip"', () => {
      let index: HierarchicalNSW;
      beforeAll(() => {
        index = new testHnswlibModule.HierarchicalNSW('ip', 3);
      });

      beforeAll(() => {
        index.initIndex(3, ...defaultParams.initIndex);
        index.addPoint([1, 2, 3], 0, false);
        index.addPoint([2, 3, 4], 1, false);
        index.addPoint([3, 4, 5], 2, false);
      });

      it('returns search results based on one minus inner product', () => {
        expect(index.searchKnn([1, 2, 5], 2, undefined)).toMatchObject({
          distances: [-35, -27],
          neighbors: [2, 1],
        });
      });
    });

    describe('when metric space is "cosine"', () => {
      let index: HierarchicalNSW;
      beforeAll(() => {
        index = new testHnswlibModule.HierarchicalNSW('cosine', 3);
      });

      beforeAll(() => {
        index.initIndex(3, ...defaultParams.initIndex);
        index.addPoint([1, 2, 3], 0, false);
        index.addPoint([2, 3, 4], 1, false);
        index.addPoint([3, 4, 5], 2, false);
      });

      it('returns search results based on one minus cosine similarity', () => {
        const res = index.searchKnn([1, 2, 5], 2, undefined);
        expect(res.neighbors).toMatchObject([0, 1]);
        expect(res.distances[0]).toBeCloseTo(1.0 - 20.0 / (Math.sqrt(14) * Math.sqrt(30)), 6);
        expect(res.distances[1]).toBeCloseTo(1.0 - 28.0 / (Math.sqrt(29) * Math.sqrt(30)), 6);
      });
    });

    describe('when filter function is given', () => {
      let index: HierarchicalNSW;
      beforeAll(() => {
        index = new testHnswlibModule.HierarchicalNSW('l2', 3);
      });
      const filter = (label: number) => label % 2 === 0;

      beforeAll(() => {
        index.initIndex(4, ...defaultParams.initIndex);
        index.addPoint([1, 2, 3], 0, false);
        index.addPoint([1, 2, 5], 1, false);
        index.addPoint([1, 2, 4], 2, false);
        index.addPoint([1, 2, 5], 3, false);
      });

      it('returns filtered search results', () => {
        expect(index.searchKnn([1, 2, 5], 4, filter)).toMatchObject({
          distances: [1, 4],
          neighbors: [2, 0],
        });
      });
    });
  });


  describe('index with 1000 points', () => {
    let index: HierarchicalNSW;
    const baseIndexSize = 1000;
    const testVectorData = createVectorData(baseIndexSize, hnswParamsForAda.dimensions);
    const metaData = generateMetadata(baseIndexSize);

    function findIdsWithProperty<keys extends string>(metadata: Record<keys, ItemMetadata>, color: string): string[] {
      const ids: string[] = [];
      for (const id in metadata) {
        if (metadata[id] != null && metadata[id].color === color) {
          ids.push(id);
        }
      }

      return ids;
    }

    beforeAll(async () => {
      metaData[10].color = 'red';
      for (let i = 1; i <= 100; i++) {
        metaData[i.toString()].color = 'red';
      }
    });

    const setup = async (m: number, efConstruction: number, efSearch: number): Promise<number[]> => {
      index = new testHnswlibModule.HierarchicalNSW('l2', hnswParamsForAda.dimensions);
      index.initIndex(baseIndexSize, m, efConstruction, 200);
      const testLabels = index.addItems(testVectorData.vectors, false);
      index.setEfSearch(efSearch);
      return testLabels;
    };

    it(`search with default parameters`, async () => {
      const testLabels = await setup(48, 24, 16);
      const data = index.searchKnn(testVectorData.vectors[10], testLabels[10], undefined);
      expect(data.neighbors).include(testLabels[10]);
      expect(data.distances).toHaveLength(testLabels[10]);
      expect(data.neighbors).toHaveLength(testLabels[10]);
    });

    it(`search with a filter for single label`, async () => {
      const testLabels = await setup(48, 24, 16);
      const data = index.searchKnn(testVectorData.vectors[10], testLabels[10], (label: number) => {
        return label === testLabels[10];
      });
      expect(data.neighbors).include(testLabels[10]);
      expect(data.distances).toHaveLength(1);
      expect(data.neighbors).toHaveLength(1);
    });

    it(`search with a filter callback for metadata red`, async () => {
      const testLabels = await setup(48, 24, 16);

      const data = index.searchKnn(testVectorData.vectors[10], testLabels[100], (label: number) => {
        const ids = findIdsWithProperty(metaData, 'red');
        return ids.includes(label.toString());
      });
      expect(data.neighbors).include(10);
      const result = data.neighbors.map((id: number) => {
        return metaData[id.toString()].color;
      });
      expect(result.every((r: string) => r === 'red')).toBe(true);
    });
  });
});
