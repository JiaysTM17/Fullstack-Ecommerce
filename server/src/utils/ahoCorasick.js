/**
 * Aho-Corasick Multi-Pattern String Matching Algorithm
 * (Thuật toán Quét & Kiểm Duyệt Từ Cấm / Hàng Giả Siêu Tốc)
 * 
 * Vấn đề:
 * Sàn TMĐT cần kiểm duyệt hàng nghìn từ cấm (hàng giả, hàng nhái, nội dung đồi trụy, vũ khí, lừa đảo)
 * trong tiêu đề sản phẩm, mô tả, đánh giá và tin nhắn chat.
 * Nếu dùng regex hoặc chuỗi lặp thông thường: O(K * N) với K từ khóa và N ký tự -> Gây nghẽn CPU.
 * 
 * Giải pháp Aho-Corasick:
 * 1. Cấu trúc cây Trie kết hợp Failure Transitions (liên kết thất bại):
 *    Tương tự thuật toán KMP mở rộng cho nhiều chuỗi (Automaton).
 * 2. Độ phức tạp thời gian tuyến tính O(N + M + Z):
 *    - N: Độ dài văn bản cần quét
 *    - M: Tổng độ dài tất cả các từ khóa trong từ điển
 *    - Z: Số lượng kết quả khớp tìm thấy
 *    => Tốc độ quét văn bản hoàn toàn ĐỘC LẬP với số lượng từ khóa trong từ điển!
 */

class AhoNode {
  constructor() {
    this.children = new Map(); // char -> AhoNode
    this.fail = null; // AhoNode fallback link
    this.output = []; // Danh sách các từ khóa kết thúc tại node này hoặc tổ tiên qua fail link
  }
}

export class AhoCorasick {
  constructor(patterns = []) {
    this.root = new AhoNode();
    this.built = false;

    if (patterns.length > 0) {
      for (const p of patterns) {
        this.addWord(p);
      }
      this.buildFailureLinks();
    }
  }

  /**
   * Thêm từ khóa vào cây tiền tố Trie
   */
  addWord(word) {
    const pattern = String(word || "").trim().toLowerCase();
    if (!pattern) return;

    let curr = this.root;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (!curr.children.has(char)) {
        curr.children.set(char, new AhoNode());
      }
      curr = curr.children.get(char);
    }
    curr.output.push(pattern);
    this.built = false;
  }

  /**
   * Xây dựng liên kết thất bại (Failure Links & Dictionary Links) bằng Breadth-First Search (BFS)
   */
  buildFailureLinks() {
    const queue = [];

    // Khởi tạo các node con bậc 1 trỏ fail link về root
    for (const [, child] of this.root.children.entries()) {
      child.fail = this.root;
      queue.push(child);
    }

    // Duyệt BFS qua toàn bộ cây
    while (queue.length > 0) {
      const current = queue.shift();

      for (const [char, child] of current.children.entries()) {
        let fallback = current.fail;

        while (fallback !== null && !fallback.children.has(char)) {
          fallback = fallback.fail;
        }

        child.fail = fallback ? fallback.children.get(char) : this.root;

        // Kế thừa output patterns từ fallback node (Dictionary Link)
        if (child.fail && child.fail.output.length > 0) {
          child.output = child.output.concat(child.fail.output);
        }

        queue.push(child);
      }
    }

    this.built = true;
  }

  /**
   * Quét văn bản và trả về tất cả các vị trí phát hiện từ cấm
   * @param {string} text - Văn bản cần quét
   * @returns {Array<{ pattern: string, start: number, end: number }>}
   */
  scan(text) {
    if (!this.built) {
      this.buildFailureLinks();
    }

    const input = String(text || "").toLowerCase();
    const matches = [];
    let curr = this.root;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      while (curr !== null && !curr.children.has(char)) {
        curr = curr.fail;
      }

      if (curr === null) {
        curr = this.root;
        continue;
      }

      curr = curr.children.get(char);

      if (curr.output.length > 0) {
        for (const pattern of curr.output) {
          matches.push({
            pattern,
            start: i - pattern.length + 1,
            end: i + 1,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Kiểm tra nhanh xem văn bản có chứa bất kỳ từ cấm nào không
   */
  hasMatch(text) {
    const matches = this.scan(text);
    return matches.length > 0;
  }

  /**
   * Tự động che dấu (Censor) các từ cấm thành ký tự thay thế (ví dụ: '***')
   */
  censor(text, replacement = "***") {
    const matches = this.scan(text);
    if (matches.length === 0) return text;

    const chars = text.split("");
    // Đánh dấu các index bị che
    const masked = new Uint8Array(chars.length);

    for (const m of matches) {
      for (let i = m.start; i < m.end; i++) {
        if (i >= 0 && i < masked.length) {
          masked[i] = 1;
        }
      }
    }

    let result = "";
    let i = 0;
    while (i < chars.length) {
      if (masked[i] === 1) {
        result += replacement;
        // Bỏ qua các ký tự liên tiếp bị mask
        while (i < chars.length && masked[i] === 1) {
          i++;
        }
      } else {
        result += chars[i];
        i++;
      }
    }

    return result;
  }
}
