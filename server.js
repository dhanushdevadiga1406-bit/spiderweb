const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const port = process.env.PORT || 5173;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

async function search(query, response) {
  try {
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const apiResponse = await fetch(apiUrl, { headers: { 'User-Agent': 'Spiderweb/1.0' } });
    if (!apiResponse.ok) throw new Error(`Search service returned ${apiResponse.status}`);
    const data = await apiResponse.json();
    const results = [];

    if (data.AbstractText) {
      results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText });
    }
    for (const topic of data.RelatedTopics || []) {
      if (topic.Text && topic.FirstURL) {
        results.push({ title: topic.Text.split(' - ')[0], url: topic.FirstURL, snippet: topic.Text });
      }
      if (results.length === 8) break;
    }
    sendJson(response, 200, { query, results });
  } catch (error) {
    sendJson(response, 502, { error: 'The search service could not be reached.' });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (requestUrl.pathname === '/api/search') {
    const query = requestUrl.searchParams.get('q')?.trim();
    if (!query) return sendJson(response, 400, { error: 'Enter something to search for.' });
    return search(query, response);
  }

  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }
  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404);
      return response.end('Not found');
    }
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(file);
  });
});

server.listen(port, () => console.log(`Spiderweb is running at http://localhost:${port}`));