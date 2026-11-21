// app.js — 多用户登录 + 排序题 + 选择题组（支持图片题按图取答案、展示题不计分）
(function () {
  'use strict';

  // ============================================================
  // 【第 1 处替换】账号表：由 gen-accounts.html 生成后粘贴
  // ============================================================
  const ACCOUNTS = [
    // { "u": "张三", "s": "...", "h": "..." },


{
    "u": "张亮",
    "s": "Mw+nHwWl1IImW6t2MNfm4g==",
    "h": "HUvYPcrBVZ2ELoIkHR0fcrCqRNX1bQE4laRiN4AJJHw="
  },
  {
    "u": "李虎",
    "s": "mwfxrO7cHrhvK4irtsX6qw==",
    "h": "FakzSkXUiuqpMkKfiD/MOifaH8SwC0Epa7VCG1xuqic="
  },
  {
    "u": "王安",
    "s": "Ry5uKcvS0l4IDPfhCHzVjw==",
    "h": "BQQdXubUyY3gmHlJOrUHUw2CN+7zQvPegaKd3vIxQh0="
  },
  ];

  // ============================================================
  // 【第 2 处替换】练习界面密文：由 encrypt.html 用 CONTENT_KEY 加密
  // ============================================================
  const PRACTICE_ENCRYPTED = {
      "salt": "g5hI9MLHlIXGL8nC80qWzQ==",
  "iv": "L7b4OpWMgrotQ6Q5",
  "data": "gOtcEtL8MEdoYuZlHbbjIiQjbQLesqJxDigBpZZ8v5kCmZ2cGNraqR+AZCWaYBDXtYwLf3u/uzgGWssDYAVUHgSb8AL5dXM0XtnrCEdxFZ25aogvstKYVDuPnutW2ijMejCXaTwCBkYmMsRvRE7EfAmmX2XYobBhonRHM8ygPAd2Q0hcZynEfpzgxDsA34DrzzRu9Y5i5AQDHsvhlnhmRIUqMDdSo84gMoStjuk99zYp97NdC8fQ2UhK3LJ5rPbCxPOElu9M23Fv/93l4oLI5Yn56WY7ihWf2uIVyn7+WaY6Pic4lQNYy8WdU4HfB2/DuJRNtwPe5sstxzMw0HA/LP92OpeZ7R5QRyiADWR5rC3kZSBBVjkO0zJtoGePW38Yt2OFiJha8FCvjhc0OJmdP83c0ZtqRQqciUjSx+7s9wt/dLwiP83DCrmat5pSx1/e4+jWNQWHMY9rka+N3vtNestpLwlFoDc1qbY/6Jfz6dRaNCOUKp6V6XP6GlhsCgHn2FLu1mmwgN/5RkoGt3tVJND5niLx1MhiBa8ACLE2tiWZdgEvMWpdIOf+kJRiDs+2c9aq/mix8xGyYQog8o5pwsjo8BBWDfJkWFqFR2vBCVywNE3yRxDaTpRJux2OVVh3uz/6ifpTr/E+auCMvvEA6KqgE4ekemATyKy7g8Mj6ZHEB9BufjamoFjZ7Ii08onUR0sUkeqUiLmyG5JT5pPYWCUxX7eAkYGT6dtF0R1bqK/hfN0L3bv6h2e064+dbuWzRS/3taO2gCtQuhmQRF1MUX6ehR0GGrpZAjOU1ngaNI6zFzxqK58+4zqqVMgDTDMb5GZElTRk8Hj2aMh2yScvk5gbTgkD7PikVVwQW3j0AES9HhpIJpvhoG2zomEthrTGGCl1q0KlvfpMrTqcNazklmuE8XiyY4R9LmU4V0lbVfzc0ux4n+NE0ZpTGLWSW6J4dfY17wSwn7pVqeq5N7cR9vSQMpi8nmjIqJazvdkAxn1EGhnI4IlbxKGaXwxWIn9jaUBEC3Bok9whCrxMp34="
  };

  const CONTENT_KEY = 'practice-content-2024';

  // ============================================================
  // 工具函数
  // ============================================================
  function b64ToBuf(b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  async function pbkdf2Hash(password, saltB64) {
    const enc = new TextEncoder();
    const salt = b64ToBuf(saltB64);
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return bufToB64(bits);
  }

  async function deriveDecryptKey(password, salt) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
  }

  async function verifyLogin(username, password) {
    const acc = ACCOUNTS.find((a) => a.u === username);
    if (!acc) return false;
    const hash = await pbkdf2Hash(password, acc.s);
    return hash === acc.h;
  }

  async function unlockPractice() {
    try {
      if (!PRACTICE_ENCRYPTED.salt || !PRACTICE_ENCRYPTED.iv || !PRACTICE_ENCRYPTED.data) {
        throw new Error('PRACTICE_ENCRYPTED 未配置：请先用 encrypt.html 生成密文');
      }
      const salt = b64ToBuf(PRACTICE_ENCRYPTED.salt);
      const iv = b64ToBuf(PRACTICE_ENCRYPTED.iv);
      const data = b64ToBuf(PRACTICE_ENCRYPTED.data);
      const key = await deriveDecryptKey(CONTENT_KEY, salt);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      const html = new TextDecoder().decode(plain);

      const appEl = document.getElementById('app');
      appEl.innerHTML = html;
      appEl.style.display = '';
      document.getElementById('gate').style.display = 'none';

      startApp();
      return true;
    } catch (e) {
      console.error('[解锁失败]', e);
      return false;
    }
  }

  // ============================================================
  // 登录事件
  // ============================================================
  const gateBtn = document.getElementById('gateBtn');
  const gateUser = document.getElementById('gateUser');
  const gatePwd = document.getElementById('gatePwd');
  const gateMsg = document.getElementById('gateMsg');

  gateBtn.addEventListener('click', async () => {
    const username = gateUser.value.trim();
    const password = gatePwd.value.trim();
    if (!username || !password) {
      gateMsg.textContent = '请输入姓名和密码';
      return;
    }
    if (!ACCOUNTS.length) {
      gateMsg.textContent = '账号表未配置，请联系管理员';
      return;
    }
    gateMsg.textContent = '验证中...';
    gateBtn.disabled = true;

    const ok = await verifyLogin(username, password);
    if (!ok) {
      gateMsg.textContent = '姓名或密码错误';
      gatePwd.value = '';
      gateBtn.disabled = false;
      return;
    }

    const unlocked = await unlockPractice();
    gateBtn.disabled = false;
    if (!unlocked) {
      gateMsg.textContent = '登录成功但界面加载失败，请联系管理员';
    }
  });

  gatePwd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') gateBtn.click();
  });
  gateUser.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') gatePwd.focus();
  });

  // ============================================================
  // 练习逻辑（排序题 + 选择题组）
  // ============================================================
  function startApp() {
    let currentQ = null;
    // 排序题状态
    let poolItems = [];
    let ticketItems = [];
    let idSeq = 0;
    let submitted = false;
    let dragId = null;
    // 选择题组状态：每题 { imgIndex, optionOrder:[原始下标], userAnswer }
    let choiceState = [];

    const $ = (s) => document.querySelector(s);
    const qSelect = $('#questionSelect');
    const qTitle = $('#qTitle');
    const qDesc = $('#qDesc');
    const poolList = $('#poolList');
    const ticketList = $('#ticketList');
    const btnSubmit = $('#btnSubmit');
    const btnReset = $('#btnReset');
    const resultBox = $('#resultBox');
    const workspace = $('.workspace');

    if (typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
      if (qTitle) qTitle.textContent = '题库未加载，请检查 questions.js';
      return;
    }

    if (qSelect) {
      QUESTIONS.forEach((q, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = q.title || q.id || ('题目' + (i + 1));
        qSelect.appendChild(opt);
      });
      qSelect.addEventListener('change', () => loadQuestion(+qSelect.value));
    }

    loadQuestion(0);
    btnSubmit.addEventListener('click', onSubmit);
    btnReset.addEventListener('click', () => {
      const idx = qSelect ? (+qSelect.value || 0) : 0;
      loadQuestion(idx);
    });

    // ---------------- 载入题目 ----------------
    function loadQuestion(index) {
      if (!QUESTIONS[index]) return;
      currentQ = QUESTIONS[index];
      if (qTitle) qTitle.textContent = currentQ.title || '';
      if (qDesc) qDesc.textContent = currentQ.description || '';
      submitted = false;
      btnSubmit.disabled = false;
      resultBox.classList.add('hidden');
      resultBox.innerHTML = '';

      if (currentQ.kind === 'choice-set') {
        // 隐藏排序题两栏及其按钮
        if (workspace) workspace.style.display = 'none';
        const ticketActions = document.querySelector('.ticket-actions');
        if (ticketActions) ticketActions.style.display = 'none';

        // 初始化选择题状态（imgIndex 在此确定，判分时复用）
        choiceState = currentQ.subQuestions.map((sub) => {
          const isImage = sub.type && sub.type.indexOf('image') === 0;
          let imgIndex = 0;
          if (isImage) {
            const imgs = Array.isArray(sub.images) ? sub.images : [];
            if (sub.pickImage === 'fixed') imgIndex = 0;
            else imgIndex = imgs.length ? Math.floor(Math.random() * imgs.length) : 0;
          }
          const opts = Array.isArray(sub.options) ? sub.options : [];
          let optionOrder = opts.map((_, i) => i);
          if (sub.shuffleOptions !== false) optionOrder = shuffle([...optionOrder]);
          const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
          return {
            imgIndex,
            optionOrder,
            userAnswer: sub.noAnswer ? null : (isMulti ? [] : null)
          };
        });
        renderChoiceSet();
      } else {
        // 排序题
        if (workspace) workspace.style.display = '';
        const ticketActions = document.querySelector('.ticket-actions');
        if (ticketActions) ticketActions.style.display = '';

        const baseOptions = Array.isArray(currentQ.options) ? currentQ.options : [];
        const shuffled = shuffle([...baseOptions]);
        poolItems = shuffled.map((text) => ({ id: ++idSeq, text }));
        ticketItems = [];
        renderSort();
      }
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // ---------------- 排序题渲染（池不减少） ----------------
    function renderSort() {
      poolList.innerHTML = '';
      poolItems.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'item';
        li.textContent = item.text;
        li.addEventListener('click', () => {
          if (submitted) return;
          ticketItems.push({ id: ++idSeq, text: item.text });
          renderSort();
        });
        poolList.appendChild(li);
      });

      ticketList.innerHTML = '';
      ticketItems.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'item';
        li.draggable = true;
        li.dataset.id = item.id;
        li.innerHTML = `
          <span class="idx">${idx + 1}</span>
          <span class="txt">${escapeHtml(item.text)}</span>
          <span class="del" title="删除">×</span>
        `;
        li.querySelector('.del').addEventListener('click', (e) => {
          e.stopPropagation();
          if (submitted) return;
          ticketItems = ticketItems.filter((i) => i.id !== item.id);
          renderSort();
        });
        attachDragEvents(li);
        ticketList.appendChild(li);
      });
    }

    function attachDragEvents(li) {
      li.addEventListener('dragstart', (e) => {
        if (submitted) { e.preventDefault(); return; }
        dragId = +li.dataset.id;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        dragId = null;
      });
      li.addEventListener('dragover', (e) => e.preventDefault());
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragId == null) return;
        const targetId = +li.dataset.id;
        if (dragId === targetId) return;
        const fromIdx = ticketItems.findIndex((i) => i.id === dragId);
        const toIdx = ticketItems.findIndex((i) => i.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;
        const [moved] = ticketItems.splice(fromIdx, 1);
        ticketItems.splice(toIdx, 0, moved);
        renderSort();
      });
    }

    // ---------------- 选择题组渲染 ----------------
    function renderChoiceSet() {
      const box = resultBox;
      box.classList.remove('hidden');
      box.innerHTML = '';

      currentQ.subQuestions.forEach((sub, qi) => {
        const st = choiceState[qi];
        const wrap = document.createElement('div');
        wrap.className = 'choice-item';
        wrap.style.cssText = 'padding:14px 0;border-bottom:1px dashed #ddd;';

        const isNoAnswer = !!sub.noAnswer;
        const isMulti = sub.type && sub.type.indexOf('multi') !== -1;

        // 题号 + 题干（noAnswer 不标单选/多选）
        const stem = document.createElement('div');
        stem.style.cssText = 'font-weight:bold;margin-bottom:8px;';
        let stemText = `第 ${sub.no} 题`;
        if (!isNoAnswer) stemText += `（${isMulti ? '多选' : '单选'}）`;
        if (sub.stem) stemText += '：' + sub.stem;
        stem.textContent = stemText;
        wrap.appendChild(stem);

        // 图片
        if (sub.type && sub.type.indexOf('image') === 0) {
          const imgs = Array.isArray(sub.images) ? sub.images : [];
          if (imgs.length) {
            const img = document.createElement('img');
            img.src = imgs[st.imgIndex] || imgs[0];
            img.style.cssText = 'max-width:100%;max-height:320px;display:block;margin:8px 0;border:1px solid #eee;border-radius:6px;';
            img.alt = '题图';
            img.onerror = function () {
              this.style.display = 'none';
              const tip = document.createElement('div');
              tip.style.cssText = 'color:#d33;font-size:13px;margin:6px 0;';
              tip.textContent = '图片加载失败：' + this.src;
              this.parentNode.insertBefore(tip, this.nextSibling);
            };
            wrap.appendChild(img);
          }
        }

        // 选项（noAnswer 不渲染）
        if (!isNoAnswer) {
          st.optionOrder.forEach((origIdx) => {
            const label = document.createElement('label');
            label.style.cssText = 'display:block;padding:6px 4px;cursor:pointer;';
            const input = document.createElement('input');
            input.type = isMulti ? 'checkbox' : 'radio';
            input.name = 'q_' + qi;
            input.value = origIdx;
            if (isMulti) {
              input.checked = st.userAnswer.indexOf(origIdx) !== -1;
              input.addEventListener('change', () => {
                if (submitted) { input.checked = !input.checked; return; }
                if (input.checked) st.userAnswer.push(origIdx);
                else st.userAnswer = st.userAnswer.filter((x) => x !== origIdx);
              });
            } else {
              input.checked = st.userAnswer === origIdx;
              input.addEventListener('change', () => {
                if (submitted) return;
                st.userAnswer = origIdx;
              });
            }
            label.appendChild(input);
            label.appendChild(document.createTextNode(' ' + sub.options[origIdx]));
            wrap.appendChild(label);
          });
        }

        box.appendChild(wrap);
      });

      // 底部提交/重置
      const actions = document.createElement('div');
      actions.style.cssText = 'margin-top:16px;display:flex;gap:10px;';
      const bSubmit = document.createElement('button');
      bSubmit.className = 'btn primary';
      bSubmit.textContent = '提交';
      bSubmit.addEventListener('click', onSubmit);
      const bReset = document.createElement('button');
      bReset.className = 'btn';
      bReset.textContent = '清空重做';
      bReset.addEventListener('click', () => {
        const idx = qSelect ? (+qSelect.value || 0) : 0;
        loadQuestion(idx);
      });
      actions.appendChild(bSubmit);
      actions.appendChild(bReset);
      box.appendChild(actions);
    }

    // ---------------- 提交 ----------------
    function onSubmit() {
      if (submitted) return;
      if (currentQ.kind === 'choice-set') gradeChoiceSet();
      else gradeSort();
    }

    function gradeSort() {
      if (ticketItems.length === 0) { alert('请至少选择一个操作项目！'); return; }
      submitted = true;
      btnSubmit.disabled = true;
      const userSeq = ticketItems.map((i) => i.text);
      const correct = currentQ.correctSequence || [];
      const maxLen = Math.max(userSeq.length, correct.length);
      let rightCount = 0;
      let html = '';
      for (let i = 0; i < maxLen; i++) {
        const u = userSeq[i] || '（未选择）';
        const c = correct[i] || '（无）';
        const ok = u === c;
        if (ok) rightCount++;
        html += `<div class="result-item ${ok ? 'ok' : 'bad'}">
          <div><strong>第 ${i + 1} 步：</strong>${escapeHtml(u)} ${ok ? '✅' : '❌'}</div>
          ${ok ? '' : `<div class="expected">正确应为：${escapeHtml(c)}</div>`}
        </div>`;
      }
      if (userSeq.length !== correct.length) {
        html = `<div class="result-item bad"><strong>⚠ 数量不符：</strong>应选 ${correct.length} 项，你选了 ${userSeq.length} 项。</div>` + html;
      }
      const full = rightCount === correct.length && userSeq.length === correct.length;
      const score = full ? 100 : (correct.length ? Math.round((rightCount / correct.length) * 100) : 0);
      const box = document.getElementById('resultBox');
      box.innerHTML = `<div class="score">得分：${score} 分 ${full ? '🎉' : ''}</div>${html}`;
      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function gradeChoiceSet() {
      submitted = true;

      function getCorrectAnswer(sub, st) {
        const isImage = sub.type && sub.type.indexOf('image') === 0;
        const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
        if (isImage) {
          let correct;
          if (Array.isArray(sub.answer)) correct = sub.answer[st.imgIndex];
          else correct = sub.answer;
          if (correct === undefined || correct === null) {
            console.error(`[第${sub.no}题] 取正确答案失败：imgIndex=${st.imgIndex}`);
            return isMulti ? [] : -1;
          }
          if (isMulti) return Array.isArray(correct) ? correct : [correct];
          return correct;
        }
        return sub.answer;
      }

      const gradable = currentQ.subQuestions.filter((s) => !s.noAnswer);
      const total = gradable.length;
      let rightCount = 0;

      const details = currentQ.subQuestions.map((sub, qi) => {
        if (sub.noAnswer) return { sub, skip: true };
        const st = choiceState[qi];
        const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
        const correctAns = getCorrectAnswer(sub, st);
        let ok = false;
        if (isMulti) {
          const ans = Array.isArray(correctAns) ? [...correctAns].sort() : [];
          const user = [...st.userAnswer].sort();
          ok = ans.length === user.length && ans.every((v, i) => v === user[i]);
        } else {
          ok = st.userAnswer === correctAns;
        }
        if (ok) rightCount++;
        return { sub, st, ok, correctAns };
      });

      const score = total ? Math.round((rightCount / total) * 100) : 0;
      let html = `<div class="score">得分：${score} 分（答对 ${rightCount}/${total} 题）${rightCount === total && total > 0 ? ' 🎉 全部正确！' : ''}</div>`;
      details.forEach((d) => {
        if (d.skip) {
          html += `<div class="result-item"><div><strong>第 ${d.sub.no} 题：</strong>展示题，不计分</div></div>`;
          return;
        }
        const { sub, ok, correctAns } = d;
        const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
        let correctText;
        if (isMulti) {
          correctText = (Array.isArray(correctAns) ? correctAns : []).map((i) => sub.options[i]).join('、');
        } else {
          correctText = (typeof correctAns === 'number' && correctAns >= 0 && sub.options && sub.options[correctAns] != null)
            ? sub.options[correctAns] : '（数据缺失）';
        }
        html += `<div class="result-item ${ok ? 'ok' : 'bad'}">
          <div><strong>第 ${sub.no} 题：</strong>${ok ? '✅ 正确' : '❌ 错误'}</div>
          ${ok ? '' : `<div class="expected">正确答案：${escapeHtml(correctText)}</div>`}
        </div>`;
      });
      const box = document.getElementById('resultBox');
      box.innerHTML = html;
      box.classList.remove('hidden');
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    }
  }
})();