# Web thi thử HSK（二级）— Đề H20902

## 1. Cấu trúc thư mục

```
index.html              Trang web (một trang, tất cả màn hình)
css/style.css           Giao diện (sáng/tối tự động, responsive)
js/config.js            Cấu hình thời gian, điểm, chính sách audio  ← sửa ở đây
js/questions.js         Dữ liệu 60 câu hỏi (không chứa đáp án)
js/key.js               Đáp án + lời thoại đã mã hoá (tự sinh, không sửa tay)
js/app.js               Logic: đồng hồ, audio, lưu bài, chấm điểm, xem lại
assets/img/*.jpg        29 hình cắt từ đề gốc (l01–l10, p2a_A–F, p2b_A–E, r1_A–F, ví dụ)
assets/audio/...mp3     File nghe gốc (25:57), không cắt ghép
admin/de_goc_H20902.pdf  Bản PDF gốc (có trang đáp án + lời thoại) ← KHÔNG đưa lên mạng
admin/answer-key.json   Đáp án gốc dạng đọc được  ← KHÔNG đưa lên mạng
admin/build-key.ps1     Sinh lại js/key.js sau khi sửa answer-key.json
serve.ps1               Máy chủ web nội bộ (tuỳ chọn)
```

## 2. Chạy thử trên máy

**Cách 1 (nhanh nhất):** nhấp đúp `index.html` để mở bằng Chrome hoặc Edge.

**Cách 2 (giống web thật):** chuột phải `serve.ps1` → *Run with PowerShell*, rồi mở http://localhost:8765/

## 3. Đưa lên Internet (miễn phí)

Web là trang tĩnh, không cần backend. **Trước khi tải lên, xoá hoặc bỏ thư mục `admin/` ra ngoài.**

- **Netlify:** vào https://app.netlify.com/drop rồi kéo thả cả thư mục (đã bỏ `admin/`). Bạn nhận được một link dạng `xxx.netlify.app`.
- **GitHub Pages:**
  1. Tạo repo và tải các file lên.
  2. Vào Settings → Pages → Deploy from branch `main`.
- **Cloudflare Pages / Vercel:** tương tự, chọn "static site", không cần lệnh build.

## 4. Sửa đề / đáp án

- **Câu hỏi:** sửa `js/questions.js`. Cú pháp `汉字{pinyin}`; các token cách nhau bằng dấu cách; `__` là ô trống.
- **Đáp án:**
  1. Sửa `admin/answer-key.json` (`T` = √, `F` = ×).
  2. Chạy `powershell -ExecutionPolicy Bypass -File admin\build-key.ps1` để sinh lại `js/key.js`.
- **Thời gian / điểm:** sửa `js/config.js`.

## 5. Giới hạn của bản không có backend

- **Lưu trữ:** bài làm lưu bằng `localStorage` trên chính trình duyệt và thiết bị đó.
  - Đổi máy hoặc trình duyệt, hay xoá dữ liệu duyệt web, là mất bài.
  - Không có máy chủ thu thập kết quả của nhiều thí sinh. Thí sinh chụp màn hình hoặc bấm "In / lưu PDF" để nộp kết quả.
- **Bảo mật đáp án:** đáp án được mã hoá và chỉ giải mã khi nộp bài. Người không rành kỹ thuật không xem trước được, nhưng người biết lập trình vẫn có thể giải mã. Muốn chống gian lận thật sự thì cần backend chấm điểm phía máy chủ.
- **Đồng hồ:** tính theo giờ hệ thống của máy thí sinh.
  - Tải lại trang không làm đặt lại đồng hồ.
  - Nếu đóng trang quá giờ, khi mở lại hệ thống tự chuyển giai đoạn hoặc tự nộp đúng thời điểm.
  - Muốn làm lại phải bấm "Bắt đầu lại", có cảnh báo xoá bài.
- **Audio sau khi tải lại trang:** trình duyệt bắt buộc thí sinh bấm nút "▶ Phát audio". Audio sẽ phát tiếp đúng vị trí thời gian thực.
