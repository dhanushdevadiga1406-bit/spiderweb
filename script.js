const viewport = document.querySelector('#viewport');
const tabsElement = document.querySelector('#tabs');
const addressInput = document.querySelector('#addressInput');
const addressForm = document.querySelector('#addressForm');
const backButton = document.querySelector('#backButton');
const forwardButton = document.querySelector('#forwardButton');
const reloadButton = document.querySelector('#reloadButton');
const newTabButton = document.querySelector('#newTab');
const bookmarkButton = document.querySelector('#bookmarkButton');
const clock = document.querySelector('#clock');

let tabs = [{ id: 1, title: 'New tab', query: '' }];
let activeTabId = 1;
let historyStack = [];
let historyIndex = -1;

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId);
}

function renderTabs() {
  tabsElement.innerHTML = tabs.map((tab) => `
    <button class="tab ${tab.id === activeTabId ? 'active' : ''}" data-tab-id="${tab.id}" role="tab" aria-selected="${tab.id === activeTabId}">
      <span class="tab-dot"></span><span class="tab-title">${escapeText(tab.title)}</span><span class="tab-close" data-close-id="${tab.id}" aria-label="Close tab">×</span>
    </button>`).join('');
  tabsElement.querySelectorAll('.tab').forEach((tabButton) => {
    tabButton.addEventListener('click', (event) => {
      const closeId = event.target.dataset.closeId;
      if (closeId) {
        closeTab(Number(closeId));
        return;
      }
      activeTabId = Number(tabButton.dataset.tabId);
      syncView();
    });
  });
}

async function renderCurrent(query, addHistory = true) {
  const tab = activeTab();
  const value = query.trim();
  tab.query = value;
  tab.title = value ? value.replace(/^https?:\/\//, '').slice(0, 22) : 'New tab';
  addressInput.value = value || 'spiderweb://start';
  if (addHistory) {
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(value);
    historyIndex += 1;
  }
  if (value) {
    SpiderwebRenderer.renderLoading(viewport, value);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed.');
      SpiderwebRenderer.renderResult(viewport, value, data.results);
    } catch (error) {
      SpiderwebRenderer.renderError(viewport, error.message);
    }
  } else {
    SpiderwebRenderer.renderHome(viewport, renderCurrent);
  }
  renderTabs();
  updateNavigationState();
}

function syncView() {
  renderCurrent(activeTab().query, false);
}

function createTab() {
  const id = Date.now();
  tabs.push({ id, title: 'New tab', query: '' });
  activeTabId = id;
  renderCurrent('', true);
  addressInput.focus();
  addressInput.select();
}

function closeTab(id) {
  if (tabs.length === 1) return;
  const index = tabs.findIndex((tab) => tab.id === id);
  tabs = tabs.filter((tab) => tab.id !== id);
  if (id === activeTabId) activeTabId = tabs[Math.max(0, index - 1)].id;
  syncView();
}

function updateNavigationState() {
  backButton.classList.toggle('muted', historyIndex <= 0);
  forwardButton.classList.toggle('muted', historyIndex >= historyStack.length - 1);
}

function escapeText(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

addressForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderCurrent(addressInput.value.replace(/^spiderweb:\/\/start$/, ''));
});
newTabButton.addEventListener('click', createTab);
reloadButton.addEventListener('click', () => {
  viewport.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
  syncView();
});
backButton.addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex -= 1;
    renderCurrent(historyStack[historyIndex], false);
  }
});
forwardButton.addEventListener('click', () => {
  if (historyIndex < historyStack.length - 1) {
    historyIndex += 1;
    renderCurrent(historyStack[historyIndex], false);
  }
});
bookmarkButton.addEventListener('click', () => {
  bookmarkButton.textContent = bookmarkButton.textContent === '☆' ? '★' : '☆';
  bookmarkButton.style.color = bookmarkButton.textContent === '★' ? 'var(--orange)' : '';
});
document.querySelector('#menuButton').addEventListener('click', () => {
  document.querySelector('#menuButton').textContent = document.querySelector('#menuButton').textContent === '•••' ? '×' : '•••';
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    addressInput.focus();
    addressInput.select();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
    event.preventDefault();
    createTab();
  }
});

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

renderCurrent('');
updateClock();
setInterval(updateClock, 30000);
