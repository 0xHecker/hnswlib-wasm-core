#ifndef EMSCRIPTEN_KEEPALIVE
#define EMSCRIPTEN_KEEPALIVE
#endif

#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <exception>
#include <cstdio>
#include <cmath>
#include <fstream>
#include <memory>
#include <new>
#include <numeric>
#include <string>
#include <vector>
#include <algorithm>
#include <iostream>
#include <stdexcept>
#include "hnswlib/hnswlib.h"

namespace emscripten {
  namespace internal {
    void normalizePoints(std::vector<float>& vec) {
      try {
        std::vector<float>& result = vec;
        const size_t dim = result.size();
        const float norm = std::sqrt(std::fabs(std::inner_product(result.begin(), result.end(), result.begin(), 0.0f)));
        if (norm > 0.0f) {
          for (size_t i = 0; i < dim; i++) result[i] /= norm;
        }
      }
      catch (const std::exception& e) {
        printf("Failed to normalize the point, check vector dimensions: %s\n", e.what());
        throw std::runtime_error("Failed to normalize the point, check vector dimensions: " + std::string(e.what()));
      }
    }

    void normalizePointsPtrs(float* vec, size_t dim) {
      float sum = 0;
      for (size_t i = 0; i < dim; ++i) {
        sum += vec[i] * vec[i];
      }
      float norm = sqrt(sum);
      for (size_t i = 0; i < dim; ++i) {
        vec[i] /= norm;
      }
    }
  }

  std::vector<float> normalizePointsPure(const std::vector<float>& vec) {
    try {
      std::vector<float> result(vec);
      const size_t dim = result.size();
      const float norm = std::sqrt(std::fabs(std::inner_product(result.begin(), result.end(), result.begin(), 0.0f)));
      if (norm > 0.0f) {
        for (size_t i = 0; i < dim; i++) result[i] /= norm;
      }
      return result;
    }
    catch (const std::exception& e) {
      printf("Failed to normalize the point, check vector dimensions: %s\n", e.what());
      throw std::runtime_error("Failed to normalize the point, check vector dimensions: " + std::string(e.what()));
    }
  }

  /*****************/
  class L2Space {
  public:
    uint32_t dim_;
    std::unique_ptr<hnswlib::L2Space> l2space_;

    L2Space(uint32_t dim) {
      if (!dim) {
        printf("Invalid the first argument type, must be a number.\n");
        throw std::invalid_argument("Invalid the first argument type, must be a number.");
      }

      dim_ = dim;
      l2space_ = std::unique_ptr<hnswlib::L2Space>(new hnswlib::L2Space(static_cast<size_t>(dim_)));
    }

    float distance(const std::vector<float>& vec_a, const std::vector<float>& vec_b) {
      if (vec_a.size() != dim_ || vec_b.size() != dim_) {
        printf("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is %d.\n", dim_);
        throw std::invalid_argument("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_) + ".");
      }
      hnswlib::DISTFUNC<float> df = l2space_->get_dist_func();
      return df(vec_a.data(), vec_b.data(), l2space_->get_dist_func_param());
    }


    uint32_t getNumDimensions() { return dim_; }
  };


  /*****************/
  class InnerProductSpace {
  public:
    uint32_t dim_;
    std::unique_ptr<hnswlib::InnerProductSpace> ipspace_;

    InnerProductSpace(uint32_t dim) : dim_(dim) {
      ipspace_ = std::unique_ptr<hnswlib::InnerProductSpace>(new hnswlib::InnerProductSpace(static_cast<size_t>(dim_)));
    }

    float distance(const std::vector<float>& vec_a, const std::vector<float>& vec_b) {
      if (vec_a.size() != dim_ || vec_b.size() != dim_) {
        printf("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is %d.\n", dim_);
        throw std::invalid_argument("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_));
      }
      hnswlib::DISTFUNC<float> df = ipspace_->get_dist_func();
      const float d = df(vec_a.data(), vec_b.data(), ipspace_->get_dist_func_param());
      return d;
    }

    uint32_t getNumDimensions() { return dim_; }
  };


  /*****************/
  class CustomFilterFunctor : public hnswlib::BaseFilterFunctor {
  public:
    CustomFilterFunctor(emscripten::val callback) : callback_(callback) {}

    bool operator()(hnswlib::labeltype id) override {
      if (callback_.isUndefined() || callback_.isNull()) {
        printf("Invalid callback function for CustomFilterFunctor.\n");
        throw std::invalid_argument("Invalid callback function for CustomFilterFunctor.");
      }

      try {
        bool result = callback_.call<bool>("call", emscripten::val::undefined(), id);
        return result;
      }
      catch (const std::exception& e) {
        printf("Failed to call the callback function: %s\n", e.what());
        throw std::invalid_argument("Failed to call the callback function: " + std::string(e.what()));
      }
    }

    // Explicitly declare the destructor with the same exception specification as the base class
    ~CustomFilterFunctor() noexcept = default;

  private:
    emscripten::val callback_;
  };



  /*****************/

  class BruteforceSearch {
  public:
    uint32_t dim_;
    hnswlib::BruteforceSearch<float>* index_;
    hnswlib::SpaceInterface<float>* space_;
    bool normalize_;

    BruteforceSearch(const std::string& space_name, uint32_t dim)
      : index_(nullptr), space_(nullptr), normalize_(false), dim_(dim) {

      if (space_name == "l2") {
        space_ = new hnswlib::L2Space(static_cast<size_t>(dim_));
      }
      else if (space_name == "ip") {
        space_ = new hnswlib::InnerProductSpace(static_cast<size_t>(dim_));
      }
      else if (space_name == "cosine") {
        space_ = new hnswlib::InnerProductSpace(static_cast<size_t>(dim_));
        normalize_ = true;
      }
      else {
        printf("invalid space should be expected l2, ip, or cosine, name: %s\n", space_name.c_str());
        throw std::invalid_argument("invalid space should be expected l2, ip, or cosine, name: " + space_name);
      }
    }

    ~BruteforceSearch() {
      if (space_) delete space_;
      if (index_) delete index_;
    }

    emscripten::val isIndexInitialized() {
      if (index_ == nullptr) {
        return emscripten::val(false);
      }
      else {
        return emscripten::val(true);
      }
    }

    void initIndex(uint32_t max_elements) {
      if (index_) delete index_;
      index_ = new hnswlib::BruteforceSearch<float>(space_, static_cast<size_t>(max_elements));
    }

    void readIndexFromBuffer(const std::vector<char>& buffer) {
      if (index_) delete index_;

      try {
        index_ = new hnswlib::BruteforceSearch<float>(space_);
        index_->loadIndexFromBuffer(buffer, space_);
      }
      catch (const std::runtime_error& e) {
        // Check the error message and re-throw a different error if it matches the expected error
        std::string errorMessage(e.what());
        std::string target = "The maximum number of elements has been reached";

        if (errorMessage.find(target) != std::string::npos) {
          printf("The maximum number of elements in the index has been reached. , please increased the index max_size.  max_size: %zu\n", index_->maxelements_);

          throw std::runtime_error("The maximum number of elements in the index has been reached. , please increased the index max_size.  max_size: " + std::to_string(index_->maxelements_));
        }
        else {
          // Re-throw the original error if it's not the one you're looking for
          throw;
        }
      }
      catch (const std::exception& e) {
        printf("Failed to read the index: %s\n", e.what());
        throw std::runtime_error("Failed to read the index: " + std::string(e.what()));
      }
      catch (...) {
        printf("Failed to read the index.\n");
        throw std::runtime_error("Failed to read the index.");
      }

    }

    std::vector<char> writeIndexToBuffer() {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_->saveIndexToBuffer();
    }

    void addPoint(const std::vector<float>& vec, uint32_t idx) {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      if (vec.size() != dim_) {
        throw std::invalid_argument("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_) + ".");
      }

      std::vector<float> mutableVec = vec;
      if (normalize_) {
        internal::normalizePoints(mutableVec);
      }

      if (index_->cur_element_count == index_->maxelements_) {
        throw std::runtime_error("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: " + std::to_string(index_->maxelements_));
      }

      try {
        index_->addPoint(reinterpret_cast<void*>(mutableVec.data()), static_cast<hnswlib::labeltype>(idx));
      }
      catch (const std::exception& e) {
        throw std::runtime_error("HNSWLIB ERROR: " + std::string(e.what()));
      }
    }

    void removePoint(uint32_t idx) {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      index_->removePoint(static_cast<hnswlib::labeltype>(idx));
    }

    emscripten::val searchKnn(const std::vector<float>& vec, uint32_t k, emscripten::val js_filterFn = emscripten::val::undefined()) {

      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      if (vec.size() != dim_) {
        throw std::invalid_argument("Invalid the given array length (expected " + std::to_string(dim_) + ", but got " +
          std::to_string(vec.size()) + ").");
      }

      if (k > index_->maxelements_) {
        throw std::invalid_argument("Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: " +
          std::to_string(index_->maxelements_) + ").");
      }
      if (k <= 0) {
        throw std::invalid_argument("Invalid the number of k-nearest neighbors (must be a positive number).");
      }

      CustomFilterFunctor* filterFnCpp = nullptr;
      if (!js_filterFn.isNull() && !js_filterFn.isUndefined()) {
        filterFnCpp = new CustomFilterFunctor(js_filterFn);
      }

      std::vector<float> mutableVec = vec;

      if (normalize_) {
        internal::normalizePoints(mutableVec);
      }

      std::priority_queue<std::pair<float, size_t>> knn =
        index_->searchKnn(reinterpret_cast<void*>(mutableVec.data()), static_cast<size_t>(k), filterFnCpp);
      const size_t n_results = knn.size();
      emscripten::val distances = emscripten::val::array();
      emscripten::val neighbors = emscripten::val::array();


      // Reverse the loop order
      for (int32_t i = static_cast<int32_t>(n_results) - 1; i >= 0; i--) {
        auto nn = knn.top();
        distances.set(i, nn.first);
        neighbors.set(i, nn.second);
        knn.pop();
      }

      if (filterFnCpp) delete filterFnCpp;

      emscripten::val results = emscripten::val::object();
      results.set("distances", distances);
      results.set("neighbors", neighbors);

      return results;
    }

    uint32_t getMaxElements() {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_->maxelements_;
    }

    uint32_t getCurrentCount() {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      return index_->cur_element_count;
    }

    uint32_t getNumDimensions() {
      return dim_;
    }
  };


  /***************** *****************/
  /***************** *****************/

  class HierarchicalNSW {
  public:
    uint32_t dim_;
    hnswlib::HierarchicalNSW<float>* index_;
    hnswlib::SpaceInterface<float>* space_;
    /// @brief Lock for mutating the index points: addPoint, addPoints, addItems, markdeleted
    std::mutex mutate_lock_;
    /// @brief Lock for cache
    std::mutex label_cache_lock_;
    /// @brief Cache for used labels populated from index_ by updateUsedLabelsCache()
    bool updateCache_ = false;
    std::vector<uint32_t> usedLabelsCache_;
    /// @brief Cache for deleted labels populated from index_ by updateDeletedLabelsCache()
    std::vector<uint32_t> deletedLabelsCache_;
    bool normalize_;
    std::string autoSaveFilename_ = "";


    HierarchicalNSW(const std::string& space_name, uint32_t dim)
      : index_(nullptr), space_(nullptr), normalize_(false), dim_(dim) {
      if (space_name == "l2") {
        space_ = new hnswlib::L2Space(static_cast<size_t>(dim_));
      }
      else if (space_name == "ip") {
        space_ = new hnswlib::InnerProductSpace(static_cast<size_t>(dim_));
      }
      else if (space_name == "cosine") {
        space_ = new hnswlib::InnerProductSpace(static_cast<size_t>(dim_));
        normalize_ = true;
      }
      else {
        printf("invalid space should be expected l2, ip, or cosine, name: %s\n", space_name.c_str());
        throw std::invalid_argument("invalid space should be expected l2, ip, or cosine, name: " + space_name);
      }
    }

    ~HierarchicalNSW() {
      if (space_) delete space_;
      if (index_) delete index_;
    }

    emscripten::val isIndexInitialized() {
      if (index_ == nullptr) {
        return emscripten::val(false);
      }
      else {
        return emscripten::val(true);
      }
    }


    void initIndex(uint32_t max_elements, uint32_t m = 16, uint32_t ef_construction = 200, uint32_t random_seed = 100) {
      if (index_) delete index_;

      index_ = new hnswlib::HierarchicalNSW<float>(space_, max_elements, m, ef_construction, random_seed, true);
    }

    void readIndexFromBuffer(const std::vector<char>& buffer) {
      if (index_) delete index_;

      try {
        index_ = new hnswlib::HierarchicalNSW<float>(space_);
        index_->loadIndexFromBuffer(buffer, space_);
        updateLabelCaches();
      }
      catch (const std::runtime_error& e) {
        std::string errorMessage(e.what());
        std::string target = "The maximum number of elements has been reached";

        if (errorMessage.find(target) != std::string::npos) {
          throw std::runtime_error("The maximum number of elements in the index has been reached. , please increased the index max_size.  max_size: " + std::to_string(index_->max_elements_));
        }
        else {
          // Re-throw the original error if it's not the one you're looking for
          throw;
        }
      }

    }

    std::vector<char> writeIndexToBuffer() {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_->saveIndexToBuffer();
    }

    void resizeIndex(uint32_t new_max_elements) {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      index_->resizeIndex(static_cast<size_t>(new_max_elements));
    }



    val getPoint(uint32_t label) {
      if (index_ == nullptr) {
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      try {
        std::vector<float> vec = index_->getDataByLabel<float>(static_cast<size_t>(label));
        val point = val::array();
        for (size_t i = 0; i < vec.size(); i++) point.set(i, vec[i]);
        return point;
      }
      catch (const std::runtime_error& e) {
        throw std::runtime_error("HNSWLIB ERROR: " + std::string(e.what()));
      }
    }

    std::vector<uint32_t> getUsedLabels() {
      std::lock_guard<std::mutex> lock(label_cache_lock_);
      if (updateCache_) {
        updateLabelCaches();
      }
      return usedLabelsCache_;
    }

    std::vector<uint32_t> getDeletedLabels() {
      std::lock_guard<std::mutex> lock(label_cache_lock_);
      if (updateCache_) {
        updateLabelCaches();
      }
      return deletedLabelsCache_;
    }

    /// @brief Update local used and deleted labels cache
    void updateLabelCaches() {
      std::lock_guard<std::mutex> lock(label_cache_lock_);
      std::vector<uint32_t> usedLabels;
      std::vector<uint32_t> deletedLabels;
      std::unordered_map<hnswlib::tableint, hnswlib::labeltype> reverse_label_lookup;
      updateCache_ = false;

      for (const auto& kv : index_->label_lookup_) {
        reverse_label_lookup[kv.second] = kv.first;
        if (index_->deleted_elements.find(kv.second) == index_->deleted_elements.end()) {
          usedLabels.push_back(static_cast<uint32_t>(kv.first));
        }
      }

      for (const auto& element : index_->deleted_elements) {
        auto it = reverse_label_lookup.find(element);
        if (it != reverse_label_lookup.end()) {
          deletedLabels.push_back(static_cast<uint32_t>(it->second));
        }
      }

      usedLabelsCache_ = std::move(usedLabels);
      deletedLabelsCache_ = std::move(deletedLabels);
    }




    /// @brief Create labels based on the current used labels and labels marked deleted
    /// @param size input array size
    /// @param replace_deleted true if we want to reuse deleted labels
    /// @return 
    std::vector<uint32_t> generateLabels(size_t size, bool replace_deleted) {
      std::vector<uint32_t> labels;

      {
        std::lock_guard<std::mutex> guard1(index_->label_lookup_lock);
        std::lock_guard<std::mutex> guard2(index_->deleted_elements_lock);

        // Determine the current maxLabel, its incremented later before use
        int64_t maxLabel = -1;
        for (const auto& pair : index_->label_lookup_) {
          if (pair.first > maxLabel) {
            maxLabel = pair.first;
          }
        }

        if (replace_deleted) {
          // Fill with deleted labels first
          for (const auto& pair : index_->label_lookup_) {
            if (index_->deleted_elements.find(pair.second) != index_->deleted_elements.end()) {
              labels.push_back(static_cast<uint32_t>(pair.first));
              if (labels.size() == size) {
                return labels;
              }
            }
          }
        }

        // If not enough deleted labels or replace_deleted is false, generate new ones
        while (labels.size() < size) {
          labels.push_back(static_cast<uint32_t>(++maxLabel));
        }
      }

      return labels;
    }

    std::vector<uint32_t> addItems(const std::vector<std::vector<float>>& vec, bool replace_deleted = false) {
      std::lock_guard<std::mutex> lock(mutate_lock_);

      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      if (vec.size() <= 0) {
        printf("The number of vectors and ids must be greater than 0.\n");
        throw std::runtime_error("The number of vectors and ids must be greater than 0.");
      }

      if (index_->cur_element_count + vec.size() > index_->max_elements_) {
        printf("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: %zu\n", index_->max_elements_);
        throw std::runtime_error("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: " + std::to_string(index_->max_elements_));
      }

      {
        std::lock_guard<std::mutex> lock(index_->global);
        // Generate labels for the vectors to be added
        std::vector<uint32_t> labels = generateLabels(vec.size(), replace_deleted);

        try {
          for (size_t i = 0; i < vec.size(); ++i) {
            if (vec[i].size() != dim_) {
              printf("Invalid vector size at index %zu. Must be equal to the dimension of the space. The dimension of the space is %d.\n", i, dim_);
              throw std::invalid_argument("Invalid vector size at index " + std::to_string(i) + ". Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_) + ".");
            }

            std::vector<float> mutableVec = vec[i];

            if (normalize_) {
              internal::normalizePoints(mutableVec);
            }

            index_->addPoint(reinterpret_cast<void*>(mutableVec.data()), static_cast<hnswlib::labeltype>(labels[i]), replace_deleted);
          }
          updateCache_ = true;
          return labels;
        }
        catch (const std::exception& e) {
          printf("Could not addItems %s\n", e.what());
          throw std::runtime_error("Could not addItems " + std::string(e.what()));
        }
      }
    }

    void addPoint(const std::vector<float>& vec, uint32_t idx, bool replace_deleted = false) {
      std::lock_guard<std::mutex> lock(mutate_lock_);

      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      if (vec.size() != dim_) {
        printf("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is %d.\n", this->dim_);
        throw std::invalid_argument("Invalid vector size. Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_) + ".");
      }

      std::vector<float> mutableVec = vec;

      if (normalize_) {
        internal::normalizePoints(mutableVec);
      }

      if (index_->cur_element_count == index_->max_elements_) {
        printf("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: %zu\n", index_->max_elements_);
        throw std::runtime_error("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: " + std::to_string(index_->max_elements_));
      }

      try {
        index_->addPoint(reinterpret_cast<void*>(mutableVec.data()), static_cast<hnswlib::labeltype>(idx), replace_deleted);
        updateCache_ = true;
      }
      catch (const std::exception& e) {
        printf("HNSWLIB ERROR: %s\n", e.what());
        throw std::runtime_error("HNSWLIB ERROR: " + std::string(e.what()));
      }
    }

    /// @brief Related to addItems which has automatic labeling logic.
    /// @param vec 
    /// @param idVec 
    /// @param replace_deleted 
    void addPoints(const std::vector<std::vector<float>>& vec, const std::vector<uint32_t>& idVec, bool replace_deleted = false) {
      std::lock_guard<std::mutex> lock(mutate_lock_);
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      if (vec.size() != idVec.size()) {
        printf("The number of vectors and ids must be the same.\n");
        throw std::runtime_error("The number of vectors and ids must be the same.");
      }

      if (vec.size() <= 0) {
        printf("The number of vectors and ids must be greater than 0.\n");
        throw std::runtime_error("The number of vectors and ids must be greater than 0.");
      }

      if (index_->cur_element_count + idVec.size() > index_->max_elements_) {
        printf("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: %zu\n", index_->max_elements_);
        throw std::runtime_error("The maximum number of elements has been reached in index, please increased the index max_size.  max_size: " + std::to_string(index_->max_elements_));
      }

      try {
        for (size_t i = 0; i < vec.size(); ++i) {
          if (vec[i].size() != dim_) {
            printf("Invalid vector size at index %zu. Must be equal to the dimension of the space. The dimension of the space is %d.\n", i, dim_);
            throw std::invalid_argument("Invalid vector size at index " + std::to_string(i) + ". Must be equal to the dimension of the space. The dimension of the space is " + std::to_string(this->dim_) + ".");
          }

          std::vector<float> mutableVec = vec[i];

          if (normalize_) {
            internal::normalizePoints(mutableVec);
          }

          index_->addPoint(reinterpret_cast<void*>(mutableVec.data()), static_cast<hnswlib::labeltype>(idVec[i]), replace_deleted);
        }
        updateCache_ = true;
      }
      catch (const std::exception& e) {
        throw std::runtime_error("Could not addPoints " + std::string(e.what()));
      }
    }



    int getMaxElements() {
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_->max_elements_;
    }

    void markDelete(uint32_t idx) {
      std::lock_guard<std::mutex> update_lock(label_cache_lock_);
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      index_->markDelete(static_cast<hnswlib::labeltype>(idx));
      updateLabelCaches();
    }

    void markDeleteItems(const std::vector<uint32_t>& labelsVec) {
      std::lock_guard<std::mutex> update_lock(label_cache_lock_);
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      try {
        for (const hnswlib::labeltype& label : labelsVec) {
          index_->markDelete(static_cast<hnswlib::labeltype>(label));
        }
        updateLabelCaches();
      }
      catch (const std::exception& e) {
        printf("Could not markDeleteItems %s\n", e.what());
        throw std::runtime_error("Could not markDeleteItems " + std::string(e.what()));
      }
    }


    void unmarkDelete(uint32_t idx) {
      std::lock_guard<std::mutex> update_lock(label_cache_lock_);
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      index_->unmarkDelete(static_cast<hnswlib::labeltype>(idx));
      updateLabelCaches();
    }

    emscripten::val searchKnn(const std::vector<float>& vec, uint32_t k, emscripten::val js_filterFn = emscripten::val::undefined()) {
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }

      if (vec.size() != dim_) {
        printf("Invalid the given array length (expected %lu, but got %zu).\n", static_cast<unsigned long>(dim_), vec.size());
        throw std::invalid_argument("Invalid the given array length (expected " + std::to_string(dim_) + ", but got " +
          std::to_string(vec.size()) + ").");
      }

      if (k > index_->max_elements_) {
        printf("Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: %zu).\n", index_->max_elements_);
        throw std::invalid_argument("Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: " +
          std::to_string(index_->max_elements_) + ").");
      }
      if (k <= 0) {
        printf("Invalid the number of k-nearest neighbors (must be a positive number).\n");
        throw std::invalid_argument("Invalid the number of k-nearest neighbors (must be a positive number).");
      }

      CustomFilterFunctor* filterFnCpp = nullptr;
      if (!js_filterFn.isNull() && !js_filterFn.isUndefined()) {
        filterFnCpp = new CustomFilterFunctor(js_filterFn);
      }


      std::vector<float> mutableVec = vec;
      if (normalize_) {
        internal::normalizePoints(mutableVec);
      }

      std::priority_queue<std::pair<float, size_t>> knn =
        index_->searchKnn(reinterpret_cast<void*>(mutableVec.data()), static_cast<size_t>(k), filterFnCpp);
      const size_t n_results = knn.size();
      emscripten::val distances = emscripten::val::array();
      emscripten::val neighbors = emscripten::val::array();

      // Reverse the loop order
      for (int32_t i = static_cast<int32_t>(n_results) - 1; i >= 0; i--) {
        auto nn = knn.top();
        distances.set(i, nn.first);
        neighbors.set(i, nn.second);
        knn.pop();
      }

      if (filterFnCpp) delete filterFnCpp;

      emscripten::val results = emscripten::val::object();
      results.set("distances", distances);
      results.set("neighbors", neighbors);

      return results;
    }

    uint32_t getCurrentCount() const {
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_ == nullptr ? 0 : static_cast<uint32_t>(index_->cur_element_count);
    }

    uint32_t getNumDimensions() const {
      return dim_;
    }

    uint32_t getEfSearch() const {
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      return index_ == nullptr ? 0 : index_->ef_;
    }

    void setEfSearch(uint32_t ef) {
      if (index_ == nullptr) {
        printf("Search index has not been initialized, call `initIndex` in advance.\n");
        throw std::runtime_error("Search index has not been initialized, call `initIndex` in advance.");
      }
      if (index_ != nullptr) {
        index_->setEf(static_cast<size_t>(ef));
      }
    }
  };



  /*****************/

  EMSCRIPTEN_BINDINGS(hnswlib) {
    using namespace emscripten;

    register_vector<float>("VectorFloat");
    register_vector<uint32_t>("VectorInt");
    register_vector<std::vector<float>>("VectorVectorFloat");

    function("normalizePoint", &normalizePointsPure);

    emscripten::class_<L2Space>("L2Space")
      .constructor<uint32_t>()
      .function("distance", &L2Space::distance)
      .function("getNumDimensions", &L2Space::getNumDimensions);

    emscripten::class_<InnerProductSpace>("InnerProductSpace")
      .constructor<uint32_t>()
      .function("distance", &InnerProductSpace::distance)
      .function("getNumDimensions", &InnerProductSpace::getNumDimensions);

    emscripten::class_<CustomFilterFunctor>("CustomFilterFunctor")
      .constructor<emscripten::val>()
      .function("op", &CustomFilterFunctor::operator());

    emscripten::class_<BruteforceSearch>("BruteforceSearch")
      .constructor<std::string, uint32_t>()
      .function("initIndex", &BruteforceSearch::initIndex)
      .function("isIndexInitialized", &BruteforceSearch::isIndexInitialized)
      .function("readIndexFromBuffer", &BruteforceSearch::readIndexFromBuffer)
      .function("writeIndexToBuffer", &BruteforceSearch::writeIndexToBuffer)
      .function("addPoint", &BruteforceSearch::addPoint)
      .function("removePoint", &BruteforceSearch::removePoint)
      .function("searchKnn", &BruteforceSearch::searchKnn)
      .function("getMaxElements", &BruteforceSearch::getMaxElements)
      .function("getCurrentCount", &BruteforceSearch::getCurrentCount)
      .function("getNumDimensions", &BruteforceSearch::getNumDimensions);

    emscripten::class_<HierarchicalNSW>("HierarchicalNSW")
      .constructor<const std::string&, uint32_t>()
      .function("initIndex", &HierarchicalNSW::initIndex)
      .function("isIndexInitialized", &HierarchicalNSW::isIndexInitialized)
      .function("readIndexFromBuffer", &HierarchicalNSW::readIndexFromBuffer)
      .function("writeIndexToBuffer", &HierarchicalNSW::writeIndexToBuffer)
      .function("resizeIndex", &HierarchicalNSW::resizeIndex)
      .function("getPoint", &HierarchicalNSW::getPoint)
      .function("addPoint", &HierarchicalNSW::addPoint)
      .function("addPoints", &HierarchicalNSW::addPoints)
      .function("addItems", &HierarchicalNSW::addItems)
      .function("getUsedLabels", &HierarchicalNSW::getUsedLabels)
      .function("getDeletedLabels", &HierarchicalNSW::getDeletedLabels)
      .function("getMaxElements", &HierarchicalNSW::getMaxElements)
      .function("markDelete", &HierarchicalNSW::markDelete)
      .function("markDeleteItems", &HierarchicalNSW::markDeleteItems)
      .function("unmarkDelete", &HierarchicalNSW::unmarkDelete)
      .function("getCurrentCount", &HierarchicalNSW::getCurrentCount)
      .function("getNumDimensions", &HierarchicalNSW::getNumDimensions)
      .function("getEfSearch", &HierarchicalNSW::getEfSearch)
      .function("setEfSearch", &HierarchicalNSW::setEfSearch)
      .function("searchKnn", &HierarchicalNSW::searchKnn);
  }
}
