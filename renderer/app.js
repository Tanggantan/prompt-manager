const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const listEl = $('#template-list');
const emptyEl = $('#empty-state');
const modalOverlay = $('#modal-overlay');
const modalTitle = $('#modal-title');
const form = $('#template-form');
const formTitle = $('#form-title');
const formContent = $('#form-content');
const formTags = $('#form-tags');
const tagsFilter = $('#tags-filter');
const searchInput = $('#search-input');
const toast = $('#toast');

let templates = [];
let editingId = null;
let activeTag = null;

async function loadTemplates() {
  templates = await window.api.getTemplates();
  render();
}

function getAllTags() {
  const set = new Set();
  templates.forEach(t => t.tags.forEach(tag => set.add(tag)));
  return [...set].sort();
}

function getFiltered() {
  const keyword = searchInput.value.trim().toLowerCase();
  return templates.filter(t => {
    if (activeTag && !t.tags.includes(activeTag)) return false;
    if (keyword) {
      return t.title.toLowerCase().includes(keyword)
        || t.content.toLowerCase().includes(keyword);
    }
    return true;
  });
}

function renderTags() {
  const tags = getAllTags();
  tagsFilter.innerHTML = tags.map(tag =>
    `<span class="tag-chip${activeTag === tag ? ' active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
  ).join('');
}

function renderList() {
  const filtered = getFiltered();

  if (filtered.length === 0 && templates.length === 0) {
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.style.display = 'flex';

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>没有匹配的模板</p></div>';
    return;
  }

  listEl.innerHTML = filtered.map(t => `
    <div class="template-card" data-id="${t.id}">
      <div class="card-header">
        <span class="card-title">${escapeHtml(t.title)}</span>
        <div class="card-actions">
          <button class="btn-icon" data-action="edit" data-id="${t.id}" title="编辑">&#9998;</button>
          <button class="btn-icon danger" data-action="delete" data-id="${t.id}" title="删除">&#10005;</button>
        </div>
      </div>
      <div class="card-content">${escapeHtml(t.content)}</div>
      ${t.tags.length ? `<div class="card-tags">${t.tags.map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}

function render() {
  renderTags();
  renderList();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

function openModal(template) {
  if (template) {
    editingId = template.id;
    modalTitle.textContent = '编辑模板';
    formTitle.value = template.title;
    formContent.value = template.content;
    formTags.value = template.tags.join(', ');
  } else {
    editingId = null;
    modalTitle.textContent = '新增模板';
    form.reset();
  }
  modalOverlay.style.display = 'flex';
  formTitle.focus();
}

function closeModal() {
  modalOverlay.style.display = 'none';
  form.reset();
  editingId = null;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function parseTags(str) {
  return str.split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean);
}

// 新增按钮
$('#btn-add').addEventListener('click', () => openModal(null));

// 取消按钮
$('#btn-cancel').addEventListener('click', closeModal);

// 点击遮罩关闭
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ESC 关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// 表单提交
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const template = {
    id: editingId || generateId(),
    title: formTitle.value.trim(),
    content: formContent.value.trim(),
    tags: parseTags(formTags.value),
    updatedAt: new Date().toISOString(),
  };
  if (!template.title || !template.content) return;
  templates = await window.api.saveTemplate(template);
  closeModal();
  render();
  showToast(editingId ? '模板已更新' : '模板已创建');
});

// 列表点击事件代理
listEl.addEventListener('click', async (e) => {
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    e.stopPropagation();
    const id = actionBtn.dataset.id;
    const action = actionBtn.dataset.action;

    if (action === 'edit') {
      const t = templates.find(t => t.id === id);
      if (t) openModal(t);
    } else if (action === 'delete') {
      if (confirm('确定要删除这个模板吗？')) {
        templates = await window.api.deleteTemplate(id);
        if (activeTag && !getAllTags().includes(activeTag)) activeTag = null;
        render();
        showToast('模板已删除');
      }
    }
    return;
  }

  const card = e.target.closest('.template-card');
  if (card) {
    const id = card.dataset.id;
    const t = templates.find(t => t.id === id);
    if (t) {
      await window.api.copyToClipboard(t.content);
      showToast('已复制到剪贴板');
    }
  }
});

// 标签筛选
tagsFilter.addEventListener('click', (e) => {
  const chip = e.target.closest('.tag-chip');
  if (!chip) return;
  const tag = chip.dataset.tag;
  activeTag = activeTag === tag ? null : tag;
  render();
});

// 搜索
searchInput.addEventListener('input', () => renderList());

// 启动
loadTemplates();
