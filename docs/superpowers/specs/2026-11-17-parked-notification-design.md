# Thông báo "Xe bạn đang đậu ở ..." sau khi lưu ảnh

Ngày: 2026-11-17

## Mục tiêu

Ngay sau khi người dùng lưu một vị trí đỗ xe, app đăng một thông báo cục bộ cho biết xe đang đậu ở đâu, kèm ảnh vừa chụp và hai nút "Đã lấy xe" và "Dẫn đường về xe". Người dùng có thể thấy lại vị trí và hành động ngay trên màn hình khoá hoặc Trung tâm thông báo mà không cần mở app.

## Hành vi

**Nội dung**
- Tiêu đề: "Vị trí xe của bạn".
- Có ghi chú (sau khi bỏ khoảng trắng đầu cuối): nội dung là `Xe bạn đang đậu ở {ghi chú}`, ví dụ "Xe bạn đang đậu ở B1".
- Không có ghi chú: nội dung là "Bạn đã đậu xe".
- Ảnh vừa chụp được đính kèm trong cả hai trường hợp. **Chỉ iOS hỗ trợ ảnh đính kèm** (thư viện chỉ có kiểu `NotificationContentAttachmentIos`); trên Android thông báo có chữ và các nút nhưng không có ảnh.

**Nút hành động**
- "Đã lấy xe" và "Dẫn đường về xe". Xe không có GPS thì chỉ có nút "Đã lấy xe".
- Cả hai nút **mở app** (cấu hình `opensAppToForeground`), vì hành động chạy khi app đã bị tắt hẳn không đáng tin cậy.
- "Đã lấy xe": nếu bản ghi trong thông báo vẫn là xe đang đậu thì đánh dấu đã lấy xe (cùng logic với nút trong app); trong mọi trường hợp đều gỡ thông báo.
- "Dẫn đường về xe": mở bản đồ tới toạ độ lưu trong thông báo (dùng lại `directionsUrl`); thông báo giữ nguyên vì xe vẫn đang đậu.
- Chạm vào thân thông báo: mở app (Home).

**Thời điểm và vòng đời**
- Đăng ngay sau khi lưu thành công và sau bước xin quyền thông báo hiện có (thông báo không bị chặn bởi việc chưa có quyền ở lần lưu đầu tiên).
- Một mã định danh cố định, nên chụp vị trí mới sẽ **thay** thông báo cũ.
- Gỡ thông báo khi: bấm "Đã lấy xe" trong app; xoá bản ghi đang là xe đang đậu (không gỡ khi xoá một ảnh cũ trong lịch sử).
- Chỉ đăng khi đã có quyền thông báo; chưa có thì bỏ qua âm thầm, không ảnh hưởng việc lưu.
- Lỗi khi đăng hoặc gỡ thông báo không bao giờ chặn việc lưu ảnh hay điều hướng.

**Hiện khi app đang mở**
- Cấu hình xử lý thông báo toàn cục để banner vẫn hiện khi app đang ở foreground (không âm thanh). Việc này cũng làm các nhắc nhở hết hạn hiện khi app đang mở.

## Kiến trúc

- `src/domain/parkedNotification.ts` (thuần, có test):
  - `buildParkedText(note: string): { title: string; body: string }`.
  - `parseParkedAction(actionIdentifier: string, data: unknown): ParkedAction` với `ParkedAction = { type: 'collect'; recordId: string } | { type: 'navigate'; lat: number; lng: number } | { type: 'open' }`. Dữ liệu thiếu hoặc sai kiểu thì trả `{ type: 'open' }`.
  - Hằng số mã định danh thông báo, hai category (`parked-with-gps`, `parked-no-gps`) và hai mã hành động.
- `src/native/parkedNotification.ts` (adapter, không test bằng Jest): đăng ký category (mỗi nút `opensAppToForeground: true`), `showParkedNotification(record, photoUri)` (kiểm tra quyền, sao chép ảnh sang thư mục cache rồi đính kèm bản sao, vì iOS có thể **di chuyển** file đính kèm và làm mất ảnh gốc, rồi đăng thông báo ngay với mã định danh cố định), `dismissParkedNotification()`.
- `src/native/notificationSetup.ts`: `setNotificationHandler` ở cấp module (banner và danh sách, không âm thanh).
- Hook gốc xử lý phản hồi thông báo (`useLastNotificationResponse`), đặt ở layout gốc: chạy mỗi phản hồi đúng một lần, gọi `parseParkedAction` rồi thực hiện hành động qua service hiện có.
- Điểm tích hợp: `capture.tsx` (đăng sau khi lưu và sau bước xin quyền, dùng bản ghi mà `service.capture` trả về), Home `collect()` và màn hình Chi tiết sau khi xoá thành công (gỡ thông báo), layout gốc (đăng ký category, xử lý phản hồi).

## Xử lý lỗi và trường hợp biên

- Ảnh gốc bị mất hoặc sao chép lỗi: đăng thông báo không có ảnh.
- Chưa có quyền thông báo: không đăng.
- Phản hồi thông báo cũ khi bản ghi không còn là xe đang đậu: chỉ gỡ thông báo, không đánh dấu lấy xe nhầm bản ghi khác.
- Phản hồi trùng lặp (khởi động nguội và hook): mỗi phản hồi chỉ xử lý một lần.

## Kiểm thử

- Jest: `buildParkedText` (có ghi chú, khoảng trắng, rỗng, ghi chú dài), `parseParkedAction` (collect, navigate với toạ độ hợp lệ, toạ độ thiếu hoặc sai kiểu, hành động mặc định, dữ liệu rác).
- Máy thật (iOS): thông báo có ảnh và hai nút sau khi lưu, cả khi app đang mở và khi đã sang app khác; "Đã lấy xe" làm Home chuyển sang trạng thái chưa có xe và thông báo biến mất; "Dẫn đường về xe" mở bản đồ; chụp lần hai thay thông báo; lưu mà chưa cấp quyền thì không lỗi; xe không có GPS chỉ có một nút.
- `npx tsc --noEmit` và toàn bộ test cũ phải tiếp tục pass.

## Ngoài phạm vi

Ảnh trong thông báo trên Android, thông báo đẩy từ máy chủ, Live Activity hay widget, thay đổi các nhắc nhở hết hạn hiện có.
