(function () {
  'use strict';

  if (window.__yuqueExportUI) {
    return;
  }
  window.__yuqueExportUI = true;

  let selectedBooks = [];
  let books = [];

  const iconUrl = chrome.runtime.getURL('icons/icon128.png');

  const style = document.createElement('style');
  style.textContent = `
    #yuque-export-panel {
      position: fixed;
      top: 120px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #374151;
      overflow: hidden;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  border-radius 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #yuque-export-panel.collapsed {
      width: 40px;
      max-height: 40px;
      border-radius: 20px;
      cursor: pointer;
    }

    #yuque-export-panel.collapsed:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    #yuque-export-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #f3f4f6;
      cursor: move;
      user-select: none;
    }

    #yuque-export-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #yuque-export-header-title img {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      border-radius: 4px;
    }

    #yuque-export-header h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    #yuque-export-header-actions {
      display: flex;
      flex-shrink: 0;
    }

    #yuque-export-header button {
      background: none;
      border: none;
      color: #9ca3af;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    #yuque-export-header button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    #yuque-export-body {
      padding: 14px;
      max-height: calc(80vh - 41px);
      overflow-y: auto;
    }

    #yuque-export-panel .ye-label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 6px;
      font-weight: 500;
    }

    #yuque-export-panel .ye-btn {
      width: 100%;
      padding: 8px 16px;
      background: #111827;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
      font-weight: 500;
    }

    #yuque-export-panel .ye-btn:hover {
      background: #1f2937;
    }

    #yuque-export-panel .ye-btn:active {
      background: #374151;
    }

    #yuque-export-panel .ye-btn:disabled {
      background: #f3f4f6;
      color: #d1d5db;
      cursor: not-allowed;
    }

    #yuque-export-panel .ye-btn:disabled:hover {
      background: #f3f4f6;
    }

    #yuque-export-panel .ye-btn-secondary {
      background: #fff;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    #yuque-export-panel .ye-btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    #yuque-export-panel .ye-section {
      margin-bottom: 14px;
    }

    #yuque-export-panel .ye-book-list {
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 8px;
    }

    #yuque-export-panel .ye-book-item {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.1s;
    }

    #yuque-export-panel .ye-book-item:hover {
      background: #f9fafb;
    }

    #yuque-export-panel .ye-book-item:last-child {
      border-bottom: none;
    }

    #yuque-export-panel .ye-book-checkbox {
      flex-shrink: 0;
      margin: 0;
    }

    #yuque-export-panel .ye-book-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #yuque-export-panel .ye-book-count {
      font-size: 11px;
      color: #9ca3af;
      flex-shrink: 0;
    }

    #yuque-export-panel .ye-select-all {
      font-size: 12px;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
    }

    #yuque-export-panel .ye-hint {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 6px;
    }

    #yuque-export-panel .ye-options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    #yuque-export-panel .ye-option {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6b7280;
      cursor: pointer;
    }

    #yuque-export-panel .ye-option input {
      margin: 0;
      accent-color: #111827;
    }

    #yuque-export-panel .ye-progress {
      margin-top: 12px;
      display: none;
    }

    #yuque-export-panel .ye-progress.active {
      display: block;
    }

    #yuque-export-panel .ye-progress-track {
      height: 3px;
      background: #f3f4f6;
      border-radius: 2px;
      overflow: hidden;
    }

    #yuque-export-panel .ye-progress-fill {
      height: 100%;
      background: #111827;
      width: 0%;
      transition: width 0.3s;
      border-radius: 2px;
    }

    #yuque-export-panel .ye-progress-text {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 6px;
      text-align: center;
    }

    #yuque-export-panel .ye-status {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      display: none;
    }

    #yuque-export-panel .ye-status.success {
      background: #f0fdf4;
      color: #15803d;
    }

    #yuque-export-panel .ye-status.error {
      background: #fef2f2;
      color: #dc2626;
    }

    #yuque-export-panel .ye-status.info {
      background: #f9fafb;
      color: #6b7280;
    }

    #yuque-export-icon {
      width: 40px;
      height: 40px;
      display: none;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 20px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    #yuque-export-icon img {
      width: 42px;
      height: 42px;
      border-radius: 4px;
    }

    #yuque-export-panel.collapsed #yuque-export-body,
    #yuque-export-panel.collapsed #yuque-export-header {
      display: none;
    }

    #yuque-export-panel.collapsed #yuque-export-icon {
      display: flex;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'yuque-export-panel';
  panel.innerHTML = `
    <div id="yuque-export-icon"><img src="${iconUrl}" alt="logo"></div>
    <div id="yuque-export-header">
      <div id="yuque-export-header-title">
        <img src="${iconUrl}" alt="logo">
        <h3>语雀批量导出插件</h3>
      </div>
      <div id="yuque-export-header-actions">
        <button id="ye-collapse-btn" title="折叠">&#8722;</button>
      </div>
    </div>
    <div id="yuque-export-body">
      <div class="ye-section">
        <label class="ye-label">选择知识库</label>
        <button id="ye-refresh-btn" class="ye-btn ye-btn-secondary" style="margin-bottom: 8px;">&#128260; 加载知识库</button>
        <label class="ye-select-all" style="display: none;">
          <input type="checkbox" id="ye-select-all"> 全选
        </label>
        <div id="ye-book-list" class="ye-book-list">
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">点击上方按钮加载知识库</div>
        </div>
        <div id="ye-selected-hint" class="ye-hint">未选择知识库</div>
      </div>

      <div class="ye-section">
        <label class="ye-label">导出格式</label>
        <div class="ye-options">
          <label class="ye-option">
            <input type="radio" name="ye-format" value="markdown" checked> Markdown
          </label>
          <label class="ye-option" title="导出为语雀 Lake 文档格式">
            <input type="radio" name="ye-format" value="lake"> Lake
          </label>
          <label class="ye-option" title="导出为 PDF 文件">
            <input type="radio" name="ye-format" value="pdf"> PDF
          </label>
          <label class="ye-option" title="导出为 Word 文件">
            <input type="radio" name="ye-format" value="word"> Word
          </label>
          <label class="ye-option" title="导出为 JPG 图片">
            <input type="radio" name="ye-format" value="jpg"> JPG
          </label>
        </div>
      </div>

      <div class="ye-section" id="ye-pdf-options" style="display: none;">
        <label class="ye-label">PDF 选项</label>
        <div class="ye-options">
          <label class="ye-option" title="在 PDF 中导出文档大纲">
            <input type="checkbox" id="ye-opt-toc" checked> 导出大纲
          </label>
        </div>
      </div>

      <div class="ye-section" id="ye-md-options">
        <label class="ye-label">导出选项</label>
        <div class="ye-options">
          <label class="ye-option" title="导出 LaTeX 公式为 Markdown 语法">
            <input type="checkbox" id="ye-opt-latexcode"> LaTeX
          </label>
          <label class="ye-option" title="导出保持语雀的锚点">
            <input type="checkbox" id="ye-opt-anchor"> 锚点
          </label>
          <label class="ye-option" title="导出保持语雀的换行">
            <input type="checkbox" id="ye-opt-linebreak"> 换行
          </label>
          <label class="ye-option" title="导出带PlantUML等额外卡片内容">
            <input type="checkbox" id="ye-opt-usemdai" checked> MDAI
          </label>
        </div>
      </div>

      <button id="ye-export-btn" class="ye-btn" disabled>&#128229; 批量导出</button>

      <div id="ye-progress" class="ye-progress">
        <div class="ye-progress-track">
          <div id="ye-progress-fill" class="ye-progress-fill"></div>
        </div>
        <div id="ye-progress-text" class="ye-progress-text">准备中...</div>
      </div>

      <div id="ye-status" class="ye-status"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const collapseBtn = document.getElementById('ye-collapse-btn');
  const refreshBtn = document.getElementById('ye-refresh-btn');
  const bookListEl = document.getElementById('ye-book-list');
  const selectAllEl = document.querySelector('.ye-select-all');
  const selectAllCheckbox = document.getElementById('ye-select-all');
  const selectedHint = document.getElementById('ye-selected-hint');
  const exportBtn = document.getElementById('ye-export-btn');
  const progressBar = document.getElementById('ye-progress');
  const progressFill = document.getElementById('ye-progress-fill');
  const progressText = document.getElementById('ye-progress-text');
  const statusEl = document.getElementById('ye-status');
  const mdOptions = document.getElementById('ye-md-options');
  const pdfOptions = document.getElementById('ye-pdf-options');
  const panelIcon = document.getElementById('yuque-export-icon');

  document.querySelectorAll('input[name="ye-format"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const format = document.querySelector('input[name="ye-format"]:checked').value;
      mdOptions.style.display = format === 'markdown' ? '' : 'none';
      pdfOptions.style.display = format === 'pdf' ? '' : 'none';
    });
  });

  let isDragging = false;
  let hasDragged = false;
  let dragOffset = { x: 0, y: 0 };

  function adjustExpandDirection() {
    const rect = panel.getBoundingClientRect();
    const expandedWidth = 320;
    const gap = rect.width;
    const needed = expandedWidth - gap;
    if (rect.right + needed > window.innerWidth) {
      panel.style.left = 'auto';
      panel.style.right = Math.max(20, window.innerWidth - rect.right) + 'px';
    } else {
      panel.style.right = 'auto';
      panel.style.left = rect.left + 'px';
    }
  }

  collapseBtn.addEventListener('click', () => {
    const willExpand = panel.classList.contains('collapsed');
    if (willExpand) adjustExpandDirection();
    panel.classList.toggle('collapsed');
  });

  panelIcon.addEventListener('click', () => {
    if (hasDragged) return;
    adjustExpandDirection();
    panel.classList.remove('collapsed');
  });

  function startDrag(e) {
    isDragging = true;
    hasDragged = false;
    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  }

  document.getElementById('yuque-export-header').addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    startDrag(e);
  });

  panelIcon.addEventListener('mousedown', (e) => {
    startDrag(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    hasDragged = true;
    panel.style.left = (e.clientX - dragOffset.x) + 'px';
    panel.style.top = (e.clientY - dragOffset.y) + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  function showStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `ye-status ${type}`;
    statusEl.style.display = 'block';
  }

  function hideStatus() {
    statusEl.style.display = 'none';
  }

  async function getCookies() {
    return document.cookie;
  }

  async function getBookStacks() {
    const cookieHeader = await getCookies();

    if (!cookieHeader) {
      throw new Error('Cookie 为空，请确保已登录语雀');
    }

    const response = await fetch('https://www.yuque.com/api/mine/book_stacks', {
      headers: {
        'accept': 'application/json',
        'cookie': cookieHeader,
      },
    });

    if (!response.ok) {
      if (response.statusText === "Unauthorized") {
        throw new Error(`未登录语雀`);
      }
      else {
        throw new Error(`获取知识库列表失败(${response.statusText})`);
      }

    }

    const data = await response.json();
    const result = [];
    for (const stack of data.data || []) {
      result.push(...(stack.books || []));
    }

    return result;
  }

  function renderBookList(books) {
    if (!books || books.length === 0) {
      bookListEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">暂无知识库</div>';
      selectAllEl.style.display = 'none';
      return;
    }

    selectAllEl.style.display = 'flex';
    selectAllCheckbox.checked = false;

    bookListEl.innerHTML = books.map(book => `
      <label class="ye-book-item" data-book-id="${book.id}" data-book-slug="${book.slug}">
        <input type="checkbox" class="ye-book-checkbox" data-book-id="${book.id}">
        <span class="ye-book-name">${book.name}</span>
        <span class="ye-book-count">${book.items_count} 篇</span>
      </label>
    `).join('');

    bookListEl.querySelectorAll('.ye-book-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const checkbox = item.querySelector('.ye-book-checkbox');
        checkbox.checked = !checkbox.checked;
        updateSelectedBooks();
      });
    });

    bookListEl.querySelectorAll('.ye-book-checkbox').forEach(cb => {
      cb.addEventListener('change', updateSelectedBooks);
    });
  }

  selectAllCheckbox.addEventListener('change', () => {
    bookListEl.querySelectorAll('.ye-book-checkbox').forEach(cb => {
      cb.checked = selectAllCheckbox.checked;
    });
    updateSelectedBooks();
  });

  function updateSelectedBooks() {
    const allCheckboxes = bookListEl.querySelectorAll('.ye-book-checkbox');
    const checkedCheckboxes = bookListEl.querySelectorAll('.ye-book-checkbox:checked');

    selectAllCheckbox.checked = allCheckboxes.length > 0 && checkedCheckboxes.length === allCheckboxes.length;

    const checkedIds = [];
    checkedCheckboxes.forEach(cb => {
      checkedIds.push(parseInt(cb.dataset.bookId));
    });
    selectedBooks = books.filter(b => checkedIds.includes(b.id));

    if (selectedBooks.length === 0) {
      selectedHint.textContent = '未选择知识库';
      selectedHint.style.color = '#9ca3af';
      exportBtn.disabled = true;
    } else {
      const totalDocs = selectedBooks.reduce((sum, b) => sum + b.items_count, 0);
      selectedHint.textContent = `已选择 ${selectedBooks.length} 个知识库 (${totalDocs} 篇)`;
      selectedHint.style.color = '#374151';
      exportBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener('click', async () => {
    try {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '加载中...';

      books = await getBookStacks();
      renderBookList(books);

      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '&#128260; 加载知识库';
    } catch (error) {
      bookListEl.innerHTML = `<div style="padding: 20px; text-align: center; color: #dc2626; font-size: 12px;">加载失败: ${error.message}</div>`;
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '&#128260; 加载知识库';
    }
  });

  exportBtn.addEventListener('click', async () => {
    if (selectedBooks.length === 0) {
      showStatus('请先选择知识库', 'error');
      return;
    }

    const format = document.querySelector('input[name="ye-format"]:checked').value;
    const options = {
      format: format,
      attachment: true,
      latexcode: format === 'lake' ? false : document.getElementById('ye-opt-latexcode').checked,
      anchor: format === 'lake' ? false : document.getElementById('ye-opt-anchor').checked,
      linebreak: format === 'lake' ? false : document.getElementById('ye-opt-linebreak').checked,
      useMdai: format === 'lake' ? false : document.getElementById('ye-opt-usemdai').checked,
      toc: format === 'pdf' ? document.getElementById('ye-opt-toc').checked : false,
    };

    exportBtn.disabled = true;
    refreshBtn.disabled = true;
    progressBar.classList.add('active');
    progressText.textContent = '正在启动下载任务...';

    chrome.runtime.sendMessage({
      action: 'batchExport',
      books: selectedBooks,
      options: options
    }, (response) => {
      exportBtn.disabled = false;
      refreshBtn.disabled = false;

      if (chrome.runtime.lastError) {
        showStatus(`错误: ${chrome.runtime.lastError.message}`, 'error');
        progressBar.classList.remove('active');
        return;
      }

      if (response && response.success) {
        showStatus(`批量导出完成！已下载 ${response.count} 个文件`, 'success');
      } else {
        showStatus(`批量导出失败: ${response?.error || '未知错误'}`, 'error');
      }

      setTimeout(() => {
        progressBar.classList.remove('active');
        progressFill.style.width = '0%';
      }, 3000);
    });

    showStatus('下载任务已启动', 'info');
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'batchProgress') {
      const { bookName, current, total, bookIndex, bookTotal, filename, done, bookDone, successCount, error } = message;

      if (done) {
        exportBtn.disabled = false;
        refreshBtn.disabled = false;

        if (error) {
          showStatus(`下载失败: ${error}`, 'error');
        } else if (successCount !== undefined) {
          showStatus(`批量导出完成！已下载 ${successCount} 个文件`, 'success');
        }

        setTimeout(() => {
          progressBar.classList.remove('active');
          progressFill.style.width = '0%';
        }, 3000);
      } else {
        const percent = (current / total) * 100;
        progressFill.style.width = `${percent}%`;
        const prefix = bookTotal > 1 ? `[${bookIndex}/${bookTotal} ${bookName}] ` : '';
        progressText.textContent = `${prefix}${current}/${total} - ${filename || '处理中...'}`;
      }
    }
  });
})();
