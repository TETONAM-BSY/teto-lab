// ═══════════════════════════════════════════════════════
// ENG·WIKI — 공통 JavaScript
// 전기전자통신 기초공학 학습 노트
// ═══════════════════════════════════════════════════════

// MathJax 재렌더링
function rerenderMath(element) {
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([element || document.body]).catch((err) => {
      console.warn('MathJax rendering error:', err);
    });
  }
}

// 페이지 로드 시 MathJax 초기화
document.addEventListener('DOMContentLoaded', () => {
  rerenderMath();
});

// 섹션 표시/숨김
function showSection(sectionId) {
  // 모든 섹션 숨김
  document.querySelectorAll('[id^="section-"]').forEach(section => {
    section.style.display = 'none';
  });
  
  // 선택된 섹션만 표시
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (targetSection) {
    targetSection.style.display = 'block';
    rerenderMath(targetSection);
    
    // 사이드바 활성화 상태 업데이트
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    // 페이지 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 사이드바 아이템 클릭 핸들러
function initSidebar() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('data-section');
      if (sectionId) {
        showSection(sectionId);
      }
    });
  });
}

// 검색 기능
function handleSearch(query) {
  if (!query || query.trim().length < 2) return;
  
  const searchTerm = query.toLowerCase().trim();
  const sections = document.querySelectorAll('[id^="section-"]');
  
  let found = false;
  
  // 섹션 내용 검색
  sections.forEach(section => {
    const content = section.textContent.toLowerCase();
    if (content.includes(searchTerm)) {
      const sectionId = section.id.replace('section-', '');
      showSection(sectionId);
      found = true;
      
      // 검색어 하이라이트 (옵션)
      highlightSearchTerm(section, searchTerm);
    }
  });
  
  if (!found) {
    alert(`"${query}"에 대한 결과를 찾을 수 없습니다.`);
  }
}

// 검색어 하이라이트
function highlightSearchTerm(element, term) {
  // 기존 하이라이트 제거
  const highlights = element.querySelectorAll('.search-highlight');
  highlights.forEach(h => {
    const parent = h.parentNode;
    parent.replaceChild(document.createTextNode(h.textContent), h);
    parent.normalize();
  });
  
  // 새 하이라이트 추가 (간단한 구현)
  // 실제로는 더 정교한 텍스트 노드 순회가 필요
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const nodesToReplace = [];
  let node;
  
  while (node = walker.nextNode()) {
    const text = node.textContent.toLowerCase();
    if (text.includes(term)) {
      nodesToReplace.push(node);
    }
  }
  
  nodesToReplace.forEach(node => {
    const regex = new RegExp(`(${term})`, 'gi');
    const html = node.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
    const span = document.createElement('span');
    span.innerHTML = html;
    node.parentNode.replaceChild(span, node);
  });
}

// 프린트 모드
function printPage() {
  window.print();
}

// 다크모드 토글 (선택사항)
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
}

// 다크모드 초기화
function initDarkMode() {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    document.body.classList.add('dark-mode');
  }
}

// 스크롤 진행 표시
function updateScrollProgress() {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    progressBar.style.width = scrolled + '%';
  }
}

// 목차 자동 생성
function generateTOC() {
  const tocContainer = document.getElementById('table-of-contents');
  if (!tocContainer) return;
  
  const headers = document.querySelectorAll('h2, h3');
  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';
  
  headers.forEach((header, index) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    
    // ID가 없으면 생성
    if (!header.id) {
      header.id = `heading-${index}`;
    }
    
    link.href = `#${header.id}`;
    link.textContent = header.textContent;
    link.className = header.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
    
    li.appendChild(link);
    tocList.appendChild(li);
  });
  
  tocContainer.appendChild(tocList);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initDarkMode();
  generateTOC();
  
  // 스크롤 진행 표시 (있을 경우)
  window.addEventListener('scroll', updateScrollProgress);
  
  // 검색 인풋 핸들러
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearch(e.target.value);
      }
    });
  }
});

// 유틸리티: 스무스 스크롤
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 유틸리티: 클립보드 복사
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('클립보드에 복사되었습니다');
  }).catch(err => {
    console.error('복사 실패:', err);
  });
}

// 알림 표시
function showNotification(message, duration = 2000) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: var(--ink);
    color: var(--bg);
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 0.85rem;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// 애니메이션 키프레임 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .search-highlight {
    background: #ffeb3b;
    padding: 2px 4px;
    border-radius: 2px;
  }
`;
document.head.appendChild(style);
