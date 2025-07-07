/* eslint-disable @typescript-eslint/ban-ts-comment */
import { testErrors } from '~test/testHelpers';
import { BruteforceSearch, HnswlibModule, L2Space, loadHnswlib } from '~lib/index';

describe('L2Space', () => {
  let hnswlib: HnswlibModule;
  let space: L2Space;

  beforeAll(async () => {
    // Instantiate the Emscripten module
    hnswlib = await loadHnswlib();
    space = new hnswlib.L2Space(3);
  });

  it('throws an error if no arguments are given', () => {
    expect(() => {
      // @ts-expect-error for testing
      new hnswlib.L2Space();
    }).toThrow(/Tried to invoke ctor of L2Space with invalid number of parameters/);
  });

  it('throws an error if given a non-Number argument', () => {
    expect(() => {
      // @ts-expect-error for testing
      new hnswlib.L2Space('yes');
    }).toThrow(/Cannot convert "yes" to unsigned int/);
  });

  describe('#getNumDimensions', () => {
    it('returns number of dimensions', () => {
      expect(space.getNumDimensions()).toBe(3);
    });
  });

  describe('#distance', () => {
    it('throws an error if no arguments are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        space.distance();
      }).toThrow(/function L2Space.distance called with/);
    });

    it('throws an error if 1 argument are given', () => {
      expect(() => {
        // @ts-expect-error for testing
        space.distance([1, 1, 3]);
      }).toThrow(/function L2Space.distance called with/);
    });

    it('throws an error if given a non-Array argument', () => {
      expect(() => {
        // @ts-expect-error for testing
        space.distance('foo', [0, 1, 2]);
      }).toThrow(/Cannot read properties of undefined/);
      expect(() => {
        // @ts-expect-error for testing
        space.distance([0, 1, 2], 'bar');
      }).toThrow(/Cannot read properties of undefined/);
    });

    it('throws an error if given an array with a length different from the number of dimensions', () => {
      expect(() => {
        space.distance([0, 1, 2, 3], [3, 4, 5]);
      }).toThrow('Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is 3.');
      expect(() => {
        space.distance([0, 1, 2], [3, 4, 5, 6]);
      }).toThrow('Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is 3.');
    });

    it('calculates squared Euclidean distance between two arrays', () => {
      expect(space.distance([1, 2, 3], [3, 4, 5])).toBeCloseTo(12.0, 8);
      expect(space.distance([0.1, 0.2, 0.3], [0.3, 0.4, 0.5])).toBeCloseTo(0.12, 8);
    });
  });
});
