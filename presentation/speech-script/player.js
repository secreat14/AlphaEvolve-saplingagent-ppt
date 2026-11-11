"use strict";
(() => {
  const payload = JSON.parse(document.querySelector('#speech-audio-data').textContent);
  const lines = payload.lines;
  const byId = new Map(lines.map(line => [line.id, line]));
  const audio = new Audio();
  audio.preload = 'none';
  const status = document.querySelector('#speech-status');
  const pauseButton = document.querySelector('#speech-pause');
  const stopButton = document.querySelector('#speech-stop');
  const rate = document.querySelector('#speech-rate');
  const repeat = document.querySelector('#speech-repeat');
  const time = document.querySelector('#speech-time');
  let queue = [];
  let index = -1;
  let active = null;
  let activeElement = null;
  let request = 0;
  let loading = false;

  function clock(seconds) {
    const value = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  }

  function updateTime() {
    time.textContent = `${clock(audio.currentTime)} / ${clock(audio.duration)}`;
  }

  function refresh() {
    const paused = audio.paused && !loading;
    pauseButton.disabled = !active || loading;
    stopButton.disabled = !active;
    pauseButton.textContent = paused ? '继续' : '暂停';
    if (!activeElement) return;
    activeElement.classList.toggle('is-paused', paused);
    const button = activeElement.querySelector('.line-play');
    button.textContent = paused ? '▶' : '❚❚';
    button.setAttribute('aria-pressed', String(!paused));
    const label = active.language === 'en'
      ? (paused ? 'Play this sentence' : 'Pause this sentence')
      : (paused ? '播放本句' : '暂停本句');
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function clearHighlight() {
    if (!activeElement) return;
    activeElement.classList.remove('is-active', 'is-paused');
    const button = activeElement.querySelector('.line-play');
    button.textContent = '▶';
    button.setAttribute('aria-pressed', 'false');
    const label = active.language === 'en' ? 'Play this sentence' : '播放本句';
    button.setAttribute('aria-label', label);
    button.title = label;
    activeElement = null;
  }

  function stop(message = '已停止。点击任意一句可以重新播放。') {
    request += 1;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    clearHighlight();
    active = null;
    queue = [];
    index = -1;
    loading = false;
    status.textContent = message;
    updateTime();
    refresh();
  }

  async function playIndex(position) {
    const ticket = ++request;
    audio.pause();
    clearHighlight();
    index = position;
    active = queue[index];
    activeElement = document.getElementById(active.id);
    activeElement.classList.add('is-active');
    loading = true;
    audio.src = active.audio;
    audio.playbackRate = Number(rate.value);
    const language = active.language === 'en' ? '英文' : '中文';
    status.textContent = `第 ${active.slide} 页 · ${language} · 第 ${index + 1} / ${queue.length} 句`;
    const bounds = activeElement.getBoundingClientRect();
    if (bounds.top < 240 || bounds.bottom > innerHeight - 30) {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
      activeElement.scrollIntoView({block: 'center', behavior});
    }
    refresh();
    try {
      await audio.play();
      if (ticket !== request) return;
      loading = false;
      refresh();
    } catch (error) {
      if (ticket !== request) return;
      loading = false;
      status.textContent = '播放未能开始，请再次点击本句。';
      refresh();
    }
  }

  async function togglePause() {
    if (!active) return;
    if (!audio.paused) {
      audio.pause();
      refresh();
      return;
    }
    const ticket = request;
    try {
      await audio.play();
    } catch (error) {
      if (ticket === request) status.textContent = '请再次点击本句开始播放。';
    }
    if (ticket === request) refresh();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-speech-id]');
    if (!button) return;
    const id = button.dataset.speechId;
    if (active?.id === id) {
      togglePause();
      return;
    }
    queue = [byId.get(id)];
    playIndex(0);
  });

  document.querySelectorAll('[data-speech-mode]').forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.speechMode;
      queue = lines.filter(line => mode === 'both' || line.language === mode);
      playIndex(0);
    });
  });
  pauseButton.addEventListener('click', togglePause);
  stopButton.addEventListener('click', () => stop());
  rate.addEventListener('change', () => {
    audio.playbackRate = Number(rate.value);
  });
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('loadedmetadata', updateTime);
  audio.addEventListener('error', () => {
    if (!active || !audio.getAttribute('src')) return;
    loading = false;
    status.textContent = '本句音频播放失败，请重新点击本句，或选择其他句子。';
    refresh();
  });
  audio.addEventListener('play', refresh);
  audio.addEventListener('pause', refresh);
  audio.addEventListener('ended', () => {
    if (!active || !audio.ended) return;
    if (repeat.checked) {
      playIndex(index);
      return;
    }
    if (index + 1 < queue.length) {
      playIndex(index + 1);
      return;
    }
    stop('本次播放完成。可以点选其他句子，或选择全文连读。');
  });
  window.addEventListener('pagehide', () => audio.pause());
})();
