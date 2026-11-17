# Thông báo "Xe bạn đang đậu ở ..." sau khi lưu ảnh

Ngày: 2026-11-17

## Mục tiêu

Ngay sau khi người dùng lưu một vị trí đỗ xe, app đăng một thông báo cục bộ cho biết xe đang đậu ở đâu, kèm hai nút "Đã lấy xe" và "Dẫn đường về xe". Người dùng thấy lại vị trí và hành động ngay trên màn hình khoá hoặc Trung tâm thông báo mà không cần mở app.

**Bất biến:** tại mọi thời điểm chỉ có **đúng một** thông báo vị trí xe, thuộc về xe đang đậu (ảnh đang active). Không có xe đang đậu thì không có thông báo nào.

## Hành vi

**Nội dung**
- Tiêu đề: "Vị trí xe của bạn".
- Có ghi chú (sau khi bỏ khoảng trắng đầu cuối): nội dung là `Xe bạn đang đậu ở {ghi chú}`, ví dụ "Xe bạn đang đậu ở B1".
- Không có ghi chú: nội dung là "Bạn đã đậu xe".
- Thông báo **không** có ảnh.

**Nút hành động**
- "Đã lấy xe" và "Dẫn đường về xe". Xe không có GPS thì chỉ có nút "Đã lấy xe".
- Cả hai nút **mở app** (cấu hình `opensAppToForeground`), vì hành động chạy khi app đã bị tắt hẳn không đáng tin cậy.
- "Đã lấy xe": nếu bản ghi trong thông báo vẫn là xe đang đậu thì đánh dấu đã lấy xe (cùng logic với nút trong app); trong mọi trường hợp đều gỡ thông báo.
- "Dẫn đường về xe": mở bản đồ tới toạ độ lưu trong thông báo (dùng lại `directionsUrl`); thông báo giữ nguyên vì xe vẫn đang đậu. Trên iOS hệ thống tự gỡ thông báo khi bấm nút, nên app đăng lại thông báo **im lặng** (không banner, chỉ vào danh sách) trước khi mở bản đồ để vẫn có đúng một thông báo cho xe đang đậu. Nếu thông báo đã cũ (xe đang đậu là bản ghi khác) thì không mở bản đồ mà chỉ gỡ thông báo.
- Chạm vào thân thông báo: mở app (Home). Trên iOS hệ thống gỡ thông báo khi chạm (Android cũng gỡ khi chạm thân), nên app đăng lại thông báo im lặng (không banner) để vẫn có đúng một thông báo cho xe đang đậu.

**Vòng đời (luôn một thông báo cho xe đang đậu)**
- Đăng ngay sau khi lưu thành công và sau bước xin quyền thông báo hiện có.
- Dùng một mã định danh cố định, nên chụp vị trí mới sẽ **thay** thông báo cũ, không bao giờ có hai thông báo.
- Gỡ thông báo khi xe đang đậu không còn nữa, gồm: xoá bản ghi xe đang đậu (xoá một ảnh cũ trong lịch sử không gỡ gì); bấm "Đã lấy xe" trong app hoặc trên thông báo; xe đang đậu bị dọn khi hết hạn.
- Để giữ bất biến một cách chắc chắn, mỗi lần làm mới dữ liệu nếu không còn xe đang đậu thì gỡ thông báo (gỡ một thông báo không tồn tại là vô hại). Làm mới **không** đăng lại thông báo, tránh hiện banner lặp lại.
- Sau khi bấm "Dẫn đường về xe" hoặc chạm thân thông báo, hệ thống có thể đã gỡ thông báo, nên app đăng lại im lặng (cờ `silent` trong dữ liệu, bộ xử lý foreground ẩn banner) cho xe đang đậu hiện tại.
- Chỉ đăng khi đã có quyền thông báo; chưa có thì bỏ qua âm thầm, không ảnh hưởng việc lưu.
- Lỗi khi đăng hoặc gỡ thông báo không bao giờ chặn việc lưu ảnh hay điều hướng.

**Hiện khi app đang mở**
- Cấu hình xử lý thông báo toàn cục để banner vẫn hiện khi app đang ở foreground (không âm thanh). Việc này cũng làm các nhắc nhở hết hạn hiện khi app đang mở.

## Kiến trúc

- `src/domain/parkedNotification.ts` (thuần, có test):
  - `buildParkedText(note: string): { title: string; body: string }`.
  - `parseParkedAction(actionIdentifier: string, data: unknown): ParkedAction` với `ParkedAction = { type: 'collect'; recordId: string } | { type: 'navigate'; lat: number; lng: number } | { type: 'open' }`. Dữ liệu thiếu hoặc sai kiểu thì trả `{ type: 'open' }`.
  - Hằng số mã định danh thông báo, hai category (`parked-with-gps`, `parked-no-gps`) và hai mã hành động.
- `src/native/parkedNotification.ts` (adapter, không test bằng Jest): đăng ký category (mỗi nút `opensAppToForeground: true`), `showParkedNotification(record)` (kiểm tra quyền rồi đăng thông báo ngay với mã định danh cố định, dữ liệu gồm `recordId`, `lat`, `lng`), `dismissParkedNotification()`.
- `src/native/notificationSetup.ts`: `setNotificationHandler` ở cấp module (banner và danh sách, không âm thanh).
- Hook gốc xử lý phản hồi thông báo (`useLastNotificationResponse`), đặt ở layout gốc: mỗi phản hồi chỉ xử lý một lần, gọi `parseParkedAction` rồi thực hiện hành động qua service hiện có.
- Điểm tích hợp: `capture.tsx` (đăng sau khi lưu và sau bước xin quyền, dùng bản ghi mà `service.capture` trả về); Home `collect()` và màn hình Chi tiết sau khi xoá xe đang đậu thành công (gỡ thông báo); `useParking.refresh` (gỡ thông báo khi không còn xe đang đậu); layout gốc (đăng ký category, xử lý phản hồi).

## Xử lý lỗi và trường hợp biên

- Chưa có quyền thông báo: không đăng.
- Phản hồi thông báo cũ khi bản ghi không còn là xe đang đậu: chỉ gỡ thông báo, không đánh dấu lấy xe nhầm bản ghi khác.
- Phản hồi trùng lặp (khởi động nguội và hook): mỗi phản hồi chỉ xử lý một lần.
- Chụp liên tiếp hai lần nhanh: cùng mã định danh nên chỉ còn thông báo của lần sau.

## Kiểm thử

- Jest: `buildParkedText` (có ghi chú, khoảng trắng, rỗng, ghi chú dài), `parseParkedAction` (collect, navigate với toạ độ hợp lệ, toạ độ thiếu hoặc sai kiểu, hành động mặc định, dữ liệu rác).
- Máy thật (iOS): thông báo hiện sau khi lưu cả khi app đang mở và khi đã sang app khác; "Đã lấy xe" làm Home chuyển sang chưa có xe và thông báo biến mất; "Dẫn đường về xe" mở bản đồ; chụp lần hai thay thông báo (chỉ còn một); xoá xe đang đậu thì thông báo mất; xoá ảnh cũ trong lịch sử thì thông báo giữ nguyên; lưu mà chưa cấp quyền không lỗi; xe không có GPS chỉ có một nút.
- `npx tsc --noEmit` và toàn bộ test cũ phải tiếp tục pass.

## Ngoài phạm vi

Ảnh trong thông báo, thông báo đẩy từ máy chủ, Live Activity hay widget, thay đổi các nhắc nhở hết hạn hiện có.
