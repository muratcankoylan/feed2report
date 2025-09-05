function ensureStyle() {
  if (document.getElementById('bu-li-style')) return;
  const style = document.createElement('style');
  style.id = 'bu-li-style';
  style.textContent = `
    .bu-li-btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.25);
      background: #0a66c2; /* LinkedIn blue */
      color: #fff;
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
      z-index: 10;
    }
    .bu-li-btn:hover { background: #004182; box-shadow: 0 3px 10px rgba(0,0,0,0.3); }
    .bu-li-btn:active { transform: translateY(1px); }
    .bu-li-btn:focus { outline: 2px solid #fff; outline-offset: 2px; }
    @media (prefers-color-scheme: light) {
      .bu-li-btn { border-color: rgba(0,0,0,0.15); }
      .bu-li-btn:focus { outline-color: #0a66c2; }
    }
  `;
  document.head.appendChild(style);
}

function getPostUrl(postEl) {
  try {
    const urnHost = 'https://www.linkedin.com/feed/update/';

    // 1) Prefer URN on the closest article
    const article = postEl.closest('article') || postEl;
    const articleUrn = article && article.getAttribute('data-urn');
    if (articleUrn && articleUrn.indexOf('urn:li:activity:') !== -1) {
      return urnHost + articleUrn;
    }

    // 2) Nested URN attributes
    const urnAttr = (
      postEl.querySelector('[data-urn*="urn:li:activity:"]') ||
      postEl.querySelector('[data-activity-urn*="urn:li:activity:"]')
    );
    if (urnAttr) {
      const val = urnAttr.getAttribute('data-urn') || urnAttr.getAttribute('data-activity-urn');
      if (val && val.indexOf('urn:li:activity:') !== -1) return urnHost + val;
    }

    // 3) Direct anchor permalinks
    const anchorSelectors = [
      'a[href*="/feed/update/urn:li:activity:"]',
      'a[href^="https://www.linkedin.com/feed/update/"]',
      'a[aria-label][href*="/feed/update/"]',
      'a[href*="/posts/"]',
      'a[data-control-name="activity_details"]'
    ];
    for (let i = 0; i < anchorSelectors.length; i++) {
      const a = postEl.querySelector(anchorSelectors[i]);
      if (a && a.href && !/\/feed\/?$/.test(a.href)) return a.href;
    }
  } catch (e) {
    // ignore
  }
  return '';
}

function findTopInsertionPoint(postEl) {
  const tops = [
    'header',
    'div.update-components-actor',
    'div.feed-shared-actor',
    'div.feed-shared-header',
    'div.feed-shared-update-v2__description-wrapper',
  ];
  for (const sel of tops) {
    const el = postEl.querySelector(sel);
    if (el) return el;
  }
  return postEl.firstElementChild || postEl;
}

function addButtonToPost(postEl) {
  if (!postEl || postEl.dataset.buLiAugmented === '1') return;
  const btn = document.createElement('button');
  btn.textContent = 'Save + Analyze';
  btn.className = 'bu-li-btn';
  btn.setAttribute('data-bu-li-btn', '1');
  btn.style.marginLeft = '8px';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = getPostUrl(postEl);
    if (!url) {
      alert('Could not resolve a LinkedIn post permalink. Try clicking the timestamp/permalink then use the button.');
      return;
    }
    const note = prompt('Add a short note for this LinkedIn post:');
    if (!note) return;

    chrome.runtime.sendMessage({
      type: 'TRIGGER_ANALYSIS_LI',
      payload: { url, note }
    }, (response) => {
      if (response?.success) {
        alert('Sent to LinkedIn analyzer.');
      } else {
        alert('Failed to send. Is the LinkedIn server running on 127.0.0.1:8001?');
      }
    });
  });

  // Insert at the beginning/top of the post (never in comments or footer)
  const top = findTopInsertionPoint(postEl);
  const holder = document.createElement('div');
  holder.style.marginBottom = '8px';
  holder.appendChild(btn);
  top.parentNode.insertBefore(holder, top);
  postEl.dataset.buLiAugmented = '1';
}

function scan() {
  const nodes = document.querySelectorAll([
    'article',
    'div.feed-shared-update-v2',
    'div.occludable-update',
  ].join(','));
  nodes.forEach((el) => {
    // skip comment/replies containers
    if (el.closest('.comments-comments-list, .comments-comment-item, [data-test-replies]')) return;
    addButtonToPost(el);
  });
}

const observer = new MutationObserver(() => scan());
observer.observe(document.documentElement, { childList: true, subtree: true });
ensureStyle();
scan();


