# Parking Photo App — Thiết kế

Ngày: 2026-11-17

## Vấn đề

Người dùng chụp ảnh cây cột ở bãi đậu xe siêu thị để nhớ vị trí xe. Ảnh nằm lại trong Gallery và không bao giờ được xoá, nên sau một năm Gallery đầy ảnh cột vô nghĩa.

## Mục tiêu

Một app cho phép chụp vị trí xe, lưu **ngoài Gallery**, và **tự xoá sau 30 ngày**.

## Phạm vi MVP

Chỉ làm việc chụp và nhớ vị trí đậu xe. Ảnh tạm dùng chung (hoá đơn, bảng giá, ...) và thời hạn xoá tuỳ chỉnh nằm ngoài MVP.

## Công nghệ

- React Native với Expo (dev build), chạy iOS và Android.
- `expo-camera`, `expo-location`, `expo-file-system`, `expo-sqlite`, `expo-notifications`, `expo-background-task`.
- Ảnh lưu trong thư mục riêng của app nên không vào Gallery và app xoá được mà không cần quyền xoá ảnh trong Gallery.

## Dữ liệu

Bảng `parking_records` (SQLite):

| Trường | Ghi chú |
| --- | --- |
| `id` | khoá chính |
| `photoPath` | đường dẫn file ảnh trong thư mục app |
| `lat`, `lng` | có thể trống nếu không có quyền vị trí hoặc không lấy được |
| `note` | ghi chú ngắn, tuỳ chọn |
| `createdAt` | thời điểm chụp |
| `collectedAt` | trống nếu xe vẫn đang đậu |
| `expiresAt` | `createdAt` + 30 ngày, không đổi khi bấm "Đã lấy xe" |

**Vị trí hiện tại** là bản ghi mới nhất có `collectedAt` trống. Nếu người dùng chụp lần mới khi lần trước chưa bấm "Đã lấy xe", app tự đặt `collectedAt` cho bản ghi cũ.

## Cơ chế tự xoá

- `purgeExpired()` xoá file ảnh trước, rồi xoá bản ghi nào có `expiresAt` đã qua.
- Chạy mỗi khi mở app hoặc quay lại app. Đây là cơ chế chính vì chắc chắn chạy.
- Tác vụ nền gọi lại hàm này khi app không mở. Hệ điều hành không đảm bảo chạy, nên chỉ là cơ chế phụ.
- Thông báo nhắc trước khi xoá (ví dụ "3 ảnh sẽ bị xoá vào ngày mai"), kèm cách giữ lại.
- Bản ghi có file ảnh bị mất sẽ bị bỏ khi dọn.

## Màn hình

**Home**
- Thẻ "Xe đang ở đây": ảnh lớn, ghi chú, thời gian đã đậu, nút **Dẫn đường về xe** (mở Apple Maps hoặc Google Maps theo GPS) và nút **Đã lấy xe**.
- Nếu chưa có xe đang đậu, thẻ đổi thành nút lớn **Chụp vị trí xe**.
- Lịch sử bên dưới: ảnh nhỏ, ghi chú, "Tự xoá sau X ngày". Chạm để xem chi tiết.

**Chụp**
- Camera, sau đó ô ghi chú (tuỳ chọn) và nút **Lưu**.
- GPS lấy ngầm lúc chụp. Nếu thiếu GPS, vẫn lưu ảnh và ghi chú, ẩn nút dẫn đường.

**Chi tiết ảnh**
- Ảnh phóng to, ghi chú, bản đồ nhỏ, ngày hết hạn.
- **Giữ lại**: ghi ảnh vào Gallery rồi gỡ bản ghi khỏi cơ chế tự xoá.
- **Xoá ngay**.

## Quyền

Xin đúng lúc cần:
- Camera và vị trí (khi đang dùng app): lần đầu mở màn hình Chụp.
- Thông báo: sau lần chụp đầu tiên, kèm lời giải thích.
- Ghi vào Gallery: chỉ khi bấm "Giữ lại".

## Xử lý lỗi

- Lưu thất bại: báo lỗi, không tạo bản ghi dở dang.
- Khi dọn: xoá file trước, rồi xoá bản ghi.
- Từ chối quyền vị trí: app vẫn dùng được, chỉ mất tính năng dẫn đường.

## Kiểm thử

- Unit test cho logic không phụ thuộc giao diện: `purgeExpired`, tính `expiresAt`, chọn vị trí hiện tại.
- Camera và GPS test tay trên máy thật.
