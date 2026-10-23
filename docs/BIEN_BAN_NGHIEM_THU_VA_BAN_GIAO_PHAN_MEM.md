# CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
**Độc lập - Tự do - Hạnh phúc**
***
**Số:** `BB-BGNT/2026/MINISHOPEE-01`
*Hà Nội, ngày 23 tháng 10 năm 2026*

# BIÊN BẢN NGHIỆM THU KỸ THUẬT & BÀN GIAO SẢN PHẨM PHẦN MỀM
### DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE MULTI-VENDOR (PHIÊN BẢN 2.0.0 ENTERPRISE)

---

## CĂN CỨ THỰC HIỆN
- Căn cứ vào Yêu cầu Dự án và Hợp đồng Phát triển Phần mềm số `HĐ-CNTT/2026/SHOPEE-ENTERPRISE`.
- Căn cứ vào Kế hoạch Phát triển Hệ thống và Báo cáo Đặc tả Nghiệp vụ `SRS-MINISHOPEE-V2.0`.
- Căn cứ vào Kết quả Thực thi Bộ Kiểm thử Tự động Toàn diện số `QA-MINISHOPEE-V2.0`.
- Căn cứ vào Biên bản Thử nghiệm Vận hành Thực tế trên môi trường phát triển và Staging.

Hôm nay, ngày 23 tháng 10 năm 2026, tại Trụ sở Dự án, các bên tham gia gồm có:

### ĐẠI DIỆN BÊN GIAO (ĐƠN VỊ PHÁT TRIỂN & CHUYỂN GIAO CÔNG NGHỆ):
- **Đơn vị:** Nhóm Nghiên cứu & Phát triển Kỹ thuật Nền tảng Mini Shopee (R&D Engineering Team)
- **Đại diện:** Kỹ sư Trưởng / Kiến trúc sư Hệ thống (Lead System Architect)
- **Chức vụ:** Trưởng Dự án Kỹ thuật (Technical Project Lead)

### ĐẠI DIỆN BÊN NHẬN (KHÁCH HÀNG / ĐƠN VỊ CHỦ QUẢN HỆ THỐNG):
- **Đơn vị:** Ban Giám Đốc / Hội đồng Nghiệm thu Dự án Phần mềm
- **Đại diện:** Giám đốc Công nghệ / Đại diện Chủ Đầu Tư
- **Chức vụ:** Trưởng Ban Tiếp Nhận & Nghiệm Thu Hệ Thống

Hai bên đã cùng tiến hành kiểm tra, đánh giá kỹ thuật và thống nhất ký kết Biên bản Nghiệm thu & Bàn giao sản phẩm phần mềm theo các nội dung chi tiết dưới đây:

---

## ĐIỀU 1: DANH MỤC CÁC SẢN PHẨM & HỒ SƠ TÀI LIỆU BÀN GIAO

Bên Giao bàn giao đầy đủ cho Bên Nhận toàn bộ gói sản phẩm phần mềm (Software Deliverables Package) bao gồm:

| STT | Tên Sản Phẩm / Tệp Tin Bàn Giao | Định Dạng & Vị Trí Lưu Trữ | Trạng Thái Bàn Giao |
| :---: | :--- | :--- | :---: |
| **1** | **Toàn bộ mã nguồn hệ thống (Full Source Code):**<br>- Frontend React 18 SPA + Vite 5.2<br>- Backend Node.js / Express REST API Gateway<br>- Bộ 86 Phase Thuật toán Doanh nghiệp (Dual-Parity) | Thư mục gốc dự án Git Repository:<br>`client/`<br>`server/`<br>`tests/` | ✔ Đã bàn giao đầy đủ mã nguồn sạch, không mã độc |
| **2** | **Bộ dữ liệu hạt nhân khởi tạo (Seed Data):**<br>- 180 sản phẩm đa ngành hàng có hình ảnh<br>- Gian hàng mẫu Shopee Mall và tài khoản phân quyền | `server/src/seed/productSeed.js`<br>`server/data/store.json` | ✔ Đã nạp và đồng bộ hóa thành công |
| **3** | **Báo cáo Phân tích Yêu cầu & Nghiệp vụ (SRS/BRD)** | `docs/BAO_CAO_PHAN_TICH_YEU_CAU_VA_NGHIEP_VU_SRS.md` | ✔ Đã hoàn thành nghiệm thu |
| **4** | **Báo cáo Thiết kế Kiến trúc & Công nghệ (SAD/TDD)** | `docs/BAO_CAO_THIET_KE_KIEN_TRUC_HE_THONG_SAD.md` | ✔ Đã hoàn thành nghiệm thu |
| **5** | **Báo cáo Nghiên cứu & Phân tích Thuật toán 86 Phase** | `docs/BAO_CAO_NGHIEN_CUU_VA_PHAN_TICH_THUAT_TOAN_DOANH_NGHIEP.md` | ✔ Đã hoàn thành nghiệm thu |
| **6** | **Báo cáo Kiểm thử Chất lượng Toàn diện (QA Report)** | `docs/BAO_CAO_KIEM_THU_CHAT_LUONG_TOAN_DIEN_QA.md` | ✔ Đã hoàn thành nghiệm thu |
| **7** | **Hướng dẫn Cài đặt, Triển khai & Vận hành (Runbook)** | `docs/HUONG_DAN_CAI_DAT_TRIEN_KHAI_VAN_HANH_RUNBOOK.md` | ✔ Đã hoàn thành nghiệm thu |
| **8** | **Sổ tay Hướng dẫn Sử dụng Khách hàng & Người dùng** | `docs/SO_TAY_HUONG_DAN_SU_DUNG_KHACH_HANG.md` | ✔ Đã hoàn thành nghiệm thu |
| **9** | **Cấu hình Đóng gói Container & Máy chủ Web** | `docker-compose.yml`<br>`Dockerfile` (client & server)<br>`nginx.conf` | ✔ Đã kiểm tra build thành công |
| **10** | **Bộ sưu tập kiểm thử API Postman Collection** | `docs/postman_collection.json` | ✔ Đã import và test thành công |

---

## ĐIỀU 2: KẾT QUẢ KIỂM ĐỊNH KỸ THUẬT & TIÊU CHUẨN NGHIỆM THU

Hội đồng tiếp nhận đã chạy kiểm thử trực tiếp trên hệ thống máy chủ và ghi nhận các chỉ số kỹ thuật chính thức:

### 2.1. Kết quả thực thi bộ kiểm thử tự động (Automated Test Execution)
- **Lệnh thực thi:** `npm test` (`node tests/run-all.js`)
- **Tổng số kịch bản kiểm thử:** **3.055 tests**
- **Số ca kiểm thử đạt (Passed):** **3.055 tests (Đạt tỷ lệ 100.0%)**
- **Số ca kiểm thử lỗi (Failed):** **0 tests**
- **Thời gian hoàn tất:** **1.60 giây** (Hiệu năng vượt trội, không có độ trễ)
- **Phân bổ phân tầng:**
  - *Tier 1 (Core Functional & Algorithms):* 2.789/2.789 tests (100%)
  - *Tier 2 (Boundary & Validation Guards):* 230/230 tests (100%)
  - *Tier 3 (Cross-Feature Combinations):* 24/24 tests (100%)
  - *Tier 4 (Real-World E2E Journeys):* 12/12 tests (100%)

### 2.2. Kết quả đóng gói sản phẩm Frontend (Production Build)
- **Lệnh thực thi:** `npm --prefix client run build`
- **Thời gian biên dịch:** **5.57 giây**
- **Mã lỗi phát sinh:** **0 Errors, 0 Warnings**
- **Chất lượng giao diện:** Tuân thủ hệ thống CSS Design Tokens, hỗ trợ đầy đủ Chế độ Tối (Dark Mode) và hiển thị sắc nét trên các thiết bị di động, máy tính bảng và máy tính để bàn.

### 2.3. Đánh giá tính năng nghiệp vụ cốt lõi
1. **Phân hệ Mua sắm (Buyer):** Tìm kiếm thông minh Trie Autocomplete dưới $1\text{ms}$; Xếp chồng ưu đãi 3 tầng (Voucher Shop + Freeship Extra + Khấu trừ Mini Xu); Thanh toán quét mã VietQR tự động; Theo dõi định vị bưu tá SPX Express trực tiếp trên bản đồ GPS; Trợ lý AI Buyer tư vấn chính xác tiếng lóng mua sắm.
2. **Kênh Người Bán (Seller Center):** Quản lý kho hàng an toàn (Safety Stock & DIR); Khởi tạo Flash Sale có rào chắn giá vốn an toàn $1.05 \times \text{COGS}$; Đấu thầu Shopee Ads Simulator đạt mục tiêu ROAS $\ge 3.5\times$; Quản trị ví doanh thu và lệnh rút tiền về ngân hàng minh bạch.
3. **Cổng Quản Trị Sàn (Admin Portal):** Giám sát GMV và Két Ký Quỹ Escrow Vault bảo chứng bất biến; Trích xuất nghĩa vụ thuế TMĐT tự động theo Nghị định 52/2018/NĐ-CP; Phê duyệt giải ngân dòng tiền; Radar DSU phát hiện và cô lập mạng lưới tài khoản ảo Sybil; Trọng tài hoàn tiền tự động công bằng.

---

## ĐIỀU 3: CAM KẾT BẢO HÀNH & HỖ TRỢ KỸ THUẬT (SLA)

Bên Giao cam kết cung cấp dịch vụ bảo hành, bảo trì và hỗ trợ kỹ thuật cho Bên Nhận theo các điều khoản:
1. **Thời hạn bảo hành miễn phí:** **12 tháng** kể từ ngày ký biên bản bàn giao này.
2. **Phạm vi bảo hành:** Khắc phục miễn phí toàn bộ các lỗi phát sinh liên quan đến mã nguồn phần mềm, lỗi logic nghiệp vụ hoặc xung đột phiên bản trong phạm vi tính năng đã bàn giao.
3. **Mức độ cam kết chất lượng dịch vụ (SLA):**
   - **Sự cố Nghiêm trọng (Mức P1 - Hệ thống ngừng hoạt động / Lỗi thanh toán):** Thời gian phản hồi trong vòng **30 phút**, giải pháp xử lý trong vòng **04 giờ**.
   - **Sự cố Trung bình (Mức P2 - Một chức năng phụ bị gián đoạn):** Thời gian phản hồi trong vòng **02 giờ**, xử lý trong vòng **12 giờ**.
   - **Yêu cầu hỗ trợ thông thường (Mức P3 - Hướng dẫn sử dụng / Cấu hình):** Phản hồi và hỗ trợ trong giờ hành chính.
4. **Kênh tiếp nhận sự cố:**
   - Hotline Kỹ thuật 24/7: `1900-MINI-SHOPEE` (1900 6868)
   - Email Kỹ thuật: `support@minishopee.vn` / `devops@minishopee.vn`

---

## ĐIỀU 4: KẾT LUẬN & XÁC NHẬN CỦA CÁC BÊN

1. Bên Nhận xác nhận đã tiếp nhận đầy đủ toàn bộ mã nguồn, cơ sở dữ liệu, bộ tài liệu phân tích kỹ thuật, báo cáo kiểm thử và sổ tay hướng dẫn sử dụng nêu tại Điều 1.
2. Sản phẩm phần mềm đáp ứng hoàn toàn các tiêu chuẩn kỹ thuật, yêu cầu chức năng và chỉ số chất lượng nghiệm thu khắt khe nhất của dự án.
3. Hai bên thống nhất: **CHÍNH THỨC NGHIỆM THU VÀ BÀN GIAO SẢN PHẨM PHẦN MỀM ĐỂ ĐƯA VÀO VẬN HÀNH THƯƠNG MẠI CHÍNH THỨC**.

Biên bản này được lập thành 04 (bốn) bản có giá trị pháp lý như nhau, Bên Giao giữ 02 (hai) bản, Bên Nhận giữ 02 (hai) bản để làm căn cứ lưu trữ và quyết toán hợp đồng.

---

### ĐẠI DIỆN BÊN GIAO
*(Ký, ghi rõ họ tên và đóng dấu)*




__________________________________
**TRƯỞNG NHÓM PHÁT TRIỂN KỸ THUẬT**
*Kỹ Sư Trưởng Hệ Thống Mini Shopee*

---

### ĐẠI DIỆN BÊN NHẬN
*(Ký, ghi rõ họ tên và đóng dấu)*




__________________________________
**ĐẠI DIỆN KHÁCH HÀNG / CHỦ ĐẦU TƯ**
*Chủ Tịch Hội Đồng Nghiệm Thu Dự Án*
