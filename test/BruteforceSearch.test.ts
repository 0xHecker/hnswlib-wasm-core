import { BruteforceSearch, HnswlibModule, loadHnswlib } from '~lib/index';
import { testErrors } from '~test/testHelpers';

const arrayToVector = (arr: number[], vector: any) => {
  arr.forEach((x) => vector.push_back(x));
  return vector;
};

describe('BruteforceSearch', () => {
  let hnswlib: HnswlibModule;
  let index: BruteforceSearch;

  beforeAll(async () => {
    // Instantiate the Emscripten module
    hnswlib = await loadHnswlib();
    index = new hnswlib.BruteforceSearch('l2', 3);
  });

  describe('#constructor', () => {
    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        new hnswlib.BruteforceSearch();
      }).toThrow(
        'Tried to invoke ctor of BruteforceSearch with invalid number of parameters (0) - expected (2) parameters instead!'
      );
    });

    it('throws an error if given a non-String object to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new hnswlib.BruteforceSearch(1, 3);
      }).toThrow('Cannot pass non-string to std::string');
    });

    it('throws an error if given a non-Number object to second argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new hnswlib.BruteforceSearch('l2', '3');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if given a String that is neither "l2", "ip", nor "cosine" to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        new hnswlib.BruteforceSearch('coss', 3);
      }).toThrow(/invalid space should be expected l2, ip, or cosine/);
    });
  });

  describe('#initIndex', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('isIndexInitialized is false before init', () => {
      expect(index.isIndexInitialized()).toBe(false);
    });

    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.initIndex();
      }).toThrow('function BruteforceSearch.initIndex called with 0 arguments, expected 1');
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.initIndex('5', 16, 200, 1, 1);
      }).toThrow('function BruteforceSearch.initIndex called with 5 arguments, expected 1');
    });

    it('initIndex it is true if initialized with defaults', () => {
      index.initIndex(5);
      expect(index.isIndexInitialized()).toBe(true);
    });
  });

  describe('#getMaxElements', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('throws if called before the index is initialized', () => {
      expect(() => index.getMaxElements()).toThrow(testErrors.indexNotInitalized);
    });

    it('returns maximum number of elements', () => {
      index.initIndex(10);
      expect(index.getMaxElements()).toBe(10);
    });
  });

  describe('#getCurrentCount', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('returns 0 if called before the index is initialized', () => {
      expect(() => index.getCurrentCount()).toThrow(testErrors.indexNotInitalized);
    });

    it('returns current number of elements', () => {
      index.initIndex(5);
      const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
      index.addPoint(vec1, 0);
      vec1.delete();
      const vec2 = arrayToVector([2, 3, 4], new hnswlib.VectorFloat());
      index.addPoint(vec2, 1);
      vec2.delete();
      expect(index.getCurrentCount()).toBe(2);
    });
  });

  describe('#getNumDimensions', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('returns number of dimensions', () => {
      expect(index.getNumDimensions()).toBe(3);
    });
  });

  describe('#addPoint', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('throws an error if given a non-Array object to first argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.addPoint('[1, 2, 3]', 0);
      }).toThrow('Cannot pass "[1, 2, 3]" as a VectorFloat');
    });

    it('throws an error if called before the index is initialized', () => {
      const vec = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
      expect(() => {
        index.addPoint(vec, 0);
      }).toThrow('Search index has not been initialized, call `initIndex` in advance.');
      vec.delete();
    });

    it('throws an error if given an array with a length different from the number of dimensions', () => {
      index.initIndex(1);
      const vec = arrayToVector([1, 2, 3, 4, 5], new hnswlib.VectorFloat());
      expect(() => {
        index.addPoint(vec, 0);
      }).toThrow(testErrors.vectorSize);
      vec.delete();
    });

    it('throws an error if more element is added than the maximum number of elements.', () => {
      index.initIndex(1);
      const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
      index.addPoint(vec1, 0);
      vec1.delete();
      const vec2 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
      expect(() => {
        index.addPoint(vec2, 1);
      }).toThrow(testErrors.indexSize);
      vec2.delete();
    });
  });

  describe('#removePoint', () => {
    beforeAll(() => {
      index = new hnswlib.BruteforceSearch('l2', 3);
    });

    it('throws an error if given a non-Number argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        index.removePoint('0');
      }).toThrow(testErrors.unsignedIntArgument);
    });

    it('throws an error if called before the index is initialized', () => {
      expect(() => {
        index.removePoint(0);
      }).toThrow('Search index has not been initialized, call `initIndex` in advance.');
    });

    it('removes the element specified by index', () => {
      index.initIndex(2);
      const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
      index.addPoint(vec1, 0);
      vec1.delete();
      const vec2 = arrayToVector([1, 2, 4], new hnswlib.VectorFloat());
      index.addPoint(vec2, 1);
      vec2.delete();
      expect(index.getCurrentCount()).toBe(2);
      index.removePoint(1);
      expect(index.getCurrentCount()).toBe(1);
      const vec3 = arrayToVector([1, 2, 4], new hnswlib.VectorFloat());
      expect(index.searchKnn(vec3, 1, undefined).neighbors).toEqual([0]);
      vec3.delete();
    });
  });

  describe('#searchKnn', () => {
    describe('when metric space is "l2"', () => {
      beforeAll(() => {
        index = new hnswlib.BruteforceSearch('l2', 3);
      });

      beforeAll(() => {
        index.initIndex(3);
        const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
        index.addPoint(vec1, 0);
        vec1.delete();
        const vec2 = arrayToVector([2, 3, 4], new hnswlib.VectorFloat());
        index.addPoint(vec2, 1);
        vec2.delete();
        const vec3 = arrayToVector([3, 4, 5], new hnswlib.VectorFloat());
        index.addPoint(vec3, 2);
        vec3.delete();
      });

      it('throws an error if no arguments are given', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn();
        }).toThrow('function BruteforceSearch.searchKnn called with 0 arguments, expected 3');
      });

      it('throws an error if given a non-Array object to first argument', () => {
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn('[1, 2, 3]', 2);
        }).toThrow('function BruteforceSearch.searchKnn called with 2 arguments, expected 3');
      });

      it('throws an error if given a non-Function object to third argument', () => {
        const vec = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
        expect(() => {
          // @ts-expect-error for testing
          index.searchKnn(vec, 2, 'fnc');
        }).toThrow('Cannot read properties of undefined (reading \'call\')');
        vec.delete();
      });

      it('throws an error if given the number of neighborhoods exceeding the maximum number of elements', () => {
        const vec = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        expect(() => {
          index.searchKnn(vec, 4, undefined);
        }).toThrow(
          'Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: 3).'
        );
        vec.delete();
      });

      it('throws an error if given an array with a length different from the number of dimensions', () => {
        const vec = arrayToVector([1, 2, 5, 4], new hnswlib.VectorFloat());
        expect(() => {
          index.searchKnn(vec, 2, undefined);
        }).toThrow('Invalid the given array length (expected 3, but got 4).');
        vec.delete();
      });

      it('returns search results based on squared Euclidean distance', () => {
        const vec = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        expect(index.searchKnn(vec, 2, undefined)).toMatchObject({
          distances: [3, 4],
          neighbors: [1, 0],
        });
        vec.delete();
      });
    });

    describe('when metric space is "ip"', () => {
      beforeAll(() => {
        index = new hnswlib.BruteforceSearch('ip', 3);
      });

      beforeAll(() => {
        index.initIndex(3);
        const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
        index.addPoint(vec1, 0);
        vec1.delete();
        const vec2 = arrayToVector([2, 3, 4], new hnswlib.VectorFloat());
        index.addPoint(vec2, 1);
        vec2.delete();
        const vec3 = arrayToVector([3, 4, 5], new hnswlib.VectorFloat());
        index.addPoint(vec3, 2);
        vec3.delete();
      });

      it('returns search results based on one minus inner product', () => {
        const vec = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        expect(index.searchKnn(vec, 2, undefined)).toMatchObject({
          distances: [-35, -27],
          neighbors: [2, 1],
        });
        vec.delete();
      });
    });

    describe('when metric space is "cosine"', () => {
      beforeAll(() => {
        index = new hnswlib.BruteforceSearch('cosine', 3);
      });

      beforeAll(() => {
        index.initIndex(3);
        const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
        index.addPoint(vec1, 0);
        vec1.delete();
        const vec2 = arrayToVector([2, 3, 4], new hnswlib.VectorFloat());
        index.addPoint(vec2, 1);
        vec2.delete();
        const vec3 = arrayToVector([3, 4, 5], new hnswlib.VectorFloat());
        index.addPoint(vec3, 2);
        vec3.delete();
      });

      it('returns search results based on one minus cosine similarity', () => {
        const vec = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        const result = index.searchKnn(vec, 2, undefined);
        vec.delete();
        expect(result.neighbors).toMatchObject([0, 1]);
        expect(result.distances[0]).toBeCloseTo(1.0 - 20.0 / (Math.sqrt(14) * Math.sqrt(30)), 6);
        expect(result.distances[1]).toBeCloseTo(1.0 - 28.0 / (Math.sqrt(29) * Math.sqrt(30)), 6);
      });
    });

    describe('when filter function is given', () => {
      beforeAll(() => {
        index = new hnswlib.BruteforceSearch('l2', 3);
      });

      beforeAll(() => {
        index.initIndex(4);
        const vec1 = arrayToVector([1, 2, 3], new hnswlib.VectorFloat());
        index.addPoint(vec1, 0);
        vec1.delete();
        const vec2 = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        index.addPoint(vec2, 1);
        vec2.delete();
        const vec3 = arrayToVector([1, 2, 4], new hnswlib.VectorFloat());
        index.addPoint(vec3, 2);
        vec3.delete();
        const vec4 = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        index.addPoint(vec4, 3);
        vec4.delete();
      });

      it('returns filtered search results', () => {
        const filter = (label: number) => label % 2 == 0;
        const vec = arrayToVector([1, 2, 5], new hnswlib.VectorFloat());
        expect(index.searchKnn(vec, 4, filter)).toMatchObject({
          distances: [1, 4],
          neighbors: [2, 0],
        });
        vec.delete();
      });
    });
  });
});
