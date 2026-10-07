# Kế hoạch nâng cấp giao diện và trải nghiệm toàn sàn

Ngày khảo sát: **07/10/2026**. Dự án: `Website-Thuong-Mai-Dien-Tu-Mini-Plan`.

**Mục tiêu:** phát triển giao diện hiện tại thành một sàn có bản sắc, nội dung có chiều sâu, hành trình mua sắm đáng tin cậy và công cụ vận hành rõ ràng cho cộng đồng, người mua, người bán, quản trị.

**Phạm vi tài liệu:** phân tích và lập kế hoạch. Chưa sửa mã ứng dụng, chưa triển khai thiết kế mới. Những route, component, API và chỉ số mục tiêu ghi là “đề xuất” chưa phải chức năng đã tồn tại.

## Mục lục

1. Cơ sở khảo sát và giới hạn kết luận.
2. Chẩn đoán hiện trạng.
3. Bài học từ trang tham khảo.
4. Định hướng mỹ thuật và hệ thống thiết kế.
5. Kiến trúc thông tin toàn sàn.
6. Khu công khai và khám phá sản phẩm.
7. Toàn bộ hành trình người mua.
8. Cộng đồng mua sắm.
9. Trung tâm người bán.
10. Trung tâm quản trị.
11. Liên thông dữ liệu và kỹ thuật.
12. Responsive, khả năng tiếp cận và hiệu năng.
13. Backlog, lộ trình và nghiệm thu.
14. Danh mục màn hình bàn giao và tài liệu nguồn.

## 1. Cơ sở khảo sát

### 1.1. Những gì đã kiểm tra

- Đọc trực tiếp dự án tại `D:\Personal-portfolio\Website-Thuong-Mai-Dien-Tu-Mini-Plan`.
- Website đang chạy tại `http://localhost:5173/`; đã xem bằng trình duyệt kiểm tra trong Codex. Công cụ chưa kết nối được với Chrome nên đây không phải phiên Chrome đang mở của chủ dự án.
- Đã quan sát hình ảnh và nội dung trang chủ, chi tiết sản phẩm `prod_01`, gian hàng được mở từ sản phẩm, đăng nhập, lịch sử đơn mua, dashboard người bán, bảng đơn hàng shop, dashboard quản trị, bảng kiểm duyệt sản phẩm và giỏ hàng rỗng.
- Đã đọc nội dung hồ sơ tài khoản đang đăng nhập; các tab khác được đối chiếu thêm qua mã nguồn.
- Đã dùng các nút tài khoản trải nghiệm có sẵn để xem vai trò người mua, người bán, quản trị. Không thực hiện đặt hàng, rút tiền, kiểm duyệt, xóa hoặc chỉnh sửa dữ liệu nghiệp vụ.
- Đã kiểm tra trang chủ ở viewport desktop thực đo 1280px và mobile 390px; có thêm quan sát ở khung hẹp khoảng 776px. Không coi việc gọi kích thước viewport là bằng chứng nếu kích thước thực đo chưa khớp.
- Đã mở và xem toàn trang [HealthCare / About](https://www.healthcare.id.vn/about), gồm ảnh, video, các khối nội dung và footer.
- Đã đọc route React, theme/CSS, các trang lớn, service phía client và route Express để phân biệt UI thật, dữ liệu mẫu và phần cần mở rộng.

### 1.2. Giới hạn

- Đây là khảo sát UX/UI có đối chiếu mã nguồn, không phải kiểm thử end-to-end đầy đủ hoặc kiểm toán bảo mật.
- Checkout, VietQR, các nhánh đổi trả, ví, quyền riêng tư, toàn bộ tab seller/admin được phân tích thêm từ mã; chưa thao tác hết mọi trạng thái trên trình duyệt.
- Không đo Lighthouse, Core Web Vitals hay tỷ lệ chuyển đổi trong đợt này. Các ngưỡng về sau là mục tiêu nghiệm thu đề xuất, không phải kết quả hiện tại.
- Chưa kiểm tra dark mode trực quan trên mọi màn hình. Nhận xét về màu theme dựa trên `theme.css`.
- Số sản phẩm, người dùng, đơn hàng là ảnh chụp trạng thái dữ liệu tại thời điểm khảo sát; không dùng làm số liệu kinh doanh cố định.
- Tài liệu `PROJECT.md` mô tả một đợt hiện đại hóa đang có các mốc M1–M5. Kế hoạch này là lớp nâng cấp tiếp theo; cần rà lại phần nào đã hoàn thành trước khi tạo ticket để tránh làm trùng.

## 2. Chẩn đoán hiện trạng

### 2.1. Nền tảng nên giữ lại

Sàn đã có nhiều thành phần hữu ích: tìm kiếm/lọc, danh mục, chi tiết sản phẩm, biến thể, xem nhanh, yêu thích, so sánh, giỏ hàng nhiều shop, checkout nhiều bước, voucher, xu, lịch sử đơn, theo dõi giao hàng, đánh giá, Q&A, gian hàng và dashboard nhiều vai trò. React Router, context và các stylesheet theo nghiệp vụ đã được tổ chức thành nền tảng có thể nâng cấp dần.

Vấn đề chính không nằm ở số lượng nút. Sàn đang thiếu một trật tự xuyên suốt: điều gì quan trọng trước, thông tin nào có căn cứ, khi nào cần xem sâu hơn và vai trò nào đang làm việc gì.

### 2.2. Phát hiện có căn cứ

Quy ước: **UI** = thấy trực tiếp; **Code** = thấy trong mã; **Đề xuất** = hướng cải thiện cần triển khai.

| ID | Bằng chứng hiện tại | Tác động | Hướng xử lý | Ưu tiên |
|---|---|---|---|---|
| A01 | UI: tại viewport 390px, `documentElement.scrollWidth` khoảng 893px; header/tìm kiếm bị khuất | Điện thoại không thể đọc và thao tác đầy đủ | Sửa cấu trúc co giãn, grid, thanh tìm kiếm, bộ lọc; không chữa bằng cách che toàn bộ overflow | P0 |
| A02 | UI: header tối, nhiều icon nhiều màu, nút gradient, badge, bóng đổ xuất hiện cùng lúc | Không có điểm nhấn rõ, cảm giác nhiều module ghép lại | Giảm trang trí, quy định cấp nhấn, làm rõ nền/bề mặt/overlay | P0 |
| A03 | UI + Code: cùng Header, Footer, mobile nav, chat widget bao quanh buyer/seller/admin trong `App.jsx` | Công cụ bán hàng/quản trị vẫn bị thanh khuyến mãi mua sắm chiếm chỗ | Tách layout theo vai trò và ngữ cảnh | P0 |
| A04 | UI: thương hiệu Fullstack E-Commerce đi cùng Shopee Mall, Amazon's Choice, Shopee Xu, Shopee Chat | Bản sắc thiếu nhất quán, khó hiểu ai chịu trách nhiệm | Tạo bộ tên/nhãn riêng; giữ tên đối tác chỉ khi đúng quan hệ | P0 |
| A05 | UI: PDP `prod_01` có 342 đánh giá ở đầu, bên dưới “Tất cả (0)” và chưa có đánh giá | Người mua không thể kiểm chứng điểm số | Một nguồn thống kê đánh giá; trạng thái chưa có đánh giá đúng nghĩa | P0 |
| A06 | UI: đổi trả 30 ngày ở trang chủ/PDP, 15 ngày ở đơn hàng/gian hàng | Quyết định mua dựa vào chính sách mâu thuẫn | Cấu hình chính sách theo hàng/shop; lưu bản chụp chính sách vào đơn | P0 |
| A07 | UI + Code: flash sale có mốc 09:00 cố định, countdown khởi tạo lại và phần trăm bán tính theo công thức | Tạo cảm giác khan hiếm không tương ứng chiến dịch thật | Dùng thời gian, quota, trạng thái từ chiến dịch; dữ liệu demo phải phân biệt | P0 |
| A08 | UI + Code: seller hiện +15.4%; biểu đồ 7 ngày nhân tổng doanh thu với tỷ lệ cứng | Dashboard đẹp nhưng không hỗ trợ quyết định đúng | KPI có định nghĩa, khoảng ngày, dữ liệu nguồn và so sánh kỳ | P0 |
| A09 | UI + Code: admin hiện GMV 0đ nhưng +18.4%, tỷ lệ duyệt 95% cố định | Trạng thái không dữ liệu bị trình bày thành kết quả kinh doanh | Hiển thị chưa đủ dữ liệu, không bịa tăng trưởng | P0 |
| A10 | Code: kiểm duyệt sản phẩm, danh mục, đối soát admin có `INITIAL_*` và cập nhật state cục bộ | “Đã duyệt/đã thanh toán” trên UI chưa chứng minh nghiệp vụ đã lưu | Kết nối quy trình server, kiểm tra lại sau tải trang | P0/P1 |
| A11 | UI + Code: cộng đồng hiện là Q&A và reviews trong PDP; chưa có route cộng đồng độc lập | Nội dung hữu ích khó khám phá, thiếu hành trình quay lại | Mở Community Hub dựa trên Q&A/reviews, rồi thêm bài trải nghiệm và cẩm nang | P1 |
| A12 | UI + Code: footer rất dài, chứa nguồn cảm hứng thiết kế/kiến trúc; nhiều mục hỗ trợ là text/span | Nội dung dành cho người phát triển chen vào mua sắm; thiếu đường đi thật | Footer ngắn, route hỗ trợ thật; thông tin kỹ thuật chuyển về tài liệu dự án | P0/P1 |
| A13 | UI: cùng shop được thấy 14 sản phẩm ở storefront, 20 ở seller, 41 ở admin | Có thể khác phạm vi/trạng thái dữ liệu nhưng UI không giải thích | Chuẩn hóa bộ lọc, nguồn dữ liệu, nhãn “đang bán/tất cả/đã duyệt” | P0 |
| A14 | Code: nhiều chức năng seller/profile/Q&A có localStorage hoặc fallback | Trải nghiệm giữa thiết bị/vai trò có nguy cơ không đồng nhất | Phân tách chế độ demo và dữ liệu vận hành; thể hiện lỗi đồng bộ | P0/P1 |
| A15 | Code: `filters` ở HomePage không đưa `brand` vào dù có UI thương hiệu và kiểm tra `filters.brand` | Bộ lọc hiển thị có thể không được truyền xuyên luồng | Đưa vào checklist xác minh lọc đầu-cuối, sửa contract nếu tái hiện | P0 |
| A16 | Code: các tab discovery dùng state; best-sellers/new-arrivals/flash-sale gọi danh sách riêng, không truyền cùng bộ lọc | Dễ thấy chip lọc vẫn còn nhưng tập kết quả không theo chip | Chuẩn hóa query và URL; một trạng thái truy vấn có thể chia sẻ | P0 |
| A17 | UI: header/đăng nhập dùng các con số 100.000+, hàng triệu, SLA, chứng nhận; dữ liệu khảo sát nhỏ hơn nhiều | Ngôn ngữ quảng bá vượt quá bằng chứng của sản phẩm demo | Nội dung trung thực, nguồn rõ, bỏ các cam kết chưa có cơ chế thực hiện | P0 |

**P0:** nền móng hoặc vấn đề ảnh hưởng trực tiếp thao tác/độ tin cậy. **P1:** chiều sâu trải nghiệm cốt lõi. **P2:** tối ưu sau khi luồng cốt lõi ổn định. Đây là ưu tiên sản phẩm, không phải phân loại mức độ lỗ hổng bảo mật.

### 2.3. Vì sao chưa có chiều sâu

1. **Thiếu phân cấp:** nhiều khối cùng có viền, nền, shadow, icon và badge; khối quyết định mua không nổi hơn khối phụ.
2. **Thiếu nhịp nội dung:** homepage nối banner, danh mục, deal và catalog, nhưng thiếu các câu chuyện sử dụng, hướng dẫn chọn và bằng chứng từ người mua.
3. **Thiếu lớp thông tin:** nhấn vào một chỉ số/chính sách chưa luôn dẫn đến chi tiết có thể kiểm chứng.
4. **Thiếu liên tục:** community, sản phẩm, shop, đơn hàng và quản trị chưa tạo thành một vòng hoạt động thống nhất.
5. **Thiếu tính xác thực:** số mẫu và trạng thái giả lập làm giao diện khó tạo niềm tin dù có nhiều huy hiệu.

Chiều sâu cần được xây bằng nội dung, cấu trúc, dữ liệu và tương tác. Thêm shadow, animation hoặc nhiều section hơn chỉ giải quyết một phần rất nhỏ.

## 3. Vận dụng trang tham khảo

[Trang About của HealthCare](https://www.healthcare.id.vn/about) có các lớp thông tin dễ nhận ra: giới thiệu, câu chuyện, nguyên tắc, quy mô và hành động tiếp theo. Khoảng trắng, hệ chữ và ảnh/video giúp từng phần có vai trò riêng. Đây là nhận xét về cách trình bày đã quan sát, không phải xác minh các tuyên bố của website đó.

| Nguyên tắc học được | Chuyển sang sàn thương mại |
|---|---|
| Một ý chính trong mỗi phần | Mỗi section trả lời một nhu cầu mua cụ thể |
| Ảnh giúp hiểu chủ thể | Ảnh đúng SKU, người dùng thật, không gian sử dụng |
| Thông tin tăng dần mức chi tiết | Tóm tắt sản phẩm rồi đến thông số, chính sách, đánh giá |
| Nhịp nội dung có thay đổi | Xen catalog với bộ sưu tập và nội dung tư vấn ngắn |
| Bước tiếp theo rõ | Từ bài tư vấn đến lựa chọn phù hợp và điều kiện mua |

Không sao chép bảng màu, nội dung, khoảng trắng quá lớn hoặc bố cục trang giới thiệu sang các màn hình xử lý đơn. Trang mua sắm phải thấy hàng hóa sớm; seller/admin phải ưu tiên mật độ thông tin và thao tác.

## 4. Định hướng thiết kế

### 4.1. Cá tính mong muốn

**Hiện đại, rõ ràng, đáng tin và có tính khám phá.** Khi mở trang, người dùng nhận ra một thương hiệu riêng, thấy sản phẩm phù hợp và hiểu vì sao nên tin vào thông tin đang đọc.

- Giữ màu xanh hành động hiện có làm điểm nhận diện để tránh thay đổi toàn bộ cùng lúc.
- Nền trung tính sáng; ảnh sản phẩm mang phần lớn màu sắc. Teal dùng cho cam kết đủ điều kiện, đỏ cho cảnh báo/ưu đãi có giới hạn, amber cho trạng thái chờ.
- Header sáng hoặc charcoal gọn với mảng màu phẳng; chọn một phương án sau thử nghiệm trang chủ/PDP. Đề xuất ưu tiên header sáng để giảm độ nặng hiện tại.
- Chỉ dùng một kiểu thương hiệu ở cả bốn khu vực; khác nhau ở bố cục và mật độ, không đổi màu thương hiệu theo role.
- Tên “Fullstack E-Commerce” có thể giữ làm tên tạm; lựa chọn tên thương mại là quyết định nội dung riêng, không tự đổi tên trong giai đoạn chỉnh UI.

### 4.2. Năm lớp tạo chiều sâu

| Lớp | Quy tắc áp dụng |
|---|---|
| Nền trang | Trung tính; phân đoạn bằng khoảng cách và đường phân cách |
| Nội dung chính | Lưới rõ, chữ có thứ bậc, ảnh thật; section không bọc trong card lớn |
| Thành phần lặp | Product card/review/card địa chỉ có ranh giới nhẹ khi cần |
| Tương tác | Hover/focus/selected khác biệt; không làm thay đổi kích thước |
| Lớp nổi | Popover/drawer/modal có bóng và nền che; quản lý focus nhất quán |

Không đặt card trong card. Bóng đổ dành cho đối tượng có tính nổi hoặc tương tác; không phủ lên mọi khối. Hạn chế chữ in hoa liên tục, viền màu, icon có hộp nền và hiệu ứng phát sáng.

### 4.3. Token đề xuất

Đây là bảng khởi đầu để thiết kế và kiểm tra tương phản, không phải khẳng định đã đạt WCAG.

| Nhóm | Đề xuất |
|---|---|
| Màu chính | Action `#2563EB`, hover `#1D4ED8`; blue dùng tập trung ở CTA/link/selected |
| Nền và chữ | Page `#F6F7F9`, surface `#FFFFFF`, text `#20242A`, secondary `#59616D`, border `#DCE1E7` |
| Màu chức năng | Trust `#0F766E`, success `#15803D`, warning `#A16207`, danger `#B91C1C`; có token nền nhẹ riêng |
| Dark mode | Page charcoal `#14171B`, surface `#1E2329`, chữ sáng; giữ họ xanh nhận diện, kiểm tra từng cặp màu |
| Typography | Giữ Plus Jakarta Sans/Inter hiện có nếu đọc tiếng Việt tốt; body 16px, data 14px, metadata 12–13px |
| Heading | Page 28–32px, section 22–24px, panel 16–18px; hero thật 36–44px desktop, 28–32px mobile |
| Spacing | Thang 4/8/12/16/24/32/48/64; section khám phá 40–64px, workbench 16–24px |
| Radius | Input/button 6px, item card 8px; pill chỉ cho badge/chip thực sự |
| Container | Storefront tối đa khoảng 1280–1320px; văn bản đọc 680–760px; dashboard tận dụng bề ngang |
| Motion | Hover 120–160ms, drawer 180–240ms; giảm/tắt khi reduced motion; không animate bố cục bảng |
| Layer | Một thang z-index chung cho header, dropdown, sticky action, drawer, modal, toast |

Cỡ chữ đổi theo breakpoint cố định; không dùng `vw` để co chữ. Letter spacing bằng 0. Tiêu đề dài phải xuống dòng hợp lý; bảng có quy tắc rút gọn và xem đầy đủ.

### 4.4. Bộ component nền

- `Button`, `IconButton`, `TextLink`: primary/secondary/destructive, loading và disabled; một primary theo khu vực tác vụ.
- `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `QuantityStepper`: nhãn thật, lỗi theo trường, trạng thái đã sửa.
- `Tabs`, `Breadcrumbs`, `FilterBar`, `FilterChip`, `Pagination`: đồng bộ URL khi thay đổi nội dung trang.
- `StatusBadge`, `PriceBlock`, `RatingSummary`, `DeliveryPromise`: dữ liệu và quy tắc hiển thị chung.
- `Dialog`, `Drawer`, `Popover`, `Toast`, `InlineAlert`: Escape, focus trap, trả focus, đóng bằng cách nhất quán.
- `DataTable`, `Metric`, `Timeline`, `EmptyState`, `Skeleton`, `ErrorState`: mẫu chung, không mỗi trang một cách.
- Dùng icon hiện có trong `OrdersIcons.jsx` qua interface thống nhất. Chỉ thêm thư viện icon khi có nhu cầu thực; không thay toàn bộ chỉ để đổi phong cách.
- Nút công cụ dùng icon quen thuộc kèm tooltip; CTA quan trọng dùng icon + nhãn ngắn. Swatch cho màu, radio cho lựa chọn, switch cho bật/tắt.

## 5. Kiến trúc thông tin

### 5.1. Bốn không gian và các layout

| Không gian | Layout đề xuất | Điều hướng chính |
|---|---|---|
| Công khai/người mua | `StorefrontLayout` | Mua sắm, Danh mục, Bộ sưu tập, Ưu đãi, Cộng đồng |
| Tài khoản người mua | `AccountLayout` trong storefront | Đơn hàng, Địa chỉ, Yêu thích, Ưu đãi, Hoạt động cộng đồng, Bảo mật |
| Cộng đồng | `CommunityLayout` dùng header thương hiệu gọn | Dành cho bạn, Chủ đề, Hỏi đáp, Cẩm nang, Đã lưu |
| Người bán | `SellerLayout` | Tổng quan, Đơn hàng, Sản phẩm, Kho, Marketing, Hộp thư, Tài chính, Gian hàng |
| Quản trị | `AdminLayout` | Vận hành, Kiểm duyệt, Đơn/khiếu nại, Shop, Người dùng, Nội dung, Tài chính, Quyền |
| Thanh toán/đăng nhập | `CheckoutLayout` / `AuthLayout` | Nhận diện ngắn, quay lại đúng nơi, trợ giúp |

Seller/admin có nút “Xem sàn” hoặc “Xem gian hàng”, không cần danh mục mua sắm, flash sale và giỏ hàng trong header công việc. Footer marketing không xuất hiện ở workbench.

### 5.2. Route đích đề xuất

| Hiện tại | Hướng phát triển |
|---|---|
| `/` vừa homepage vừa search/catalog | `/` cho khám phá; `/search`, `/categories/:slug`, `/collections/:slug`, `/deals` cho mục đích cụ thể |
| `/products/:id` | Giữ route; bổ sung anchors nội dung và trạng thái biến thể có thể chia sẻ khi phù hợp |
| `/shop/:shopId` | Giữ route; tab Sản phẩm, Bộ sưu tập, Đánh giá, Câu chuyện |
| `/profile?tab=...`, `/orders`, `/wishlist` | Giữ tương thích; tổ chức dưới `/account/*` theo giai đoạn, redirect đường cũ |
| Chưa có community route | `/community`, `/community/topics/:slug`, `/community/posts/:id`, `/community/questions/:id`, `/guides/:slug` |
| `/seller/dashboard` + tab state | `/seller/overview`, `/seller/orders`, `/seller/orders/:id`, `/seller/products`, `/seller/products/:id/edit`, các nhánh tương ứng |
| `/admin/dashboard` + tab state | `/admin/overview`, `/admin/moderation`, `/admin/cases/:id`, `/admin/shops/:id`, các nhánh tương ứng |
| Footer phần lớn chưa có đích riêng | `/about`, `/help`, `/policies/returns`, `/policies/shipping`, `/contact` |

Không đổi route cũ hàng loạt trong một lần. Mỗi lần tách một nghiệp vụ cần giữ link cũ, query/filter, nút Back và khả năng tải lại trang.

## 6. Khu công khai và khám phá

### 6.1. Header, tìm kiếm và điều hướng

**Hiện tại:** nhiều hàng và mục nhỏ, vùng thương hiệu/search/actions tranh chỗ; mobile tràn.

**Thiết kế đích:**

- Desktop: hàng chính gồm thương hiệu, search co giãn, tài khoản và giỏ; hàng phụ ngắn gồm danh mục, bộ sưu tập, ưu đãi, cộng đồng.
- Topbar chỉ giữ thông tin thực sự hữu ích. Theme/ngôn ngữ đưa vào menu tài khoản/cài đặt; hotline và trợ giúp có đường đi thật.
- Mobile: hàng đầu logo + thông báo + giỏ; search chiếm một hàng riêng. Không cố nhét layout desktop xuống 390px.
- Search overlay hiển thị lịch sử có thể xóa, gợi ý sản phẩm/danh mục/shop, trạng thái không kết quả, điều hướng bằng bàn phím.
- Sau tìm kiếm, mở ngay vùng kết quả có từ khóa và số lượng; không bắt cuộn qua hero và flash sale.
- Mega menu có cấu trúc ngành hàng thực, đường link “Xem tất cả”, highlight mục đang chọn. Mobile dùng drawer có nút quay lại cấp trước.
- Nhãn “100.000+ sản phẩm” bỏ hoặc lấy số thực; placeholder nên ngắn: “Tìm sản phẩm, thương hiệu, cửa hàng”.

**Nghiệm thu:** search, giỏ, tài khoản truy cập được ở 360px; chọn gợi ý mở đúng đích; đóng overlay trả focus; URL tìm kiếm tải lại được.

### 6.2. Trang chủ

Homepage phải vừa thấy hàng hóa sớm vừa mở ra các tầng khám phá. Không biến thành một trang giới thiệu dài trước khi cho mua hàng.

| Thứ tự | Section đích | Cách tạo chiều sâu | Dữ liệu |
|---|---|---|---|
| 1 | Một chiến dịch chính hoặc bộ sưu tập mùa | Ảnh đúng sản phẩm/ngữ cảnh, một tiêu đề literal, một CTA | CMS chiến dịch + sản phẩm còn bán |
| 2 | Danh mục phổ biến | 8–10 mục dễ nhận diện, ảnh cùng phong cách, xem tất cả | Taxonomy thực |
| 3 | Sản phẩm phù hợp/nổi bật | 6–8 sản phẩm, lý do tuyển chọn ngắn khi có | Bộ tuyển chọn biên tập hoặc lịch sử đã cho phép |
| 4 | Ưu đãi đang diễn ra | Countdown đúng chiến dịch; chỉ một màu nhấn deal | Campaign/quota/giá hiệu lực |
| 5 | Mua theo nhu cầu | Ví dụ góc làm việc, đồ dùng căn hộ, trang phục hằng ngày | Collection có tiêu chí và khoảng giá |
| 6 | Gian hàng đáng khám phá | Ảnh nhận diện, sở trường, số liệu đủ điều kiện | Shop profile + chất lượng dịch vụ |
| 7 | Kinh nghiệm từ cộng đồng | 2–3 bài có ảnh, tiêu đề cụ thể, sản phẩm được nhắc | Nội dung được duyệt |
| 8 | Đã xem gần đây | Hiển thị khi có lịch sử; không lặp rail giống nhau | Recently viewed |
| 9 | Trợ giúp và footer | Chính sách và đầu mối hỗ trợ dễ tìm | Nội dung chính sách |

Không cần hiện tất cả section nếu thiếu nội dung tốt. MVP ưu tiên 1–6 và footer; nội dung cộng đồng xuất hiện khi có nguồn biên tập/kiểm duyệt.

**Hero:** ưu tiên một ảnh bitmap rõ sản phẩm phủ ngang, chữ trên vùng ảnh có khoảng trống tự nhiên; không phủ tối quá mức. Tên bộ sưu tập/danh mục là tiêu đề. Trên desktop, chiều cao khoảng 320–400px; trên mobile khoảng 220–280px tùy ảnh để lộ phần tiếp theo. Nếu giữ carousel, có nút dừng và không tự đổi slide khi đang focus; giảm chuyển động theo tùy chọn hệ thống.

**Không dùng để tạo vẻ “cao cấp”:** bokeh, bóng sáng trang trí, nền gradient toàn trang, mô hình 3D không liên quan, slogan chung chung hoặc nhiều vùng trắng không phục vụ thông tin.

### 6.3. Danh mục, tìm kiếm và bộ lọc

- Category page có tiêu đề rõ, mô tả 1–2 câu, subcategory và sản phẩm ngay sau đó; nội dung hướng dẫn chọn nằm dưới hoặc trong panel riêng.
- Bộ lọc thay đổi theo ngành: thời trang có size/chất liệu, điện tử có cấu hình/tương thích, gia dụng có dung tích/công suất. Chưa có dữ liệu thì không bày bộ lọc giả.
- Sidebar desktop khoảng 220–240px; mobile dùng drawer có “Xem N kết quả”, “Đặt lại” và trạng thái đã chọn.
- Chip hiển thị đầy đủ filter đang tác động; chọn tab không âm thầm bỏ qua filter.
- Sort theo giá/đánh giá/bán chạy dùng cùng tập dữ liệu đã lọc. Thay filter đặt lại trang 1; thay page không làm mất filter.
- Kết quả rỗng phân biệt: không có sản phẩm phù hợp, lỗi mạng, danh mục chưa có hàng. Có gợi ý nới lọc, không tự xóa lựa chọn.
- Pagination ổn định; trở lại từ PDP giữ vị trí catalog. Tránh forced scroll lên đầu khi người dùng cần tiếp tục duyệt.

**Nghiệm thu:** tổ hợp brand + category + giá + sort + page phản ánh đúng URL và kết quả; kiểm thử thêm tab discovery rồi reload/Back.

### 6.4. Product card, quick view và compare

- Khung ảnh tỉ lệ 1:1, dùng `contain` cho ảnh sản phẩm nền sạch; ảnh lifestyle có biến thể trình bày riêng.
- Nội dung thứ tự: tên tối đa 2 dòng, giá hiện tại, giá trước nếu hợp lệ, rating + số review, thông tin giao hàng đủ điều kiện.
- Tối đa 1 badge ưu đãi và 1 tín hiệu tin cậy thực sự có ý nghĩa; hạn chế đánh dấu “hot/best/choice” đồng loạt.
- Không có review thì ghi “Chưa có đánh giá”, không tự hiện 5.0.
- Không dùng whole-card button chứa các button con. Ảnh/tên là link; yêu thích/so sánh là button riêng.
- Sản phẩm cần chọn size/cấu hình mở quick view hoặc PDP; không thêm mặc định một biến thể mà người mua chưa chọn.
- Quick view chỉ chứa thông tin để quyết định nhanh; không sao chép toàn bộ PDP vào modal.
- Compare tối đa 3–4 sản phẩm cùng nhóm thuộc tính; highlight khác biệt, giữ tên/ảnh cố định khi cuộn; mobile từng cặp.

### 6.5. Gian hàng công khai

**Hiện tại:** có cover, avatar, rating/follower, danh mục và catalog; nhiều nhãn Shopee Mall, cam kết chung và khối số liệu lớn.

**Nâng cấp:**

- Đầu trang có cover đúng nhận diện shop, tên, sở trường, vùng gửi hàng, tình trạng shop và nút theo dõi/chat.
- Trust row nhỏ: điểm từ số đánh giá thật, thời gian phản hồi theo kỳ đo, tỷ lệ giao đúng hạn nếu có. Bấm vào có giải thích nguồn.
- Tabs: Sản phẩm, Bộ sưu tập, Đánh giá, Câu chuyện & Chính sách. Search trong shop giữ `shopId` rõ ràng.
- Câu chuyện shop gồm giới thiệu ngắn, ảnh thật, quy trình đóng gói/chọn hàng và lý do chuyên về ngành này; không dùng lời tuyên bố chung.
- Khi shop tạm nghỉ/khóa/ngừng bán, UI phân biệt và giải thích ảnh hưởng tới đơn hiện có.
- Theo dõi shop có trạng thái lưu từ server, tùy chọn nhận thông báo; không ép đăng ký marketing.

### 6.6. About, Help và footer

- `/about`: sàn phục vụ ai, cách chọn shop, hành trình mua được bảo vệ thế nào, con người/vận hành, số liệu có nguồn và đường sang trợ giúp.
- `/help`: tìm theo vấn đề, nhóm mua hàng/đổi trả/thanh toán/tài khoản/người bán; bài có ngày cập nhật và đường mở yêu cầu hỗ trợ.
- Chính sách dùng văn bản dễ quét: điều kiện, ngoại lệ, thời hạn, chi phí, các bước thực hiện. Link ngay từ PDP/cart/order.
- Footer desktop 4 nhóm: Mua sắm, Hỗ trợ, Người bán, Về sàn. Mobile accordion. Thông tin pháp nhân/liên hệ chỉ dùng dữ liệu đúng.
- Thông tin stack, nguồn cảm hứng và tuyên bố kiến trúc chuyển sang README/case study; không lặp dưới mọi màn hình.
- Logo phương thức thanh toán/đơn vị giao hàng chỉ hiện khi đúng tính năng được hỗ trợ; chứng nhận chưa xác minh không hiển thị như đã được cấp.

## 7. Hành trình người mua

### 7.1. Chi tiết sản phẩm (PDP)

**Giữ:** gallery, biến thể, thông số, hộp mua, shop, reviews, Q&A, sản phẩm liên quan.

**Cấu trúc đích desktop:** gallery khoảng 50–55%; thông tin và mua khoảng 45–50%. Hộp mua hiện tại ba cột có thể giữ ở màn hình rất rộng nhưng phải có ngưỡng chuyển hợp lý. Mobile một cột, CTA mua cố định dưới với safe area.

1. Breadcrumb và link danh mục/shop.
2. Gallery ảnh đúng SKU: tổng thể, góc khác, chi tiết vật liệu, kích thước, ảnh trong ngữ cảnh; zoom/lightbox và video nếu có.
3. Tên đọc được, thương hiệu, rating thật, giá và khoảng hiệu lực ưu đãi.
4. Biến thể: swatch + tên màu, size/cấu hình có trạng thái hết hàng, bảng size, tồn kho theo biến thể. Thay biến thể cập nhật ảnh/giá/availability đồng bộ.
5. Địa chỉ hoặc khu vực nhận hàng, phí dự kiến, khoảng ngày giao có căn cứ. Không viết cố định “Ngày mai” cho mọi đơn.
6. CTA chính, số lượng và tóm tắt đổi trả/bảo hành ngắn có đường xem chi tiết.
7. Mô tả có cấu trúc: phù hợp cho ai, điểm nổi bật, thông số, cách sử dụng/bảo quản, thành phần trong hộp.
8. Reviews và Q&A trước rail bán chéo dài. Có sticky anchor nav ở desktop khi cuộn xuống.
9. Sản phẩm tương tự/mua kèm có lý do hợp lý, không gọi “khách cũng mua” nếu chỉ lấy ngẫu nhiên cùng danh mục.

**Trạng thái bắt buộc:** đang tải, lỗi ảnh, chưa chọn biến thể, hết hàng, còn ít, đổi giá, ngừng bán, shop tạm ngừng, lỗi thêm giỏ, thêm thành công. Khi sản phẩm ngừng bán, vẫn hỗ trợ người mua cũ xem thông tin đơn/bảo hành.

**Nghiệm thu:** giá/rating/stock nhất quán với card/cart; ảnh gallery không phải nhiều sản phẩm khác nhau; CTA mobile không che Q&A/chat.

### 7.2. Đánh giá và Q&A trong PDP

- Summary rating lấy cùng nguồn với danh sách; phân phối sao cộng đúng số lượng, không ghép seed count với review thật.
- Review gồm điểm, thời gian, biến thể đã mua, ưu/nhược điểm, ảnh nếu có; nhãn “Đã mua” xác nhận bằng đơn hợp lệ.
- Lọc có ảnh, số sao, biến thể; sort mới nhất/hữu ích. Hiển thị tiêu chí và tổng số kết quả.
- Phản hồi shop có badge riêng, tách khỏi lời người mua; có báo cáo vi phạm và trạng thái đã nhận báo cáo.
- Q&A có search, câu hỏi chưa trả lời, câu trả lời chính thức, bình chọn hữu ích và link vào chi tiết cộng đồng khi được triển khai.
- Hỏi đáp dùng danh tính tài khoản theo chính sách; không để tên tùy nhập tạo cảm giác người bán chính thức.
- Composer có giới hạn, lưu nháp, gửi lỗi giữ nội dung. Nội dung chờ duyệt vẫn xem được với tác giả theo quyền.
- Không trả thưởng theo đánh giá tích cực. Nếu có xu cho đóng góp, phải độc lập số sao và có điều kiện chống spam.

### 7.3. Giỏ hàng

**Hiện tại:** có nhóm shop, chọn hàng, số lượng, voucher và ngưỡng freeship. Empty state đã hiện được nhưng chủ yếu dẫn về homepage.

- Header giỏ nêu số sản phẩm đã chọn; từng shop có checkbox, link shop, sản phẩm và ưu đãi áp dụng cho nhóm đó.
- Mỗi dòng rõ biến thể, giá, tồn kho, số lượng, xóa và “Lưu để mua sau”. Xóa một món cho phép undo ngắn khi khả thi.
- Sản phẩm hết hàng/giá đổi hiển thị ngay tại dòng; không chỉ toast rồi tiếp tục thanh toán như bình thường.
- Summary desktop sticky: tạm tính phần đã chọn, giảm shop, giảm sàn, giảm ship, xu, tổng dự kiến.
- Thanh freeship nói chính xác phạm vi và mức giảm tối đa; đạt 300.000đ không đồng nghĩa mọi phương thức giao đều miễn phí nếu policy không như vậy.
- Mobile có thanh tổng tiền + CTA, mở breakdown riêng; không chồng bottom nav và chatbot.
- Giỏ rỗng có đường quay lại lịch sử đã xem/yêu thích nếu có, thêm CTA khám phá; không dùng con số hàng nghìn/hàng triệu không có căn cứ.

**Nghiệm thu:** bỏ chọn một shop làm tổng/ưu đãi/phí tính lại đúng; checkout chỉ mang các item đã chọn; reload vẫn giữ ý định mua phù hợp.

### 7.4. Checkout

Giữ bốn bước hiện có ở giai đoạn đầu để giảm rủi ro: Địa chỉ → Vận chuyển → Thanh toán → Kiểm tra. Có thể nghiên cứu rút còn ba bước sau dữ liệu thử nghiệm, không thay chỉ vì muốn ngắn hơn.

- Header checkout gọn, có quay về giỏ mà không mất dữ liệu. Không có carousel, flash sale hay điều hướng cộng đồng tại đây.
- Stepper cho biết vị trí và bước đã hoàn thành; sửa bước trước không xóa vô cớ phần còn lại.
- Địa chỉ: nhãn, tên người nhận, điện thoại, địa chỉ đầy đủ, lỗi tại trường, đánh dấu địa chỉ mặc định. Chọn địa chỉ có radio và nút sửa riêng.
- Vận chuyển: trình bày theo kiện/shop nếu nhiều shop; khoảng giao và phí thực tế. Phân biệt lời ghi chú cho shop với ghi chú giao hàng.
- Thanh toán: chỉ phương thức có khả năng xử lý; mỗi phương thức có pending/failure/expiry/retry. Không dựng trạng thái đã thanh toán từ việc người dùng đóng modal.
- Voucher picker phân nhóm dùng được/chưa đủ điều kiện, nêu lý do; trình bày kết hợp voucher shop/sàn/ship trước khi chốt.
- Bước review thể hiện mọi chi phí, mỗi kiện hàng, chính sách áp dụng, phương thức và CTA cuối duy nhất.
- Nếu giá/tồn kho/ưu đãi đổi trong khi checkout, server trả phần thay đổi để người mua xác nhận lại.
- Sau lỗi gửi đơn, giữ nội dung và kiểm tra đơn đã tạo trước khi cho thử lại; idempotency phía server.

**Phụ thuộc:** mã thanh toán client đang có `BANK`, `CARD`, `MOMO`, `COD`; cần đối chiếu contract server/service trước khi mở rộng. Việc UI có logo không xác nhận cổng thanh toán đã tích hợp.

### 7.5. Sau đặt hàng, thanh toán và theo dõi

- Trang thành công phân biệt “Đã tạo đơn”, “Đang chờ thanh toán”, “Đã thanh toán”; hiển thị mã đơn, người nhận, kiện hàng và bước tiếp theo.
- VietQR có số tiền, nội dung chuyển khoản, người nhận, hết hạn và trạng thái kiểm tra. “Tôi đã chuyển khoản” chỉ khởi động đối chiếu/yêu cầu xác minh.
- Lịch sử đơn dùng một bộ tab trạng thái chính; sidebar không lặp toàn bộ tabs nếu không tạo giá trị.
- Card đơn có status summary + cập nhật gần nhất; timeline đầy đủ chuyển vào trang chi tiết `/account/orders/:id`.
- Chỉ hiện hành động hợp lệ theo trạng thái: thanh toán lại, hủy nếu đủ điều kiện, theo dõi, xác nhận nhận hàng, đánh giá, mua lại, yêu cầu hỗ trợ.
- Không đưa nút “Mô phỏng giao hàng tiếp theo” vào luồng người mua chuẩn. Demo có vùng riêng và nhãn rõ.
- Tracking có mốc thời gian, khoảng giao, sự cố/chậm, đầu mối liên hệ. Bản đồ chỉ dùng nếu có dữ liệu vị trí thực hoặc ghi rõ mô phỏng.
- Đơn nhiều shop có trạng thái theo từng kiện; trạng thái tổng không che mất một kiện thất bại.

### 7.6. Đổi trả, hoàn tiền và tranh chấp

- Chọn đúng item/số lượng, lý do, phương án mong muốn, chứng cứ cần thiết; hiển thị điều kiện theo bản chụp chính sách lúc mua.
- Sau gửi có mã yêu cầu, tiến độ, thời hạn phản hồi và lịch sử trao đổi; không chỉ có modal rồi biến mất.
- Các bước: tiếp nhận → cần bổ sung/được chấp thuận/từ chối → thu hồi nếu cần → kiểm tra → hoàn tiền → đóng.
- Từ chối phải có lý do và đường khiếu nại. Người mua nhìn được khoản hoàn gồm/không gồm phí ship/voucher/xu.
- Quản trị và seller nhìn cùng case; quyền thao tác khác nhau. Thanh toán hoàn trả là nghiệp vụ server, không toggle UI.

### 7.7. Tài khoản, ưu đãi và hỗ trợ

| Khu vực | Cải thiện đề xuất |
|---|---|
| Hồ sơ | Thông tin cần thiết trước; chỉnh avatar thành tác vụ phụ, không để studio avatar chiếm đầu trang |
| Địa chỉ | Danh sách compact; thêm/sửa bằng drawer; mặc định rõ; đồng bộ checkout |
| Phương thức thanh toán | Chỉ dữ liệu đã liên kết thực; masked identifiers, trạng thái và gỡ liên kết; không giả lập đã xác minh |
| Bảo mật | Phiên đăng nhập, mật khẩu, 2FA theo năng lực backend; không coi cờ localStorage là bảo vệ tài khoản |
| Quyền riêng tư | Tùy chọn thông báo/phạm vi hồ sơ/lịch sử; nêu hiệu lực thực, lưu server |
| Yêu thích | Nhóm/bộ sưu tập cá nhân, stock/price thay đổi, chuyển item đủ điều kiện sang giỏ |
| Voucher | Sắp theo dùng được/sắp hết hạn; giải thích điều kiện và đường tới sản phẩm áp dụng |
| Xu | Số dư khả dụng/chờ/hết hạn, lịch sử từng giao dịch, quy tắc đổi rõ |
| Hỗ trợ | Inbox theo yêu cầu/đơn; chatbot có đường chuyển hỗ trợ người thật và lịch sử liên tục |
| Thông báo | Nhóm đơn hàng/tài khoản/shop/cộng đồng; click tới đúng đối tượng; đọc/chưa đọc có nguồn server |

Gamification là tính năng phụ. Giảm màu vàng và nhấp nháy trong header, đưa điểm danh/vòng quay về trang thưởng riêng; không làm loãng nhiệm vụ mua hàng.

## 8. Cộng đồng mua sắm

### 8.1. Điểm xuất phát và giới hạn MVP

Hiện chưa có một phân hệ community độc lập trong `App.jsx`. Nền có thể tận dụng là review, Q&A sản phẩm, phản hồi shop, bình chọn hữu ích và báo cáo review. Vì vậy đây vừa là nâng cấp phần hiện có vừa là một nhánh sản phẩm mới; không thể chỉ thêm tab “Cộng đồng” và vài card bài viết.

Mục tiêu cộng đồng: **giúp người mua quyết định tốt hơn và sử dụng sản phẩm tốt hơn**. MVP tập trung vào hỏi đáp, trải nghiệm đã mua và cẩm nang có biên tập. Chưa ưu tiên livestream, mạng xã hội video, thuật toán feed phức tạp hoặc kinh tế creator.

### 8.2. Community Hub

- Entry point nằm trong điều hướng chính; từ PDP có link tới thảo luận liên quan, từ đơn hoàn thành có lời mời chia sẻ trải nghiệm.
- Desktop hai cột chính: feed đọc được ở giữa, cột chủ đề/nội dung nổi bật nhỏ hơn; chỉ dùng cột điều hướng thứ ba khi đủ không gian.
- Mobile một feed, chủ đề cuộn ngang có chủ đích, nút tạo bài rõ. Không để sidebar chuyển thành hàng chục khối trước nội dung.
- Tabs: Khám phá, Đang theo dõi, Hỏi đáp, Cẩm nang. Chỉ xuất bản tab có dữ liệu và hành vi hoàn chỉnh.
- Mỗi item thể hiện loại bài, tiêu đề, tác giả, thời gian, ảnh đại diện nội dung, đoạn trích và phản hồi; sản phẩm liên quan là thông tin phụ có kiểm soát.
- Feed có lựa chọn mới nhất/hữu ích/chủ đề; nội dung nổi bật do biên tập phải được nhận diện, không giả định cá nhân hóa AI.
- Trang rỗng hướng tới câu hỏi/bài đầu tiên hoặc chủ đề có nội dung; không tạo bình luận, lượt thích hay thành viên giả.

### 8.3. Bốn loại nội dung

| Loại | Nội dung và cấu trúc | Quan hệ với thương mại |
|---|---|---|
| Hỏi đáp | Vấn đề, ngữ cảnh sử dụng, ngân sách/nhu cầu tùy chọn, câu trả lời được chấp nhận | Gắn một hoặc nhiều sản phẩm; không bắt người hỏi đã mua |
| Trải nghiệm đã mua | Sản phẩm/biến thể, thời gian sử dụng, ảnh, ưu/nhược điểm, phù hợp với ai | Nhãn xác thực theo đơn; không tự động coi bài là review sao |
| Cẩm nang | Tác giả/biên tập, tiêu chí lựa chọn, bảng so sánh, ngày cập nhật | Link lựa chọn theo ngân sách; công khai nội dung tài trợ nếu có |
| Bài từ shop | Hướng dẫn, câu chuyện, công bố bộ sưu tập, trả lời chuyên môn | Badge người bán; giới hạn spam; liên kết về shop rõ |

Review sao và bài trải nghiệm là hai đối tượng liên quan nhưng khác nhau. Không nhân đôi cùng một bài vào thống kê review, cũng không gán “đã mua” cho người chỉ liên kết sản phẩm.

### 8.4. Trang bài viết và thảo luận

- Cột đọc khoảng 680–760px, body 16–18px, line-height khoảng 1.6; ảnh có caption khi cần giải thích.
- Đầu bài: loại nội dung, tiêu đề, tác giả/role, thời gian, thời điểm chỉnh sửa và thông tin tài trợ nếu có.
- Bài dài có mục lục; ưu tiên nội dung trước các nút mua. Product attachment dùng giá/tồn kho hiện tại và ghi rõ thời điểm khi so sánh giá quá khứ.
- Hành động: lưu, theo dõi thảo luận, hữu ích, chia sẻ, báo cáo; số đếm không làm lấn nội dung.
- Bình luận có tối đa một cấp reply hiển thị mặc định, mở rộng có kiểm soát. Pin câu trả lời được chấp nhận hoặc phản hồi chính thức.
- Câu trả lời của shop có badge và liên hệ với sản phẩm/shop; chuyên môn không được suy ra chỉ từ role người bán.
- Trạng thái bài bị ẩn/xóa/sản phẩm ngừng bán vẫn có trang giải thích phù hợp; link không rơi vào trang trắng.

### 8.5. Soạn bài và hồ sơ công khai

- Composer từng bước ngắn: loại bài → nội dung/ảnh → sản phẩm/chủ đề → preview → gửi.
- Tự lưu nháp, hiện thời điểm lưu; lỗi tải ảnh có retry từng ảnh; rời trang đang có thay đổi phải giữ được nháp.
- Hồ sơ công khai chỉ gồm tên hiển thị, bio, bài, đóng góp hữu ích và shop liên kết nếu có. Không lộ địa chỉ, điện thoại, email hay lịch sử đơn.
- Trong tài khoản có “Hoạt động cộng đồng”: bài đã đăng/chờ duyệt/nháp, câu hỏi, phản hồi, bài đã lưu.
- Badge uy tín dựa trên tiêu chí minh bạch; không tạo bảng xếp hạng khiến người dùng spam để lấy xu.

### 8.6. Kiểm duyệt và chất lượng

- Lifecycle đề xuất: `draft → pending → published`; nhánh `needs_changes`, `rejected`, `hidden`, `archived` có lý do và lịch sử.
- Report gồm loại vấn đề, ngữ cảnh nội dung, người báo cáo; người gửi thấy “đã tiếp nhận” và kết quả phù hợp, không nhận thông tin riêng của người khác.
- Cần giới hạn spam, xác thực tác giả, xử lý nội dung trùng lặp; thao tác của admin ghi audit log.
- Seller được trả lời và báo cáo, không tự xóa đánh giá/bài phê bình của người mua.
- Kháng nghị cho tác giả bị gỡ; có người xử lý và mốc thời gian.
- Giai đoạn đầu chuẩn bị khoảng 12–20 bài/câu hỏi hữu ích qua biên tập; nếu dùng dữ liệu minh họa cho portfolio phải gắn nhãn demo, không giả dạng đóng góp thật.

**Nghiệm thu community MVP:** bài có URL riêng; nháp giữ sau reload; review/Q&A cũ vẫn hoạt động; người bán trả lời đúng vai trò; bài pending không lộ cho khách; báo cáo xuất hiện ở admin; không có nội dung không được duyệt trong feed công khai.

## 9. Trung tâm người bán

### 9.1. Bố cục và điều hướng

**Hiện tại:** `SellerDashboardPage.jsx` có nhiều tab và modal trong một file lớn; cùng header thương mại; nhóm KPI và giới thiệu shop xuất hiện trước bảng công việc. Các state/API/fallback đang pha trộn.

**Đích:** một công cụ làm việc có sidebar rõ, header 56–64px, tên shop, tìm kiếm trong vận hành, thông báo và đường xem gian hàng. Khu nội dung có breadcrumb, tên tác vụ, bộ lọc và hành động chính.

- Các tab chuyển thành route; mở chi tiết một đơn/sản phẩm rồi Back giữ được bộ lọc.
- Sidebar khoảng 224–240px desktop; tên ngắn: Tổng quan, Đơn hàng, Sản phẩm, Kho hàng, Khuyến mãi, Hộp thư, Tài chính, Gian hàng, Cài đặt.
- Header shop chi tiết và KPI chỉ dành cho overview hoặc trang liên quan; không đẩy bảng đơn xuống quá nửa màn hình ở mọi tab.
- Mobile dùng menu drawer và các hành động thiết yếu; bảng dữ liệu có vùng cuộn riêng, không làm tràn trang.
- Khi không có shop/đang xét duyệt/bị hạn chế, có màn hình trạng thái và nhiệm vụ tiếp theo; không tự fallback về `shop_01`.

### 9.2. Tổng quan theo việc cần làm

Trang đầu trả lời “Hôm nay cần xử lý gì?” trước khi trình bày biểu đồ.

1. Việc cần làm: đơn sắp quá hạn, chat chưa trả lời, tồn kho thấp, sản phẩm bị yêu cầu sửa, yêu cầu đổi trả.
2. KPI theo khoảng ngày: doanh thu theo định nghĩa, số đơn, đơn hoàn thành, tỷ lệ hủy/đổi trả; từng ô mở danh sách liên quan.
3. Biểu đồ có trục, đơn vị, tooltip, kỳ so sánh; không dùng cột có chiều cao cố định nhưng nhãn dữ liệu thay đổi.
4. Top sản phẩm theo kỳ; không trộn số đã bán toàn thời gian với doanh thu kỳ hiện tại.
5. Sức khỏe shop: phản hồi, bàn giao đúng hạn, vi phạm cần xử lý; giải thích cách tính.

**Quy tắc KPI:** luôn có khoảng ngày, phạm vi shop, định nghĩa gross/net và thời điểm cập nhật. Kỳ trước bằng 0 dùng “Chưa có cơ sở so sánh”, không hiển thị phần trăm vô nghĩa.

### 9.3. Đơn hàng và chi tiết xử lý

- Queue theo công việc: Chờ xác nhận, Chờ đóng gói, Chờ bàn giao, Đang giao, Hoàn thành, Hủy, Đổi trả.
- Bảng ưu tiên mã đơn, giờ đặt/hạn xử lý, hàng + biến thể, số tiền, thanh toán, giao vận, trạng thái và một hành động tiếp theo.
- Search theo mã đơn, mã vận đơn hoặc thông tin khách thuộc phạm vi shop; kết quả và bộ lọc lưu trên URL.
- Checkbox chọn lô; toolbar chỉ xuất hiện khi chọn. Trước bulk action, nêu số đơn hợp lệ/không hợp lệ và lý do.
- Không dùng một nút “xác nhận giao tất cả” với phạm vi khó hiểu. Phân biệt xác nhận đơn, sẵn sàng giao và bàn giao cho vận chuyển.
- Trang chi tiết gồm items, địa chỉ giao, thanh toán, timeline sự kiện, vận đơn, ghi chú nội bộ, trao đổi với khách và liên kết case.
- In vận đơn/packing slip có preview, trạng thái in và thông tin đúng kiện; thao tác in không tự chuyển trạng thái giao.
- API thất bại phải giữ selection và báo lỗi theo dòng; không cập nhật UI thành công nếu server từ chối.

**Nghiệm thu:** seller không thấy hàng/shop ngoài quyền; hai người cùng xử lý một đơn không gây nhảy trạng thái sai; cập nhật hợp lệ được người mua và admin nhìn thấy thống nhất.

### 9.4. Sản phẩm và tồn kho

| Màn hình | Nội dung nâng cấp |
|---|---|
| Danh sách sản phẩm | Tab nháp/chờ duyệt/đang bán/hết hàng/ẩn/từ chối; search SKU, category, tồn; bulk có phạm vi rõ |
| Tạo/sửa | Trang riêng thay modal dài: thông tin, ảnh, phân loại, biến thể, giá/kho, giao hàng, chính sách, SEO tùy nhu cầu |
| Quản lý ảnh | Upload nhiều ảnh, crop cơ bản, thứ tự, alt, ảnh theo biến thể; cảnh báo lỗi/kích thước và preview |
| Biến thể | Ma trận SKU, giá, số lượng, ảnh; kiểm tra trùng và tổ hợp không bán |
| Kiểm tra trước đăng | Chỉ rõ thiếu ảnh/giá/thuộc tính nào; preview giống PDP thật; lưu nháp |
| Sản phẩm bị từ chối | Lý do, trường cần sửa, lịch sử phiên bản, gửi duyệt lại |
| Kho | Tồn thực, giữ chỗ, khả dụng, ngưỡng cảnh báo, lịch sử nhập/xuất/điều chỉnh |
| Nhập hàng loạt | P2: mẫu dữ liệu, preview lỗi từng dòng và chỉ nhập dòng hợp lệ sau xác nhận |

Không lấy số lượng sản phẩm từ ba bộ fallback khác nhau. Các màn hình phải ghi rõ “đang bán”, “đã duyệt” hay “tất cả” và lấy cùng contract.

### 9.5. Marketing, voucher và flash sale

- Dashboard chiến dịch: sắp diễn ra/đang chạy/kết thúc/tạm dừng, ngân sách và kết quả trong kỳ.
- Wizard voucher: phạm vi sản phẩm/khách → loại giảm → min/max → số lượng/ngân sách → hiệu lực → xem trước.
- Preview cho ví dụ giỏ hàng đủ/không đủ điều kiện; nói rõ kết hợp được với loại voucher nào.
- Flash sale phải chọn SKU, tồn phân bổ, giới hạn mua, giá sale, thời gian bắt đầu/kết thúc và múi giờ.
- Có xử lý chiến dịch chồng nhau, hết quota, hết hàng và sửa chiến dịch đang chạy.
- Report dùng số thực: lượt dùng, doanh số liên quan, chi phí giảm giá; không gọi là lợi nhuận khi chưa có giá vốn và chi phí đầy đủ.

### 9.6. Inbox, review và cộng đồng

- Gộp nơi tiếp nhận thành “Hộp thư” với kênh Chat, Hỏi đáp, Đánh giá, Đổi trả; bộ lọc chưa xử lý/đã phân công/đã trả lời.
- Desktop bố cục danh sách hội thoại, nội dung và thông tin đơn/sản phẩm; mobile chuyển từng màn hình.
- Câu trả lời mẫu có thể sửa; đính kèm đơn/sản phẩm bằng object chuẩn, không gõ thông tin thủ công lặp lại.
- Review tiêu cực dẫn tới hỗ trợ, không dẫn tới hành động xóa; phản hồi công khai và ghi chú nội bộ tách biệt.
- Nhãn AI phải đúng chức năng thực, có trạng thái đang xử lý/thất bại/chuyển người phụ trách. Không tự xác nhận hủy/hoàn tiền qua lời chatbot.
- Community cho shop có bài hướng dẫn/giới thiệu được duyệt; hiệu quả đo bằng đọc hữu ích và truy cập sản phẩm, không chỉ lượt đăng.

### 9.7. Tài chính và đối soát

- Tách số dư khả dụng, chờ đối soát, tạm giữ, đã rút; từng khoản có lý do và liên kết đơn/giao dịch.
- Ledger: thời gian, loại giao dịch, mã đơn, gross, voucher, phí, điều chỉnh, net, số dư sau giao dịch.
- Kỳ đối soát có chi tiết tính toán, lệch cần xử lý và tài liệu xuất được; khoảng ngày thống nhất dashboard.
- Rút tiền có số dư khả dụng, phí, thời gian dự kiến, tài khoản nhận đã xác minh, pending/processing/paid/failed; chống gửi lặp.
- Không dùng số dư nền cộng cứng hoặc state cục bộ làm căn cứ tài chính. Trong demo, ghi rõ dữ liệu minh họa.

### 9.8. Gian hàng, onboarding và cài đặt

- Onboarding có checklist có thể tiếp tục: thông tin shop, kho, liên hệ, vận chuyển, thanh toán, sản phẩm đầu tiên.
- Chỉnh gian hàng có cover/logo, bio, bộ sưu tập, thứ tự module, preview desktop/mobile và trạng thái chưa xuất bản.
- Cho chọn template phù hợp ngành; giữ chuẩn sàn về chữ, CTA và chính sách, tránh mỗi shop trở thành một ứng dụng khác.
- Cài đặt gồm thông tin, giờ làm, nghỉ bán, thông báo, thành viên/quyền nếu có nhu cầu. Multi-staff là P2, không ngầm giả định RBAC chi tiết đã có.
- Bổ sung tài liệu hướng dẫn theo tác vụ trong Help riêng; không viết chú thích kỹ thuật rải trên giao diện.

## 10. Trung tâm quản trị

### 10.1. Vai trò và cấu trúc

Admin cần hỗ trợ ra quyết định và theo dõi trách nhiệm. Thiết kế nên yên tĩnh, mật độ vừa cao, bảng dễ so sánh, có bộ lọc và bằng chứng trước hành động.

Sidebar đề xuất: Tổng quan vận hành; Kiểm duyệt; Đơn hàng & Khiếu nại; Gian hàng; Người dùng; Danh mục; Nội dung; Khuyến mãi; Tài chính; Phân quyền & Nhật ký.

Các mục mới phải được triển khai cùng API/quyền thích hợp; không tạo menu mở ra những màn hình giả có nút thành công.

### 10.2. Tổng quan vận hành

- Bộ lọc thời gian chung, so sánh kỳ trước và thời điểm cập nhật; phạm vi KPI được giải thích qua tooltip.
- Hàng đầu là việc cần xử lý: shop chờ duyệt, hàng chờ duyệt, report cộng đồng, tranh chấp quá hạn, đối soát lệch.
- KPI GMV, đơn, hoàn tiền, doanh thu phí và shop hoạt động có định nghĩa riêng. GMV không tự đồng nghĩa doanh thu thuần.
- Biểu đồ có drill-down tới đơn/giao dịch tương ứng; nhãn “realtime” chỉ dùng khi có cơ chế cập nhật và độ trễ được xác định.
- Health widget chỉ lấy dữ liệu vận hành đã có; thông tin hệ thống chi tiết chuyển sang trang kỹ thuật có quyền.
- Không dữ liệu/đang đồng bộ/lỗi kết nối là ba trạng thái riêng, không cùng hiện số 0 xanh lá.

### 10.3. Quản lý và phê duyệt shop

- Bảng gồm tên shop/chủ, hồ sơ, ngành, ngày gửi, trạng thái, người phụ trách và hạn xử lý.
- Mở chi tiết thấy hồ sơ, tài liệu liên quan, thông tin liên hệ, lịch sử, chính sách và ảnh hưởng nếu khóa.
- Duyệt/yêu cầu bổ sung/từ chối là các hành động khác nhau, có lý do và thông báo tới seller.
- Khóa shop phải phân biệt ngừng niêm yết, hạn chế tác vụ và cách tiếp tục xử lý đơn đang chạy.
- Ưu tiên trạng thái đình chỉ/khôi phục đối với vận hành thường ngày; hành động xóa có phạm vi và hậu quả rõ.
- Badge xác thực là kết quả của workflow có nguồn dữ liệu, không suy ra từ tên “Official”.

### 10.4. Kiểm duyệt sản phẩm

**Hiện tại:** bảng mẫu có duyệt/gỡ trực tiếp; handler được đọc chủ yếu đổi state. Cần nâng từ “bảng có nút” thành hàng đợi có hồ sơ xử lý.

- Filter: chờ duyệt, yêu cầu sửa, được duyệt, bị gỡ; theo ngành/shop/độ ưu tiên/người xử lý.
- Màn chi tiết hai vùng: preview sản phẩm như khách thấy và checklist kiểm duyệt.
- Hiển thị trường thay đổi từ phiên bản đã duyệt: ảnh, mô tả, claim, giá, biến thể, tài liệu liên quan.
- Lý do chuẩn + ghi chú cụ thể; seller nhận thông báo đúng trường cần sửa.
- Có claim/assign cho người xử lý, xử lý xung đột khi hai admin cùng mở; lịch sử quyết định không bị ghi đè.
- Duyệt hàng loạt chỉ với nhóm đủ điều kiện; trước thực hiện hiện số lượng và ngoại lệ.
- Không đánh đồng gỡ khỏi bán với xóa lịch sử sản phẩm khỏi đơn đã mua.

### 10.5. Quản trị cộng đồng

- Một queue cho bài/review/Q&A/comment bị báo cáo, nhưng giữ type để dùng tiêu chí đúng.
- Màn case hiển thị nội dung gốc, ngữ cảnh thảo luận, báo cáo, lịch sử tác giả ở mức được phép và chính sách liên quan.
- Hành động: giữ nguyên, yêu cầu sửa, ẩn, hạn chế tài khoản hoặc chuyển xử lý; phải có lý do và log.
- Người bán không có quyền ưu tiên gỡ bài phê bình chỉ vì nội dung bất lợi.
- Thao tác phục hồi và kháng nghị có luồng riêng; tác giả thấy trạng thái và bước tiếp theo.
- KPI chất lượng: queue tồn, thời gian xử lý, tỷ lệ kháng nghị được chấp nhận; không tối ưu số lượng gỡ bỏ đơn thuần.

### 10.6. Đơn hàng, hỗ trợ và tranh chấp

- Tra cứu xuyên vai trò bằng mã đơn/case, vẫn kiểm soát quyền xem dữ liệu cá nhân.
- Timeline kết hợp sự kiện đơn, thanh toán, giao vận, đổi trả; phân biệt nguồn và thời điểm nhận sự kiện.
- Case có owner, ưu tiên, hạn xử lý, chứng cứ từ hai phía, trao đổi và quyết định.
- Hoàn tiền/đền bù/điều chỉnh đi qua quy trình đúng quyền; giao diện không cho một click thay số dư không có chứng từ.
- Kết quả cập nhật đồng thời ở người mua, seller và sổ giao dịch.
- Hỗ trợ xem trước nội dung thông báo trước khi gửi; không lẫn ghi chú nội bộ vào phản hồi cho khách.

### 10.7. Người dùng và phân quyền

- Bảng có filter role/trạng thái/ngày tạo; profile quản trị tập trung vào hoạt động và quyền, không kéo toàn bộ dữ liệu nhạy cảm ra bảng mặc định.
- Khóa/mở có lý do, thời hạn nếu cần, ảnh hưởng và log; ngăn tự tước quyền quản trị cuối cùng.
- RBAC chi tiết đề xuất: vận hành, kiểm duyệt, hỗ trợ, tài chính, quản trị quyền. Đây là mở rộng so với role customer/seller/admin hiện tại.
- Có trạng thái 403 rõ và đường quay lại, không chỉ ẩn menu. Quyền thực thi server; route guard phía client cải thiện UX.
- Nhật ký gồm actor, action, target, thời gian, trước/sau phù hợp và correlation/request id; search/filter/export theo quyền.

### 10.8. Danh mục, nội dung và chiến dịch

| Module | Cải thiện |
|---|---|
| Danh mục | Cây cha/con, slug, thuộc tính bắt buộc, thứ tự, ảnh và trạng thái; kiểm tra sản phẩm bị ảnh hưởng khi ẩn |
| CMS trang chủ | Slot chiến dịch, collection, shop và bài cộng đồng; preview breakpoint, lịch xuất bản, rollback |
| About/Help/Policy | Draft/review/publish, người phụ trách, phiên bản, ngày hiệu lực; link chính sách không chết |
| Voucher sàn | Ngân sách, loại giảm, đối tượng, stacking rule, thời hạn; simulation giỏ hàng và số liệu sử dụng |
| Flash sale toàn sàn | Duyệt SKU/shop tham gia, quota, lịch chạy, tình trạng hết hàng và dừng chiến dịch |
| Media library | Ảnh có nguồn/quyền sử dụng, alt, kích thước, crop riêng mobile/desktop và nơi đang dùng |

CMS giai đoạn đầu dùng module định sẵn, không xây trình kéo-thả tự do quá sớm. Admin chỉ cấu hình nội dung trong cấu trúc thiết kế đã kiểm chứng.

### 10.9. Tài chính và báo cáo

- Một ledger và các view đối soát thay vì các bảng số tiền rời nhau.
- Bảng kỳ đối soát: shop, tổng đủ điều kiện, phí, hoàn tiền/điều chỉnh, net, trạng thái, ngày chi trả và mã giao dịch.
- Chi tiết đối soát tới từng đơn; export cùng filter và cùng công thức với màn hình.
- Workflow: tính toán → kiểm tra → duyệt → chờ xử lý thanh toán → thành công/thất bại. Không đặt “Đã thanh toán” ngay khi đổi state client.
- Cần phân quyền và bước kiểm tra thích hợp cho điều chỉnh/rút tiền; bản UI phải thể hiện rõ pending, người thực hiện, kết quả đối chiếu.
- Báo cáo có phiên bản/định nghĩa chỉ số; kỳ đóng không bị thay đổi âm thầm khi giá sản phẩm hiện tại đổi.

**Nghiệm thu admin:** mọi quyết định quan trọng có lý do + log + trạng thái server; refresh không hồi về dữ liệu mẫu; người mua/seller nhìn thấy kết quả tương ứng; thất bại không giả thành công.

## 11. Liên thông dữ liệu và kỹ thuật

### 11.1. Ba mức thay đổi

| Mức | Nội dung | Phụ thuộc |
|---|---|---|
| A: UI | Typography, spacing, token, responsive, layout theo role, bớt card/badge, tổ chức nội dung | Có thể bắt đầu với contract hiện có |
| B: Nối dữ liệu | Rating thống nhất, KPI, trạng thái đơn, filter, voucher, phân biệt demo/API | Cần rà service và endpoint hiện có; chưa chắc phải thêm endpoint |
| C: Nghiệp vụ mới | Community độc lập, CMS, moderation case, ledger/đối soát hoàn chỉnh, quyền chi tiết | Cần model, API, kiểm thử quyền và thiết kế trạng thái |

Không ước lượng cả dự án như một đợt “chỉnh CSS”. Phần B quyết định độ tin cậy của phần A; phần C nên làm theo các luồng hoàn chỉnh có ưu tiên.

### 11.2. Dữ liệu hiện có và cần hoàn thiện

| Domain | Bằng chứng hiện tại | Hướng nâng cấp |
|---|---|---|
| Sản phẩm/catalog | Product routes có search, category list, best-sellers, flash-sale, related | Chuẩn hóa taxonomy/brand/variant, filter đồng nhất và gallery đúng SKU |
| Reviews/Q&A | Có API review, report/reply/helpful, question/answer/vote | Thống kê cùng nguồn, xác minh đã mua, nối moderation và community |
| Đơn hàng | Có create/mine/tracking/confirm/ship/deliver/complete/cancel/return/repurchase | Thống nhất state machine, tách kiện/shop, snapshot giá/chính sách và case đổi trả |
| Seller | Có API dashboard/revenue/stats/wallet/products/orders; UI vẫn dùng nhiều dữ liệu local | Ưu tiên tái sử dụng API đúng, thay fallback âm thầm bằng trạng thái lỗi rõ |
| Admin | Có dashboard/revenue/top/shops/users/overview/finance; một số UI dùng INITIAL state | Nối đúng endpoint, bổ sung command/workflow còn thiếu sau audit contract |
| Cộng đồng | Chưa có community routes độc lập trong route client/server đã đọc | Post, topic, comment, follow, saved item, report, moderation case |
| CMS | Chưa thấy route/module CMS trong danh mục đã đọc | Module nội dung định sẵn, draft/publish, version, lịch và asset |
| Thông báo | Có list/unread/read/delete | Thông báo theo domain event, đích điều hướng đúng role |
| Tài chính | Có wallet/finance phía server và số liệu local phía client | Ledger thống nhất, payout/refund lifecycle, audit và đối chiếu |

### 11.3. Contract cần khóa trước khi thiết kế màn hình cuối

- **Product:** id, shopId, tên, taxonomy, brand, ảnh, variants, stock khả dụng, giá/khuyến mãi hiệu lực, trạng thái duyệt/bán.
- **Review summary:** trung bình, count, phân phối sao và danh sách dùng cùng tập review hợp lệ. Không có review thì average có thể null.
- **Delivery/policy:** vùng áp dụng, phí, khoảng ngày dự kiến, nguồn policy, phiên bản và ngoại lệ.
- **Order:** mã đơn mẹ, đơn con/kiện, từng item + variant snapshot, shipping/payment/order status riêng, tổng tiền chuẩn server.
- **Metric:** value, unit, start/end, timezone, comparison, computedAt và trạng thái đủ/chưa đủ dữ liệu.
- **Community:** author/role, type, topicIds, productRefs, nội dung, media, lifecycle và thời gian xuất bản/chỉnh sửa.
- **Case:** loại, đối tượng, requester, assignee, state, lý do/chứng cứ, deadline, history.
- **Money movement:** amount integer VND, loại giao dịch, tham chiếu đơn/case, trạng thái, idempotency và lịch sử; không tính tiền bằng float ở UI.

Các enum và tên trường cuối cùng phải theo backend đã thống nhất, không lấy bảng đề xuất này làm lý do đổi schema hàng loạt.

### 11.4. Luồng liên thông phải thiết kế cùng nhau

| Luồng | Người mua/cộng đồng | Seller | Admin | Bất biến cần giữ |
|---|---|---|---|---|
| Đăng sản phẩm | Chỉ thấy hàng được phép bán | Nháp → gửi → sửa theo lý do | Duyệt/yêu cầu sửa/gỡ | Cùng productId/version; giá/tồn không tách ba bản |
| Mua hàng | Giỏ → checkout → theo dõi | Xác nhận → đóng gói → giao | Theo dõi ngoại lệ/case | Một nguồn tổng tiền và trạng thái kiện |
| Đánh giá | Chỉ gắn “đã mua” khi đủ điều kiện | Phản hồi có role | Xử lý report | Điểm trung bình khớp review được tính |
| Hỏi đáp | Hỏi → nhận câu trả lời → đánh dấu hữu ích | Hộp thư Q&A | Xử lý vi phạm | Cùng thread tại PDP và community |
| Đổi trả | Yêu cầu/chứng cứ/theo dõi | Phản hồi/nhận lại hàng | Phân xử theo quyền | Không hoàn hai lần; timeline chung |
| Voucher | Điều kiện/giảm tiền trên giỏ | Tạo trong phạm vi shop | Rule ngân sách toàn sàn | Preview và checkout dùng cùng quy tắc |
| Đối soát | Nhìn thanh toán/hoàn tiền của mình | Khoản chờ/khả dụng/rút | Kiểm tra/duyệt/đối chiếu | UI không tự quyết định dòng tiền |

### 11.5. Tổ chức mã theo tiến độ

- Giữ React 18, Vite, React Router và CSS token hiện có. Không cần chuyển framework để đạt mục tiêu giao diện.
- Tách `AppLayout` thành layout theo role/ngữ cảnh trước, rồi chuyển từng route vào layout tương ứng.
- Tách file seller/admin lớn theo domain: orders, products, marketing, finance, moderation; giữ service API làm ranh giới.
- Di chuyển style tĩnh trong JSX sang class/token khi sửa module đó; không mở chiến dịch sửa toàn bộ inline style không liên quan.
- Có component chung thật sự dùng lại; component chuyên ngành như payout/case không ép thành một “siêu component”.
- Route-based lazy loading cho seller/admin/community; tách dữ liệu demo khỏi bundle storefront khi không cần.
- Chuẩn hóa schema response và lỗi ở service; phân biệt 401/403/404/409/422/network, giữ dữ liệu form khi retry.
- Thao tác đọc có cache/invalidation có chủ đích; sau thay đổi phải cập nhật view liên quan, không dùng sự kiện storage như một hệ thống đồng bộ đa thiết bị.
- Nếu bổ sung thư viện query/table/chart, chọn theo nhu cầu đã chứng minh và kiểm tra tài liệu chính thức tại thời điểm triển khai. Chưa cần khóa thêm dependency ở giai đoạn plan.

### 11.6. Tách demo và vận hành

1. Có chế độ demo rõ, dataset nhất quán giữa buyer/seller/admin.
2. Dữ liệu mẫu cùng ID và trạng thái; không mỗi trang tự thêm một bộ `INITIAL_*` riêng.
3. Chế độ vận hành gặp lỗi API phải báo lỗi, không fallback sang dữ liệu mẫu rồi cho phép thao tác như đã thành công.
4. Label “demo/mô phỏng” tập trung và dễ nhận ra; không để một trang tuyên bố dữ liệu thật trong khi dùng tỷ lệ cứng.
5. Gỡ số tăng trưởng/đánh giá/follower không có nguồn khỏi giao diện chuẩn; có thể giữ mẫu có nhãn cho mục đích thuyết trình.
6. Dọn dữ liệu “Test” trong một đợt chuẩn bị demo có kiểm soát, không xóa dữ liệu đang có chỉ vì tên chứa “Test”.

### 11.7. Rà quyền trong lúc tách layout

`App.jsx` đang render trực tiếp seller/admin routes; trong phần page đã tìm chưa thấy guard vai trò tương ứng, trong khi server routes có middleware phân quyền. Cần xác minh và bổ sung route guard cho trải nghiệm 401/403, nhưng không kết luận từ đó rằng mọi API đã bị truy cập trái phép.

Ma trận tối thiểu: guest, customer, seller đúng shop, seller khác shop, admin, tài khoản bị khóa. Test cả link trực tiếp và gọi API; việc không thấy menu không phải bảo vệ dữ liệu.

## 12. Responsive, accessibility và hiệu năng

### 12.1. Quy tắc responsive

| Màn hình | Storefront/PDP | Tài khoản/cộng đồng | Seller/admin |
|---|---|---|---|
| 360–430px | Search một hàng; grid 2 cột nếu đủ rộng, 1 cột ở thành phần cần đọc; CTA bottom | Một cột, điều hướng gọn, filter drawer | Queue compact hoặc table vùng cuộn riêng; action drawer |
| 768–820px | Header tablet riêng; catalog 2–3 cột; PDP tránh ba cột | Sidebar chuyển drawer khi chật | Sidebar thu gọn; giữ cột quan trọng |
| 1024px | Filter và grid cân đối; PDP hai cột | Hai cột khi đủ không gian | Table dùng chiều ngang; toolbar wrap có chủ đích |
| 1280–1440px | Container 1280–1320; grid 4–5 cột theo width thực | Feed có rail phụ | Sidebar cố định và workbench rộng |
| 1920px | Không kéo text/ảnh tới vô hạn | Giới hạn chiều dài dòng | Tận dụng không gian cho bảng/chi tiết, không phóng chữ |

- `min-width: 0`, `minmax(0, 1fr)` và wrap phải được áp dụng đúng nơi gây tràn; không dùng `overflow-x: hidden` ở body để che lỗi.
- Carousel/rail được phép cuộn ngang trong vùng riêng với dấu hiệu điều hướng; toàn trang không có thanh cuộn ngang.
- Mobile chỉ một thanh tác vụ bottom tại một thời điểm: nav, mua hàng hoặc checkout. Chat/toast nằm trên vùng đó và safe area.
- Kiểm tra bàn phím ảo khi điền form/chat, landscape, tên sản phẩm dài và ngôn ngữ EN dài hơn VI.
- Khung ảnh có aspect-ratio; skeleton cùng kích thước nội dung; không để ảnh tải xong đẩy CTA ra khỏi vị trí.

### 12.2. Khả năng tiếp cận

- Mục tiêu WCAG 2.2 AA cho các luồng chính; tương phản chữ thường tối thiểu 4.5:1 và thành phần giao diện cần thiết 3:1 theo trường hợp áp dụng. Đối chiếu tiêu chí tại [W3C WCAG Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).
- Focus nhìn rõ; thứ tự Tab theo thứ tự nội dung; không dùng div/span click-only cho điều hướng quan trọng.
- Nút icon có accessible name; tooltip hỗ trợ cả focus, không phải nguồn tên duy nhất.
- Vùng chạm thiết kế tối thiểu 44×44px cho thao tác mobile chính; tăng khoảng cách cho hành động phá hủy.
- Form có label, lỗi cụ thể liên kết đúng trường, summary lỗi khi cần; không dùng màu làm tín hiệu duy nhất.
- Dialog/drawer không làm mất focus hoặc kẹt cuộn; Escape đóng khi phù hợp; sau đóng quay lại trigger.
- Một H1 có nghĩa cho mỗi trang; heading đi đúng cấp; link “bỏ qua điều hướng”.
- Carousel/video có điều khiển dừng; không làm người dùng phải đuổi theo CTA đang thay đổi.
- Thông báo sau thao tác dùng live region có mức ưu tiên phù hợp; không đọc lại toàn bộ catalog khi đổi một bộ lọc.

### 12.3. Hiệu năng đề xuất

- Ảnh responsive WebP/AVIF theo năng lực pipeline; khai báo width/height, ưu tiên ảnh đầu viewport, lazy-load phần dưới.
- Chọn ảnh hero theo mobile/desktop để giữ sản phẩm nhìn rõ và giảm dung lượng; không tải video hero tự động ở MVP.
- Load code seller/admin/community theo route; đo tác động của `productService.js` chứa nhiều dữ liệu fallback trước khi tối ưu bundle.
- Không load lại toàn bộ dashboard chỉ để đổi một trạng thái dòng; cập nhật đúng query và phần bị ảnh hưởng.
- Đặt mục tiêu khi có dữ liệu thực: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 ở percentile 75, theo [hướng dẫn Core Web Vitals](https://web.dev/articles/vitals). Trong local/staging dùng test lab có điều kiện ghi rõ, chưa được coi là đạt field metrics.
- Chưa đặt ngân sách bundle cứng khi chưa đo baseline. Sau đo, khóa mức tăng theo từng giai đoạn và chặn regressions đáng kể.

### 12.4. Bộ trạng thái chung cho mọi màn hình

| Trạng thái | Yêu cầu thiết kế |
|---|---|
| Loading lần đầu | Skeleton đúng cấu trúc, không nhấp nháy dữ liệu mẫu |
| Refetch | Giữ nội dung hiện có nếu còn hợp lệ, chỉ báo đang cập nhật |
| Empty lần đầu | Giải thích ngắn và một hành động để bắt đầu |
| Empty do filter | Hiển thị filter hiện tại và hành động nới/xóa lọc |
| Error | Nói phần nào lỗi, giữ phần còn dùng được, có retry |
| Offline/mất đồng bộ | Không báo thao tác server đã thành công; giữ draft |
| Forbidden/not found | Trang rõ nghĩa, đường quay lại đúng role |
| Saving/success | Khóa gửi lặp, phản hồi vừa đủ, hiển thị dữ liệu đã lưu |
| Conflict | Chỉ rõ dữ liệu đổi, lựa chọn tải mới hoặc xem khác biệt |
| Disabled | Nêu điều kiện chưa đạt, không để nút mờ không giải thích |

## 13. Lộ trình triển khai và nghiệm thu

### 13.1. Cách chia việc

Triển khai theo luồng hoàn chỉnh: thiết kế → contract → UI → dữ liệu → trạng thái → kiểm thử. Mỗi giai đoạn có vài màn hình đại diện hoàn thiện, sau đó nhân rộng component. Không thay giao diện toàn sàn bằng một đợt chỉnh CSS khổng lồ.

Các thời lượng dưới đây là **ước lượng kế hoạch**, giả định nhóm nhỏ có một frontend chủ lực, một backend hỗ trợ và thời gian thiết kế/QA. Chưa phải cam kết; nếu một người làm tất cả hoặc tích hợp thanh toán/giao vận thật, lịch cần dài hơn.

| Giai đoạn | Công việc và đầu ra | Phụ thuộc | Ước lượng |
|---|---|---|---|
| G0: Chốt nền | Chốt tên/giọng thương hiệu, kiểm kê nội dung thật/demo, baseline ảnh màn hình, kiểm tra API, wireframe 6 màn hình | Không | 2–4 ngày làm việc |
| G1: Nền giao diện | Token, component cốt lõi, layout theo role, header/footer mới, sửa tràn mobile và guard UX | G0 | 1–2 tuần |
| G2: Khám phá và PDP | Home, search/category, product card, PDP, shop, rating/policy/filter thống nhất | G1 + catalog contract | 2–3 tuần |
| G3: Người mua | Cart, checkout, payment states, order detail, return flow, account/help | G1 + order/payment contract; có thể gối G2 | 2–3 tuần |
| G4: Người bán | Workbench, order queue/detail, editor/variants/stock, marketing, inbox, số liệu | G1 + domain API | 2–3 tuần |
| G5: Quản trị | Moderation/case, shop/users, tài chính theo phạm vi đã chốt, CMS cơ bản, log/quyền | G4 contract + G1 | 2–3 tuần |
| G6: Community MVP | Hub, bài/Q&A, composer, saved/follow, liên kết PDP, queue kiểm duyệt | G2 + G5 moderation | 2–3 tuần |
| G7: Hoàn thiện | QA chéo role, accessibility, hiệu năng, data demo, hướng dẫn vận hành, rollout | Các giai đoạn liên quan | 1–2 tuần |

Nếu thực hiện tuần tự, tổng khung khoảng **12–20 tuần** với các giả định trên. Có thể gối việc UI buyer/seller/admin sau G1, nhưng không gối những thay đổi chưa thống nhất contract. Chỉ nên cam kết sprint tiếp theo sau khi G0 xác định rõ khối lượng tích hợp backend.

### 13.2. Phiên bản nâng cấp nhìn thấy sớm

Trong một đợt đầu khoảng 2–4 tuần tùy nguồn lực, tập trung: responsive + header/footer + layout theo role + homepage + card + PDP + sửa số liệu/nhãn dễ gây hiểu nhầm. Đây là một bản phát hành hữu ích và dễ so sánh trước/sau, không phải hoàn tất toàn bộ kế hoạch.

Community đầy đủ, ledger tài chính và quy trình phân xử không được hứa hoàn thành trong cùng một đợt “làm đẹp” ngắn.

### 13.3. Backlog có thể chuyển thành ticket

| ID | Đầu việc cụ thể | Ưu tiên | Nhóm | Điều kiện hoàn thành |
|---|---|---|---|---|
| F01 | Chốt từ điển thương hiệu, nhãn, chính sách | P0 | Design/content | Không còn nhãn sàn khác hoặc cam kết mâu thuẫn trong luồng chính |
| F02 | Đo và sửa overflow 390/776px | P0 | Frontend | Page width không vượt viewport; thao tác chính không khuất |
| F03 | Token màu/chữ/khoảng cách/trạng thái | P0 | Design/frontend | 6 màn hình mẫu dùng cùng token ở light/dark |
| F04 | Tách Storefront/Account/Auth/Checkout/Seller/Admin layout | P0 | Frontend | Mỗi role có điều hướng đúng nhiệm vụ |
| F05 | Button/input/dialog/drawer/table nền | P0 | Frontend | Keyboard, loading/error và focus hoạt động |
| F06 | Route guard và 401/403 | P0 | Full stack | Guest/customer/seller khác shop không dùng được view/API sai quyền |
| F07 | Chế độ demo và nguồn dữ liệu chuẩn | P0 | Full stack | Không fallback thành công giả ở luồng vận hành |
| B01 | Search/filter/sort trong URL | P0 | Full stack | Tổ hợp lọc + tab + reload + Back cho kết quả nhất quán |
| B02 | Home theo bộ sưu tập/nhu cầu | P1 | Design/frontend/content | Thấy hàng hóa sớm, mỗi section có đích và nguồn |
| B03 | Product card/quick view/compare | P1 | Frontend | Không nested button, không thêm sai biến thể, chiều cao ổn định |
| B04 | PDP/gallery/variant/delivery | P0 | Full stack/content | Ảnh/giá/stock đúng biến thể và cùng nguồn với cart |
| B05 | Review summary/Q&A | P0 | Full stack | Count/average/list khớp, verified purchase đúng |
| B06 | Storefront shop | P1 | Full stack/content | Tab/filter có URL, KPI có phạm vi, không badge giả |
| B07 | Cart nhiều shop | P0 | Full stack | Selected items/tổng/phí/voucher nhất quán |
| B08 | Checkout và payment states | P0 | Full stack | Đơn/tiền do server xác nhận; retry không tạo trùng |
| B09 | Order detail và tracking | P1 | Full stack | Timeline/kiện/hành động phù hợp và link được trực tiếp |
| B10 | Returns/case người mua | P1 | Full stack | Có caseId, trạng thái, deadline, kết quả liên thông |
| B11 | Account/wishlist/voucher/xu | P1 | Full stack | Thông tin lưu thật hoặc chỉ rõ demo; UI nhất quán |
| B12 | Auth/Help/About/Policy | P1 | Frontend/content | Link footer có đích; giữ return URL sau login |
| C01 | Topic taxonomy và content model | P1 | Backend/content | Q&A/review/post phân biệt và liên kết đúng |
| C02 | Community Hub/topic/feed | P1 | Full stack | Filter và pagination ổn; chỉ nội dung được phép xuất hiện |
| C03 | Post/question detail | P1 | Full stack | Reply/saved/report và sản phẩm liên quan hoạt động |
| C04 | Composer/draft/media | P1 | Full stack | Reload giữ nháp, upload lỗi retry, preview đúng |
| C05 | Community profile/activity | P1 | Full stack | Không lộ thông tin tài khoản/đơn riêng tư |
| C06 | Follow/notification/digest | P2 | Full stack | Có opt-out, deep link và cài đặt phù hợp |
| S01 | Seller overview với KPI thật | P0 | Full stack | Kỳ/nguồn/formula khớp report, không tăng trưởng cố định |
| S02 | Order queue/detail/bulk | P1 | Full stack | Filter giữ khi Back; bulk xử lý ngoại lệ và xung đột |
| S03 | Product editor/variants | P1 | Full stack | Draft/preview/validation/review lifecycle hoàn chỉnh |
| S04 | Inventory ledger/cảnh báo | P1 | Backend/frontend | Tồn khả dụng/giữ chỗ/historical adjustments rõ |
| S05 | Marketing campaigns | P1 | Full stack | Time/quota/stacking thực; hết hạn chuyển trạng thái đúng |
| S06 | Inbox đa kênh | P1 | Full stack | Hội thoại đúng shop, public/internal tách biệt |
| S07 | Wallet/settlement views | P0/P1 | Full stack | Không dùng số dư giả; chi tiết tới nguồn giao dịch |
| S08 | Shop editor/onboarding | P1 | Full stack | Preview/publish/approval có trạng thái rõ |
| A01 | Admin overview/queue/KPI | P0 | Full stack | Không số 0 giả hoặc tăng trưởng cố định |
| A02 | Shop approval/profile | P1 | Full stack | Quyết định có lý do, log và thông báo |
| A03 | Product moderation detail | P1 | Full stack | Có version, preview, conflict và kết quả server |
| A04 | Community reports/appeals | P1 | Full stack | Báo cáo tới queue, tác giả thấy trạng thái đúng quyền |
| A05 | Orders/disputes desk | P1 | Full stack | Cùng case ở ba role, quyết định truy vết được |
| A06 | Users/RBAC/audit | P1 | Full stack | Quyền server và UI đồng nhất, log truy xuất được |
| A07 | Catalog taxonomy/CMS | P1 | Full stack/content | Draft/preview/publish/rollback; không có link chết |
| A08 | Finance reconciliation | P1 | Full stack | Tổng khớp ledger, payout không là toggle client |
| Q01 | Cross-role regression | P0 | QA/full stack | Bộ hành trình chính và quyền đều qua |
| Q02 | Visual/mobile/a11y regression | P0 | QA/frontend | Không overlap/overflow, keyboard dùng được |
| Q03 | Perf và rollout | P1 | QA/full stack | Có baseline, báo cáo và phương án quay lại |

Ưu tiên P0 ở tài chính/kiểm duyệt trước hết là ngừng trình bày dữ liệu giả như thật; việc xây đầy đủ quy trình mới có thể thuộc P1 và triển khai theo giai đoạn.

### 13.4. Nghiệm thu bằng hành trình

| Kịch bản | Kết quả cần chứng minh |
|---|---|
| Người mới trên 390px tìm áo theo giá/size | Search nhìn thấy; filter có hiệu lực; PDP mở đúng, Back giữ vị trí |
| PDP chưa có đánh giá | Không hiển thị điểm mặc định; summary và danh sách nhất quán |
| Mua hai sản phẩm của hai shop | Giỏ, voucher, phí, tổng và hai kiện thống nhất; item không chọn không bị mua |
| Giá hoặc tồn đổi giữa checkout | Có thông báo cụ thể; khách xác nhận lại; không thu theo số cũ |
| Timeout sau gửi đơn | Thử lại không tạo hai đơn; khôi phục được trạng thái thực |
| Thanh toán đang chờ/thất bại/hết hạn | Không hiện thành công; có retry hợp lệ và giữ đơn |
| Seller xác nhận và bàn giao | Buyer/admin thấy đúng sự kiện; không gộp nhầm shipping với payment |
| Người mua gửi yêu cầu đổi trả | Seller/admin nhận cùng case; kết quả và tiền hoàn khớp |
| Seller đăng sản phẩm bị yêu cầu sửa | Có lý do theo trường, draft giữ, gửi lại tạo version phù hợp |
| Cộng đồng gửi bài rồi báo cáo | Pending không lộ; report tới admin; quyết định có log/kháng nghị |
| Seller B mở ID của seller A | UI/API từ chối, không chỉ ẩn menu |
| Reload admin sau duyệt/đối soát | Trạng thái tồn tại từ server, không hồi `INITIAL_*` |
| Dark mode + EN + keyboard | Đọc được, tên dài không vỡ bố cục, focus không mất |
| API lỗi hoặc danh sách rỗng | Lỗi/empty/loading khác nhau, không chuyển sang seed âm thầm |

### 13.5. Kiểm tra kỹ thuật khi thực hiện

- Chạy build client sau mỗi nhóm thay đổi có ý nghĩa: `npm --prefix client run build`.
- Chạy test backend/contract theo domain bị đổi; chạy bộ hồi quy đầy đủ trước mốc tích hợp lớn. `PROJECT.md` ghi 636 test, nhưng cần xác định lại số thực tế lúc chạy, không dùng con số tài liệu làm bằng chứng.
- E2E tập trung vào tìm/lọc, mua hàng, payment states, đơn/case, seller/admin và quyền. Không cần test sao chép mọi dòng CSS.
- Chụp baseline/sau sửa ở 390, 768, 1024, 1440px; kiểm tra thêm 360px và zoom 200% cho màn hình quan trọng.
- Kiểm tra `scrollWidth <= clientWidth` ở toàn trang; cho phép overflow nằm trong rail/table được thiết kế rõ.
- Kiểm tra ảnh đã load, alt hợp lý, component không blank, console không có lỗi mới trong luồng chính.
- Không thực hiện thanh toán/rút tiền thật trong QA; dùng sandbox hoặc dữ liệu demo tách biệt.

### 13.6. Thử nghiệm với người dùng

Sau G2/G3 tổ chức vòng thử nhỏ: khoảng 3 người mua, 2 người bán và 1 người quen vận hành. Đây là vòng khám phá vấn đề, không phải mẫu thống kê đủ để công bố tỷ lệ chuyển đổi.

Giao nhiệm vụ cụ thể: chọn sản phẩm theo ngân sách, tìm điều kiện đổi trả, tiếp tục thanh toán lỗi, xử lý một đơn, sửa sản phẩm bị từ chối, tìm case quá hạn. Quan sát thời gian, chỗ dừng, thao tác sai và mức tự tin. Ghi lại baseline trước khi đặt mục tiêu phần trăm cải thiện.

### 13.7. Chỉ số theo dõi sau phát hành

| Nhóm | Chỉ số đáng theo dõi |
|---|---|
| Người mua | Hoàn thành search → PDP, thêm giỏ theo phiên đủ điều kiện, checkout completion, lỗi thanh toán, liên hệ do không hiểu policy |
| Cộng đồng | Câu hỏi được trả lời, thời gian có trả lời hữu ích, lượt lưu, report hợp lệ, quay lại thảo luận |
| Người bán | Thời gian xử lý đơn, đơn quá hạn, lỗi tạo sản phẩm, câu hỏi chưa trả lời, sai lệch tồn |
| Quản trị | Queue quá hạn, thời gian xử lý, quyết định bị kháng nghị đúng, lệch đối soát, thất bại thao tác |
| Chất lượng UI | Lỗi responsive, lỗi accessibility nghiêm trọng, LCP/INP/CLS và tỷ lệ request thất bại |

Analytics không thu nội dung chat, địa chỉ hay dữ liệu thanh toán không cần thiết. Event nên gồm tên hành động, object id hợp lệ, role, trạng thái và ngữ cảnh cần cho đo lường.

### 13.8. Phát hành từng phần

- Feature flag theo layout/module: storefront mới, seller mới, community. Tắt riêng module lỗi, không cần rollback toàn sàn.
- Giữ redirect và URL cũ; migrates dữ liệu có version, lưu draft phù hợp, không làm mất giỏ đang dùng.
- Với schema mới, triển khai khả năng đọc tương thích trước, rồi UI và cuối cùng loại bỏ đường cũ khi đã xác minh.
- Chuẩn bị baseline ảnh, danh sách regression, backup/migration và cách quay lại cho thay đổi dữ liệu quan trọng.
- Sau phát hành kiểm tra ngay đường mua hàng, login, đơn, seller order queue và admin moderation; theo dõi lỗi trước khi bật cho toàn bộ người dùng.

## 14. Bộ màn hình và đầu ra cần bàn giao

### 14.1. Màn hình thiết kế tối thiểu

| Khu vực | Màn hình bắt buộc |
|---|---|
| Công khai | Home; search; category; collection; deals; PDP; shop; about; help/article; policy; not found |
| Người mua | Login/register/recovery; cart; 4 bước checkout; pending/failure/success; orders; order detail/tracking; return/case; profile/address/payment/security; wishlist; voucher/xu; inbox/notifications |
| Cộng đồng | Hub; topic; post/question detail; composer/preview; drafts; public profile; saved/activity; report/status |
| Seller | Onboarding; overview; orders/detail; products/editor/variants; inventory; campaign/voucher; inbox/reviews/Q&A; wallet/ledger/settlement; storefront editor; settings |
| Admin | Overview/queue; shop list/detail; moderation list/detail; community report/case; order/dispute; user detail; role/audit; taxonomy; CMS/media; campaign; settlement detail |

Mỗi màn hình quan trọng cần bản desktop/mobile và ít nhất trạng thái loading, empty, error, success/selected liên quan. Không bàn giao chỉ một ảnh tĩnh có dữ liệu lý tưởng.

### 14.2. Sáu màn hình nên chốt thiết kế trước

1. **Home:** xác định bản sắc, nhịp nội dung và phong cách ảnh.
2. **PDP:** xác định chiều sâu thông tin, giá, biến thể, review và cam kết.
3. **Checkout mobile:** xác định hiệu quả thao tác, form và tổng chi phí.
4. **Community detail:** xác định trải nghiệm đọc, thảo luận và liên kết sản phẩm.
5. **Seller order queue:** xác định công cụ vận hành có mật độ thông tin phù hợp.
6. **Admin moderation detail:** xác định bằng chứng, hành động, lý do và lịch sử.

Khi sáu màn hình này có cùng ngôn ngữ thiết kế và hoạt động hợp lý, phần còn lại có cơ sở để mở rộng nhất quán.

### 14.3. Ví dụ thay đổi nội dung

| Hiện tại | Cách viết đích |
|---|---|
| “Tìm kiếm hơn 100.000+ sản phẩm...” | “Tìm sản phẩm, thương hiệu, cửa hàng” |
| “Amazon's Choice” | “Sàn tuyển chọn” chỉ khi có tiêu chí và dữ liệu, nếu không thì bỏ |
| “Đổi trả 30 ngày” ở mọi nơi | “Đổi trả trong N ngày theo điều kiện sản phẩm” với N lấy từ policy |
| “Tăng trưởng +15.4%” cố định | “So với kỳ trước: ...” tính thật, hoặc “Chưa đủ dữ liệu so sánh” |
| “Đã thanh toán” sau thao tác UI | “Đang chờ xác nhận thanh toán” tới khi có kết quả server |
| “Tính toán theo doanh thu thực tế” trên biểu đồ mẫu | “Dữ liệu minh họa” trong demo; số liệu thật và kỳ đo trong vận hành |
| “Xác nhận giao tất cả” | “Xác nhận N đơn đã chọn” hoặc “Bàn giao N kiện” theo đúng hành động |

### 14.4. Quyết định cần chốt tại G0

Các điểm này không ngăn việc lập kế hoạch, nhưng ảnh hưởng ước lượng và thiết kế cuối:

- Sản phẩm phục vụ portfolio/demo hay sẽ vận hành thật? Nếu cả hai, cần cơ chế demo riêng.
- Giữ tên hiện tại hay xây tên thương mại? Mặc định plan giữ tên hiện tại và làm sạch nhãn lẫn thương hiệu.
- Nhóm ngành hàng ưu tiên? Mặc định chọn 2–3 ngành có dữ liệu tốt để làm chuẩn trước khi nhân rộng.
- Phương thức thanh toán/giao vận nào đã tích hợp thật? Mặc định không suy ra từ logo hoặc text UI.
- Community ưu tiên tư vấn lựa chọn hay chia sẻ trải nghiệm? Mặc định Q&A + trải nghiệm đã mua + cẩm nang.
- Nguồn ảnh, người viết nội dung và người duyệt là ai? Thiếu nội dung thì giảm số section, không bù bằng dữ liệu giả.
- Quy mô nhóm và thời hạn mong muốn? Dùng để điều chỉnh roadmap, không cắt bỏ trạng thái lỗi/quyền khỏi định nghĩa hoàn thành.

### 14.5. Nguồn mã để triển khai

Các số dòng là vị trí ở thời điểm khảo sát, có thể thay đổi sau các đợt chỉnh sửa.

| File | Vị trí/chủ đề liên quan |
|---|---|
| `client/src/App.jsx` | Dòng 39: AppLayout; 72: Header; 87: Routes; 106: Footer dùng chung |
| `client/src/styles/theme.css` | Token light/dark, radius, shadow, font; light dùng blue, dark chuyển sang orange |
| `client/src/styles/index.css` | Danh mục CSS import toàn cục, điểm kiểm soát cascade |
| `client/src/pages/HomePage.jsx` | Dòng 43: filters; 70: discovery fetch; 207: filters.brand; 227: hero; 239: flash deals |
| `client/src/components/FlashDeals.jsx` | TIME_SLOTS, countdown reset, công thức percentSold |
| `client/src/components/Header.jsx` và `client/src/styles/header.css` | Header/search/navigation, responsive cần rà |
| `client/src/components/Footer.jsx` | Nội dung SEO/attribution và các mục dạng span/li |
| `client/src/components/MobileBottomNav.jsx` | Điều hướng mobile và stacking với chat/CTA |
| `client/src/components/ProductCard.jsx` | Card, thao tác lồng, nhãn và trạng thái |
| `client/src/pages/ProductDetailPage.jsx` | Dòng 327: heading; 466: delivery text cố định; reviews/gallery/variants |
| `client/src/components/ProductQASection.jsx` | Dòng 66: fallback; local Q&A/vote, nút hỏi/trả lời |
| `client/src/pages/ShopStorefrontPage.jsx` | Cover, chỉ số shop, catalog và chính sách |
| `client/src/pages/CartPage.jsx` | Dòng 30: ngưỡng freeship; nhóm shop/voucher/tổng |
| `client/src/pages/CheckoutPage.jsx` | Dòng 46: stylesheet; SHIPPING_OPTIONS; stepper; payment codes; create order |
| `client/src/components/VietQRPaymentModal.jsx` | QR và trạng thái thanh toán cần đối chiếu backend |
| `client/src/pages/OrderHistoryPage.jsx` | Timeline/card đơn, mô phỏng vận chuyển, hành động sau mua |
| `client/src/pages/ProfilePage.jsx` | Tab hồ sơ, payment/security, local 2FA và rewards |
| `client/src/pages/SellerDashboardPage.jsx` | INITIAL data/localStorage; dòng 710: số dư tính từ nền cố định; 1805: tăng trưởng; 1862: chart; 2714: orders |
| `client/src/pages/AdminDashboardPage.jsx` | Dòng 119/127/135: dữ liệu mẫu; 479/484: moderation; 513: settlement state; 738/762: chỉ số cố định |
| `client/src/services/productService.js` | Fallback catalog và service sản phẩm/Q&A; cần đo bundle và chuẩn hóa nguồn |
| `client/src/services/addressService.js`, `paymentMethodService.js` | Persistence tài khoản, phân biệt local/server |
| `server/src/routes/productRoutes.js`, `reviewRoutes.js` | API Q&A/review/filter có thể tái dùng |
| `server/src/routes/orderRoutes.js`, `sellerRoutes.js`, `adminRoutes.js` | Endpoint nghiệp vụ và middleware quyền hiện có |
| `server/src/models/memoryStore.js` | Tài khoản/dữ liệu demo; không coi mọi dữ liệu là production |
| `PROJECT.md`, `docs/architecture.md`, `docs/api.md`, `docs/testing.md` | Tài liệu nền, mốc hiện đại hóa và hướng kiểm thử cần đối chiếu mã thực tế |

### 14.6. Thứ tự bắt đầu được khuyến nghị

**Đầu tiên:** sửa mobile, thống nhất nội dung và dữ liệu dễ gây hiểu nhầm, tạo token/component và tách layout. **Tiếp theo:** hoàn thiện homepage/PDP và luồng mua. **Sau đó:** xây công cụ seller/admin theo quy trình thật, đồng thời chuẩn bị moderation để mở community.

Kết quả mong muốn là một sàn dễ khám phá ở bề mặt, có thông tin đáng tin khi xem sâu và có công cụ làm việc rõ ràng phía sau. Người dùng cảm nhận sự chỉn chu từ việc mọi màn hình hiểu cùng một sản phẩm, đơn hàng và chính sách, chứ không chỉ từ màu sắc đẹp hơn.
