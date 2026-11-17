# Gợi ý ghi chú vị trí từ ảnh (OCR trên máy)

Ngày: 2026-11-17

## Mục tiêu

Sau khi chụp ảnh vị trí xe, app đọc chữ trong ảnh (tên tầng, khu, số cột in trên cột và biển chỉ dẫn) ngay trên điện thoại và tự điền gợi ý vào ô ghi chú, ví dụ "B2, cột 14". Người dùng đỡ phải gõ, còn thông báo "Xe bạn đang đậu ở ..." có sẵn vị trí để nhận ra chỗ đỗ.

## Quyết định đã chốt

- **Đọc chữ trên máy (OCR)**, không dùng dịch vụ AI trên mạng ở lần này. Ảnh không rời khỏi điện thoại, miễn phí, hoạt động khi hầm mất sóng. App vẫn giữ lời hứa "không gửi gì ra ngoài".
- **Tự điền vào ô ghi chú**, người dùng có thể sửa. Không bao giờ ghi đè chữ người dùng đã tự gõ.
- AI trên mạng (mô tả cảnh) là tuỳ chọn **sau này**, chỉ chạy khi người dùng tự bật và đồng ý gửi ảnh. Lần này chỉ thiết kế một đường nối cho nó, không làm phần mạng.

## Hành vi

Ở bước xem lại ảnh của màn hình Chụp:

1. Ngay khi có ảnh, app chạy OCR **ở nền**, không chặn nút "Lưu". Dưới ô ghi chú hiện dòng chữ phụ "Đang đọc ảnh...".
2. Khi OCR xong và quy tắc tìm được vị trí: nếu ô ghi chú **còn trống và người dùng chưa gõ gì**, tự điền gợi ý và đổi dòng chữ phụ thành "Gợi ý từ ảnh, bạn có thể sửa". Nếu người dùng đã gõ (kể cả đã xoá hết), không điền.
3. Không tìm được gì phù hợp, hoặc OCR lỗi hay quá 5 giây: dòng chữ phụ biến mất, ô ghi chú để nguyên, không báo lỗi.
4. Người dùng bấm "Lưu" lúc OCR còn chạy: lưu với ghi chú hiện có, kết quả OCR về sau bị bỏ qua.
5. Người dùng bấm "Chụp lại": kết quả của ảnh cũ bị bỏ qua, ảnh mới chạy OCR mới và trạng thái "đã gõ" được đặt lại.
6. Người dùng bắt đầu gõ: dòng chữ phụ biến mất.

Thông báo và mọi nơi khác dùng ghi chú **không đổi**: gợi ý chỉ là chữ trong ô ghi chú cho tới khi lưu.

## Quy tắc nhận ra vị trí (logic thuần, có test)

Đầu vào là danh sách dòng chữ OCR đọc được; đầu ra là một chuỗi gợi ý hoặc `null`.

- Chuẩn hoá trước khi so khớp: bỏ khoảng trắng thừa, chuyển chữ hoa, bỏ dấu tiếng Việt (`Đ` thành `D`, `TẦNG` thành `TANG`), để "Cột", "COT" và "cột" đều khớp.
- Ưu tiên độ chính xác hơn độ phủ, vì người dùng luôn sửa được. Chỉ nhận ba loại thành phần:
  - **Tầng:** cả dòng là mã tầng dạng `B1`, `B2`, `L3`, `P1`; hoặc dòng có từ khoá `TANG`, `LEVEL`, `FLOOR` kèm số hay mã (kết quả "Tầng 2" hoặc mã như "B2").
  - **Khu:** dòng có từ khoá `KHU`, `ZONE`, `AREA` kèm một chữ cái (kết quả "khu C").
  - **Cột:** dòng có từ khoá `COT`, `PILLAR`, `COLUMN` kèm số hay mã (kết quả "cột 14"); hoặc, khi không có từ khoá, **cả dòng** là mã dạng một chữ cái và 1 đến 3 chữ số như `A12` hay `C-14` (kết quả "A12", "C14").
- Cách ghép: `{tầng}, {khu}, {cột}` theo thứ tự đó, bỏ thành phần không có, ví dụ "B2, khu C, cột 14". Mỗi loại chỉ lấy kết quả đầu tiên tìm được.
- Chống nhận nhầm: dòng chỉ gồm số, dòng dài (ví dụ biển số xe, câu quảng cáo) không được coi là mã; mã đứng một mình phải chiếm **cả dòng**.
- Không có thành phần nào: trả `null`. Kết quả bị cắt về tối đa 80 ký tự (giới hạn của ô ghi chú).

## Kiến trúc

- `src/domain/locationSuggestion.ts` (thuần, có test): `suggestLocationNote(lines: string[]): string | null`.
- `src/native/textRecognition.ts` (adapter native, không test bằng Jest): `recognizeTextLines(photoUri: string): Promise<string[]>`, không bao giờ reject (lỗi hay quá 5 giây thì trả mảng rỗng). Dùng thư viện OCR trên máy (Apple Vision trên iOS, Google ML Kit trên Android).
- `src/native/photoSuggestion.ts`: `suggestNoteFromPhoto(photoUri: string): Promise<string | null>` = OCR rồi quy tắc nhận ra vị trí. Đây là **đường nối duy nhất** màn hình Chụp dùng; sau này một nhà cung cấp AI tuỳ chọn có thể đứng sau cùng hàm này mà không đổi màn hình.
- `src/app/capture.tsx`: gọi `suggestNoteFromPhoto` khi có ảnh, quản lý trạng thái "đang đọc / đã gợi ý", cờ "người dùng đã gõ", và mã yêu cầu để bỏ qua kết quả của ảnh cũ. Không đổi logic chụp, lưu, quyền hay thông báo.

**Thư viện OCR** chưa chọn: các ứng viên là `expo-text-extractor`, `expo-ocr-kit`, `expo-mlkit-ocr`. Khi lập kế hoạch phải kiểm tra trên npm cho từng gói: còn được bảo trì không, tương thích Expo SDK 58 không, có cần config plugin không, giấy phép, kích thước, đọc được ảnh `file://` do camera tạo ra không, và hỗ trợ chữ Latin có dấu. Nếu không gói nào đạt thì dừng và báo lại thay vì tự chọn.

## Phụ thuộc và build

Thêm một module native, nên **phải build lại app** (`npx expo run:ios --device`); không dùng được trong Expo Go.

## Xử lý lỗi và trường hợp biên

- OCR không có kết quả, lỗi, hoặc chạy quá 5 giây: im lặng, ô ghi chú để trống.
- Ảnh tối, mờ hay không có chữ: không gợi ý.
- OCR đọc nhầm: người dùng sửa; vì chỉ điền khi ô trống và chỉ nhận mã khớp **cả dòng**, rủi ro điền sai nhiều là thấp.
- Chụp lại hay lưu khi OCR đang chạy: kết quả muộn bị bỏ qua (so mã yêu cầu).
- Ghi chú dài hơn 80 ký tự: bị cắt về 80.

## Kiểm thử

- Jest cho `suggestLocationNote`: từng loại (tầng, khu, cột, có từ khoá, mã đứng riêng cả dòng), ghép nhiều thành phần, có dấu và không dấu, chữ thường, dòng nhiễu (biển số xe, câu dài, dòng chỉ có số, mã nằm trong từ dài hơn), không có gì thì `null`, và cắt về 80 ký tự.
- Máy thật (iOS): ảnh cột có chữ "B2" và "Cột 14" được gợi ý đúng; ảnh không có chữ không điền gì; gõ trước khi OCR xong thì không bị ghi đè; "Chụp lại" bỏ kết quả cũ; tắt mạng vẫn chạy; thông báo hiện đúng "Xe bạn đang đậu ở ..." với ghi chú đã gợi ý.
- `npx tsc --noEmit` và toàn bộ test cũ phải tiếp tục pass.

## Ngoài phạm vi

AI trên mạng hay mô tả cảnh ("gần thang máy"), nhận biển số xe, lưu lại chữ OCR đã đọc, tìm kiếm lịch sử theo chữ OCR, đọc chữ từ ảnh đã lưu.
