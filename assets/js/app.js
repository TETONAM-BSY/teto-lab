// ═══════════════════════════════════════════════════════
// ENG·WIKI v4.0 — App Core
// SPA 라우팅, 데이터 로딩, 상태 관리
// ═══════════════════════════════════════════════════════

const App = (() => {

  // ── 상태 ────────────────────────────────────────────
  const state = {
    metadata: null,
    currentSubject: null,
    currentChapter: null,
    subjectCache: {},       // { subjectId: jsonData }
    searchIndex: [],
    bookmarks: JSON.parse(localStorage.getItem('engwiki-bookmarks') || '[]'),
    progress: JSON.parse(localStorage.getItem('engwiki-progress') || '{}'),
    sidebarOpen: true,
  };

  // ── 초기화 ──────────────────────────────────────────
  async function init() {
    showLoading(true);
    try {
      state.metadata = await loadJSON('data/metadata.json');
      renderSidebar();
      renderHome();
      setupRouter();
      setupSearch();
      restoreScrollProgress();
    } catch (e) {
      showError('메타데이터를 불러올 수 없습니다: ' + e.message);
    } finally {
      showLoading(false);
    }
  }

  // ── JSON 로더 ────────────────────────────────────────
  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    return res.json();
  }

  async function loadSubject(subjectId, dataFile) {
    if (state.subjectCache[subjectId]) return state.subjectCache[subjectId];
    const data = await loadJSON(dataFile);
    state.subjectCache[subjectId] = data;
    return data;
  }

  // ── 사이드바 렌더링 ──────────────────────────────────
  function renderSidebar() {
    const meta = state.metadata;
    const sidebar = document.getElementById('sidebar');

    // 카테고리별 그룹핑
    const byCategory = {};
    meta.subjects.forEach(s => {
      if (!byCategory[s.category]) byCategory[s.category] = [];
      byCategory[s.category].push(s);
    });

    let html = `
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">∑</span>
          <div>
            <div class="logo-title">ENG·WIKI</div>
            <div class="logo-sub">v${meta.version}</div>
          </div>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="사이드바 접기">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v1.5H2zm0 5.25h12v1.5H2zm0 5.25h12v1.5H2z"/>
          </svg>
        </button>
      </div>

      <div class="sidebar-search-wrap">
        <input type="text" id="sidebar-search" class="sidebar-search" placeholder="🔍  과목·챕터 검색…" autocomplete="off">
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="sidebar-section home-item">
          <a class="sidebar-item home-link active" href="#" data-action="home">
            <span class="item-icon">🏠</span>
            <span class="item-label">홈</span>
          </a>
        </div>
    `;

    meta.categories.forEach(cat => {
      const subjects = byCategory[cat.id] || [];
      if (!subjects.length) return;

      html += `
        <div class="sidebar-section">
          <div class="sidebar-category" data-cat="${cat.id}">
            <span class="cat-icon">${cat.icon}</span>
            <span class="cat-name">${cat.name}</span>
            <span class="cat-arrow">▾</span>
          </div>
          <ul class="sidebar-subjects" id="cat-${cat.id}">
      `;
      subjects.forEach(subj => {
        const prog = getProgress(subj.id);
        const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
        html += `
          <li>
            <a class="sidebar-item subject-link" href="#subject/${subj.id}"
               data-subject="${subj.id}" data-file="${subj.dataFile}">
              <span class="item-label">${subj.name}</span>
              <span class="item-badge">${subj.chapters}ch</span>
            </a>
            ${pct > 0 ? `<div class="progress-mini"><div style="width:${pct}%"></div></div>` : ''}
          </li>
        `;
      });
      html += `</ul></div>`;
    });

    html += `</nav>

      <div class="sidebar-footer">
        <div class="stats-row">
          <span>📚 ${meta.totalSubjects}과목</span>
          <span>📖 ${meta.totalChapters}챕터</span>
        </div>
      </div>
    `;

    sidebar.innerHTML = html;

    // 이벤트
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

    document.querySelectorAll('.sidebar-category').forEach(el => {
      el.addEventListener('click', () => {
        const catId = el.dataset.cat;
        const ul = document.getElementById(`cat-${catId}`);
        ul.classList.toggle('collapsed');
        el.querySelector('.cat-arrow').textContent = ul.classList.contains('collapsed') ? '▸' : '▾';
      });
    });

    document.querySelectorAll('.subject-link').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = el.dataset.subject;
        const file = el.dataset.file;
        await navigateTo(id, file);
      });
    });

    document.querySelector('.home-link').addEventListener('click', (e) => {
      e.preventDefault();
      renderHome();
      setActiveNav(null);
    });
  }

  // ── 홈 화면 ──────────────────────────────────────────
  function renderHome() {
    const meta = state.metadata;
    const main = document.getElementById('main-content');
    state.currentSubject = null;
    state.currentChapter = null;

    // 카테고리별 과목 수
    const byCategory = {};
    meta.subjects.forEach(s => {
      if (!byCategory[s.category]) byCategory[s.category] = [];
      byCategory[s.category].push(s);
    });

    let catCards = meta.categories.map(cat => {
      const subjects = byCategory[cat.id] || [];
      return `
        <div class="home-cat-card" style="border-top-color:${cat.color}">
          <div class="home-cat-icon">${cat.icon}</div>
          <div class="home-cat-name">${cat.name}</div>
          <div class="home-cat-count">${subjects.length}개 과목</div>
          <ul class="home-cat-subjects">
            ${subjects.slice(0,4).map(s => `
              <li><a href="#subject/${s.id}" class="home-subj-link" data-subject="${s.id}" data-file="${s.dataFile}">${s.name}</a></li>
            `).join('')}
            ${subjects.length > 4 ? `<li class="more-link">+${subjects.length-4}개 더</li>` : ''}
          </ul>
        </div>
      `;
    }).join('');

    main.innerHTML = `
      <div class="home-wrap">
        <div class="home-hero">
          <div class="home-hero-badge">Engineering Knowledge Base</div>
          <h1 class="home-title">ENG<span class="dot">·</span>WIKI</h1>
          <p class="home-desc">${meta.description}</p>
          <div class="home-stats">
            <div class="stat-item"><span class="stat-num">${meta.totalSubjects}</span><span class="stat-label">과목</span></div>
            <div class="stat-item"><span class="stat-num">${meta.totalChapters}</span><span class="stat-label">챕터</span></div>
            <div class="stat-item"><span class="stat-num">800+</span><span class="stat-label">공식</span></div>
          </div>
        </div>

        <div class="home-search-wrap">
          <input type="text" class="home-search-input" id="home-search" placeholder="🔍  찾고 싶은 공식, 개념을 검색하세요…">
        </div>

        <h2 class="home-section-title">전체 과목</h2>
        <div class="home-cat-grid">
          ${catCards}
        </div>
      </div>
    `;

    // 홈 과목 링크 이벤트
    document.querySelectorAll('.home-subj-link').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        await navigateTo(el.dataset.subject, el.dataset.file);
      });
    });

    // 홈 검색
    document.getElementById('home-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch(e.target.value);
    });

    document.getElementById('home-search').addEventListener('input', (e) => {
      if (e.target.value.length > 1) performSearch(e.target.value);
    });
  }

  // ── 과목 페이지 ──────────────────────────────────────
  async function navigateTo(subjectId, dataFile) {
    showLoading(true);
    try {
      const data = await loadSubject(subjectId, 'data/' + dataFile);
      state.currentSubject = data;
      state.currentChapter = null;
      renderSubjectPage(data);
      setActiveNav(subjectId);
      window.location.hash = `#subject/${subjectId}`;
    } catch (e) {
      showError(`"${subjectId}" 데이터를 불러올 수 없습니다.<br><small>파일 경로: data/${dataFile}</small>`);
    } finally {
      showLoading(false);
    }
  }

  function renderSubjectPage(data) {
    const main = document.getElementById('main-content');

    const chapList = data.chapters.map((ch, i) => `
      <div class="chapter-card" data-chapter="${i}">
        <div class="chapter-num">Ch.${ch.number}</div>
        <div class="chapter-info">
          <div class="chapter-title">${ch.title}</div>
          <div class="chapter-meta">${ch.sections?.length || 0}개 섹션</div>
        </div>
        <button class="btn-open-chapter" data-chapter="${i}">열기 →</button>
      </div>
    `).join('');

    main.innerHTML = `
      <div class="subject-wrap">
        <div class="subject-header">
          <a class="back-btn" href="#" id="back-home">← 홈으로</a>
          <div class="subject-title-wrap">
            <h1 class="subject-title">${data.title}</h1>
            <p class="subject-subtitle">${data.subtitle || ''}</p>
          </div>
        </div>
        <div class="chapter-list" id="chapter-list">
          ${chapList}
        </div>
      </div>
    `;

    document.getElementById('back-home').addEventListener('click', (e) => {
      e.preventDefault(); renderHome(); setActiveNav(null);
    });

    document.querySelectorAll('.btn-open-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.chapter);
        renderChapterPage(data, idx);
      });
    });
  }

  // ── 챕터 페이지 ──────────────────────────────────────
  function renderChapterPage(data, chapterIdx) {
    const ch = data.chapters[chapterIdx];
    const main = document.getElementById('main-content');
    state.currentChapter = chapterIdx;

    // 이전/다음
    const hasPrev = chapterIdx > 0;
    const hasNext = chapterIdx < data.chapters.length - 1;

    let sectionsHtml = (ch.sections || []).map((sec, si) => {
      const contentHtml = (sec.content || []).map(block => Renderer.render(block)).join('');
      return `
        <section class="section-block" id="sec-${chapterIdx}-${si}">
          <h3 class="section-title">${sec.id} ${sec.title}</h3>
          ${contentHtml}
        </section>
      `;
    }).join('');

    // 사이드 TOC
    const toc = (ch.sections || []).map((sec, si) => `
      <li><a class="toc-link" href="#sec-${chapterIdx}-${si}">${sec.id} ${sec.title}</a></li>
    `).join('');

    main.innerHTML = `
      <div class="chapter-wrap">
        <div class="chapter-content">
          <div class="chapter-breadcrumb">
            <a href="#" class="back-btn" id="back-subject">← ${data.title}</a>
            <span class="breadcrumb-sep">›</span>
            <span>Ch.${ch.number} ${ch.title}</span>
          </div>

          <div class="chapter-header">
            <div class="chapter-header-num">Chapter ${ch.number}</div>
            <h1 class="chapter-header-title">${ch.title}</h1>
            ${ch.subtitle ? `<p class="chapter-header-sub">${ch.subtitle}</p>` : ''}
          </div>

          <div class="chapter-body">
            ${sectionsHtml}
          </div>

          <div class="chapter-nav">
            <button class="btn-chapter-nav prev" ${hasPrev ? '' : 'disabled'} id="btn-prev">
              ← Ch.${hasPrev ? data.chapters[chapterIdx-1].number : ''} ${hasPrev ? data.chapters[chapterIdx-1].title : '처음 챕터'}
            </button>
            <button class="btn-chapter-nav next" ${hasNext ? '' : 'disabled'} id="btn-next">
              Ch.${hasNext ? data.chapters[chapterIdx+1].number : ''} ${hasNext ? data.chapters[chapterIdx+1].title : '마지막 챕터'} →
            </button>
          </div>
        </div>

        <aside class="chapter-toc">
          <div class="toc-title">목차</div>
          <ul class="toc-list">${toc}</ul>
        </aside>
      </div>
    `;

    document.getElementById('back-subject').addEventListener('click', (e) => {
      e.preventDefault(); renderSubjectPage(data);
    });
    if (hasPrev) document.getElementById('btn-prev').addEventListener('click', () => renderChapterPage(data, chapterIdx-1));
    if (hasNext) document.getElementById('btn-next').addEventListener('click', () => renderChapterPage(data, chapterIdx+1));

    // MathJax 재렌더링
    if (window.MathJax) MathJax.typesetPromise([main]).catch(console.warn);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    markProgress(data.id, chapterIdx);
  }

  // ── 라우터 ───────────────────────────────────────────
  function setupRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  async function handleRoute() {
    const hash = window.location.hash;
    if (!hash || hash === '#') { renderHome(); return; }
    const [, type, id] = hash.split('/');
    if (type === 'subject' && id) {
      const subj = state.metadata.subjects.find(s => s.id === id);
      if (subj) await navigateTo(subj.id, subj.dataFile);
    }
  }

  // ── 검색 ────────────────────────────────────────────
  function setupSearch() {
    document.getElementById('sidebar-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      filterSidebarItems(q);
    });
  }

  function filterSidebarItems(q) {
    document.querySelectorAll('.subject-link').forEach(el => {
      const label = el.querySelector('.item-label').textContent.toLowerCase();
      el.closest('li').style.display = (q && !label.includes(q)) ? 'none' : '';
    });
  }

  function performSearch(query) {
    if (!query || query.trim().length < 2) return;
    // 추후 구현: 전체 텍스트 검색
    alert(`검색: "${query}"\n(전체 검색은 모든 과목 데이터 로드 후 사용 가능합니다)`);
  }

  // ── 사이드바 토글 ────────────────────────────────────
  function toggleSidebar() {
    const wrap = document.getElementById('app-wrap');
    state.sidebarOpen = !state.sidebarOpen;
    wrap.classList.toggle('sidebar-collapsed', !state.sidebarOpen);
  }

  // ── 진도 관리 ────────────────────────────────────────
  function markProgress(subjectId, chapterIdx) {
    if (!state.progress[subjectId]) state.progress[subjectId] = { done: [], total: 0 };
    if (!state.progress[subjectId].done.includes(chapterIdx)) {
      state.progress[subjectId].done.push(chapterIdx);
    }
    localStorage.setItem('engwiki-progress', JSON.stringify(state.progress));
  }

  function getProgress(subjectId) {
    const p = state.progress[subjectId];
    if (!p) return { done: 0, total: 0 };
    return { done: p.done?.length || 0, total: p.total || 0 };
  }

  function restoreScrollProgress() {
    // 스크롤 위치 복원 (추후)
  }

  // ── 네비게이션 활성화 ────────────────────────────────
  function setActiveNav(subjectId) {
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    if (subjectId) {
      const el = document.querySelector(`[data-subject="${subjectId}"]`);
      if (el) el.classList.add('active');
    } else {
      document.querySelector('.home-link')?.classList.add('active');
    }
  }

  // ── UI 헬퍼 ─────────────────────────────────────────
  function showLoading(on) {
    document.getElementById('loading-overlay').style.display = on ? 'flex' : 'none';
  }

  function showError(msg) {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="error-wrap">
        <div class="error-icon">⚠️</div>
        <div class="error-msg">${msg}</div>
        <button onclick="App.renderHome()" class="btn-primary">홈으로 돌아가기</button>
      </div>
    `;
  }

  // ── Public API ───────────────────────────────────────
  return { init, renderHome, navigateTo };

})();

// ── 시작 ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
