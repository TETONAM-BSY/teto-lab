// ═══════════════════════════════════════════════════════
// ENG·WIKI v4.0 — JSON → HTML Renderer
// 콘텐츠 블록 타입별 렌더링 엔진
// ═══════════════════════════════════════════════════════

const Renderer = (() => {

  // ── 메인 디스패처 ───────────────────────────────────
  function render(block) {
    switch (block.type) {
      case 'note-card':      return renderNoteCard(block);
      case 'formula':        return renderFormula(block);
      case 'formula-grid':   return renderFormulaGrid(block);
      case 'proof':          return renderProof(block);
      case 'table':          return renderTable(block);
      case 'analogy':        return renderAnalogy(block);
      case 'example':        return renderExample(block);
      case 'definition':     return renderDefinition(block);
      case 'theorem':        return renderTheorem(block);
      case 'warning':        return renderWarning(block);
      case 'tip':            return renderTip(block);
      case 'compare':        return renderCompare(block);
      case 'steps':          return renderSteps(block);
      case 'callout':        return renderCallout(block);
      case 'html':           return block.body || '';
      default:
        console.warn('Unknown block type:', block.type);
        return `<div class="unknown-block">[Unknown: ${block.type}]</div>`;
    }
  }

  // ── 노트 카드 ────────────────────────────────────────
  // { type, class, label, title, body }
  function renderNoteCard(b) {
    return `
      <div class="note-card ${b.class || ''}">
        ${b.label ? `<div class="note-label">${b.label}</div>` : ''}
        ${b.title ? `<div class="note-title">${b.title}</div>` : ''}
        <div class="note-body">${b.body || ''}</div>
      </div>
    `;
  }

  // ── 공식 박스 ────────────────────────────────────────
  // { type, name, latex, description, note }
  function renderFormula(b) {
    return `
      <div class="formula-box">
        ${b.name ? `<div class="formula-name">${b.name}</div>` : ''}
        <div class="formula-display">
          \\[${b.latex}\\]
        </div>
        ${b.description ? `<div class="formula-desc">${b.description}</div>` : ''}
        ${b.note ? `<div class="formula-note">💡 ${b.note}</div>` : ''}
      </div>
    `;
  }

  // ── 공식 그리드 ──────────────────────────────────────
  // { type, title, cols, items: [{ name, latex, desc }] }
  function renderFormulaGrid(b) {
    const cols = b.cols || 2;
    const items = (b.items || []).map(item => `
      <div class="formula-grid-item">
        ${item.name ? `<div class="fg-name">${item.name}</div>` : ''}
        <div class="fg-latex">\\[${item.latex}\\]</div>
        ${item.desc ? `<div class="fg-desc">${item.desc}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="formula-grid-wrap">
        ${b.title ? `<div class="formula-grid-title">${b.title}</div>` : ''}
        <div class="formula-grid cols-${cols}">${items}</div>
      </div>
    `;
  }

  // ── 증명 블록 ────────────────────────────────────────
  // { type, title, steps: [string | {step, latex}] }
  function renderProof(b) {
    const steps = (b.steps || []).map((s, i) => {
      if (typeof s === 'string') return `<div class="proof-step">${s}</div>`;
      return `
        <div class="proof-step">
          ${s.step ? `<span class="proof-label">Step ${i+1}.</span> ${s.step}` : ''}
          ${s.latex ? `<div class="proof-latex">\\[${s.latex}\\]</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="proof-block">
        <div class="proof-header">
          <span class="proof-icon">∴</span>
          ${b.title ? `<span class="proof-title">${b.title}</span>` : '증명'}
        </div>
        <div class="proof-body">${steps}</div>
        <div class="proof-qed">□</div>
      </div>
    `;
  }

  // ── 표 ──────────────────────────────────────────────
  // { type, title, headers: [], rows: [[...]] }
  function renderTable(b) {
    const headers = (b.headers || []).map(h => `<th>${h}</th>`).join('');
    const rows = (b.rows || []).map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
      <div class="table-wrap">
        ${b.title ? `<div class="table-title">${b.title}</div>` : ''}
        <div class="table-scroll">
          <table class="wiki-table">
            ${headers ? `<thead><tr>${headers}</tr></thead>` : ''}
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── 비유·직관 ────────────────────────────────────────
  // { type, emoji, title, body }
  function renderAnalogy(b) {
    return `
      <div class="analogy-block">
        <div class="analogy-icon">${b.emoji || '💡'}</div>
        <div class="analogy-content">
          ${b.title ? `<div class="analogy-title">${b.title}</div>` : ''}
          <div class="analogy-body">${b.body || ''}</div>
        </div>
      </div>
    `;
  }

  // ── 예제 ─────────────────────────────────────────────
  // { type, title, problem, solution, answer }
  function renderExample(b) {
    return `
      <div class="example-block">
        <div class="example-header">예제${b.title ? ': ' + b.title : ''}</div>
        ${b.problem ? `<div class="example-problem"><strong>문제.</strong> ${b.problem}</div>` : ''}
        ${b.solution ? `
          <details class="example-solution">
            <summary>풀이 보기</summary>
            <div class="solution-body">${b.solution}</div>
          </details>
        ` : ''}
        ${b.answer ? `<div class="example-answer">∴ <strong>${b.answer}</strong></div>` : ''}
      </div>
    `;
  }

  // ── 정의 ─────────────────────────────────────────────
  // { type, term, latex, body }
  function renderDefinition(b) {
    return `
      <div class="definition-block">
        <div class="def-label">Definition</div>
        ${b.term ? `<div class="def-term">${b.term}</div>` : ''}
        ${b.latex ? `<div class="def-latex">\\[${b.latex}\\]</div>` : ''}
        ${b.body ? `<div class="def-body">${b.body}</div>` : ''}
      </div>
    `;
  }

  // ── 정리 ─────────────────────────────────────────────
  // { type, name, statement, latex, proof }
  function renderTheorem(b) {
    return `
      <div class="theorem-block">
        <div class="theorem-label">Theorem${b.name ? ': ' + b.name : ''}</div>
        ${b.statement ? `<div class="theorem-statement">${b.statement}</div>` : ''}
        ${b.latex ? `<div class="theorem-latex">\\[${b.latex}\\]</div>` : ''}
        ${b.proof ? `
          <details class="theorem-proof">
            <summary>증명 보기</summary>
            <div class="proof-content">${b.proof}</div>
          </details>
        ` : ''}
      </div>
    `;
  }

  // ── 경고 ─────────────────────────────────────────────
  function renderWarning(b) {
    return `
      <div class="warning-block">
        <span class="warning-icon">⚠️</span>
        <div class="warning-content">
          ${b.title ? `<div class="warning-title">${b.title}</div>` : ''}
          <div class="warning-body">${b.body || ''}</div>
        </div>
      </div>
    `;
  }

  // ── 팁 ──────────────────────────────────────────────
  function renderTip(b) {
    return `
      <div class="tip-block">
        <span class="tip-icon">💡</span>
        <div class="tip-content">
          ${b.title ? `<div class="tip-title">${b.title}</div>` : ''}
          <div class="tip-body">${b.body || ''}</div>
        </div>
      </div>
    `;
  }

  // ── 비교 표 ──────────────────────────────────────────
  // { type, title, left: {label, items:[]}, right: {label, items:[]} }
  function renderCompare(b) {
    const leftItems = (b.left?.items || []).map(i => `<li>${i}</li>`).join('');
    const rightItems = (b.right?.items || []).map(i => `<li>${i}</li>`).join('');

    return `
      <div class="compare-block">
        ${b.title ? `<div class="compare-title">${b.title}</div>` : ''}
        <div class="compare-grid">
          <div class="compare-col">
            <div class="compare-label">${b.left?.label || 'A'}</div>
            <ul class="compare-list">${leftItems}</ul>
          </div>
          <div class="compare-divider">vs</div>
          <div class="compare-col">
            <div class="compare-label">${b.right?.label || 'B'}</div>
            <ul class="compare-list">${rightItems}</ul>
          </div>
        </div>
      </div>
    `;
  }

  // ── 단계별 절차 ──────────────────────────────────────
  // { type, title, steps: [{ num?, label, body }] }
  function renderSteps(b) {
    const steps = (b.steps || []).map((s, i) => `
      <div class="step-item">
        <div class="step-num">${s.num || (i+1)}</div>
        <div class="step-content">
          ${s.label ? `<div class="step-label">${s.label}</div>` : ''}
          <div class="step-body">${s.body || ''}</div>
          ${s.latex ? `<div>\\[${s.latex}\\]</div>` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="steps-block">
        ${b.title ? `<div class="steps-title">${b.title}</div>` : ''}
        <div class="steps-list">${steps}</div>
      </div>
    `;
  }

  // ── 콜아웃 ───────────────────────────────────────────
  function renderCallout(b) {
    const types = { info: '📌', success: '✅', danger: '🚨', formula: '📐' };
    const icon = types[b.variant] || '📌';
    return `
      <div class="callout-block callout-${b.variant || 'info'}">
        <span class="callout-icon">${icon}</span>
        <div class="callout-content">
          ${b.title ? `<div class="callout-title">${b.title}</div>` : ''}
          <div class="callout-body">${b.body || ''}</div>
        </div>
      </div>
    `;
  }

  return { render };
})();
