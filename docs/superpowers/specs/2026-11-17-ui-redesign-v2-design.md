# Thiết kế lại UI v2: Amber + Charcoal + Warm White theo mẫu

Ngày: 2026-11-17

Tài liệu này **thay thế** hướng "biển chỉ dẫn hầm xe" trong `2026-11-17-ui-redesign-design.md` (bảng màu xanh/bê tông, khung vạch vàng, font Barlow). Những gì không nêu lại ở đây (dữ liệu, service, quyền, thông báo, logic từng màn hình) giữ nguyên như hiện tại.

## Mục tiêu

Đổi giao diện theo ba ảnh mẫu của người dùng (app đỗ xe: thẻ bo góc lớn, nút viên thuốc, chip nhỏ, tab phân đoạn, thanh điều hướng đáy dạng viên thuốc nổi) với bảng màu Amber + Charcoal + Warm White, và đổi cấu trúc điều hướng sang thanh tab đáy.

## Phạm vi

Trong phạm vi:
- Hệ thống thiết kế mới (màu sáng/tối, font, hình khối).
- Thanh tab đáy 3 mục: **Xe của tôi**, nút **Chụp** tròn amber ở giữa, **Lịch sử**.
- Viết lại Home, Lịch sử (màn hình mới), Chụp, Chi tiết.
- Header tuỳ chỉnh (nút quay lại hình tròn, tiêu đề giữa) cho màn hình Chụp và Chi tiết.
- Chế độ tối theo cài đặt máy.

Ngoài phạm vi: bản đồ, tìm kiếm, ngày giờ, đánh giá sao, giá tiền, số dư, loại phương tiện, màn hình hồ sơ hay cài đặt (không có tương đương trong app); thay đổi dữ liệu, service, quyền, thông báo.

## Ánh xạ từ mẫu sang app

| Trong mẫu | Trong app |
| --- | --- |
| Thẻ booking: ảnh trái, chip, tiêu đề, hai nút (phụ xám + chính) | Thẻ vị trí đỗ xe: ảnh, chip hạn xoá, ghi chú làm tiêu đề; hai nút chỉ có ở thẻ xe đang đậu trên Home |
| Tab phân đoạn Active / Completed / Cancelled | Tab phân đoạn ở Lịch sử: **Tất cả / Sắp hết hạn / Đã giữ lại** |
| Nút tròn "+" cạnh số dư | Nút Chụp tròn amber ở giữa thanh tab |
| Thanh tab đáy viên thuốc nổi, mục đang chọn nằm trong vòng tròn màu | Giữ nguyên kiểu, 3 mục |
| Header: nút quay lại tròn, tiêu đề giữa, nút lọc tròn | Giữ nút quay lại tròn và tiêu đề giữa; không có nút lọc |

Khác mẫu có chủ ý: thẻ trong Lịch sử không có hai nút, chạm vào cả thẻ để mở Chi tiết, nhằm không lặp lại logic "Giữ lại" và "Mở bản đồ" ở hai nơi.

## Hệ thống thiết kế

### Màu (đề xuất; test tương phản là nơi chốt giá trị cuối)

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `background` | `#FBF7F0` (warm white) | `#1E1B19` | nền màn hình |
| `surface` | `#FFFFFF` | `#2A2623` | thẻ, ô nhập |
| `surfaceAlt` | `#F3ECE0` | `#35302C` | nút phụ, tab phân đoạn nền, ô thanh tab |
| `text` | `#2B2724` (charcoal) | `#F5EFE6` | chữ chính |
| `textMuted` | `#6F675F` | `#B3A99D` | chữ phụ |
| `primary` | `#F5A524` (amber) | `#F5A524` | nút chính, nút Chụp, mục tab đang chọn, thanh hạn xoá |
| `onPrimary` | `#2B2724` | `#2B2724` | chữ và biểu tượng trên nền amber |
| `accent` | `#9A5B00` | `#F5A524` | chữ hoặc liên kết màu nhấn trên nền `background`/`surface` |
| `chip` | `#FDEBC8` | `#4A3A1F` | nền chip trạng thái |
| `onChip` | `#2B2724` | `#F5E3BE` | chữ trên chip |
| `border` | `#E9E1D4` | `#3E3833` | viền thẻ, nền thanh hạn xoá |
| `danger` | `#B3261E` | `#FF7A6B` | "Xoá ngay" và chip sắp hết hạn |

Quy tắc: amber chỉ dùng làm **nền** (nút, chip, vòng tròn, thanh). Chữ trên amber luôn là charcoal (chữ trắng trên amber không đạt tương phản). Chữ nhấn trên nền sáng dùng `accent` (amber đậm). Mọi cặp chữ/nền đạt WCAG AA (4.5:1 chữ thường, 3:1 thành phần giao diện) ở cả hai chế độ, kiểm bằng unit test trên bảng token.

### Chữ

Một họ chữ: **Be Vietnam Pro** (Regular 400, Medium 500, SemiBold 600, Bold 700), thiết kế cho tiếng Việt, tròn và thân thiện, gần với font trong mẫu. Phải kiểm độc lập mọi ký tự tiếng Việt có trong file font (như lần trước) trước khi dùng; nếu thiếu thì dừng và chọn lại.

| Biến thể | Cỡ/dòng | Dùng cho |
| --- | --- | --- |
| `display` | 30/38 Bold | ghi chú vị trí trên thẻ xe đang đậu và Chi tiết (tối đa 2 dòng, tự co) |
| `title` | 24/30 Bold | tiêu đề màn hình |
| `heading` | 18/24 SemiBold | tiêu đề thẻ, tiêu đề mục |
| `body` | 16/24 Regular | nội dung |
| `button` | 16/24 SemiBold | nhãn nút |
| `caption` | 13/18 Medium | chữ phụ, chip |

Phóng chữ hệ thống tối đa 1.2 lần cho `display`/`title`, 1.6 cho phần còn lại.

### Hình khối

Lưới 8pt, lề màn hình 20. Bo góc: thẻ 24, ảnh trong thẻ 20, chip 12, ô nhập 16, nút và tab phân đoạn hình viên thuốc, thanh tab 32. Vùng chạm tối thiểu 48pt. Chỉ thanh tab nổi có một bóng đổ nhẹ; thẻ phân tầng bằng khác biệt màu `background`/`surface` và viền `border`.

## Điều hướng

```
Root Stack (không header mặc định)
├─ (tabs)            thanh tab nổi tuỳ chỉnh
│   ├─ index         "Xe của tôi"
│   └─ history       "Lịch sử"
├─ capture           toàn màn hình, header tuỳ chỉnh
└─ record/[id]       toàn màn hình, header tuỳ chỉnh
```

- Thanh tab có 3 vị trí: Xe của tôi, nút Chụp tròn amber (không phải tab thật, bấm sẽ mở `/capture`), Lịch sử. Mục đang chọn nằm trong vòng tròn amber, biểu tượng charcoal.
- Nội dung hai tab chừa chỗ ở đáy bằng chiều cao thanh tab cộng vùng an toàn dưới.
- Route `record/[id]` và `capture` giữ nguyên đường dẫn; typed routes cập nhật theo nhóm `(tabs)`.

## Màn hình

**Xe của tôi (tab 1)**
- Tiêu đề "Xe của tôi" (title) ở trên cùng.
- Có xe đang đậu: thẻ lớn gồm ảnh bo 20, chip "Đang đậu", ghi chú `display`, "Đậu 2 giờ trước" (caption), hàng hai nút viên thuốc: "Đã lấy xe" (phụ) và "Dẫn đường về xe" (chính amber, chỉ khi có GPS; không có GPS thì "Đã lấy xe" là nút chính đầy chiều ngang). Bấm ảnh mở Chi tiết.
- Dưới thẻ: mục "Gần đây" kèm liên kết "Xem tất cả" (sang tab Lịch sử), hiển thị tối đa 3 thẻ lịch sử gần nhất.
- Chưa có xe: thẻ trống với vòng tròn amber chứa biểu tượng camera, dòng "Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày." và nút chính "Chụp vị trí xe".

**Lịch sử (tab 2)**
- Tiêu đề "Lịch sử", tab phân đoạn viên thuốc: Tất cả / Sắp hết hạn / Đã giữ lại (mục chọn nền amber, chữ charcoal).
- Danh sách thẻ: ảnh vuông 88 bo 16 bên trái; bên phải chip trạng thái ("còn N ngày" nền `chip`; "Sắp hết hạn" nền `danger` nhạt khi còn dưới 4 ngày; "Đã giữ lại"), ghi chú (`heading`, 1 dòng), "Đậu 3 ngày trước" (caption), thanh hạn xoá mảnh (không có cho ảnh đã giữ lại). Chạm cả thẻ để mở Chi tiết.
- Trạng thái trống theo từng tab, ví dụ "Chưa có ảnh nào sắp hết hạn."

**Chụp**
- Header: nút quay lại tròn, tiêu đề giữa "Chụp vị trí xe".
- Ô ngắm bo 24; nút chụp tròn dưới giữa (vòng trắng ngoài, hình tròn amber bên trong).
- Sau khi chụp: ảnh xem lại bo 24, một dòng trạng thái GPS, ô ghi chú bo 16 trên `surface`, nút chính "Lưu" và nút phụ "Chụp lại" (giữ nguyên logic lưu, xin quyền thông báo, quyền camera).

**Chi tiết**
- Header: nút quay lại tròn, tiêu đề "Chi tiết".
- Ảnh bo 24, chip trạng thái, ghi chú `display`; thẻ thông tin gồm "Chụp lúc", thanh hạn xoá kèm "còn N ngày" và toạ độ (khi có); nút chính "Giữ lại" (khi chưa giữ), nút phụ "Mở bản đồ" (khi có GPS), nút chữ danger "Xoá ngay" tách ra ở cuối (giữ nguyên logic keep/xoá).

## Kiến trúc

Thay đổi trong `src/ui/`: viết lại `theme.ts`, `fonts.ts`, `Text`, `Button` (thêm nút phụ, nút tròn biểu tượng), `ExpiryBar`; thêm `Chip`, `SegmentedTabs`, `ScreenHeader`, `TabBar`, `EmptyState`, `SpotCard` và `HistoryCard` mới; bỏ `BayFrame` và gói font Barlow. Logic thuần mới: `src/domain/history.ts` với `filterHistory(records, filter, now)` và kiểu `HistoryFilter = 'all' | 'expiring' | 'kept'`. Biểu tượng dùng bộ `@expo/vector-icons` nếu đã là dependency cấp cao nhất (kiểm tra khi lập kế hoạch), nếu không thì chọn phương án khác trong kế hoạch.

Cấu trúc route đổi sang `src/app/_layout.tsx` (Stack gốc), `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/history.tsx`, `src/app/capture.tsx`, `src/app/record/[id].tsx`. `useParking` được hai tab dùng chung (mỗi tab có bản thể riêng, cùng làm mới khi lấy tiêu điểm).

## Xử lý lỗi và trường hợp biên

- Font lỗi: app vẫn chạy bằng font hệ thống (giữ cơ chế hiện có).
- Ghi chú dài hoặc trống: tự co hai dòng; trống thì hiện "Không có ghi chú".
- Danh sách rỗng ở từng tab phân đoạn: hiện dòng thông báo riêng.
- Chữ hệ thống phóng to: bố cục cuộn được, nút không bị cắt, thanh tab không che nội dung.
- Vùng an toàn dưới: thanh tab và các nút sát đáy cộng `insets.bottom`.

## Kiểm thử

- Unit test thuần (Jest): `filterHistory` (ba bộ lọc, biên 4 ngày, ảnh đã giữ lại, danh sách rỗng); tương phản cho mọi cặp trong bảng token ở cả hai chế độ, gồm chữ charcoal trên amber, `accent` trên `background`, `onChip` trên `chip`, `danger` trên `surface`.
- Kiểm tra bằng mắt trên máy thật, sáng và tối: Home hai trạng thái, Lịch sử ba tab, Chụp, Chi tiết, ghi chú dài, chữ hệ thống lớn, thanh tab và nút Chụp, dấu tiếng Việt ở mọi cỡ.
- `npx tsc --noEmit`, toàn bộ test cũ và `expo export` iOS phải tiếp tục pass.

## Phụ thuộc

Thêm gói font Be Vietnam Pro (`@expo-google-fonts/be-vietnam-pro`), gỡ `@expo-google-fonts/barlow` và `@expo-google-fonts/barlow-condensed`. Không cần build native lại (font nạp lúc chạy).
