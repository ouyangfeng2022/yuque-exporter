# AGENTS.md

Instructions for agentic coding assistants working in this repository.

## Project Overview

A Chrome browser extension (Manifest V3) that exports Yuque (语雀) documents to Markdown. Supports single-doc and batch export of entire knowledge bases. All code lives in the project root — no build step, no bundler, no npm.

## Build / Test / Lint

There is **no build system, no package manager, no linter, and no test framework**. The extension is plain vanilla JavaScript loaded directly by Chrome.

To test changes:
1. Open `chrome://extensions/`, enable Developer mode
2. Click "Load unpacked" and select the project root directory
3. After editing files, click the refresh icon on the extension card
4. Open DevTools on the popup or background service worker to see console output

There are no automated tests. Manual testing is done on `https://www.yuque.com/*` pages.

## Architecture

Three components communicate via `chrome.runtime.sendMessage`:

- **`content.js`** — Injected into Yuque pages. Reads `document.cookie`, extracts CSRF tokens, calls single-doc export API. Must be the cookie proxy since Yuque cookies are httpOnly.
- **`background.js`** — Service worker handling long-running batch exports. Fetches doc lists, downloads markdown, saves via `chrome.downloads`. Sends progress updates to popup.
- **`popup.html` + `popup.js`** — Dual-tab UI (single doc / batch). Fetches book stacks, delegates batch export to background. Styles are inlined in `<style>` tags within the HTML.

## Code Style

### Language & Modules
- Plain ES2017+ JavaScript, no TypeScript, no ES modules (`import`/`export`)
- Each file is a standalone script; cross-file communication is via Chrome messaging APIs
- `chrome.*` APIs used with callback style, wrapped in `new Promise()` where sequential flow is needed

### Formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required
- No trailing commas
- Opening braces on same line (`if (...) {`)

### Naming
- `camelCase` for functions and variables (`handleBatchExport`, `getCookieHeader`)
- `UPPER_CASE` for constants (not currently used but follow convention if added)
- Descriptive function names that indicate action (`exportToMarkdown`, `buildDocPathMap`)

### Functions & Async
- Prefer `async`/`await` over raw `.then()` chains
- Wrap Chrome callback APIs in `new Promise((resolve, reject) => { ... })`
- Use arrow functions for callbacks and inline handlers

### Error Handling
- Use `try`/`catch` in `async` functions
- Check `response.ok` after every `fetch()` call and throw with status code
- Send `{ success: false, error: error.message }` response objects on failure
- Use `console.log`/`console.error` extensively for debugging (visible in service worker DevTools)
- Ignore errors from `chrome.runtime.sendMessage` when the popup may be closed (`.catch(() => {} )`)

### DOM & UI
- All CSS is inlined in `popup.html` and `ui.js` `<style>` blocks — no external stylesheets
- Use `document.getElementById` to reference DOM elements
- Store selected state in module-level variables (`let selectedBook = null`)
- Progress updates sent via `chrome.runtime.sendMessage` with action `'batchProgress'`

## File Structure

```
manifest.json    # Manifest V3 config
popup.html       # UI + inline CSS
popup.js         # Popup logic, UI event handlers
background.js    # Service worker, batch export
content.js       # Content script, cookie proxy
ui.js            # Floating panel UI injected into Yuque pages
icon16.png       # Extension icons
icon48.png
icon128.png
docs/            # Reference JSON data (book_stacks, docs examples)
```

## Key Patterns

### Cookie Handling
Yuque uses httpOnly cookies, so `chrome.cookies` API cannot access them. The content script reads `document.cookie` directly and relays it to background/popup via messaging.

### Message Passing
Popup sends `{ action, tabId, ...data }` to background. Background responds via callback. Progress updates flow back via `chrome.runtime.sendMessage` with a `.catch(() => {})` guard.

### File Downloads
Encode content as `data:text/markdown;charset=utf-8;base64,...` and use `chrome.downloads.download()`. Paths preserve directory structure from Yuque TOC: `{bookName}/{subfolder}/{docTitle}.md`.
