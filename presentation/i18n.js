"use strict";
(() => {
  const english = /*__ENGLISH__*/;
  const messages = new Map(Object.entries(english.messages));
  const patterns = english.patterns.map(([pattern, replacement]) => ({
    expression: new RegExp(pattern, 'u'),
    replacement
  }));
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const han = /[\u3400-\u9fff]/u;
  const attributes = ['title', 'aria-label', 'content'];
  const storageKey = 'matrix-presentation-language';
  let language = 'zh-CN';

  function translate(source) {
    if (messages.has(source)) return messages.get(source);
    const trimmed = source.trim();
    if (messages.has(trimmed)) {
      return source.replace(trimmed, () => messages.get(trimmed));
    }
    for (const {expression, replacement} of patterns) {
      const match = source.match(expression);
      if (match) {
        return replacement.replace(/\{(\d+)\}/g, (_, index) => translate(match[Number(index)]));
      }
    }
    return source;
  }

  function localizedValue(value, previous) {
    const source = previous && (value === previous.zh || value === previous.en)
      ? previous.zh
      : value;
    return {zh: source, en: translate(source)};
  }

  // Update text nodes in place so controls, matrix state and timers keep their identity.
  function apply(root = document.documentElement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script, style, #language-select')) continue;
      const previous = originalText.get(node);
      if (!previous && !han.test(node.data)) continue;
      const record = localizedValue(node.data, previous);
      originalText.set(node, record);
      const value = language === 'en' ? record.en : record.zh;
      if (node.data !== value) node.data = value;
    }
    const elements = [root, ...root.querySelectorAll('[title], [aria-label], meta[content]')];
    for (const element of elements) {
      let records = originalAttributes.get(element);
      if (!records) {
        records = new Map();
        originalAttributes.set(element, records);
      }
      for (const attribute of attributes) {
        if (!element.hasAttribute(attribute)) continue;
        const value = element.getAttribute(attribute);
        const record = localizedValue(value, records.get(attribute));
        records.set(attribute, record);
        element.setAttribute(attribute, language === 'en' ? record.en : record.zh);
      }
    }
  }

  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'zh-CN';
    document.documentElement.lang = language;
    document.querySelector('#language-select').value = language;
    apply();
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Offline file URLs and browser privacy settings may disable storage.
    }
  }

  function registerNotes(notes) {
    if (notes.length !== english.notes.length) {
      throw new Error('English speaker notes must match the slide count');
    }
    notes.forEach((note, index) => {
      const translation = english.notes[index];
      if (translation.sourceText !== note.text || translation.sourceAction !== note.action) {
        throw new Error(`English speaker note ${index + 1} needs its source updated`);
      }
      messages.set(note.text, translation.text);
      messages.set(note.action, translation.action);
    });
  }

  function start() {
    let savedLanguage = 'zh-CN';
    try {
      savedLanguage = localStorage.getItem(storageKey) || savedLanguage;
    } catch {
      // The selector continues to work when persistence is unavailable.
    }
    document.querySelector('#language-select').addEventListener('change', event => {
      setLanguage(event.target.value);
    });
    setLanguage(savedLanguage);
  }

  globalThis.PresentationI18n = {apply, registerNotes, setLanguage, start, translate};
})();
