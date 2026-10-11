/* HSK 模拟考试 — logic chính (không cần backend). Dữ liệu: questions.js, cấu hình: config.js, đáp án mã hoá: key.js */
(function () {
  'use strict';

  const CFG = window.HSK_CONFIG;
  const EXAM = window.HSK_EXAM;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = $('#app');
  const audio = $('#listenAudio');

  // ---------- chỉ mục câu hỏi ----------
  const Q = {};          // n -> { q, group, section }
  const SECTION_NS = {}; // sectionId -> [n...]
  EXAM.sections.forEach(sec => {
    SECTION_NS[sec.id] = [];
    sec.groups.forEach(g => g.questions.forEach(q => { Q[q.n] = { q, group: g, section: sec }; SECTION_NS[sec.id].push(q.n); }));
  });
  const L_NS = SECTION_NS.listening, R_NS = SECTION_NS.reading;
  const ALL_NS = L_NS.concat(R_NS);
  const TOTAL_Q = ALL_NS.length;

  function choicesOf(n) {
    const { q, group } = Q[n];
    if (group.type === 'tf') return ['T', 'F'];
    if (group.type === 'mc') return q.options.map((_, i) => 'ABC'[i]);
    return group.bank.map(b => b[0]);
  }
  const disp = (n, v) => !v ? '—' : (Q[n].group.type === 'tf' ? (v === 'T' ? '√' : '×') : v);

  // ---------- thời lượng ----------
  const SEC = 1000;
  function listeningMs() {
    let s = CFG.time.listening;
    if (CFG.time.extendListeningToAudio) s = Math.max(s, Math.ceil(EXAM.audio.durationSec + CFG.time.listeningTailSec));
    return s * SEC;
  }
  const PHASE_LABEL = {
    info: 'Nhập thông tin thí sinh', guide: 'Hướng dẫn làm bài',
    listening: '一、听力 · Nghe hiểu', card: '答題卡填寫時間',
    reading: '二、阅读 · Đọc hiểu', confirm: '二、阅读 · Xác nhận nộp bài', result: 'Kết quả'
  };

  // ---------- trạng thái + lưu trữ cục bộ ----------
  let S = null;
  function fresh() {
    return { v: 1, phase: 'intro', name: '', cid: '', examDate: null, t: {}, answers: {}, cur: { listening: 1, reading: 36 }, warned: {}, pinyin: true, result: null, restored: 0 };
  }
  function save() { try { localStorage.setItem(CFG.storageKey, JSON.stringify(S)); } catch (e) { /* bộ nhớ bị chặn: vẫn thi được nhưng không khôi phục */ } }
  function load() {
    try { const raw = localStorage.getItem(CFG.storageKey); if (raw) { const o = JSON.parse(raw); if (o && o.v === 1) return o; } } catch (e) { }
    return null;
  }
  function storageOk() { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; } }

  // ---------- chuyển giai đoạn (nhận mốc thời gian để bắt kịp khi tải lại trang) ----------
  function startInfo(at) {
    S.phase = 'info'; S.examDate = new Date(at).toISOString();
    S.t = { infoStart: at, infoEnd: at + CFG.time.info * SEC };
  }
  function startListening(at) {
    S.phase = 'listening'; S.t.listenStart = at; S.t.listenEnd = at + listeningMs();
    if (!S.name.trim()) S.name = '';
  }
  function startCard(at) {
    S.phase = 'card'; S.t.cardStart = at; S.t.cardEnd = at + CFG.time.answerCard * SEC;
    try { audio.pause(); } catch (e) { }
  }
  function startReading(at) {
    S.phase = 'reading'; S.t.readStart = at; S.t.readEnd = at + CFG.time.reading * SEC;
  }
  function submit(at, how) {
    S.t.submittedAt = at; S.submitType = how; S.result = grade(); S.phase = 'result';
    try { audio.pause(); } catch (e) { }
  }
  function deadline() {
    switch (S.phase) {
      case 'info': case 'guide': return S.t.infoEnd;
      case 'listening': return S.t.listenEnd;
      case 'card': return S.t.cardEnd;
      case 'reading': case 'confirm': return S.t.readEnd;
      default: return null;
    }
  }
  function phaseLen() {
    switch (S.phase) {
      case 'info': case 'guide': return CFG.time.info * SEC;
      case 'listening': return listeningMs();
      case 'card': return CFG.time.answerCard * SEC;
      case 'reading': case 'confirm': return CFG.time.reading * SEC;
      default: return 0;
    }
  }
  // Hết giờ -> làm đúng hành động của giai đoạn. Lặp để bắt kịp nếu trang bị đóng qua nhiều mốc.
  function catchUp(now) {
    let moved = false, guard = 0;
    while (guard++ < 6) {
      const d = deadline();
      if (d == null || now < d) break;
      if (S.phase === 'info' || S.phase === 'guide') startListening(d);
      else if (S.phase === 'listening') startCard(d);
      else if (S.phase === 'card') startReading(d);
      else if (S.phase === 'reading' || S.phase === 'confirm') submit(d, 'auto');
      moved = true;
    }
    if (moved) { save(); closeModal(); }
    return moved;
  }

  // ---------- đáp án (chỉ giải mã khi nộp bài) ----------
  function decodeKey() {
    const bin = atob(window.HSK_KEY);
    const k = 'H20902|hsk2|mock-key';
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ k.charCodeAt(i % k.length);
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }
  function scale(correct, n) {
    const raw = correct * CFG.scoring.sectionMax / n;
    return CFG.scoring.rounding === 'floor' ? Math.floor(raw) : Math.round(raw);
  }
  function grade() {
    const key = decodeKey().answers;
    const sec = ns => {
      let ok = 0, bad = 0, empty = 0;
      ns.forEach(n => { const a = S.answers[n]; if (!a) empty++; else if (a === key[n]) ok++; else bad++; });
      return { n: ns.length, ok, bad, empty, score: scale(ok, ns.length) };
    };
    const L = sec(L_NS), R = sec(R_NS);
    const total = L.score + R.score;
    return { L, R, total, pass: total >= CFG.scoring.passScore };
  }

  // ---------- tiện ích hiển thị ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function zh(line, blankVal) {
    return line.split(' ').filter(Boolean).map(tok => {
      if (tok === '__') return `<span class="blank">${blankVal ? esc(blankVal) : '&nbsp;'}</span>`;
      const m = tok.match(/^(.+?)\{(.+)\}$/);
      return m ? `<ruby>${esc(m[1])}<rt>${esc(m[2])}</rt></ruby>` : esc(tok);
    }).join('');
  }
  const zhLines = (lines, blankVal) => lines.map(l => `<div class="ln">${zh(l, blankVal)}</div>`).join('');
  const img = name => `assets/img/${name}.jpg`;
  const mmss = ms => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const fmtDate = iso => { const d = iso ? new Date(iso) : new Date(); return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const fmtDur = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)} phút ${String(s % 60).padStart(2, '0')} giây`; };
  const answeredCount = ns => ns.filter(n => S.answers[n]).length;
  const canEdit = n => (L_NS.includes(n) ? (S.phase === 'listening' || S.phase === 'card') : (S.phase === 'reading' || S.phase === 'confirm'));

  // ---------- modal ----------
  let modalOk = null;
  function openModal(title, bodyHtml, okText, onOk, opts) {
    opts = opts || {};
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    $('#modalOk').textContent = okText || 'Đồng ý';
    $('#modalOk').hidden = !!opts.noOk;
    $('#modalCancel').textContent = opts.cancelText || 'Huỷ';
    modalOk = onOk;
    $('#modal').hidden = false;
    if (opts.onOpen) opts.onOpen($('#modalBody'));
  }
  function closeModal() { $('#modal').hidden = true; modalOk = null; }
  $('#modalCancel').onclick = closeModal;
  $('#modalOk').onclick = () => { const f = modalOk; closeModal(); if (f) f(); };
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  let toastTimer = null;
  function toast(msg, kind, ms) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms || 6000);
  }

  // ---------- thanh trên cùng ----------
  function renderTopbar() {
    const tb = $('#topbar');
    tb.hidden = S.phase === 'intro';
    $('#tbPhase').textContent = PHASE_LABEL[S.phase] || '';
    const inExam = ['listening', 'card', 'reading', 'confirm'].includes(S.phase);
    $('#tbProgressWrap').hidden = !inExam;
    const a = answeredCount(ALL_NS);
    $('#tbProgress').style.width = (a / TOTAL_Q * 100) + '%';
    $('#tbProgressText').textContent = `Đã làm ${a}/${TOTAL_Q}`;
    $('#tbTimer').hidden = deadline() == null;
    document.body.classList.toggle('no-pinyin', !S.pinyin);
  }

  // ---------- đồng hồ ----------
  function tick() {
    const now = Date.now();
    if (catchUp(now)) { render(); return; }
    const d = deadline();
    if (d == null) return;
    const left = d - now;
    $('#tbClock').textContent = mmss(left);
    $('#tbTimerLbl').textContent = (S.phase === 'info' || S.phase === 'guide') ? 'Nhập thông tin' : (S.phase === 'card' ? 'Điền phiếu' : 'Còn lại');
    const timer = $('#tbTimer');
    timer.classList.toggle('danger', left <= 60 * SEC);
    timer.classList.toggle('warn', left > 60 * SEC && left <= 5 * 60 * SEC);
    CFG.warnAt.forEach(thr => {
      const k = S.phase.replace('confirm', 'reading').replace('guide', 'info') + thr;
      if (thr * SEC < phaseLen() && left <= thr * SEC && left > (thr - 5) * SEC && !S.warned[k]) {
        S.warned[k] = 1; save();
        const what = { listening: 'phần nghe', card: 'thời gian điền phiếu', reading: 'phần đọc', confirm: 'phần đọc', info: 'thời gian nhập thông tin', guide: 'thời gian nhập thông tin' }[S.phase];
        toast(`⏰ Còn ${thr >= 60 ? thr / 60 + ' phút' : thr + ' giây'} cho ${what}!`, thr <= 60 ? 'danger' : '', 8000);
      }
    });
    if (S.phase === 'listening') syncAudio(now);
  }

  // ---------- audio phần nghe ----------
  // Audio chạy theo thời gian thực kể từ lúc bắt đầu phần nghe (như phòng thi): không tua, không phát lại.
  let audioBlocked = false;
  function audioTarget(now) { return (now - S.t.listenStart) / 1000; }
  function syncAudio(now) {
    const pos = audioTarget(now);
    const dur = audio.duration || EXAM.audio.durationSec;
    const box = $('#audioBox');
    if (pos >= dur) {
      if (!audio.paused) audio.pause();
      setAudioUi('ended', dur, dur);
      return;
    }
    if (audio.paused) {
      if (!audioBlocked) {
        try { if (audio.readyState >= 1) audio.currentTime = pos; } catch (e) { }
        const p = audio.play();
        if (p && p.catch) p.catch(() => { audioBlocked = true; setAudioUi('blocked', pos, dur); });
      } else setAudioUi('blocked', pos, dur);
    } else {
      if (Math.abs(audio.currentTime - pos) > 3) { try { audio.currentTime = pos; } catch (e) { } }
      setAudioUi('playing', audio.currentTime, dur);
    }
    if (box) box.dataset.ready = '1';
  }
  function setAudioUi(state, pos, dur) {
    const st = $('#audioState'); if (!st) return;
    st.className = 'audio-state ' + (state === 'playing' ? 'playing' : '');
    $('#audioStateText').textContent = state === 'playing' ? 'Đang phát audio phần nghe' : state === 'ended' ? 'Audio phần nghe đã kết thúc' : 'Audio chưa phát — bấm nút bên dưới';
    $('#audioBtn').hidden = state !== 'blocked';
    if ($('#audioAlert')) $('#audioAlert').hidden = state !== 'blocked';
    $('#audioBar').style.width = Math.min(100, pos / dur * 100) + '%';
    $('#audioPos').textContent = mmss(pos * 1000);
    $('#audioDur').textContent = mmss(dur * 1000);
  }
  audio.addEventListener('pause', () => { /* tạm dừng ngoài ý muốn: tick() sẽ tự phát lại đúng vị trí */ });
  function userStartAudio() { audioBlocked = false; syncAudio(Date.now()); }

  // ---------- bộ khung chung ----------
  let tickTimer = null;
  function render() {
    renderTopbar();
    const f = { intro: renderIntro, info: renderInfo, guide: renderGuide, listening: renderExam, card: renderCard, reading: renderExam, confirm: renderConfirm, result: renderResult }[S.phase];
    f();
    if (S.phase !== 'listening') { try { audio.pause(); } catch (e) { } }
    tick();
    window.scrollTo({ top: 0 });
  }
  function select(n, v) {
    if (!canEdit(n)) { toast('Câu này đã bị khoá, không thể sửa.', 'danger', 3000); return; }
    S.answers[n] = (S.answers[n] === v) ? S.answers[n] : v;
    save(); renderTopbar();
  }

  // ===== 1. Trang giới thiệu =====
  function renderIntro() {
    const prev = load();
    const inProgress = prev && prev.phase !== 'intro' && prev.phase !== 'result';
    const lm = Math.round(listeningMs() / 60000 * 10) / 10;
    app.innerHTML = `
      <section class="card hero narrow">
        <div class="seal">汉</div>
        <h1>HSK 模拟考试</h1>
        <p class="muted">Thi thử HSK（二级）— Đề <b>${EXAM.code}</b> · Hanban / Confucius Institute</p>
        <div class="facts">
          <div class="fact"><b>35</b><span>câu nghe · 一、听力</span></div>
          <div class="fact"><b>25</b><span>câu đọc · 二、阅读</span></div>
          <div class="fact"><b>200</b><span>điểm tối đa (100 + 100)</span></div>
          <div class="fact"><b>120</b><span>điểm trở lên là đạt</span></div>
        </div>
        <div class="timeline">
          <div><b>5'</b>Nhập thông tin</div>
          <div><b>${lm > 25 ? '≈' + Math.round(lm) + "'" : "25'"}</b>Nghe hiểu</div>
          <div><b>3'</b>Điền phiếu trả lời</div>
          <div><b>22'</b>Đọc hiểu</div>
        </div>
        ${storageOk() ? '' : '<p class="notice warn">Trình duyệt đang chặn bộ nhớ cục bộ: bạn vẫn thi được nhưng nếu tải lại trang sẽ mất bài làm.</p>'}
        <p class="notice small" style="text-align:left">🔒 Bài làm được lưu <b>trên chính thiết bị/trình duyệt này</b> (localStorage) để khôi phục khi lỡ tải lại trang. Không có dữ liệu nào được gửi lên máy chủ.</p>
        <div class="row" style="justify-content:center;margin-top:22px">
          ${inProgress
            ? `<button class="btn primary big" id="resume">Tiếp tục bài đang làm</button><button class="btn ghost" id="restart">Bắt đầu lại từ đầu</button>`
            : (prev && prev.phase === 'result'
              ? `<button class="btn primary big" id="viewRes">Xem kết quả lần trước</button><button class="btn ghost" id="restart">Làm bài mới</button>`
              : `<button class="btn primary big" id="enter">Vào phòng thi →</button>`)}
        </div>
      </section>`;
    const enter = () => { S = fresh(); startInfo(Date.now()); save(); render(); };
    if ($('#enter')) $('#enter').onclick = enter;
    if ($('#resume')) $('#resume').onclick = () => { S = prev; S.restored = (S.restored || 0) + 1; save(); render(); };
    if ($('#viewRes')) $('#viewRes').onclick = () => { S = prev; render(); };
    if ($('#restart')) $('#restart').onclick = () => openModal('Bắt đầu lại từ đầu?',
      `<p>Toàn bộ bài làm${inProgress ? ' đang dở' : ''} và kết quả cũ trên thiết bị này sẽ bị <b>xoá vĩnh viễn</b>, đồng hồ đếm lại từ đầu.</p>`,
      'Xoá và làm lại', () => { try { localStorage.removeItem(CFG.storageKey); } catch (e) { } enter(); });
  }

  // ===== 2. Nhập thông tin =====
  function renderInfo() {
    app.innerHTML = `
      <section class="card narrow stack">
        <h2>Thông tin thí sinh <span class="muted zh" style="font-weight:500">· 考生信息</span></h2>
        <p class="muted small">Bạn có 5 phút cho bước nhập thông tin và đọc hướng dẫn. Hết giờ, hệ thống tự chuyển sang phần nghe.</p>
        <div><label class="field" for="fName">Họ và tên <span class="muted zh">姓名</span></label>
          <input class="input" id="fName" autocomplete="name" maxlength="80" value="${esc(S.name)}" placeholder="Nguyễn Văn A"></div>
        <div><label class="field" for="fCid">Mã thí sinh <span class="muted">(không bắt buộc)</span> <span class="muted zh">考生序号</span></label>
          <input class="input" id="fCid" maxlength="40" value="${esc(S.cid)}" placeholder="VD: H2-001"></div>
        <div><label class="field">Ngày thi <span class="muted zh">考试日期</span></label>
          <input class="input readonly" readonly value="${esc(fmtDate(S.examDate))}"></div>
        <div class="row"><span class="spacer"></span><button class="btn primary big" id="next">Tiếp tục: Hướng dẫn →</button></div>
      </section>`;
    $('#fName').oninput = e => { S.name = e.target.value; save(); };
    $('#fCid').oninput = e => { S.cid = e.target.value; save(); };
    $('#next').onclick = () => {
      if (!S.name.trim()) { $('#fName').focus(); toast('Vui lòng nhập họ và tên.', 'danger', 3000); return; }
      S.phase = 'guide'; save(); render();
    };
    $('#fName').focus();
  }

  // ===== 3. Hướng dẫn =====
  function renderGuide() {
    const lm = listeningMs() / 1000;
    app.innerHTML = `
      <section class="card narrow stack">
        <h2>Hướng dẫn làm bài <span class="muted zh" style="font-weight:500">· 注意</span></h2>
        <div class="zh" style="font-size:17px;line-height:1.9">
          一、HSK（二级）分两部分：1．听力（35 题，约 25 分钟） 2．阅读（25 题，22 分钟）<br>
          二、听力结束后，有 3 分钟填写答题卡。<br>
          三、全部考试约 55 分钟（含考生填写个人信息时间 5 分钟）。
        </div>
        <ol class="guide">
          <li><b>Phần nghe (câu 1–35):</b> audio phát <b>tự động, liên tục một lần</b> ngay khi bắt đầu — mỗi câu được đọc <b>2 lần</b> trong file gốc. Không tua, không phát lại (giống phòng thi). Audio gốc dài ${mmss(EXAM.audio.durationSec * 1000)}, nên phần nghe có ${mmss(lm * 1000)} để không cắt mất câu cuối.</li>
          <li>Có thể chuyển qua lại giữa các câu bằng nút <b>Câu trước / Câu sau</b> hoặc bảng số câu. Câu đã trả lời có màu xanh.</li>
          <li><b>答題卡填寫時間 (3 phút):</b> kiểm tra lại phiếu trả lời phần nghe. Hết 3 phút, đáp án phần nghe <b>bị khoá</b>.</li>
          <li><b>Phần đọc (câu 36–60):</b> 22 phút. Hết giờ hệ thống <b>tự nộp bài</b>.</li>
          <li>Mỗi phần 100 điểm, tổng 200; <b>từ 120 điểm là đạt</b>. Câu bỏ trống = 0 điểm, sai không bị trừ.</li>
          <li>Hãy dùng tai nghe, kiểm tra âm lượng và <b>không đóng/tải lại trang</b>. Nếu lỡ tải lại, bài làm được khôi phục nhưng đồng hồ vẫn tiếp tục chạy.</li>
        </ol>
        <div class="panel" style="box-shadow:none">
          <h4>Thử âm lượng</h4>
          <div class="row"><button class="btn" id="testAudio">🔊 Phát thử 5 giây (nhạc mở đầu)</button><span class="muted small">Đoạn thử lấy từ phần nhạc mở đầu của file nghe.</span></div>
        </div>
        <div class="row"><button class="btn ghost" id="back">← Sửa thông tin</button><span class="spacer"></span>
          <button class="btn primary big" id="go"><span class="zh">開始考試</span></button></div>
      </section>`;
    $('#back').onclick = () => { S.phase = 'info'; save(); render(); };
    $('#testAudio').onclick = () => {
      audio.currentTime = 0; audio.play().catch(() => { });
      setTimeout(() => { if (S.phase === 'guide') audio.pause(); }, 5000);
    };
    $('#go').onclick = () => openModal('開始考試?', '<p>Phần nghe sẽ bắt đầu và audio phát ngay. Bạn đã sẵn sàng?</p>', 'Bắt đầu', () => {
      audio.pause(); startListening(Date.now()); save(); audioBlocked = false; render();
    });
  }

  // ===== 4 & 6. Giao diện thi (nghe / đọc) =====
  function renderExam() {
    const sid = S.phase === 'listening' ? 'listening' : 'reading';
    const ns = SECTION_NS[sid];
    let n = S.cur[sid]; if (!ns.includes(n)) n = ns[0];
    const { q, group, section } = Q[n];
    const idx = ns.indexOf(n);
    const firstOfGroup = q === group.questions[0];

    const side = `
      <aside class="side">
        ${sid === 'listening' ? `
        <div class="panel audio-box" id="audioBox">
          <h4>Audio phần nghe</h4>
          <div class="audio-state" id="audioState"><span class="dot"></span><span id="audioStateText">Đang tải audio…</span></div>
          <div class="audio-bar"><span id="audioBar"></span></div>
          <div class="audio-time"><span id="audioPos">00:00</span><span id="audioDur">--:--</span></div>
          <button class="btn accent" id="audioBtn" hidden>▶ Phát audio</button>
          <label class="vol">🔈 <input type="range" id="vol" min="0" max="1" step="0.05" value="${audio.volume}"> 🔊</label>
          <p class="muted small" style="margin:0">Phát liên tục 1 lần như phòng thi. Mỗi câu được đọc 2 lần.</p>
        </div>` : ''}
        <div class="panel nav-panel">
          <h4>${esc(section.zh)} · ${answeredCount(ns)}/${ns.length} câu</h4>
          <div class="navgrid">${section.groups.map(g => `<div class="sec-lbl">${esc(g.title)} (${g.range[0]}–${g.range[1]})</div>` +
            g.questions.map(x => `<button class="qn ${S.answers[x.n] ? 'answered' : ''} ${x.n === n ? 'current' : ''}" data-n="${x.n}">${x.n}</button>`).join('')).join('')}</div>
          <div class="legend"><span><i class="a"></i>Đã trả lời</span><span><i></i>Chưa trả lời</span></div>
        </div>
        <div class="panel">
          ${sid === 'listening'
            ? `<button class="btn" style="width:100%" id="endSec">Kết thúc phần nghe sớm</button>`
            : `<button class="btn primary" style="width:100%" id="endSec"><span class="zh">交卷</span>&nbsp;· Nộp bài</button>`}
          <label class="switch small muted" style="margin-top:12px"><input type="checkbox" id="py" ${S.pinyin ? 'checked' : ''}> Hiện pinyin</label>
        </div>
      </aside>`;

    app.innerHTML = `
      <div class="exam">
        <div class="qpane">
          ${sid === 'listening' ? '<button class="btn accent big audio-alert" id="audioAlert" hidden>▶ Audio chưa phát — bấm để phát audio phần nghe</button>' : ''}
          <div class="group-head"><span class="part">${esc(section.zh)} · ${esc(group.title)}</span>
            <span class="range">第 ${group.range[0]}–${group.range[1]} 题</span><span class="vi">${esc(group.vi)}</span></div>
          ${group.example ? renderExample(group, firstOfGroup) : ''}
          ${renderBank(group, n)}
          <div class="qcard" id="qcard">${renderQuestion(n, 'exam')}</div>
          <div class="qnav">
            <button class="btn" id="prev" ${idx === 0 ? 'disabled' : ''}>← Câu trước</button>
            <span class="spacer muted small center">Câu ${idx + 1}/${ns.length}</span>
            <button class="btn ${idx === ns.length - 1 ? '' : 'primary'}" id="next" ${idx === ns.length - 1 ? 'disabled' : ''}>Câu sau →</button>
          </div>
        </div>
        ${side}
      </div>`;

    const go = m => { S.cur[sid] = m; save(); renderExam(); renderTopbar(); tick(); };
    app.querySelectorAll('.qn').forEach(b => b.onclick = () => go(+b.dataset.n));
    $('#prev').onclick = () => idx > 0 && go(ns[idx - 1]);
    $('#next').onclick = () => idx < ns.length - 1 && go(ns[idx + 1]);
    app.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
      select(n, b.dataset.pick);
      const keepScroll = window.scrollY; renderExam(); renderTopbar(); tick(); window.scrollTo({ top: keepScroll });
    });
    $('#py').onchange = e => { S.pinyin = e.target.checked; save(); renderTopbar(); };
    if (sid === 'listening') {
      $('#audioBtn').onclick = userStartAudio;
      $('#audioAlert').onclick = userStartAudio;
      $('#vol').oninput = e => { audio.volume = +e.target.value; };
      $('#endSec').onclick = () => {
        const left = ns.length - answeredCount(ns);
        openModal('Kết thúc phần nghe?', `<p>Audio sẽ dừng và chuyển sang <b>答題卡填寫時間</b> (3 phút). ${left ? `Bạn còn <b>${left}</b> câu nghe chưa trả lời.` : ''}</p><p class="muted small">Không thể quay lại nghe tiếp.</p>`,
          'Kết thúc phần nghe', () => { startCard(Date.now()); save(); render(); });
      };
    } else {
      $('#endSec').onclick = () => { S.phase = 'confirm'; save(); render(); };
    }
  }

  function renderExample(group, open) {
    const ex = group.example;
    let body = '';
    if (ex.kind === 'tfimg') body = ex.items.map(it => `<div class="ex-row"><img src="${img(it.img)}" alt=""><span class="mark">${it.mark}</span></div>`).join('');
    else if (ex.kind === 'tftext') body = ex.items.map(it => `<div class="text-zh">${zhLines(it.lines)}<div class="star-line">${zh(it.star)} <span class="mark">（ ${it.mark} ）</span></div></div>`).join('<hr style="border:0;border-top:1px solid var(--line)">');
    else if (ex.kind === 'mc') body = `<div class="text-zh">${zhLines(ex.lines)}</div><div class="row text-zh">${ex.options.map((o, i) => `<span><b>${'ABC'[i]}</b> ${zh(o)} ${'ABC'[i] === ex.answer ? '<span class="mark">√</span>' : ''}</span>`).join('&emsp;&emsp;')}</div>`;
    else body = `<div class="ex-row"><div class="text-zh">${zhLines(ex.lines, ex.blankShows)}</div>${ex.blankShows ? '' : `<span class="boxed">${ex.answer}</span>`}</div>`;
    return `<details class="example" ${open ? 'open' : ''}><summary>例如 · Ví dụ mẫu</summary><div class="ex-body">${body}</div></details>`;
  }

  function renderBank(group, n) {
    if (group.type === 'bank-img') {
      const v = S.answers[n];
      return `<div class="bank">${group.bank.map(([k, f]) => `<button class="bank-img ${v === k ? 'opt sel' : ''}" data-pick="${k}" ${canEdit(n) ? '' : 'disabled'} aria-label="Chọn ${k}" style="cursor:pointer"><span class="tag">${k}</span><img src="${img(f)}" alt="Hình ${k}"></button>`).join('')}</div>`;
    }
    if (group.type === 'bank-word') return `<div class="bank-words text-zh">${group.bank.map(([k, w]) => `<span><b>${k}</b>${zh(w)}</span>`).join('')}</div>`;
    if (group.type === 'bank-sent') return `<div class="bank-sents text-zh">${group.bank.map(([k, s]) => `<div><b>${k}</b><span>${zh(s)}</span></div>`).join('')}</div>`;
    return '';
  }

  // mode: 'exam' | 'review'
  function renderQuestion(n, mode, key) {
    const { q, group, section } = Q[n];
    const v = S.answers[n];
    const right = key ? key[n] : null;
    const isL = section.id === 'listening';
    let stem = '';
    const hint = isL ? '🎧 Nghe audio và chọn đáp án' : '📖 Đọc và chọn đáp án';
    if (q.img) stem += `<img class="q-img" src="${img(q.img)}" alt="Hình câu ${n}">`;
    if (q.lines) {
      const blankVal = group.type === 'bank-word' && v ? v + ' ' + (group.bank.find(b => b[0] === v)[1].replace(/\{.*\}/, '')) : '';
      stem += `<div class="text-zh">${zhLines(q.lines, blankVal)}${q.star ? `<div class="star-line">${zh(q.star)}</div>` : ''}</div>`;
    }
    const ch = choicesOf(n);
    let cls = 'cols-6', label = k => `<span class="key">${k}</span>`;
    if (group.type === 'tf') { cls = 'cols-2'; label = k => (k === 'T' ? '√' : '×'); }
    else if (group.type === 'mc') { cls = 'cols-3'; label = k => `<span class="key">${k}</span><span class="zh">${zh(q.options['ABC'.indexOf(k)])}</span>`; }
    else if (group.type === 'bank-word') { cls = 'cols-3'; label = k => `<span class="key">${k}</span><span class="zh">${zh(group.bank.find(b => b[0] === k)[1])}</span>`; }
    const dis = mode === 'review' || !canEdit(n);
    const opts = ch.map(k => {
      let c = 'opt' + (group.type === 'tf' ? ' tf' : '') + (['bank-img', 'bank-sent'].includes(group.type) ? ' center' : '');
      if (v === k) c += ' sel';
      if (mode === 'review') { if (k === right) c += ' is-right'; else if (v === k) c += ' is-wrong'; }
      return `<button class="${c}" ${mode === 'exam' ? `data-pick="${k}"` : ''} ${dis ? 'disabled' : ''} aria-pressed="${v === k}">${label(k)}</button>`;
    }).join('');
    return `
      <div class="qtitle"><span class="qnum">${n}</span><span class="hint">${mode === 'exam' ? hint : ''}</span></div>
      ${stem}
      <div class="options ${cls}">${opts}</div>`;
  }

  // ===== 5. Điền phiếu trả lời =====
  function renderCard() {
    app.innerHTML = `
      <section class="card stack">
        <h2 class="zh">答題卡填寫時間</h2>
        <div class="notice">
          <div class="zh" style="font-size:17px">听力考试现在结束。请在 3 分钟内检查并填写答题卡。3 分钟后听力答案将被锁定，自动进入阅读考试。</div>
          <div style="margin-top:6px">Phần nghe đã kết thúc. Bạn có <b>3 phút</b> để kiểm tra phiếu trả lời phần nghe — bấm vào ô để sửa. Hết 3 phút, đáp án phần nghe bị <b>khoá</b> và hệ thống tự chuyển sang phần đọc.</div>
        </div>
        <p class="muted small">Đáp án bạn chọn đã được ghi nhận trực tiếp vào hệ thống, không cần chép lại. Ô màu vàng = chưa trả lời (${L_NS.length - answeredCount(L_NS)} câu).</p>
        <div class="sheet">${L_NS.map(n => `<button class="sheet-cell ${S.answers[n] ? '' : 'empty'}" data-n="${n}"><span class="n">${n}</span><span class="v">${disp(n, S.answers[n])}</span></button>`).join('')}</div>
        <div class="row"><span class="spacer"></span><button class="btn primary" id="toRead">Bắt đầu phần đọc ngay →</button></div>
      </section>`;
    app.querySelectorAll('.sheet-cell').forEach(b => b.onclick = () => {
      const n = +b.dataset.n;
      openModal(`Câu ${n}`, `<p class="muted small">Chọn đáp án cho câu ${n}:</p><div class="options cols-3">${choicesOf(n).map(k => `<button class="opt center ${S.answers[n] === k ? 'sel' : ''}" data-k="${k}"><span class="key">${disp(n, k)}</span></button>`).join('')}</div>`,
        '', null, {
          noOk: true, cancelText: 'Đóng', onOpen: body => body.querySelectorAll('[data-k]').forEach(o => o.onclick = () => {
            if (S.phase !== 'card') { closeModal(); return; }
            select(n, o.dataset.k); closeModal(); renderCard();
          })
        });
    });
    $('#toRead').onclick = () => openModal('Bắt đầu phần đọc?', '<p>Đáp án phần nghe sẽ bị <b>khoá</b> ngay và không sửa được nữa.</p>', 'Bắt đầu phần đọc', () => { startReading(Date.now()); save(); render(); });
  }

  // ===== 7. Xác nhận nộp bài =====
  function renderConfirm() {
    const emptyL = L_NS.filter(n => !S.answers[n]), emptyR = R_NS.filter(n => !S.answers[n]);
    app.innerHTML = `
      <section class="card narrow stack">
        <h2>Xác nhận nộp bài <span class="muted zh" style="font-weight:500">· 交卷确认</span></h2>
        <table class="stat">
          <tr><th>Phần</th><th>Đã trả lời</th><th>Bỏ trống</th></tr>
          <tr><td class="zh">一、听力</td><td>${L_NS.length - emptyL.length}/${L_NS.length}</td><td>${emptyL.length}</td></tr>
          <tr><td class="zh">二、阅读</td><td>${R_NS.length - emptyR.length}/${R_NS.length}</td><td>${emptyR.length}</td></tr>
        </table>
        ${emptyR.length ? `<p class="notice warn">Câu đọc chưa trả lời: <b>${emptyR.join(', ')}</b>. Bạn vẫn còn thời gian để quay lại làm.</p>` : '<p class="notice">Bạn đã trả lời tất cả câu phần đọc.</p>'}
        ${emptyL.length ? `<p class="muted small">Phần nghe đã khoá; ${emptyL.length} câu bỏ trống được tính 0 điểm.</p>` : ''}
        <div class="row"><button class="btn" id="back">← Quay lại làm bài</button><span class="spacer"></span>
          <button class="btn primary big" id="sub"><span class="zh">交卷</span>&nbsp;· Nộp bài</button></div>
      </section>`;
    $('#back').onclick = () => { S.phase = 'reading'; save(); render(); };
    $('#sub').onclick = () => openModal('Nộp bài ngay?', '<p>Sau khi nộp, bạn <b>không thể sửa</b> đáp án. Hệ thống sẽ chấm điểm ngay.</p>', 'Nộp bài', () => { submit(Date.now(), 'manual'); save(); render(); });
  }

  // ===== 8. Kết quả + xem lại =====
  let reviewFilter = 'all';
  function renderResult() {
    const r = S.result;
    const keyData = decodeKey();
    const key = keyData.answers;
    const pct = (x, n) => Math.round(x / n * 100);
    const used = S.t.submittedAt - S.t.listenStart;
    const secCard = (title, s, max) => `
      <div class="panel sec-card">
        <h3>${title}</h3>
        <div class="score-big">${s.score}<small>/${max}</small></div>
        <div class="bars">
          <div class="b"><span>Đúng</span><span class="track"><span class="c-ok" style="width:${pct(s.ok, s.n)}%"></span></span><b>${s.ok}</b></div>
          <div class="b"><span>Sai</span><span class="track"><span class="c-bad" style="width:${pct(s.bad, s.n)}%"></span></span><b>${s.bad}</b></div>
          <div class="b"><span>Bỏ trống</span><span class="track"><span class="c-empty" style="width:${pct(s.empty, s.n)}%"></span></span><b>${s.empty}</b></div>
        </div>
        <p class="muted small" style="margin:0">Tỷ lệ đúng: <b>${pct(s.ok, s.n)}%</b> (${s.ok}/${s.n} câu)</p>
      </div>`;
    app.innerHTML = `
      <section class="card stack">
        <div class="result-head">
          <div class="muted">Kết quả thi thử HSK（二级）· ${EXAM.code}</div>
          <div class="score-big" style="margin-top:8px">${r.total}<small>/${CFG.scoring.total}</small></div>
          <div class="verdict ${r.pass ? 'pass' : 'fail'}">${r.pass ? '通過' : '未通過'}</div>
          <p class="verdict-msg zh">${r.pass ? '恭喜你，考試通過！' : '繼續努力，下次再接再厲！'}</p>
        </div>
        <div class="meter" aria-label="Thanh điểm">
          <span style="width:${r.total / CFG.scoring.total * 100}%;background:${r.pass ? 'var(--ok)' : 'var(--bad)'}"></span>
          <i class="pass-line" style="left:${CFG.scoring.passScore / CFG.scoring.total * 100}%"><em>Đạt: ${CFG.scoring.passScore}</em></i>
        </div>
        <div class="kv">
          <div><span>Họ và tên</span><b>${esc(S.name || '(chưa nhập)')}</b></div>
          ${S.cid ? `<div><span>Mã thí sinh</span><b>${esc(S.cid)}</b></div>` : ''}
          <div><span>Ngày thi</span><b>${esc(fmtDate(S.examDate))}</b></div>
          <div><span>Thời gian làm bài thực tế</span><b>${fmtDur(used)}</b></div>
          <div><span>Hình thức nộp</span><b>${S.submitType === 'auto' ? 'Tự động (hết giờ)' : 'Nộp thủ công'}</b></div>
        </div>
        <div class="secs">
          ${secCard('一、听力 · Nghe', r.L, CFG.scoring.sectionMax)}
          ${secCard('二、阅读 · Đọc', r.R, CFG.scoring.sectionMax)}
        </div>
        <p class="muted small">Cách tính: Đọc = số câu đúng × 4 (25 câu). Nghe: đề gốc có 35 câu nên quy đổi về thang 100 = làm tròn(số câu đúng × 100 / 35). Tổng = Nghe + Đọc; từ ${CFG.scoring.passScore}/200 là đạt.</p>
        <div class="row"><button class="btn" id="print">🖨 In / lưu PDF</button><span class="spacer"></span><button class="btn ghost" id="again">Làm bài mới</button></div>
      </section>

      <section class="stack" style="margin-top:22px">
        <div class="row"><h2 style="margin:0">Xem lại bài làm</h2><span class="spacer"></span>
          <label class="switch small muted"><input type="checkbox" id="py" ${S.pinyin ? 'checked' : ''}> Hiện pinyin</label></div>
        <div class="panel review-audio"><h4>Audio phần nghe (xem lại — được tua tự do)</h4><audio controls preload="none" src="${EXAM.audio.src}"></audio></div>
        <div class="review-filter">${[['all', 'Tất cả'], ['bad', 'Sai'], ['empty', 'Bỏ trống'], ['ok', 'Đúng']].map(([k, l]) => `<button class="chip ${reviewFilter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
        <div id="reviewList" class="stack"></div>
      </section>`;

    const list = $('#reviewList');
    let lastGroup = null, html = '';
    ALL_NS.forEach(n => {
      const v = S.answers[n], st = !v ? 'empty' : (v === key[n] ? 'ok' : 'bad');
      if (reviewFilter !== 'all' && reviewFilter !== st) return;
      const { group, section } = Q[n];
      if (group !== lastGroup) {
        html += `<div class="group-head" style="margin-top:10px"><span class="part">${esc(section.zh)} · ${esc(group.title)}</span><span class="range">第 ${group.range[0]}–${group.range[1]} 题</span></div>${renderBank(group, -1).replace(/data-pick="[A-F]"/g, 'disabled')}`;
        lastGroup = group;
      }
      const tr = keyData.transcript[n];
      html += `<div class="qcard rv ${st}">
        ${renderQuestion(n, 'review', key).replace('<span class="hint"></span>', `<span class="badge ${st}">${st === 'ok' ? 'Đúng' : st === 'bad' ? 'Sai' : 'Bỏ trống'}</span>`)}
        <div class="ans-line"><span class="yours ${st}">Bạn chọn: ${disp(n, v)}</span><span class="right">Đáp án đúng: ${disp(n, key[n])}</span></div>
        ${tr ? `<div class="transcript"><div class="src">Lời thoại (听力材料 — trích nguyên văn từ đề gốc)</div>${tr.map(esc).join('<br>')}</div>` : ''}
      </div>`;
    });
    list.innerHTML = html || '<p class="muted">Không có câu nào trong mục này.</p>';
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { reviewFilter = b.dataset.f; const y = window.scrollY; renderResult(); renderTopbar(); window.scrollTo({ top: y }); });
    $('#py').onchange = e => { S.pinyin = e.target.checked; save(); renderTopbar(); };
    $('#print').onclick = () => window.print();
    $('#again').onclick = () => openModal('Làm bài mới?', '<p>Kết quả hiện tại trên thiết bị này sẽ bị xoá.</p>', 'Làm bài mới', () => {
      try { localStorage.removeItem(CFG.storageKey); } catch (e) { }
      S = fresh(); render();
    });
  }

  // ---------- khởi động ----------
  audio.src = EXAM.audio.src;
  audio.addEventListener('loadedmetadata', () => { if (S && S.phase === 'listening') syncAudio(Date.now()); });
  window.addEventListener('beforeunload', e => {
    if (S && ['listening', 'card', 'reading', 'confirm'].includes(S.phase)) { e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S) tick(); });

  S = fresh();
  const saved = load();
  if (saved && saved.phase !== 'intro') {
    if (saved.phase === 'result') { S = fresh(); }               // trang giới thiệu cho phép xem lại kết quả
    else {
      S = saved; S.restored = (S.restored || 0) + 1;
      const moved = catchUp(Date.now()); save();
      setTimeout(() => toast(moved
        ? 'Đã khôi phục bài làm. Trong lúc trang đóng, thời gian đã hết ở giai đoạn trước nên hệ thống đã tự chuyển tiếp.'
        : 'Đã khôi phục bài làm đang dở. Đồng hồ vẫn tiếp tục chạy trong lúc tải lại trang.', 'info', 7000), 300);
      if (S.phase === 'listening') audioBlocked = true;           // cần thao tác người dùng để phát lại audio
    }
  }
  render();
  tickTimer = setInterval(tick, 250);
})();
