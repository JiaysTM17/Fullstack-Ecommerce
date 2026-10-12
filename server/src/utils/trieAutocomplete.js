/**
 * Trie with Frequency Ranking & Fuzzy Typo-Tolerant Search Engine
 * 
 * Vấn đề:
 * Khi người mua gõ tìm kiếm trên thanh search box của sàn TMĐT (Shopee/Lazada):
 * 1. Cần trả về danh sách gợi ý (Typeahead Autocomplete) trong thời gian < 1ms ngay khi người dùng gõ từng ký tự.
 * 2. Cần xếp hạng các từ khóa phổ biến (Search Volume / Popularity) lên trên đầu.
 * 3. Hỗ trợ tiếng Việt không dấu (gõ "ao khoac" vẫn gợi ý "Áo khoác gió", "Áo khoác bomber").
 * 4. Chịu lỗi chính tả (Typo Tolerance): Người dùng gõ sai 1 ký tự (ví dụ "son mồi" -> gợi ý "Son môi", "iphoen" -> gợi ý "iPhone 15").
 * 
 * Giải pháp: Cây tiền tố Trie kết hợp Max-Heap / Top-K Ranking
 * - Mỗi nút TrieNode lưu danh sách Top-K từ khóa có tần suất cao nhất của nhánh con.
 * - Nhờ bộ đệm Top-K trên từng node, thao tác searchPrefix chỉ tốn O(L) với L là độ dài tiền tố (không cần duyệt toàn bộ cây con).
 * - Tích hợp thuật toán đệ quy tìm kiếm mờ (Fuzzy Search) với ngưỡng sai số Levenshtein Distance <= 1.
 */

/**
 * Chuẩn hóa chuỗi tiếng Việt: loại bỏ dấu thanh, chuyển về chữ thường
 */
export function removeVietnameseTones(str) {
  if (!str) return "";
  let res = String(str).toLowerCase().trim();
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  res = res.replace(/đ/g, "d");
  return res;
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 */
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Xóa
          dp[i][j - 1],     // Thêm
          dp[i - 1][j - 1]  // Thay thế
        );
      }
    }
  }

  return dp[m][n];
}

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.originalText = "";
    this.payload = null;
    this.topSuggestions = []; // Lưu sẵn Top K gợi ý tốt nhất từ nhánh con này
  }

  updateSuggestion(item, maxCapacity = 10) {
    // Tìm và cập nhật hoặc thêm mới
    const existingIndex = this.topSuggestions.findIndex(s => s.text === item.text);
    if (existingIndex >= 0) {
      if (item.frequency > this.topSuggestions[existingIndex].frequency) {
        this.topSuggestions[existingIndex].frequency = item.frequency;
      }
    } else {
      this.topSuggestions.push(item);
    }

    // Sắp xếp giảm dần theo tần suất
    this.topSuggestions.sort((a, b) => b.frequency - a.frequency);

    // Giữ tối đa maxCapacity phần tử
    if (this.topSuggestions.length > maxCapacity) {
      this.topSuggestions.pop();
    }
  }
}

export class TrieAutocomplete {
  constructor({ maxSuggestionsPerNode = 10 } = {}) {
    this.root = new TrieNode();
    this.maxSuggestionsPerNode = maxSuggestionsPerNode;
    this.totalWords = 0;
  }

  /**
   * Chèn một từ khóa kèm tần suất và dữ liệu payload
   * @param {string} text - Từ khóa gốc (ví dụ: "Áo khoác gió")
   * @param {number} frequency - Điểm phổ biến / số lượt tìm kiếm
   * @param {object} payload - Thông tin sản phẩm hoặc danh mục
   */
  insert(text, frequency = 1, payload = null) {
    if (!text || typeof text !== "string") return;

    const normalizedOriginal = text.trim();
    const unaccented = removeVietnameseTones(normalizedOriginal);
    const suggestionItem = {
      text: normalizedOriginal,
      unaccented,
      frequency: Number(frequency),
      payload
    };

    // Chèn 2 đường: đường có dấu gốc và đường không dấu
    this._insertPath(normalizedOriginal.toLowerCase(), suggestionItem);
    if (unaccented !== normalizedOriginal.toLowerCase()) {
      this._insertPath(unaccented, suggestionItem);
    }

    this.totalWords++;
  }

  _insertPath(pathStr, suggestionItem) {
    let curr = this.root;
    curr.updateSuggestion(suggestionItem, this.maxSuggestionsPerNode);

    for (const char of pathStr) {
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode());
      }
      curr = curr.children.get(char);
      curr.updateSuggestion(suggestionItem, this.maxSuggestionsPerNode);
    }

    curr.isEndOfWord = true;
    curr.frequency = Math.max(curr.frequency, suggestionItem.frequency);
    curr.originalText = suggestionItem.text;
    curr.payload = suggestionItem.payload;
  }

  /**
   * Tìm kiếm gợi ý tức thì theo tiền tố (Prefix Autocomplete)
   * Độ phức tạp: O(L) với L là độ dài tiền tố (nhờ bộ đệm Top-K trên từng node)
   */
  searchPrefix(prefix, limit = 5) {
    if (!prefix) return [];

    const norm = prefix.trim().toLowerCase();
    const unaccented = removeVietnameseTones(norm);

    // Thử tìm theo chuỗi nhập vào trước
    let suggestions = this._findPathSuggestions(norm);

    // Nếu không thấy, thử tìm theo phiên bản không dấu
    if (suggestions.length === 0 && unaccented !== norm) {
      suggestions = this._findPathSuggestions(unaccented);
    }

    // Khử trùng lặp theo text gốc và lấy đúng limit
    const uniqueMap = new Map();
    for (const item of suggestions) {
      if (!uniqueMap.has(item.text)) {
        uniqueMap.set(item.text, item);
      }
    }

    return Array.from(uniqueMap.values()).slice(0, limit);
  }

  _findPathSuggestions(pathStr) {
    let curr = this.root;
    for (const char of pathStr) {
      if (!curr.children.has(char)) {
        return [];
      }
      curr = curr.children.get(char);
    }
    return curr.topSuggestions;
  }

  /**
   * Tìm kiếm mờ có khả năng chịu lỗi gõ sai chính tả (Fuzzy Search với Levenshtein <= maxDistance)
   * @param {string} query - Từ khóa tìm kiếm người dùng gõ (ví dụ: "iphoen", "son mồi")
   * @param {number} maxDistance - Số ký tự lỗi tối đa (mặc định: 1)
   * @param {number} limit - Số lượng kết quả trả về
   */
  fuzzySearch(query, maxDistance = 1, limit = 5) {
    if (!query) return [];

    // Trước tiên thử tìm kiếm chính xác
    const exact = this.searchPrefix(query, limit);
    if (exact.length > 0) return exact;

    const normQuery = removeVietnameseTones(query);
    const results = [];

    // Duyệt cây bằng DFS tìm các từ có khoảng cách Levenshtein <= maxDistance
    const currentRow = Array.from({ length: normQuery.length + 1 }, (_, i) => i);

    for (const [char, childNode] of this.root.children.entries()) {
      this._fuzzySearchRecursive(childNode, char, normQuery, currentRow, results, maxDistance);
    }

    // Sắp xếp kết quả theo khoảng cách chỉnh sửa nhỏ nhất, sau đó theo tần suất cao nhất
    results.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.frequency - a.frequency;
    });

    // Khử trùng lặp
    const unique = new Map();
    for (const r of results) {
      if (!unique.has(r.text)) {
        unique.set(r.text, r);
      }
    }

    return Array.from(unique.values()).slice(0, limit);
  }

  _fuzzySearchRecursive(node, char, query, previousRow, results, maxDistance) {
    const columns = query.length + 1;
    const currentRow = [previousRow[0] + 1];

    for (let col = 1; col < columns; col++) {
      const insertCost = currentRow[col - 1] + 1;
      const deleteCost = previousRow[col] + 1;
      const replaceCost = previousRow[col - 1] + (query[col - 1] === char ? 0 : 1);

      currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
    }

    // Nếu tiền tố duyệt đến hiện tại nằm trong khoảng cách maxDistance, gợi ý của nhánh này đều hợp lệ
    if (currentRow[columns - 1] <= maxDistance) {
      for (const item of node.topSuggestions) {
        results.push({
          text: item.text,
          distance: currentRow[columns - 1],
          frequency: item.frequency,
          payload: item.payload
        });
      }
    }

    // Nhánh cắt tỉa: Nếu giá trị nhỏ nhất trong dòng hiện tại <= maxDistance, tiếp tục duyệt cây con
    if (Math.min(...currentRow) <= maxDistance) {
      for (const [nextChar, childNode] of node.children.entries()) {
        this._fuzzySearchRecursive(childNode, nextChar, query, currentRow, results, maxDistance);
      }
    }
  }
}
