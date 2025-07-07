/***************** GENERATED FILE ********************/ 
import { HierarchicalNSW } from './index';

const INDEX_FILE_NAME = 'hnswlib-index.bin';

export const saveIndexToOpfs = async (index: HierarchicalNSW & { writeIndexToBuffer: () => Uint8Array }): Promise<void> => {
  const buffer = index.writeIndexToBuffer();
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(INDEX_FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(buffer);
  await writable.close();
};

export const loadIndexFromOpfs = async (index: HierarchicalNSW, maxElements: number): Promise<void> => {
  const root = await navigator.storage.getDirectory();
  try {
    const fileHandle = await root.getFileHandle(INDEX_FILE_NAME);
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    index.readIndexFromBuffer(new Uint8Array(buffer));
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      // Index file doesn't exist, so we'll just initialize a new index.
      index.initIndex(maxElements, 16, 200, 100);
    } else {
      throw error;
    }
  }
};
 
/***************** GENERATED FILE ********************/ 
