/*
 * CẤU HÌNH KỲ THI — chỉnh tại đây, không cần sửa app.js
 */
window.HSK_CONFIG = {
  storageKey: 'hsk2_h20902_session_v1',

  // Thời gian từng giai đoạn (giây)
  time: {
    info: 5 * 60,       // Nhập thông tin thí sinh
    listening: 25 * 60, // Phần nghe theo quy định
    // Audio gốc dài 25:57 (> 25 phút). Nếu true, phần nghe kéo dài tới khi audio kết thúc
    // (+ listeningTailSec) để không cắt mất câu 35. Đặt false để giữ cứng 25:00.
    extendListeningToAudio: true,
    listeningTailSec: 10,
    answerCard: 3 * 60, // 答题卡填写时间
    reading: 22 * 60    // Phần đọc
  },

  // Cảnh báo khi còn lại (giây)
  warnAt: [5 * 60, 60],

  // Chấm điểm: mỗi phần tối đa 100 điểm, tổng 200, đạt từ 120.
  // Đề gốc có 35 câu nghe + 25 câu đọc (60 câu).
  //  - Đọc: 25 câu × 4 điểm = 100.
  //  - Nghe: 35 câu → quy đổi về thang 100: round(số câu đúng × 100 / 35).
  scoring: {
    sectionMax: 100,
    total: 200,
    passScore: 120,
    rounding: 'round' // 'round' | 'floor'
  },

  // Audio phần nghe: theo đề gốc mỗi câu đã được đọc 2 lần trong file,
  // cả bài phát liên tục 1 lần như phòng thi thật (không tua, không phát lại).
  audioPolicy: {
    playOnce: true,
    allowSeek: false
  }
};
