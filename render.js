const quickLinks = [
  { icon: '⌁', name: 'Are.na', url: 'are.na', query: 'are.na' },
  { icon: '◒', name: 'The Verge', url: 'theverge.com', query: 'theverge.com' },
  { icon: '◈', name: 'Figma', url: 'figma.com', query: 'figma.com' },
  { icon: '✳', name: 'GitHub', url: 'github.com', query: 'github.com' }
];

function renderHome(viewport, onSearch) {
  viewport.innerHTML = `
    <div class="homepage">
      <div class="home-grid">
        <section>
          <div class="kicker">A calmer way to browse</div>
          <h1>Find your way<br>through the <em>web.</em></h1>
          <p class="intro">Spiderweb is a focused browser for the curious. Keep your threads close, your attention yours, and the noise outside.</p>
          <form class="search-card" id="homeSearch">
            <input id="homeSearchInput" aria-label="Search the web" placeholder="Search the web or enter an address" autocomplete="off">
            <button type="submit">Explore</button>
          </form>
        </section>
        <aside class="network-card">
          <div class="network-label">Your network</div>
          <div class="network-number">04<span style="font-size: 18px; color: var(--muted)"> / 12</span></div>
          <div class="network-caption">active threads today</div>
        </aside>
      </div>
      <section class="quick-links">
        <div class="quick-head"><span>Jump back in</span><span>Local shortcuts</span></div>
        <div class="quick-grid">
          ${quickLinks.map((link) => `<button class="quick-link" data-query="${link.query}"><span class="quick-icon">${link.icon}</span><span class="quick-name">${link.name}</span><span class="quick-url">${link.url}</span></button>`).join('')}
        </div>
      </section>
    </div>`;

  viewport.querySelector('#homeSearch').addEventListener('submit', (event) => {
    event.preventDefault();
    onSearch(viewport.querySelector('#homeSearchInput').value);
  });
  viewport.querySelectorAll('.quick-link').forEach((button) => {
    button.addEventListener('click', () => onSearch(button.dataset.query));
  });
}

function renderLoading(viewport, query) {
  viewport.innerHTML = `<div class="page-result"><div class="result-wrap"><div class="result-label">Spiderweb search</div><h2>Following the thread...</h2><p>Looking for current information about “${escapeHtml(query)}”.</p></div></div>`;
}

function renderError(viewport, message) {
  viewport.innerHTML = `<div class="page-result"><div class="result-wrap"><div class="result-label">Search unavailable</div><h2>That thread went quiet.</h2><p>${escapeHtml(message)} Start the backend with <strong>node server.js</strong>, then try again.</p></div></div>`;
}

function renderResult(viewport, query, results) {
  const cleanQuery = query.trim() || 'spiderweb';
  const encodedQuery = encodeURIComponent(cleanQuery);
  viewport.innerHTML = `
    <div class="page-result">
      <div class="result-wrap">
        <div class="result-label">Spiderweb search</div>
        <h2>Results for<br><span style="color: var(--mint)">“${escapeHtml(cleanQuery)}”</span></h2>
        <div class="result-url">search.spiderweb.local / ${encodedQuery}</div>
        <p>Live information from DuckDuckGo, gathered through your Spiderweb backend.</p>
        <div class="result-panel">
          ${results.length ? results.map((result) => `<article class="result-item"><h3><a href="${escapeHtml(result.url)}" target="_blank" rel="noreferrer">${escapeHtml(result.title)}</a></h3><p>${escapeHtml(result.snippet)}</p><span class="result-link">${escapeHtml(result.url)}</span></article>`).join('') : '<article class="result-item"><h3>No direct results found</h3><p>Try a more specific phrase or search for a named website.</p></article>'}
        </div>
      </div>
    </div>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

window.SpiderwebRenderer = { renderHome, renderLoading, renderError, renderResult };
