let defaultParams, hnswParamsForAda, loadHnswlib;
let __tla = (async () => {
  defaultParams = {
    initIndex: [
      32,
      128,
      100
    ]
  };
  hnswParamsForAda = {
    m: 32,
    efSearch: 128,
    efConstruction: 128,
    numNeighbors: 8,
    dimensions: 1538
  };
  let library;
  loadHnswlib = async () => {
    try {
      if (typeof hnswlib !== "undefined" && hnswlib !== null) {
        const lib = hnswlib();
        if (lib != null)
          return lib;
      }
      if (!library) {
        const factoryFunc = (await import("./hnswlib-c96e51e6.js").then(async (m) => {
          await m.__tla;
          return m;
        })).default;
        library = await factoryFunc();
      }
      return library;
    } catch (err) {
      console.error("----------------------------------------");
      console.error("Error initializing the library:", err);
      throw err;
    }
  };
})();
export {
  __tla,
  defaultParams,
  hnswParamsForAda,
  loadHnswlib
};
