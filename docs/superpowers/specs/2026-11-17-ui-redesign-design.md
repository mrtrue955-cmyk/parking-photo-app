# Thiết kế lại UI: biển chỉ dẫn hầm xe

Ngày: 2026-11-17

## Mục tiêu

Thiết kế lại giao diện của Parking Photo App theo ngôn ngữ thị giác của bãi đỗ xe trong hầm (số tầng sơn lớn, biển xanh chữ P, vạch kẻ ô vàng, nền bê tông), để người dùng đang xách đồ trong hầm nhìn một lần là biết xe ở đâu và bấm một nút để đi tới.

Chỉ đổi giao diện. **Không đổi** dữ liệu, service, quyền, thông báo hay luồng người dùng.

## Phạm vi

Trong phạm vi:
- Hệ thống thiết kế (màu, chữ, khoảng cách) cho chế độ sáng và tối.
- Font Barlow và Barlow Condensed.
- Thiết kế lại Home (có xe / chưa có xe), Chụp, Chi tiết.
- Chế độ tối tự theo cài đặt máy.

Ngoài phạm vi: hoạt ảnh góc vạch vàng, nút chọn nhanh tầng, thay đổi cấu trúc dữ liệu, tablet, web.

## Người dùng và nhiệm vụ chính

Người đỗ xe trong hầm siêu thị. Hai khoảnh khắc: (1) chụp trong vài giây rồi đi; (2) vài giờ sau, đứng trong hầm, phải nhìn là biết xe ở đâu và bấm "Dẫn đường về xe".

## Hệ thống thiết kế

### Màu (token ngữ nghĩa)

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `background` | `#E4E6E5` (bê tông) | `#1B1E21` | nền màn hình |
| `surface` | `#F7F8F7` | `#252A2E` | thẻ, hàng lịch sử |
| `text` | `#23272B` (nhựa đường) | `#ECEEED` | chữ chính |
| `textMuted` | `#5A6166` | `#A3AAAE` | chữ phụ |
| `border` | `#C9CDCC` | `#394046` | đường viền, nền thanh hạn xoá |
| `primary` | `#1550A0` (biển xanh) | `#8DB6F5` | nút chính, liên kết |
| `onPrimary` | `#FFFFFF` | `#0E1F3B` | chữ trên nút chính |
| `bay` | `#F4C20D` (vạch vàng) | `#F4C20D` | **chỉ** khung quanh xe đang đậu và góc ô ngắm |
| `danger` | `#C23B2E` | `#FF7A6B` | chỉ cho "Xoá ngay" |

Ràng buộc: mọi cặp chữ/nền đạt tương phản WCAG AA (4.5:1 cho chữ thường, 3:1 cho chữ lớn và thành phần giao diện) ở cả hai chế độ. Việc này được kiểm bằng unit test trên chính bảng token (hàm tính tỉ lệ tương phản), nên giá trị hex ở trên là đề xuất và có thể điều chỉnh để đạt ngưỡng.

### Chữ

- **Barlow Condensed (SemiBold):** ghi chú vị trí cỡ lớn và tiêu đề màn hình, giống chữ số tầng trên cột.
- **Barlow (Regular, Medium, SemiBold):** mọi chữ còn lại.
- Thang chữ: số tầng/ghi chú 44/48 (condensed), tiêu đề 28/32 (condensed), nút 18/24 (Barlow SemiBold), nội dung 17/24, chữ phụ 14/20.
- Ghi chú vị trí tối đa 2 dòng, tự co (`adjustsFontSizeToFit`, `minimumFontScale` 0.6); phóng chữ hệ thống tối đa 1.2 lần cho cỡ lớn để bố cục không vỡ.
- **Điều kiện bắt buộc:** font phải hiển thị đúng đầy đủ dấu tiếng Việt (ă â ê ô ơ ư đ và các dấu thanh trên chúng). Nếu Barlow thiếu hoặc hiển thị sai, dùng Be Vietnam Pro làm phương án dự phòng và cập nhật tài liệu này.

### Khoảng cách và hình khối

Lưới 8pt. Lề màn hình 20. Bo góc 12 cho thẻ và ảnh, 28 cho nút (viên thuốc). Không đổ bóng; phân tầng bằng khác biệt màu `background`/`surface` và viền `border`. Vùng chạm tối thiểu 48pt.

## Bố cục

### Home, đang có xe

```
┌──────────────────────────────┐
│ Xe của tôi  (nhựa đường,     │
│              condensed 28)   │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │  ← 4 góc vạch vàng quanh ảnh
│ │        ảnh cột           │  │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│  B2, cột 14   (condensed 44) │
│  Đậu 2 giờ trước  (phụ)      │
│  [   Dẫn đường về xe   ]     │  ← biển xanh, full width
│  Đã lấy xe        (chữ xanh) │
├──────────────────────────────┤
│ ▣ B1, gần thang máy          │
│   ▓▓▓▓▓▓▓▓░░░  còn 21 ngày   │  ← thanh hạn xoá
└──────────────────────────────┘
```

- Không có nhãn kiểu "Xe đang ở đây" phía trên thẻ: ảnh có khung vàng và số tầng lớn tự nói lên điều đó.
- "Dẫn đường về xe" chỉ hiện khi có GPS (giữ nguyên hành vi hiện tại).
- "Đã lấy xe" là nút chữ, kém nổi bật hơn nút chính để tránh bấm nhầm.
- "Chụp vị trí mới" nằm ở cuối phần xe hiện tại dưới dạng nút chữ.

### Home, chưa có xe

Căn giữa theo chiều dọc: dòng hướng dẫn "Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày." và nút "Chụp vị trí xe" (biển xanh).

### Lịch sử

Hàng gồm ảnh nhỏ 64×64, ghi chú (một dòng, condensed 20), và thanh hạn xoá. Thanh có độ đầy bằng `daysLeft / 30` (hàm thuần `expiryFraction`, có test), kèm chữ "còn N ngày". Ảnh đã giữ lại (`expiresAt === null`) không có thanh mà hiện chữ "Đã giữ lại". Khi còn dưới 4 ngày, thanh đổi sang `danger`.

### Chụp

Ô ngắm kín chiều ngang, bốn góc vạch vàng đánh dấu khung chụp. Nút chụp tròn lớn nằm dưới giữa màn hình trong tầm ngón cái. Sau khi chụp: ảnh xem lại, trạng thái GPS bằng một dòng chữ phụ, ô ghi chú ("Ví dụ: B2, cột 14"), nút "Lưu" (chính) và "Chụp lại" (chữ).

### Chi tiết

Ảnh rộng đầy lề, ghi chú condensed 44, ngày chụp, hạn xoá (thanh + chữ), toạ độ và nút "Mở bản đồ" (chữ), nút "Giữ lại" (chính) khi chưa giữ, nút "Xoá ngay" (chữ màu `danger`) ở cuối, tách khỏi các nút khác bằng khoảng trống lớn.

## Kiến trúc

Thêm thư mục `src/ui/`:

- `theme.ts`: bảng token sáng/tối và kiểu chữ (hàm thuần, không phụ thuộc React Native).
- `useTheme.ts`: hook trả token theo `useColorScheme()`.
- `fonts.ts`: danh sách font nạp bằng `useFonts` và tên họ chữ.
- `contrast.ts`: hàm tính tỉ lệ tương phản WCAG (cho test).
- `components/`: `Text` (nhận `variant`), `PrimaryButton`, `TextButton`, `BayFrame` (khung bốn góc vàng quanh một nội dung), `ExpiryBar`, `SpotCard`, `HistoryRow`.

`src/app/_layout.tsx` nạp font bằng `useFonts` và giữ màn hình khởi động (splash) cho tới khi font sẵn sàng, đồng thời cấu hình header theo token (nền, màu chữ, font condensed). Ba màn hình hiện có được viết lại để dùng các thành phần trên. Giữ nguyên `contentInsetAdjustmentBehavior="automatic"` trên các danh sách cuộn.

Mọi thành phần có `accessibilityLabel`/`accessibilityRole` phù hợp; thanh hạn xoá có `accessibilityValue` dạng "còn 21 ngày".

## Xử lý lỗi và trường hợp biên

- Font tải lỗi: vẫn hiển thị bằng font hệ thống (không chặn app) và không crash.
- Ghi chú dài hoặc trống: tự co hai dòng; trống thì hiện "Không có ghi chú" với chữ phụ.
- Ảnh không tải được: khung xám với biểu tượng ảnh hỏng, không làm vỡ bố cục.
- Chữ hệ thống phóng to: bố cục cuộn được, nút không bị cắt.

## Kiểm thử

- Unit test thuần (Jest): `expiryFraction` (biên: 0, hết hạn, giữ lại), `contrastRatio` và kiểm tra mọi cặp màu ở cả hai chế độ đạt ngưỡng.
- Kiểm tra bằng mắt trên máy thật, sáng và tối: Home hai trạng thái, Chụp, Chi tiết, ghi chú dài, chữ hệ thống lớn.
- Xác nhận dấu tiếng Việt hiển thị đúng ở mọi cỡ chữ của Barlow.
- `npx tsc --noEmit` và toàn bộ test cũ phải tiếp tục pass.

## Phụ thuộc mới

`expo-font` và gói font Barlow (`@expo-google-fonts/barlow`, `@expo-google-fonts/barlow-condensed`), cài bằng `npx expo install`. App cần build native lại sau khi cài.
