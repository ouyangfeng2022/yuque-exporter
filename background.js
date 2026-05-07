chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'batchExport') {
    const requestWithTabId = {
      ...request,
      tabId: request.tabId || sender.tab?.id
    };

    handleBatchExport(requestWithTabId).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'getCookies') {
    chrome.tabs.sendMessage(request.tabId, { action: 'getCookies' }, (response) => {
      sendResponse(response);
    });
    return true;
  }

  return false;
});

async function fetchTocData(username, bookSlug, cookieHeader) {
  const url = `https://www.yuque.com/${username}/${bookSlug}`;
  const response = await fetch(url, {
    headers: {
      'cookie': cookieHeader,
      'accept': 'text/html',
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  const match = html.match(/window\.appData\s*=\s*JSON\.parse\(decodeURIComponent\("(.+?)"\)\)/);
  if (!match) {
    return null;
  }

  const decoded = decodeURIComponent(match[1]);
  const appData = JSON.parse(decoded);
  return appData.book?.toc || null;
}

async function fetchBookOwnerMap(cookieHeader) {
  const response = await fetch('https://www.yuque.com/api/mine/book_stacks', {
    headers: {
      'accept': 'application/json',
      'cookie': cookieHeader,
    },
  });

  if (!response.ok) return {};

  const data = await response.json();
  const map = {};
  for (const stack of data.data || []) {
    for (const book of stack.books || []) {
      if (book.user?.login) {
        map[book.id] = book.user.login;
      }
    }
  }
  return map;
}

function buildUuidMap(tocItems) {
  const map = {};
  for (const item of tocItems) {
    if (item.uuid) {
      map[item.uuid] = item;
    }
  }
  return map;
}

function getItemPath(uuid, uuidMap) {
  const parts = [];
  let current = uuidMap[uuid];

  while (current && current.parent_uuid) {
    const parent = uuidMap[current.parent_uuid];
    if (parent && parent.type === 'TITLE') {
      parts.unshift(sanitizeFilename(parent.title));
    }
    current = parent;
  }

  return parts.join('/');
}

function buildDocPathMap(tocItems) {
  const uuidMap = buildUuidMap(tocItems);
  const docMap = {};

  for (const item of tocItems) {
    if (item.type === 'DOC' && item.doc_id) {
      const dirPath = getItemPath(item.uuid, uuidMap);
      docMap[item.doc_id] = {
        slug: item.url,
        title: item.title,
        path: dirPath,
      };
    }
  }

  return docMap;
}


async function handleBatchExport(request) {
  const { book, books, options, tabId } = request;
  const bookList = books || (book ? [book] : []);

  try {
    const tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(tab);
      });
    });

    const cookieResponse = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'getCookies' }, (response) => {
        resolve(response);
      });
    });

    if (!cookieResponse?.cookie) {
      throw new Error('无法获取 Cookie');
    }

    const cookieHeader = cookieResponse.cookie;

    const ownerMap = await fetchBookOwnerMap(cookieHeader);

    let totalCount = 0;
    let totalSuccess = 0;

    for (let bi = 0; bi < bookList.length; bi++) {
      const currentBook = bookList[bi];

      const username = ownerMap[currentBook.id] || null;

      if (!username) {
        continue;
      }

      const tocItems = await fetchTocData(username, currentBook.slug, cookieHeader);
      const docPathMap = tocItems ? buildDocPathMap(tocItems) : {};

      const docsResponse = await fetch(`https://www.yuque.com/api/docs?book_id=${currentBook.id}`, {
        headers: {
          'accept': 'application/json',
          'cookie': cookieHeader,
        },
      });

      if (!docsResponse.ok) {
        continue;
      }

      const docsData = await docsResponse.json();
      const docs = docsData.data || [];

      if (docs.length === 0) {
        continue;
      }

      totalCount += docs.length;
      let successCount = 0;

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const tocInfo = docPathMap[doc.id];

        sendProgress({
          bookName: currentBook.name,
          current: i + 1,
          total: docs.length,
          bookIndex: bi + 1,
          bookTotal: bookList.length,
          filename: doc.title,
        });

        try {
          const format = options.format || 'markdown';
          const isExport = ['pdf', 'word', 'jpg'].includes(format);

          let filePath = sanitizeFilename(currentBook.name);
          if (tocInfo?.path) {
            filePath += '/' + tocInfo.path;
          }

          if (isExport) {
            const fileExt = `.${format}`;
            filePath += '/' + sanitizeFilename(doc.title || '未命名') + fileExt;

            const exportPayload = { type: format, force: 0 };
            if (format === 'pdf' && options.toc) {
              exportPayload.options = JSON.stringify({ enableToc: 1 });
            }

            let exportResult = null;
            for (let retry = 0; retry < 3; retry++) {
              const exportResponse = await fetch(`https://www.yuque.com/api/docs/${doc.id}/export`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'cookie': cookieHeader,
                  'referer': `https://www.yuque.com/${username}/${currentBook.slug}`,
                },
                body: JSON.stringify(exportPayload),
              });

              if (!exportResponse.ok) {
                throw new Error(`导出请求失败: HTTP ${exportResponse.status}`);
              }

              const exportData = await exportResponse.json();
              if (exportData.data?.state === 'success') {
                exportResult = exportData.data;
                break;
              }

              await new Promise(resolve => setTimeout(resolve, 3000));
            }

            if (!exportResult?.url) {
              throw new Error('导出超时或失败');
            }

            let downloadUrl = exportResult.url;
            if (downloadUrl.startsWith('/')) {
              downloadUrl = 'https://www.yuque.com' + downloadUrl;
            }

            const safePath = filePath.replace(/[<>:"|?*]/g, '_');
            await new Promise((resolve, reject) => {
              chrome.downloads.download({
                url: downloadUrl,
                filename: safePath,
                saveAs: false,
              }, (downloadId) => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(downloadId);
              });
            });

          } else {
            const isLake = format === 'lake';
            const fileExt = isLake ? '.lake' : '.md';
            filePath += '/' + sanitizeFilename(doc.title || '未命名') + fileExt;

            const downloadUrl = `https://www.yuque.com/${username}/${currentBook.slug}/${doc.slug}/${isLake ? 'lake' : 'markdown'}`;
            const params = new URLSearchParams();
            params.set('attachment', '1');
            if (!isLake) {
              if (options.anchor) params.set('anchor', '1');
              if (options.linebreak) params.set('linebreak', '1');
              if (options.latexcode) params.set('latexcode', '1');
              if (options.useMdai) params.set('useMdai', '1');
            }

            const markdownResponse = await fetch(`${downloadUrl}?${params}`, {
              headers: {
                'accept': 'application/json',
                'cookie': cookieHeader,
                'referer': `https://www.yuque.com/${username}/${currentBook.slug}`,
              },
            });
            if (!markdownResponse.ok) {
              throw new Error(`HTTP ${markdownResponse.status}`);
            }

            let markdownBody = markdownResponse.body;
            if (markdownBody == null) {
              throw new Error('Response body is null');
            }
            const safePath = filePath.replace(/[<>:"|?*]/g, '_');
            const mimeType = isLake ? 'text/plain' : 'text/markdown';
            const dataUrl = `data:${mimeType};charset=utf-8;base64,` + btoa(unescape(encodeURIComponent(markdownBody)));

            await new Promise((resolve, reject) => {
              chrome.downloads.download({
                url: dataUrl,
                filename: safePath,
                saveAs: false,
              }, (downloadId) => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(downloadId);
              });
            });
          }

          successCount++;
          totalSuccess++;
        } catch (error) {
          sendProgress({
            bookName: currentBook.name,
            current: i + 1,
            total: docs.length,
            filename: `${doc.title} (失败: ${error.message})`,
          });
        }
      }

      sendProgress({
        bookName: currentBook.name,
        current: docs.length,
        total: docs.length,
        bookIndex: bi + 1,
        bookTotal: bookList.length,
        filename: `${currentBook.name} 完成`,
        bookDone: true,
        successCount: successCount,
      });
    }

    sendProgress({
      current: totalCount,
      total: totalCount,
      filename: '全部完成',
      done: true,
      successCount: totalSuccess,
    });

    return { success: true, count: totalSuccess };

  } catch (error) {

    sendProgress({
      error: error.message,
      done: true,
    });

    return { success: false, error: error.message };
  }
}

function sendProgress(data) {
  chrome.runtime.sendMessage({
    action: 'batchProgress',
    ...data
  }).catch(() => {
    // Popup may be closed
  });
}

function toBinary(string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(string);
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return binary;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

