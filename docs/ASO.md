# ASO — metadata cửa hàng

Không có "tag" nào để nhúng vào app. Cả Apple lẫn Google chỉ đọc **metadata của
listing**, không đọc chuỗi bên trong app. Vì vậy phần dưới đây là văn bản dán
thẳng vào App Store Connect / Play Console, không phải thay đổi mã nguồn.

## Cái gì được index

| Nền tảng | Trường được tìm | Giới hạn |
|---|---|---|
| App Store | Tên app, phụ đề (subtitle), **từ khoá**, tên IAP, tên nhà phát triển | 30 / 30 / 100 / — |
| App Store | Mô tả (description) **không** được index, chỉ để thuyết phục người đọc | 4000 |
| Google Play | Tên, mô tả ngắn, mô tả đầy đủ (đều được index toàn văn) | 30 / 80 / 4000 |

Từ khoá của iOS nên viết **không dấu cách sau dấu phẩy** để tiết kiệm ký tự, và
không lặp lại từ đã có trong tên/phụ đề — Apple đã index các trường đó rồi.

---

## 0. Tên đã chốt

**`ParkPic — Car Photo Finder`** (26/30) — dùng cho storefront tiếng Anh và toàn cầu.
Storefront tiếng Việt vẫn là **`Cột Xe — Nhớ chỗ đỗ xe`**.
Tên trên màn hình chính giữ nguyên **Cột Xe**; muốn đổi theo ngôn ngữ thì cần thêm
`InfoPlist.strings` (chưa làm).

Việc cần làm khi tạo app trên App Store Connect:

1. Primary language: English (U.S.) — đặt tên `ParkPic — Car Photo Finder`.
2. Thêm localization Vietnamese — đặt tên `Cột Xe — Nhớ chỗ đỗ xe`.
3. Nếu tên bị báo trùng, thử `PillarPark — Car Finder` (phương án B) trước khi đổi cấu trúc tên.

## 1. Tên quốc tế

"Cột Xe" là tên hay với người Việt nhưng vô nghĩa với người không nói tiếng Việt.
App Store cho phép **tên khác nhau theo từng ngôn ngữ**, nên giữ tên Việt cho
storefront Việt Nam và dùng tên Anh cho phần còn lại.

| Phương án | Tên | Ký tự | Ghi chú |
|---|---|---|---|
| **A (khuyến nghị)** | `ParkPic — Car Photo Finder` | 26 | Có "Park" + "Photo", dễ nhớ, không trùng nghĩa với đối thủ |
| B | `PillarPark — Car Finder` | 23 | Nhấn vào chi tiết "cột xe", ít cạnh tranh hơn |
| C | `SpotShot — Parking Memory` | 25 | Trừu tượng hơn, hợp nếu sau này mở rộng sang giữ chỗ |

Tên hiển thị trên màn hình chính vẫn là **Cột Xe** (không cần đổi). Nếu muốn
người dùng nước ngoài cũng thấy tên Anh trên Home Screen thì cần thêm
`InfoPlist.strings` theo ngôn ngữ — nói một tiếng là mình làm.

> Trước khi chốt: kiểm tra tên còn trống trong App Store Connect (bước tạo app sẽ
> báo ngay) và tra trademark. Đừng dùng tên đối thủ như "ParkSnap" — Apple từ chối
> theo 5.2.1.

---

## 2. Bộ metadata tiếng Anh

**Tên (26/30)**
```
ParkPic — Car Photo Finder
```

**Phụ đề (25/30)**
```
Remember where you parked
```

**Từ khoá (94/100)**
```
parking,garage,locator,pillar,spot,timer,note,reminder,floor,widget,tracker,mall,carpark,level
```

**Promotional text (59/170)** — đổi được không cần review
```
One photo, one spot. No account, no cloud, no subscription.
```

**Mô tả (App Store + Play)**

```
One photo. That is the whole job.

ParkPic saves the pillar you parked next to, reads the pillar number for you, and
deletes the photo when it has done its job. No account, no cloud, nothing leaves
your phone.

HOW IT WORKS
1. Snap the pillar. The photo is compressed on the spot, so it never slows the app.
2. The note is filled in for you from the text in the photo.
3. Choose 7, 30 or 60 days. The photo deletes itself on that date.
4. Walk back with distance and a compass that points at your car.

BUILT FOR PEOPLE WHO FORGET
- Home screen widget with the spot and the days left
- Live Activity on the Lock Screen and Dynamic Island
- Parking meter with a warning ten minutes before it ends
- Search your history without typing Vietnamese accents
- Statistics: how long you usually park, which floor, which hour

PRIVATE BY DESIGN
Photos, notes and coordinates stay in the app's own storage. There is no server
to send them to, no analytics SDK, no advertising ID. Delete the app and the data
is gone.

Made for drivers who would rather not remember the floor.
```

**Play — mô tả ngắn (68/80)**
```
Snap the pillar. Find your car by compass. Photos delete themselves.
```

---

## 3. Bộ metadata tiếng Việt

**Tên (22/30)**
```
Cột Xe — Nhớ chỗ đỗ xe
```

**Phụ đề (28/30)**
```
Chụp cột, tự xoá, tìm lại xe
```

**Từ khoá (87/100)**
```
đỗ xe,hầm xe,tìm xe,bãi đỗ,gửi xe,chỗ đỗ,vị trí,nhắc nhở,giữ xe,chỗ gửi xe,quên chỗ đỗ
```

**Mô tả**

```
Chụp một tấm ảnh cột xe. Phần còn lại để app lo.

Cột Xe lưu vị trí đỗ bằng ảnh, tự đọc số cột để điền ghi chú, và tự xoá tấm ảnh
khi hết hạn. Không tài khoản, không máy chủ, không tải ảnh lên.

CÁCH DÙNG
1. Chụp cột xe. Ảnh được nén ngay, không làm chậm máy.
2. App đọc chữ trong ảnh và điền ghi chú giúp bạn.
3. Chọn hạn 7, 30 hoặc 60 ngày. Hết hạn, ảnh tự biến mất.
4. Quay lại bằng khoảng cách và la bàn chỉ đúng chỗ xe.

DÀNH CHO NGƯỜI HAY QUÊN
- Widget ngoài màn hình chính: vị trí và số ngày còn lại
- Live Activity trên màn hình khoá và Dynamic Island
- Đồng hồ đỗ xe, nhắc trước 10 phút khi sắp hết giờ
- Tìm lại lịch sử không cần gõ dấu
- Thống kê: đỗ bao lâu, tầng nào, giờ nào

RIÊNG TƯ
Ảnh, ghi chú và toạ độ chỉ nằm trên máy. Không có máy chủ để gửi lên, không SDK
phân tích, không mã quảng cáo. Gỡ app là hết dữ liệu.
```

**Play — mô tả ngắn (57/80)**
```
Chụp cột xe, tìm lại bằng la bàn. Ảnh tự xoá khi hết hạn.
```

---

## 4. Slogan

| Ngôn ngữ | Câu | Dùng ở đâu |
|---|---|---|
| Anh | **Snap the pillar. Forget the rest.** | Ảnh bìa, video, first screenshot |
| Việt | **Chụp cột xe. Rồi quên đi.** | Landing page, ảnh bìa |

Giữ đúng một câu cho mỗi ngôn ngữ; đổi slogan giữa các kênh làm loãng nhận diện.

---

## 5. Chú thích ảnh chụp màn hình

Ảnh 1 và 2 quyết định tỉ lệ tải; phần chữ phải đọc được trong 2 giây.

| # | Tiếng Anh | Tiếng Việt |
|---|---|---|
| 1 | One photo is all it takes | Chụp một tấm là xong |
| 2 | The photo deletes itself | Ảnh tự xoá khi hết hạn |
| 3 | Distance and compass back to your car | Khoảng cách và la bàn về lại xe |
| 4 | Parking meter on your Lock Screen | Đồng hồ đỗ trên màn hình khoá |
| 5 | Find last month's spot in a second | Tìm lại chỗ đỗ tháng trước |
| 6 | No account. No cloud. No tracking. | Không tài khoản, không máy chủ |

---

## 6. Không nên làm

- Nhồi từ khoá vào tên hoặc mô tả ("parking car finder spot locator garage…") —
  Apple 2.3.7 và Play đều xử lý.
- Dùng tên đối thủ trong từ khoá (ParkSnap, Parkopedia) — rủi ro 5.2.1.
- Hứa điều app không làm ("tự tìm xe trong bãi", "chỉ đường trong nhà") — bị từ
  chối ở mục 2.3.1 nếu reviewer thử không thấy.
- Đặt giá trong mô tả khi giá chưa chốt.
- Đổi tên app sau khi đã có rating — mất một phần lịch sử tìm kiếm.

## 7. Việc còn lại khi submit

1. Chọn tên (A/B/C) và kiểm tra còn trống.
2. Tạo localization `vi` và `en` trong App Store Connect, dán đúng 3 trường.
3. Play: dán tên + mô tả ngắn + mô tả đầy đủ, bật "Localize" cho `vi` và `en`.
4. Ảnh chụp màn hình 6.7" và 6.5" (iPhone-only nên không cần iPad).
5. ~~Lời nhắc xin đánh giá sau lần lưu thứ 3~~ — đã làm (`expo-store-review`,
   bộ đếm `captureCount` trong settings, chỉ hỏi một lần).
6. ~~Tên hiển thị tiếng Anh trên Home Screen~~ — đã làm bằng `expo.locales`
   (`en` → ParkPic, `vi` → Cột Xe), kèm bản dịch Purpose String cho quyền camera,
   vị trí và thư viện ảnh.
