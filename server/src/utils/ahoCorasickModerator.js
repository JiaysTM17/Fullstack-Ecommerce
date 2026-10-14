/**
 * Aho-Corasick Multi-Pattern Sensitive Content Moderation Engine
 * 
 * Thuật toán So Khớp Chuỗi Đa Mẫu Tuyến Tính Tuyệt Đối O(N + M + Z) (Alfred Aho & Margaret Corasick):
 * 1. Xây dựng cây Trie kết hợp các liên kết thất bại (Failure Links) và liên kết đầu ra (Dictionary/Output Links).
 * 2. Quét đồng thời toàn bộ từ điển nhạy cảm chỉ trong MỘT LƯỢT DUY NHẤT trên văn bản, không duyệt lặp O(K * N).
 * 3. Ứng dụng nghiệp vụ trên Mini Shopee Multi-Vendor:
 *    - OFF_PLATFORM_TRADING: Chặn số điện thoại, Zalo, lôi kéo giao dịch ngoài sàn nhằm trốn phí hoa hồng 5%.
 *    - COUNTERFEIT_BRAND: Chặn hàng nhái, fake, replica 1:1, super fake bảo vệ uy tín Shopee Mall.
 *    - TOXIC_CONTENT: Kiểm duyệt từ ngữ thô tục, khiêu dâm, lừa đảo trong tiêu đề sản phẩm và tin nhắn chat.
 */

export class AhoCorasickNode {
  constructor(char = "") {
    this.char = char;
    this.children = new Map(); // char -> AhoCorasickNode
    this.fail = null;          // Failure link
    this.outputs = [];         // Danh sách các mẫu kết thúc tại nút này: [{ pattern, category, severity }]
  }
}

export class AhoCorasickModerator {
  /**
   * @param {Object[]} [patterns=[]] - Danh sách từ khóa { pattern, category, severity }
   */
  constructor(patterns = []) {
    this.root = new AhoCorasickNode();
    this.totalPatterns = 0;

    if (Array.isArray(patterns) && patterns.length > 0) {
      this.buildAutomaton(patterns);
    }
  }

  /**
   * Nạp từ điển và xây dựng đồ thị máy hữu hạn Aho-Corasick
   * @param {Object[]} patterns
   */
  buildAutomaton(patterns) {
    this.root = new AhoCorasickNode();
    this.totalPatterns = patterns.length;

    // Bước 1: Xây dựng cây tiền tố (Trie)
    for (const item of patterns) {
      const patternText = (typeof item === "string" ? item : item.pattern || "").toLowerCase().trim();
      if (!patternText) continue;

      const meta = typeof item === "string"
        ? { pattern: patternText, category: "GENERAL_SENSITIVE", severity: "MEDIUM" }
        : {
            pattern: patternText,
            category: item.category || "GENERAL_SENSITIVE",
            severity: item.severity || "MEDIUM"
          };

      let curr = this.root;
      for (const char of patternText) {
        if (!curr.children.has(char)) {
          curr.children.set(char, new AhoCorasickNode(char));
        }
        curr = curr.children.get(char);
      }
      curr.outputs.push(meta);
    }

    // Bước 2: Xây dựng Failure Links và Output Links bằng BFS (Queue)
    const queue = [];

    // Các con trực tiếp của root có fail link trỏ về root
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const curr = queue.shift();

      for (const [char, child] of curr.children.entries()) {
        let failureNode = curr.fail;

        while (failureNode !== null && !failureNode.children.has(char)) {
          failureNode = failureNode.fail;
        }

        child.fail = failureNode ? failureNode.children.get(char) : this.root;

        // Kế thừa các output từ nút fail nếu có
        if (child.fail.outputs.length > 0) {
          child.outputs = [...child.outputs, ...child.fail.outputs];
        }

        queue.push(child);
      }
    }
  }

  /**
   * Quét và phát hiện tất cả các vi phạm trong văn bản trong thời gian O(N)
   * @param {string} text - Văn bản cần kiểm duyệt (Tiêu đề sản phẩm, mô tả, tin nhắn chat)
   * @returns {Object}
   */
  scan(text) {
    if (!text || typeof text !== "string") {
      return { isClean: true, matchCount: 0, matches: [], categoriesFound: [] };
    }

    const lowerText = text.toLowerCase();
    let curr = this.root;
    const matches = [];

    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i];

      while (curr !== this.root && !curr.children.has(char)) {
        curr = curr.fail;
      }

      curr = curr.children.has(char) ? curr.children.get(char) : this.root;

      if (curr.outputs.length > 0) {
        for (const out of curr.outputs) {
          const startIndex = i - out.pattern.length + 1;
          matches.push({
            pattern: out.pattern,
            category: out.category,
            severity: out.severity,
            startIndex,
            endIndex: i
          });
        }
      }
    }

    const categoriesFound = Array.from(new Set(matches.map(m => m.category)));
    const hasHighSeverity = matches.some(m => m.severity === "HIGH");

    return {
      isClean: matches.length === 0,
      matchCount: matches.length,
      hasHighSeverity,
      matches,
      categoriesFound
    };
  }

  /**
   * Tự động che mờ các từ cấm trong văn bản bằng ký tự '*'
   * @param {string} text
   * @param {string} [maskChar="*"]
   * @returns {string}
   */
  maskText(text, maskChar = "*") {
    if (!text || typeof text !== "string") return text;
    const { matches } = this.scan(text);
    if (matches.length === 0) return text;

    const chars = text.split("");
    for (const m of matches) {
      for (let i = m.startIndex; i <= m.endIndex; i++) {
        chars[i] = maskChar;
      }
    }
    return chars.join("");
  }
}

export default {
  AhoCorasickNode,
  AhoCorasickModerator
};
