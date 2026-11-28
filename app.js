// app.js — 多用户登录 + 排序题 + 选择题组（含下拉/自动日期/自动打勾/图片下拉）+ 限时开关 + localStorage 弱限制
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
  // 【第 2 处替换】练习界面密文：由新版 encrypt.html 用 CONTENT_KEY 加密
  // ============================================================
  const PRACTICE_ENCRYPTED = {
 "salt": "Bl8ZOfhXquAOzJTgdypkEA==",
  "iv": "0mMrnD6PSPSXDHsd",
  "data": "Qgh27bmr3Jp/le1acE/+Cjuar91sfyB3IZGpvXQ6UNZqrlXYhORYXqt08ZqCtNgeLx6vAhNtgCpq/BppNAub1gwMwA/nmDRUCBW71JPC9Ni8bsCswKHX2u04/0HAeZEWvx5PZmRfUyDnAQ5CH8HxeC1f4rCm6zbJpMdN6YO17vFfMqr0eiNJuF6khPvTEAoj8D1VeU76LvLLzloMVPopEBlNMVCSRRchQkR7MYaluSM91r34LK5joigHvTx0Qpl04kMRq/JmkjWIuSRL+8KwgwEmb9T824m52emDjI0zn5tI83KHZgPNOmnW6q7mYILg6FAlfBhh60EKuSiR9cTICsFsUFw+QM2C4t5mNcjVoJiz08z8jfiaFsszltEyw+HgTmS7WsZwe91mcDR/0xfdh16NxXA7dTsR39Fp5j3VCoL1vawj1vocnouIGXhbNgPiRSGUn4i2y/ufDRjL5Gppo8fDEac+TwGmLpofPUmfBdbS9sg+EJkFwQiCoMhE0TM6YUeMFicqqbFY7EWwKeTGgisaaqrqZu7QBPwgRaL4l7uPEAl3KtJ8VYjjJ9GbyQovdLJxDTF+OMicB97NtaBnaqGMuYU2cdH7Nb8TBLYUrL+TDvCXfiDZWKAKB5qrCeLA53Ppf0vMSP1BeIEcIP2Z0cVL2+b//d6mkzG48F8KuS2odUE946QQ9SxWxim8xzaXxFwyrOetKNVUzdMLMyvOAp9INRf+NUFOIs2YjqCN7e13ZT0s4zhVQDzF9pMxrv+GmfcO87oHXtaO0f3ELazprst+NTYJSYvUN2allS0GK1JYCu5MOVaiqdSyac3KonGgbSVsFHZ7tXhPI7ZB3VAjWQLp2hoCNHdZQyFFxSkZkQRcvfivTZkhWlxCgMQxkePjF2qSPip9vPR5OEUmCGV8jza9iIg/sKKgjtK9y0x0Y0vANA4UptsA2KtHz4jNa0VsqK4MvcOqn3ueVueZK2pUAfsKQ8rOGNj5fMXQb+MCUK7B/piw35Xa+EcP+QUAeg0fuUbjTS4JzCbcS4LErEI6gRDM3zpnoZV81HBHYCu9JFU5css9UYfZm7BLQsQdBXwigQ+LPvZA0dSXOIx+etgoU/xtZlZOqk7brUXXc9xNVlJy3bVuNMdX1gVpM5mLEBHPtUDoWkDj8GSKsdUj0r9WaM1Hv3LD57crp8X27QU4XR8X3SYiF6YgbpykMigQstypUvPhPOJKuYLMdimU6pR8yPjo+5CnFbaQi8WYKVlqmhJwGxct68dVb4XJzq7dx2E3SnzwAXDTTnSCFiiej09JXdXSYWmbf1iM7N038FvyC7lLYeOnfeggU3WlV8xdXpncnLYFPrGA21dMQLu4FCcguhRaHKzlU6b6ng1yw2h51xxb40qup0f9th9Dy4o1HJHY84Nz0+BCgxg4QeLdE/Shfg=="
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
  // localStorage 弱限制：同一浏览器只能一个账号登录
  // ============================================================
  const LS_USER = 'ot_logged_user';
  const LS_TIME = 'ot_login_time';
  const LOGIN_EXPIRE = 60 * 60 * 1000; // 1 小时

  function checkExistingLogin() {
    const u = localStorage.getItem(LS_USER);
    const t = +localStorage.getItem(LS_TIME) || 0;
    if (u && Date.now() - t < LOGIN_EXPIRE) return u;
    if (u) {
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_TIME);
    }
    return null;
  }
  function markLogin(username) {
    localStorage.setItem(LS_USER, username);
    localStorage.setItem(LS_TIME, Date.now());
  }
  function clearLogin() {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TIME);
  }

  // ============================================================
  // 登录事件
  // ============================================================
  const gateBtn = document.getElementById('gateBtn');
  const gateUser = document.getElementById('gateUser');
  const gatePwd = document.getElementById('gatePwd');
  const gateMsg = document.getElementById('gateMsg');

  const existing = checkExistingLogin();
  if (existing) {
    const gate = document.getElementById('gate');
    gate.innerHTML = `
      <h2>该浏览器已有账号登录</h2>
      <p style="margin:12px 0;color:#555;">当前登录：<strong>${existing}</strong></p>
      <p style="margin-bottom:16px;color:#888;font-size:13px;">如需切换账号，请先退出登录</p>
      <button id="logoutBtn" style="width:100%;padding:10px;background:#d33;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;">退出登录</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearLogin();
      location.reload();
    });
    return;
  }

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

    markLogin(username);
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
  // 练习逻辑
  // ============================================================
  function startApp() {
    let currentQ = null;
    let poolItems = [];
    let ticketItems = [];
    let idSeq = 0;
    let submitted = false;
    let dragId = null;
    let choiceState = [];
    // 限时
    let timerId = null;
    let remaining = 0;
    const TIME_LIMIT = 180;
    let timerEnabled = true;

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

    // 限时开关
    const timerToggle = document.getElementById('timerToggle');
    if (timerToggle) {
      timerEnabled = timerToggle.checked;
      timerToggle.addEventListener('change', () => {
        timerEnabled = timerToggle.checked;
        if (!timerEnabled) {
          stopTimer();
          const el = document.getElementById('timerBox');
          if (el) { el.textContent = '限时已关闭'; el.style.color = '#888'; el.style.fontWeight = 'normal'; }
        } else {
          startTimer();
        }
      });
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

    // ---------------- 计时 ----------------
    function startTimer() {
      stopTimer();
      if (!timerEnabled) {
        const el = document.getElementById('timerBox');
        if (el) { el.textContent = '限时已关闭'; el.style.color = '#888'; }
        return;
      }
      remaining = TIME_LIMIT;
      updateTimerDisplay();
      timerId = setInterval(() => {
        remaining--;
        updateTimerDisplay();
        if (remaining <= 0) {
          stopTimer();
          if (!submitted) {
            if (currentQ.kind === 'choice-set') gradeChoiceSet();
            else gradeSort();
          }
        }
      }, 1000);
    }
    function stopTimer() {
      if (timerId) { clearInterval(timerId); timerId = null; }
    }
    function updateTimerDisplay() {
      const el = document.getElementById('timerBox');
      if (!el) return;
      if (!timerEnabled) { el.textContent = '限时已关闭'; el.style.color = '#888'; el.style.fontWeight = 'normal'; return; }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      el.textContent = `剩余时间：${m}:${String(s).padStart(2, '0')}`;
      el.style.color = remaining <= 30 ? '#d33' : '#333';
      el.style.fontWeight = remaining <= 30 ? 'bold' : 'normal';
    }

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
        if (workspace) workspace.style.display = 'none';
        const ticketActions = document.querySelector('.ticket-actions');
        if (ticketActions) ticketActions.style.display = 'none';

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

          let initAnswer;
          if (sub.noAnswer) initAnswer = null;
          else if (sub.type === 'date-auto') initAnswer = null;
          else if (sub.type === 'check-auto') initAnswer = false;
          else if (sub.type === 'select' || sub.type === 'image-select') initAnswer = null;
          else if (sub.type && sub.type.indexOf('multi') !== -1) initAnswer = [];
          else initAnswer = null;

          return { imgIndex, optionOrder, userAnswer: initAnswer };
        });
        renderChoiceSet();
      } else {
        if (workspace) workspace.style.display = '';
        const ticketActions = document.querySelector('.ticket-actions');
        if (ticketActions) ticketActions.style.display = '';

        const baseOptions = Array.isArray(currentQ.options) ? currentQ.options : [];
        const shuffled = shuffle([...baseOptions]);
        poolItems = shuffled.map((text) => ({ id: ++idSeq, text }));
        ticketItems = [];
        renderSort();
      }

      startTimer();
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // ---------------- 排序题渲染 ----------------
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
          <span class="move" title="上移">↑</span>
          <span class="move" title="下移">↓</span>
          <span class="del" title="删除">×</span>
        `;
        li.querySelector('.del').addEventListener('click', (e) => {
          e.stopPropagation();
          if (submitted) return;
          ticketItems = ticketItems.filter((i) => i.id !== item.id);
          renderSort();
        });
        const moves = li.querySelectorAll('.move');
        moves[0].addEventListener('click', (e) => {
          e.stopPropagation();
          if (submitted || idx === 0) return;
          [ticketItems[idx - 1], ticketItems[idx]] = [ticketItems[idx], ticketItems[idx - 1]];
          renderSort();
        });
        moves[1].addEventListener('click', (e) => {
          e.stopPropagation();
          if (submitted || idx === ticketItems.length - 1) return;
          [ticketItems[idx + 1], ticketItems[idx]] = [ticketItems[idx], ticketItems[idx + 1]];
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

        const stem = document.createElement('div');
        stem.style.cssText = 'font-weight:bold;margin-bottom:8px;';
        let stemText = `第 ${sub.no} 题：`;
        if (sub.stem) stemText += sub.stem;
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

        // 下拉（select / image-select）
        if (sub.type === 'select' || sub.type === 'image-select') {
          const sel = document.createElement('select');
          sel.style.cssText = 'padding:6px 10px;border:1px solid #ccc;border-radius:6px;font-size:14px;min-width:120px;';
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = '--请选择--';
          sel.appendChild(placeholder);
          st.optionOrder.forEach((origIdx) => {
            const opt = document.createElement('option');
            opt.value = origIdx;
            opt.textContent = sub.options[origIdx];
            sel.appendChild(opt);
          });
          sel.value = (st.userAnswer === null || st.userAnswer === undefined) ? '' : st.userAnswer;
          sel.addEventListener('change', () => {
            if (submitted) { sel.value = st.userAnswer === null ? '' : st.userAnswer; return; }
            st.userAnswer = sel.value === '' ? null : +sel.value;
          });
          wrap.appendChild(sel);
        }

        // 自动日期
        else if (sub.type === 'date-auto') {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn';
          btn.style.cssText = 'padding:6px 14px;font-size:14px;';
          btn.textContent = st.userAnswer ? st.userAnswer : '点击显示当天日期';
          btn.addEventListener('click', () => {
            if (submitted) return;
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            st.userAnswer = `${y}年${m}月${day}日`;
            btn.textContent = st.userAnswer;
          });
          wrap.appendChild(btn);
        }


        // 自动打勾：空白长方形框，点击显示 ✓
        else if (sub.type === 'check-auto') {
          const boxEl = document.createElement('div');
          boxEl.className = 'check-box';
          boxEl.style.cssText = `
            width: 120px; height: 40px;
            border: 2px solid #4a90d9;
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; color: #34a853; font-weight: bold;
            cursor: pointer; user-select: none;
            background: ${st.userAnswer ? '#e6f7ea' : '#fff'};
            transition: .15s;
          `;
          boxEl.textContent = st.userAnswer ? '✓' : '';
          boxEl.addEventListener('click', () => {
            if (submitted) return;
            st.userAnswer = !st.userAnswer;
            boxEl.textContent = st.userAnswer ? '✓' : '';
            boxEl.style.background = st.userAnswer ? '#e6f7ea' : '#fff';
          });
          wrap.appendChild(boxEl);
 
        }

        // 单选/多选
        else if (!isNoAnswer) {
          const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
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
      stopTimer();
      if (currentQ.kind === 'choice-set') gradeChoiceSet();
      else gradeSort();
    }

    function gradeSort() {
      stopTimer();
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
      stopTimer();
      submitted = true;

      function todayStr() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}年${m}月${day}日`;
      }

      function getCorrectAnswer(sub, st) {
        const isImage = sub.type && sub.type.indexOf('image') === 0;
        const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
        if (sub.type === 'date-auto') return todayStr();
        if (sub.type === 'check-auto') return true;
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
        const correctAns = getCorrectAnswer(sub, st);
        let ok = false;

        if (sub.type === 'date-auto') {
          ok = st.userAnswer === correctAns;
        } else if (sub.type === 'check-auto') {
          ok = st.userAnswer === true;
        } else if (sub.type === 'select' || sub.type === 'image-select') {
          ok = st.userAnswer === correctAns;
        } else {
          const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
          if (isMulti) {
            const ans = Array.isArray(correctAns) ? [...correctAns].sort() : [];
            const user = [...st.userAnswer].sort();
            ok = ans.length === user.length && ans.every((v, i) => v === user[i]);
          } else {
            ok = st.userAnswer === correctAns;
          }
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
        const { sub, st, ok, correctAns } = d;
        let userText, correctText;

        if (sub.type === 'date-auto') {
          userText = st.userAnswer || '（未点击）';
          correctText = correctAns;
        } else if (sub.type === 'check-auto') {
          userText = st.userAnswer ? '已勾选' : '（未勾选）';
          correctText = '应勾选';
        } else if (sub.type === 'select' || sub.type === 'image-select') {
          userText = (st.userAnswer === null || st.userAnswer === undefined) ? '（未选择）' : sub.options[st.userAnswer];
          correctText = sub.options[correctAns];
        } else {
          const isMulti = sub.type && sub.type.indexOf('multi') !== -1;
          if (isMulti) {
            userText = (Array.isArray(st.userAnswer) ? st.userAnswer : []).map((i) => sub.options[i]).join('、') || '（未选）';
            correctText = (Array.isArray(correctAns) ? correctAns : []).map((i) => sub.options[i]).join('、');
          } else {
            userText = (st.userAnswer === null || st.userAnswer === undefined) ? '（未选）' : sub.options[st.userAnswer];
            correctText = (typeof correctAns === 'number' && correctAns >= 0 && sub.options[correctAns] != null) ? sub.options[correctAns] : '（数据缺失）';
          }
        }

        html += `<div class="result-item ${ok ? 'ok' : 'bad'}">
          <div><strong>第 ${sub.no} 题：</strong>${ok ? '✅ 正确' : '❌ 错误'}</div>
          ${ok ? '' : `<div class="expected">你的答案：${escapeHtml(userText)}；正确答案：${escapeHtml(correctText)}</div>`}
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
