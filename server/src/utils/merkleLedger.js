/**
 * Double-Entry Bookkeeping Ledger & Cryptographic Merkle Tree Audit Trail
 * 
 * Vấn đề:
 * Trong hệ thống sàn TMĐT đa người bán (Multi-Vendor Marketplace):
 * 1. Dòng tiền ký quỹ (Escrow Vault) hàng chục tỷ đồng cần đảm bảo nguyên tắc kế toán kép:
 *    Mọi bút toán tài chính (Khách thanh toán -> Tạm giữ Escrow -> Trích phí sàn 5% -> Trích thuế 2.5% -> Rút tiền Ví Shop)
 *    phải tuyệt đối cân bằng: Tổng Nợ (Debit) = Tổng Có (Credit).
 * 2. Nguy cơ giả mạo dữ liệu quyết toán (Audit Tampering):
 *    Nếu một quản trị viên hoặc kẻ tấn công can thiệp sửa đổi số dư trong Database,
 *    cần có cơ chế phát hiện tức thì bằng mật mã học (Cryptographic Audit Trail).
 * 
 * Giải pháp:
 * 1. DoubleEntryLedger:
 *    - Quản lý 5 nhóm tài khoản chuẩn mực (Tài sản, Nợ phải trả, Vốn, Doanh thu, Chi phí).
 *    - Xác thực bất biến: sum(Debits) === sum(Credits). Nếu lệch 1 đồng lập tức từ chối giao dịch.
 * 2. MerkleTree (Cây băm Merkle - Ralph Merkle 1979):
 *    - Mỗi giao dịch quyết toán tài chính tạo thành một nút lá H_i = SHA256(T_i).
 *    - Băm cặp nút con lên đỉnh cây tạo ra Merkle Root độc nhất (Root Hash).
 *    - Sinh bằng chứng Merkle (Merkle Proof) kích thước O(log N) cho phép chứng minh
 *      một bút toán nằm trong sổ cái mà không cần tải toàn bộ lịch sử kế toán.
 */

/**
 * Thuật toán băm SHA-256 thuần JavaScript (Zero external dependencies)
 * Chạy đồng nhất trên cả Node.js và Trình duyệt Web (Isomorphic)
 */
export function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let currentBlock = 0;
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    currentBlock = (currentBlock << 8) | (code & 0xff);
    if ((i % 4) === 3) {
      words.push(currentBlock >>> 0);
      currentBlock = 0;
    }
  }
  const remaining = ascii[lengthProperty] % 4;
  if (remaining !== 0) {
    currentBlock = (currentBlock << ((4 - remaining) * 8)) >>> 0;
    words.push(currentBlock);
  }

  // Padding bit '1' followed by zeros
  const bitOffset = asciiBitLength % 32;
  const wordIndex = asciiBitLength >>> 5;
  if (words.length <= wordIndex) {
    words.push(0x80000000 >>> 0);
  } else {
    words[wordIndex] = (words[wordIndex] | (0x80 << (24 - bitOffset))) >>> 0;
  }

  while ((words.length % 16) !== 14) {
    words.push(0);
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength >>> 0);

  // Process blocks
  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const s0 = i < 16 ? w[i] : (
        w[i] = (
          (w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0
        )
      );

      const s1 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ ((~hash[0]) & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ((hash[4] & hash[5]) ^ ((~hash[4]) & hash[6])) + k[i] + w[i]) | 0;
      const temp2 = (s1 + ch) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16 ? 0 : "") + b.toString(16));
    }
  }
  return result;
}

export class DoubleEntryLedger {
  constructor() {
    // 5 nhóm tài khoản: ASSETS, LIABILITIES, EQUITY, REVENUE, EXPENSES
    this.accounts = new Map();
    this.transactions = [];

    // Khởi tạo các tài khoản kế toán sàn mặc định
    this._initAccount("ASSETS:ESCROW_BANK", "ASSET");
    this._initAccount("ASSETS:COD_RECEIVABLE", "ASSET");
    this._initAccount("LIABILITIES:MERCHANT_PAYABLE", "LIABILITY");
    this._initAccount("LIABILITIES:TAX_WITHHOLDING", "LIABILITY");
    this._initAccount("REVENUE:PLATFORM_COMMISSION", "REVENUE");
    this._initAccount("EXPENSES:VOUCHER_SUBSIDY", "EXPENSE");
  }

  _initAccount(name, type) {
    if (!this.accounts.has(name)) {
      this.accounts.set(name, {
        name,
        type, // 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
        balance: 0,
        debitTotal: 0,
        creditTotal: 0
      });
    }
  }

  /**
   * Ghi nhận một giao dịch kế toán kép
   * @param {object} tx
   * @param {string} tx.id - Mã giao dịch duy nhất
   * @param {string} tx.description - Diễn giải nghiệp vụ
   * @param {Array<{ account: string, debit?: number, credit?: number }>} tx.entries
   */
  recordTransaction({ id, description = "", entries = [], timestamp = null }) {
    if (!id || !Array.isArray(entries) || entries.length < 2) {
      throw new Error("Transaction must have an id and at least 2 ledger entries");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      if (debit < 0 || credit < 0) {
        throw new Error("Debit and credit amounts must be non-negative");
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    // Kiểm tra tính cân bằng kép (Double-Entry Invariant)
    if (totalDebit !== totalCredit || totalDebit === 0) {
      throw new Error(`LEDGER_IMBALANCE_ERROR: Total Debits (${totalDebit}) must equal Total Credits (${totalCredit})`);
    }

    // Cập nhật số dư từng tài khoản
    for (const entry of entries) {
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      this._initAccount(entry.account, entry.account.startsWith("ASSET") ? "ASSET" : "LIABILITY");
      const acc = this.accounts.get(entry.account);

      acc.debitTotal += debit;
      acc.creditTotal += credit;

      // Quy tắc kế toán:
      // Tài sản (Asset) & Chi phí (Expense): Tăng bên Nợ (Debit), giảm bên Có (Credit)
      // Nợ phải trả (Liability), Vốn & Doanh thu (Revenue): Tăng bên Có (Credit), giảm bên Nợ (Debit)
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        acc.balance += (debit - credit);
      } else {
        acc.balance += (credit - debit);
      }
    }

    const txRecord = {
      id,
      description,
      entries,
      totalAmount: totalDebit,
      timestamp: timestamp || new Date().toISOString()
    };

    this.transactions.push(txRecord);
    return txRecord;
  }

  getBalance(accountName) {
    const acc = this.accounts.get(accountName);
    return acc ? acc.balance : 0;
  }

  /**
   * Bảng cân đối thử (Trial Balance) kiểm toán toàn sàn
   */
  getTrialBalance() {
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;
    const accountList = [];

    for (const acc of this.accounts.values()) {
      grandTotalDebit += acc.debitTotal;
      grandTotalCredit += acc.creditTotal;
      accountList.push({
        name: acc.name,
        type: acc.type,
        debit: acc.debitTotal,
        credit: acc.creditTotal,
        balance: acc.balance
      });
    }

    return {
      isBalanced: grandTotalDebit === grandTotalCredit,
      totalDebit: grandTotalDebit,
      totalCredit: grandTotalCredit,
      discrepancy: Math.abs(grandTotalDebit - grandTotalCredit),
      accounts: accountList
    };
  }
}

export class MerkleTree {
  /**
   * @param {Array<any>} transactions - Danh sách bút toán giao dịch
   */
  constructor(transactions = []) {
    this.leaves = [];
    this.layers = [];

    if (transactions.length > 0) {
      this.buildTree(transactions);
    }
  }

  /**
   * Xây dựng cây Merkle Tree từ danh sách dữ liệu
   */
  buildTree(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      this.leaves = [];
      this.layers = [[]];
      return "";
    }

    // 1. Tạo các nút lá bằng mã băm SHA-256
    this.leaves = transactions.map(tx => {
      const serialized = typeof tx === "string" ? tx : JSON.stringify(tx);
      return sha256(serialized);
    });

    this.layers = [this.leaves];

    // 2. Băm cặp từng tầng lên đỉnh
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        // Nếu số lá lẻ, nhân đôi nút cuối (chuẩn Bitcoin / RFC 6962)
        const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
        const combinedHash = sha256(left + right);
        nextLayer.push(combinedHash);
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return this.getRoot();
  }

  /**
   * Lấy Merkle Root đại diện cho toàn bộ sổ cái
   */
  getRoot() {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) {
      return "";
    }
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Tạo bằng chứng Merkle (Merkle Proof) cho phần tử tại vị trí leafIndex
   */
  getProof(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Invalid leaf index: ${leafIndex}`);
    }

    const proof = [];
    let currentIndex = leafIndex;

    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isRightSibling = currentIndex % 2 === 1;
      const siblingIndex = isRightSibling ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRightSibling ? "left" : "right",
          hash: layer[siblingIndex]
        });
      } else {
        // Nút lẻ nhân đôi
        proof.push({
          position: "right",
          hash: layer[currentIndex]
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Xác thực bằng chứng Merkle trong O(log N)
   * @param {any} transaction - Bút toán cần xác minh
   * @param {Array<{ position: 'left'|'right', hash: string }>} proof
   * @param {string} root - Merkle Root của hệ thống
   */
  static verifyProof(transaction, proof, root) {
    if (!transaction || !proof || !root) return false;

    const serialized = typeof transaction === "string" ? transaction : JSON.stringify(transaction);
    let currentHash = sha256(serialized);

    for (const item of proof) {
      if (item.position === "left") {
        currentHash = sha256(item.hash + currentHash);
      } else {
        currentHash = sha256(currentHash + item.hash);
      }
    }

    return currentHash === root;
  }
}
