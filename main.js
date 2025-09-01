'use strict';
{
  document.addEventListener("DOMContentLoaded", () => {
    // 定数・ダミーデータ 
    const STORAGE_KEY = "snowbuddy_teach_posts";

    const ALL_LEVELS = ["初級", "中級", "上級"];
    const ALL_STYLES = ["カービング", "パーク", "グラトリ", "フリーラン"];

    const SEED = [
      { id: "a1", nickname: "ぽんすけ", level: "上級", styles: ["パーク"], tricks: ["レール", "キッカー12m"], resort: "栂池", message: "一日中、パークのリフト回してます！", gender: "男性" },
      { id: "b2", nickname: "ごまつぶ", level: "中級", styles: ["カービング"], tricks: ["カービング切り替え"], resort: "白馬", message: "朝イチ圧雪バーンでカービング。午後はパーク練習。", gender: "女性" },
      { id: "c3", nickname: "そらごん", level: "中級", styles: ["グラトリ", "フリーラン"], tricks: ["スイッチ基礎", "オーリー"], resort: "苗場", message: "スイッチの安定感を上げたい。", gender: "女性" },
      { id: "d4", nickname: "たけのこ", level: "初級", styles: ["フリーラン"], tricks: ["FS180", "ノーリー"], resort: "ニセコ", message: "初めての北海道！ゆるく回せる人募集。", gender: "非公開" },
    ];

    const me = {
      id: "me", nickname: "ごまち", level: "中級",
      styles: ["パーク"], tricks: ["FS180"], resort: "苗場",
      message: "午後から軽く回します！", gender: "非公開",
    };

    // ストレージ 
    const storage = {
      load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
        catch { return []; }
      },
      save(posts) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
        catch (e) { alert("保存に失敗しました（容量の可能性）"); console.error(e); }
      }
    };

    // 状態
    const state = {
      tab: "riders",
      profiles: [...SEED],
      requested: [],
      filterResort: "すべて",
      filterLevel: "すべて",
      filterStyle: "すべて",
      posts: storage.load(),
    };

    // ユーティリティ
    function nowLocalValue() {
      const n = new Date(); const off = n.getTimezoneOffset();
      const local = new Date(n.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    }
    const fmtDateTime = s => new Date(s).toLocaleString();
    const yen = n => (n == null ? "無料" : "¥" + Number(n).toLocaleString("ja-JP"));
    function uuid() {
      return (crypto && crypto.randomUUID) ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16);
        });
    }

    //  要素参照 
    const ridersView = document.getElementById("ridersView");
    const postsView = document.getElementById("postsView");
    const tabR = document.getElementById("tabRiders");
    const tabP = document.getElementById("tabPosts");
    const riderList = document.getElementById("riderList");
    const postList = document.getElementById("postList");
    const postEmpty = document.getElementById("postEmpty");
    const filterResort = document.getElementById("filterResort");
    const filterLevel = document.getElementById("filterLevel");
    const filterStyle = document.getElementById("filterStyle");
    const matchCount = document.getElementById("matchCount");
    const postForm = document.getElementById("postForm");

    if (!ridersView || !postsView || !tabR || !tabP || !riderList || !postList || !postForm) {
      console.error("必要なDOM要素が見つかりません。index.html の id を確認してください。");
      return;
    }


    function buildLevelBadge(level) {
      const span = document.createElement("span");
      span.className =
        "level " + (level === "初級" ? "beginner" : level === "中級" ? "intermediate" : "advanced");
      span.textContent = level;
      return span;
    }

    // レンダリング
    function render() {
      // タブ切替
      if (state.tab === "riders") {
        ridersView.style.display = "";
        postsView.style.display = "none";
        tabR.classList.remove("btn-disabled");
        tabP.classList.add("btn-disabled");
      } else {
        ridersView.style.display = "none";
        postsView.style.display = "";
        tabR.classList.add("btn-disabled");
        tabP.classList.remove("btn-disabled");
      }

      // フィルタ
      const filtered = state.profiles.filter(p => {
        if (state.filterResort !== "すべて" && p.resort !== state.filterResort) return false;
        if (state.filterLevel !== "すべて" && p.level !== state.filterLevel) return false;
        if (state.filterStyle !== "すべて" && !p.styles.includes(state.filterStyle)) return false;
        return true;
      });
      matchCount.textContent = `該当 ${filtered.length} 人`;

      // ライダー一覧
      riderList.innerHTML = "";
      filtered.forEach(p => {
        const li = document.createElement("li");
        const article = document.createElement("article");
        article.className = "item";

        // header
        const header = document.createElement("div");
        header.className = "header";

        const h3 = document.createElement("h3");
        h3.style.margin = "0";
        h3.textContent = `🏂 ${p.nickname}`;

        const badge = buildLevelBadge(p.level);

        header.appendChild(h3);
        header.appendChild(badge);
        article.appendChild(header);

        // meta
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `📍 ${p.resort} ・ ${p.gender || "非公開"}`;
        article.appendChild(meta);

        // styles
        const stylesWrap = document.createElement("div");
        stylesWrap.style.marginTop = "6px";
        p.styles.forEach(s => {
          const span = document.createElement("span");
          span.className = "badge";
          span.textContent = s;
          stylesWrap.appendChild(span);
        });
        article.appendChild(stylesWrap);

        // tricks
        const tricksWrap = document.createElement("div");
        tricksWrap.style.marginTop = "6px";
        p.tricks.forEach(t => {
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = `#${t}`;
          tricksWrap.appendChild(span);
        });
        article.appendChild(tricksWrap);

        // message
        if (p.message) {
          const msg = document.createElement("p");
          msg.style.marginTop = "8px";
          msg.textContent = `💬 ${p.message}`;
          article.appendChild(msg);
        }

        // footer (button)
        const footer = document.createElement("div");
        footer.className = "right";
        footer.style.marginTop = "8px";

        const btn = document.createElement("button");
        btn.className = "btn";
        btn.dataset.action = "request";
        btn.dataset.id = p.id;
        if (state.requested.includes(p.id)) {
          btn.classList.add("btn-disabled");
          btn.disabled = true;
          btn.textContent = "リクエスト済み";
        } else {
          btn.textContent = "一緒に回す？";
        }

        footer.appendChild(btn);
        article.appendChild(footer);

        li.appendChild(article);
        riderList.appendChild(li);
      });

      // 募集一覧
      postList.innerHTML = "";
      state.posts.forEach(p => {
        const li = document.createElement("li");
        const article = document.createElement("article");
        article.className = "item";

        const header = document.createElement("div");
        header.className = "header";

        const left = document.createElement("div");
        const strong = document.createElement("b");
        strong.textContent = `[${p.type === "teach" ? "教える" : "教わる"}]`;
        left.appendChild(strong);

        const titleText = document.createTextNode(` ${(p.tricks || []).join(", ")} @ ${p.resort}`);
        left.appendChild(titleText);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${fmtDateTime(p.startAt)} – ${fmtDateTime(p.endAt)}`
          + (p.priceJPY == null ? " ・無料" : ` ・${yen(p.priceJPY)}`);
        left.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "actions";

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-disabled";
        editBtn.textContent = "編集";
        editBtn.dataset.action = "edit-note";
        editBtn.dataset.id = p.id;

        const delBtn = document.createElement("button");
        delBtn.className = "btn";
        delBtn.textContent = "削除";
        delBtn.dataset.action = "delete-post";
        delBtn.dataset.id = p.id;

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        header.appendChild(left);
        header.appendChild(actions);
        article.appendChild(header);

        if (p.note) {
          const note = document.createElement("p");
          note.style.marginTop = "8px";
          note.textContent = `💬 ${p.note}`;
          article.appendChild(note);
        }

        li.appendChild(article);
        postList.appendChild(li);
      });

      postEmpty.style.display = state.posts.length === 0 ? "" : "none";
    }

    // イベント
    // タブ
    tabR.addEventListener("click", () => { state.tab = "riders"; render(); });
    tabP.addEventListener("click", () => { state.tab = "posts"; render(); });

    // フィルタ
    filterResort.addEventListener("change", e => { state.filterResort = e.target.value; render(); });
    filterLevel.addEventListener("change", e => { state.filterLevel = e.target.value; render(); });
    filterStyle.addEventListener("change", e => { state.filterStyle = e.target.value; render(); });

    // ライダー一覧：リクエスト
    riderList.addEventListener("click", (e) => {
      const target = e.target;
      const btn = target.closest && target.closest("button[data-action='request']");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!state.requested.includes(id)) {
        state.requested = Array.from(new Set([...state.requested, id]));
        render();
      }
    });

    // 募集一覧：編集・削除
    postList.addEventListener("click", (e) => {
      const target = e.target;
      const editBtn = target.closest && target.closest("button[data-action='edit-note']");
      const delBtn = target.closest && target.closest("button[data-action='delete-post']");

      if (editBtn) {
        const id = editBtn.dataset.id;
        const idx = state.posts.findIndex(x => x.id === id);
        if (idx >= 0) {
          const cur = state.posts[idx];
          const next = prompt("メモを編集", cur.note || "");
          if (next !== null) {
            state.posts = state.posts.map(x => x.id === id ? { ...x, note: next || undefined } : x);
            storage.save(state.posts);
            render();
          }
        }
      }
      if (delBtn) {
        const id = delBtn.dataset.id;
        if (confirm("この募集を削除しますか？")) {
          state.posts = state.posts.filter(x => x.id !== id);
          storage.save(state.posts);
          render();
        }
      }
    });

    // 追加フォーム
    (function initForm() {
      const f = postForm;

      const startAtEl = f.elements.namedItem("startAt");
      const endAtEl = f.elements.namedItem("endAt");
      if (startAtEl && !startAtEl.value) startAtEl.value = nowLocalValue();
      if (endAtEl && !endAtEl.value) endAtEl.value = nowLocalValue();

      f.addEventListener("submit", (e) => {
        e.preventDefault();

        const typeEl = f.elements.namedItem("type");
        const trickEl = f.elements.namedItem("trick");
        const resortEl = f.elements.namedItem("resort");
        const priceEl = f.elements.namedItem("price");
        const noteEl = f.elements.namedItem("note");

        const type = (typeEl && typeEl.value) || "teach";
        const trick = (trickEl && trickEl.value.trim()) || "FS180";
        const resort = (resortEl && resortEl.value) || "白馬";
        const startAt = (startAtEl && startAtEl.value) || nowLocalValue();
        const endAt = (endAtEl && endAtEl.value) || nowLocalValue();
        const price = priceEl && priceEl.value ? Number(priceEl.value) : undefined;
        const note = (noteEl && noteEl.value.trim()) || "";

        const next = {
          id: uuid(),
          ownerId: me.id,
          type,
          tricks: [trick],
          resort,
          startAt,
          endAt,
          priceJPY: price,
          note: note || undefined,
          createdAt: new Date().toISOString(),
        };

        state.posts = [next, ...state.posts];
        storage.save(state.posts);

        f.reset();
        if (startAtEl && !startAtEl.value) startAtEl.value = nowLocalValue();
        if (endAtEl && !endAtEl.value) endAtEl.value = nowLocalValue();

        state.tab = "posts";
        render();
      });
    })();

    // 別タブ同期
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        state.posts = storage.load();
        render();
      }
    });

    // 初期描画
    render();
  });

}