// Media library: connect a local folder (videos, PDFs, audio, MIDI, images, notes) and attach items to lessons.
// Files never leave the computer. They are read directly by the browser.

const TYPES = {
  video: ['mp4', 'm4v', 'mov', 'webm', 'ogv', 'mkv', 'avi'],
  audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'aif', 'aiff'],
  pdf: ['pdf'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'],
  midi: ['mid', 'midi'],
  text: ['txt', 'md', 'rtf'],
};
const EXT_TYPE = Object.fromEntries(Object.entries(TYPES).flatMap(([t, exts]) => exts.map(e => [e, t])));

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};

// ---- IndexedDB (keeps the folder handle so it can be reopened after reload — Chrome/Edge)
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('keystone-library', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(key) {
  try { const db = await idb(); return await new Promise(res => { const q = db.transaction('kv').objectStore('kv').get(key); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch { return null; }
}
async function idbSet(key, val) {
  try { const db = await idb(); await new Promise(res => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(val, key); t.oncomplete = res; t.onerror = res; }); } catch { }
}

export function normalize(s) {
  return ' ' + String(s).toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9#&]+/g, ' ')
    .replace(/\btwo\b/g, '2').replace(/\bfive\b/g, '5').replace(/\bone\b/g, '1')
    .replace(/\s+/g, ' ').trim() + ' ';
}

export class Library {
  constructor() {
    this.items = [];
    this.hiddenPhrases = LS.get('ks.hiddenPhrases', []);
    this.assign = LS.get('ks.assign', {});    // path -> [lessonIds]
    this.unassign = LS.get('ks.unassign', {}); // path -> [lessonIds]
    this.handle = null;
    this.needsPermission = false;
    this.source = null;
    this.urls = new Map();
    this.listeners = [];
    this.supportsHandle = 'showDirectoryPicker' in window;
  }

  onChange(fn) { this.listeners.push(fn); }
  _changed() { this.listeners.forEach(f => f()); }

  // ------------------------------------------------------------------ connect
  async restore() {
    // A curated manifest (media/manifest.json) is optional and loads automatically.
    await this._loadManifest();
    if (!this.supportsHandle) return;
    const h = await idbGet('root');
    if (!h) return;
    this.handle = h;
    try {
      const p = await h.queryPermission({ mode: 'read' });
      if (p === 'granted') await this._scanHandle(h);
      else { this.needsPermission = true; this._changed(); }
    } catch { this.needsPermission = true; this._changed(); }
  }

  async reconnect() {
    if (!this.handle) return this.connect();
    const p = await this.handle.requestPermission({ mode: 'read' });
    if (p === 'granted') { this.needsPermission = false; await this._scanHandle(this.handle); }
  }

  async connect() {
    if (this.supportsHandle) {
      const h = await window.showDirectoryPicker({ id: 'keystone-media', mode: 'read' });
      this.handle = h;
      await idbSet('root', h);
      this.needsPermission = false;
      await this._scanHandle(h);
    } else {
      // Safari / Firefox fallback: folder <input>
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      await new Promise(res => {
        input.onchange = () => {
          const files = [...input.files];
          const root = files[0]?.webkitRelativePath.split('/')[0] || '';
          this._hideRoot(root);
          this._setItems(files.map(f => this._item(f.webkitRelativePath.split('/').slice(1).join('/'), f)).filter(Boolean), 'folder');
          res();
        };
        input.click();
      });
    }
  }

  _hideRoot(name) {
    if (!name) return;
    const phrase = name.replace(/[_\-.]+/g, ' ').trim();
    if (phrase && !this.hiddenPhrases.some(p => p.toLowerCase() === phrase.toLowerCase())) {
      this.hiddenPhrases.push(phrase);
      LS.set('ks.hiddenPhrases', this.hiddenPhrases);
    }
  }

  async _scanHandle(root) {
    this._hideRoot(root.name);
    const found = [];
    const walk = async (dir, prefix, depth) => {
      if (depth > 8) return;
      for await (const [name, h] of dir.entries()) {
        if (name.startsWith('.')) continue;
        const path = prefix ? prefix + '/' + name : name;
        if (h.kind === 'directory') await walk(h, path, depth + 1);
        else { const it = this._item(path, null, h); if (it) found.push(it); }
      }
    };
    await walk(root, '', 0);
    this._setItems(found, 'folder');
  }

  async _loadManifest() {
    try {
      const r = await fetch('media/manifest.json', { cache: 'no-store' });
      if (!r.ok) return;
      const m = await r.json();
      const list = (m.items || m).map(e => {
        const it = this._item(e.path, null, null, 'media/' + e.path.split('/').map(encodeURIComponent).join('/'));
        if (!it) return null;
        if (e.title) it.title = e.title;
        if (e.lessons) it.manifestLessons = e.lessons;
        return it;
      }).filter(Boolean);
      if (list.length) { this.items = list; this.source = 'manifest'; this._changed(); }
    } catch { }
  }

  _item(path, file, handle, url) {
    const name = path.split('/').pop();
    const ext = (name.split('.').pop() || '').toLowerCase();
    const type = EXT_TYPE[ext];
    if (!type) return null;
    const folders = path.split('/').slice(0, -1);
    return { path, name, ext, type, file, handle, url, folders, size: file?.size };
  }

  _setItems(items, source) {
    const keep = this.source === 'manifest' && source !== 'manifest' ? this.items.filter(i => i.url) : [];
    this.items = [...keep, ...items].sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
    this.source = source;
    this.urls.forEach(u => URL.revokeObjectURL(u));
    this.urls.clear();
    this._changed();
  }

  // ------------------------------------------------------------------ titles
  clean(s) {
    let t = String(s).replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[_]+/g, ' ');
    for (const p of this.hiddenPhrases) {
      if (!p.trim()) continue;
      const words = p.trim().split(/[\s_\-.]+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const re = new RegExp(words.join('[\\s_\\-.]*') + "(?:'s|s)?", 'gi');
      t = t.replace(re, ' ');
    }
    t = t.replace(/\s*[-–—|:]+\s*$/g, '').replace(/^\s*[-–—|:]+\s*/g, '').replace(/\(\s*\)|\[\s*\]/g, '').replace(/\s{2,}/g, ' ').trim();
    t = t.replace(/\s*[-–—|]\s*[-–—|]\s*/g, ' – ');
    return t || 'Untitled';
  }
  title(item) { return item.title ? this.clean(item.title) : this.clean(item.name); }
  folderLabel(item) { return item.folders.map(f => this.clean(f)).filter(f => f !== 'Untitled').join(' › '); }

  setHiddenPhrases(list) {
    this.hiddenPhrases = list.map(s => s.trim()).filter(Boolean);
    LS.set('ks.hiddenPhrases', this.hiddenPhrases);
    this._changed();
  }

  // ------------------------------------------------------------------ files
  async getFile(item) {
    if (item.file) return item.file;
    if (item.handle) return item.handle.getFile();
    if (item.url) { const r = await fetch(item.url); return new File([await r.blob()], item.name); }
    throw new Error('Unavailable');
  }
  async getURL(item) {
    if (item.url) return item.url;
    if (this.urls.has(item.path)) return this.urls.get(item.path);
    const f = await this.getFile(item);
    const u = URL.createObjectURL(f);
    this.urls.set(item.path, u);
    return u;
  }

  // ------------------------------------------------------------------ lesson matching
  score(item, lesson) {
    const hay = normalize(item.path + ' ' + (item.title || ''));
    let s = 0;
    for (const kw of [...lesson.keywords, lesson.title]) {
      const k = normalize(kw);
      if (k.trim().length < 3) continue;
      if (hay.includes(k)) s += k.trim().split(' ').length > 1 ? 3 : 1.5;
    }
    return s;
  }

  forLesson(lesson, limit = 12) {
    const pinned = [], suggested = [];
    for (const it of this.items) {
      const un = (this.unassign[it.path] || []).includes(lesson.id);
      if (un) continue;
      if ((this.assign[it.path] || []).includes(lesson.id) || (it.manifestLessons || []).includes(lesson.id)) { pinned.push(it); continue; }
      const s = this.score(it, lesson);
      if (s >= 1.5) suggested.push({ it, s });
    }
    suggested.sort((a, b) => b.s - a.s);
    return { pinned, suggested: suggested.slice(0, limit).map(x => x.it) };
  }

  lessonsFor(item, lessons, limit = 4) {
    const pinned = lessons.filter(l => (this.assign[item.path] || []).includes(l.id) || (item.manifestLessons || []).includes(l.id));
    const sugg = lessons.map(l => ({ l, s: this.score(item, l) })).filter(x => x.s >= 1.5 && !pinned.includes(x.l))
      .sort((a, b) => b.s - a.s).slice(0, limit).map(x => x.l);
    return { pinned, suggested: sugg };
  }

  pin(item, lessonId) {
    const a = new Set(this.assign[item.path] || []); a.add(lessonId); this.assign[item.path] = [...a];
    const u = new Set(this.unassign[item.path] || []); u.delete(lessonId); this.unassign[item.path] = [...u];
    LS.set('ks.assign', this.assign); LS.set('ks.unassign', this.unassign); this._changed();
  }
  unpin(item, lessonId) {
    const a = new Set(this.assign[item.path] || []); a.delete(lessonId); this.assign[item.path] = [...a];
    const u = new Set(this.unassign[item.path] || []); u.add(lessonId); this.unassign[item.path] = [...u];
    LS.set('ks.assign', this.assign); LS.set('ks.unassign', this.unassign); this._changed();
  }

  counts() {
    const c = {};
    for (const it of this.items) c[it.type] = (c[it.type] || 0) + 1;
    return c;
  }
}
