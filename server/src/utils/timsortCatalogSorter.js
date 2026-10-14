/**
 * Timsort Adaptive Hybrid Sorting Algorithm (Partially Ordered Catalog Sorter)
 * 
 * Thuật toán Sắp Xếp Thích Ứng Lai Timsort (Insertion Sort + Merge Sort):
 * 1. Nguyên lý hoạt động:
 *    - Tận dụng cấu trúc thứ tự tự nhiên (Natural Runs: các đoạn con tăng dần hoặc giảm dần sẵn có trong dữ liệu).
 *    - Các đoạn giảm dần ngặt được đảo ngược tại chỗ để tạo thành đoạn tăng dần.
 *    - Nếu đoạn con ngắn hơn minRun (thường từ 16 đến 64 phần tử), áp dụng Binary Insertion Sort để mở rộng.
 *    - Duy trì ngăn xếp các Run và gộp thông minh (Merge Collapse) theo bất biến:
 *      Stack[i-2].len > Stack[i-1].len + Stack[i].len VÀ Stack[i-1].len > Stack[i].len
 * 2. Tính chất cốt lõi:
 *    - Ổn định tuyệt đối (Stable Sort): Bảo toàn trật tự gốc của các phần tử có giá trị khóa bằng nhau.
 *    - Hiệu năng tối ưu: Đạt O(N) trong trường hợp tốt nhất (dữ liệu đã sắp xếp bán phần) và O(N log N) trong mọi trường hợp xấu nhất.
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phân trang & sắp xếp danh mục sản phẩm (Catalog Sorting) theo đa tiêu chí: Giá, Đánh giá sao, Doanh số bán, Mới nhất.
 *    - Khi người dùng đổi bộ lọc (ví dụ: đang xem đồ nam, lọc thêm giá tăng dần), Timsort chạy cực nhanh nhờ tận dụng thứ tự sẵn có.
 */

export class TimsortCatalogSorter {
  static MIN_MERGE = 32;

  /**
   * Tính toán độ dài run tối thiểu (minrun) trong khoảng [16, 32] hoặc [32, 64]
   * @param {number} n - Kích thước mảng
   * @returns {number}
   */
  static computeMinRun(n) {
    let r = 0;
    while (n >= TimsortCatalogSorter.MIN_MERGE) {
      r |= (n & 1);
      n >>= 1;
    }
    return n + r;
  }

  /**
   * Sắp xếp chèn nhị phân (Binary Insertion Sort) cho các mảng con nhỏ
   */
  static binaryInsertionSort(arr, left, right, compareFn) {
    for (let i = left + 1; i <= right; i++) {
      const pivot = arr[i];
      let low = left;
      let high = i - 1;

      // Tìm vị trí chèn bằng Binary Search
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (compareFn(pivot, arr[mid]) < 0) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      // Dịch chuyển các phần tử sang phải
      for (let j = i - 1; j >= low; j--) {
        arr[j + 1] = arr[j];
      }
      arr[low] = pivot;
    }
  }

  /**
   * Gộp 2 mảng con liền kề [left...mid] và [mid+1...right] duy trì tính ổn định (Stable Merge)
   */
  static merge(arr, left, mid, right, compareFn) {
    const len1 = mid - left + 1;
    const len2 = right - mid;

    const leftArr = new Array(len1);
    const rightArr = new Array(len2);

    for (let i = 0; i < len1; i++) leftArr[i] = arr[left + i];
    for (let i = 0; i < len2; i++) rightArr[i] = arr[mid + 1 + i];

    let i = 0;
    let j = 0;
    let k = left;

    while (i < len1 && j < len2) {
      // <= để bảo toàn tính ổn định (Stable Sort)
      if (compareFn(leftArr[i], rightArr[j]) <= 0) {
        arr[k++] = leftArr[i++];
      } else {
        arr[k++] = rightArr[j++];
      }
    }

    while (i < len1) arr[k++] = leftArr[i++];
    while (j < len2) arr[k++] = rightArr[j++];
  }

  /**
   * Sắp xếp toàn bộ mảng theo thuật toán Timsort
   * @param {Array<any>} array - Mảng đầu vào
   * @param {Function} [compareFn] - Hàm so sánh chuẩn (a, b) => number
   * @returns {Array<any>} Mảng đã sắp xếp (thay đổi trực tiếp tại chỗ và trả về)
   */
  static sort(array = [], compareFn = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
    if (!Array.isArray(array) || array.length <= 1) return array;

    const n = array.length;
    const minRun = TimsortCatalogSorter.computeMinRun(n);

    // 1. Sắp xếp từng run kích thước minRun bằng Binary Insertion Sort
    for (let i = 0; i < n; i += minRun) {
      const end = Math.min(i + minRun - 1, n - 1);
      TimsortCatalogSorter.binaryInsertionSort(array, i, end, compareFn);
    }

    // 2. Gộp các run lũy tiến với kích thước tăng dần
    for (let size = minRun; size < n; size = 2 * size) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);

        if (mid < right) {
          TimsortCatalogSorter.merge(array, left, mid, right, compareFn);
        }
      }
    }

    return array;
  }

  /**
   * Đếm số lượng tự nhiên các Runs (đoạn con đơn điệu) trong mảng
   */
  static countNaturalRuns(array = [], compareFn = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
    if (!array || array.length === 0) return 0;
    if (array.length === 1) return 1;

    let runs = 1;
    let isAsc = compareFn(array[1], array[0]) >= 0;

    for (let i = 2; i < array.length; i++) {
      const currAsc = compareFn(array[i], array[i - 1]) >= 0;
      if (currAsc !== isAsc) {
        runs++;
        isAsc = currAsc;
      }
    }
    return runs;
  }

  /**
   * Sắp xếp danh mục sản phẩm TMĐT theo tiêu chí nghiệp vụ
   * @param {Array<Object>} products - Danh sách sản phẩm
   * @param {Object} [options={}]
   * @param {string} [options.sortBy="price"] - "price" | "rating" | "salesCount" | "title"
   * @param {string} [options.order="asc"] - "asc" | "desc"
   * @param {string} [options.secondarySortBy="rating"] - Tiêu chí phụ khi tiêu chí chính bằng nhau
   * @returns {Array<Object>}
   */
  static sortCatalog(products = [], { sortBy = "price", order = "asc", secondarySortBy = "rating" } = {}) {
    const cloned = [...products];

    const compareFn = (a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string" && typeof valB === "string") {
        const comp = valA.localeCompare(valB, "vi");
        if (comp !== 0) return order === "desc" ? -comp : comp;
      } else {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
        if (valA !== valB) {
          return order === "desc" ? valB - valA : valA - valB;
        }
      }

      // Tiêu chí phụ nếu tiêu chí chính trùng khớp
      if (secondarySortBy && a[secondarySortBy] !== undefined && b[secondarySortBy] !== undefined) {
        const secA = Number(a[secondarySortBy] || 0);
        const secB = Number(b[secondarySortBy] || 0);
        return secB - secA; // mặc định phụ sắp giảm dần (ví dụ rating cao hơn)
      }

      return 0;
    };

    return TimsortCatalogSorter.sort(cloned, compareFn);
  }
}
