/* Monaco Flow LLC — themonacoflow.com */
(function () {
  'use strict';

  /* ---- Mobile navigation ------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* ---- Vendor inquiry form ----------------------------------------------
     Posts to the site API, which emails the team. No address is published on
     this site, so there is nothing for a scraper to harvest.
  ------------------------------------------------------------------------ */
  var form = document.getElementById('vendor-form');

  if (form) {
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name) payload[el.name] = el.value;
      });

      var original = button ? button.innerHTML : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
      }

      fetch('/api/vendor-inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error(data && data.error);
          done(
            'Inquiry received.',
            'We reply to qualified vendor inquiries within one business day. If it is urgent, call (877) 460-7547, Monday to Friday, 9 to 5 Eastern.'
          );
        })
        .catch(function () {
          if (button) {
            button.disabled = false;
            button.innerHTML = original;
          }
          failure(
            'That did not send. Please call (877) 460-7547, Monday to Friday, 9 to 5 Eastern, and we will take the details over the phone.'
          );
        });
    });

    function done(heading, message) {
      var card = form.parentNode;
      var el = document.createElement('div');
      el.className = 'form-done';
      el.setAttribute('role', 'status');
      var h = document.createElement('h3');
      h.textContent = heading;
      var p = document.createElement('p');
      p.textContent = message;
      el.appendChild(h);
      el.appendChild(p);
      card.replaceChild(el, form);
    }

    function failure(message) {
      var existing = form.querySelector('.form-error');
      if (existing) existing.remove();
      var p = document.createElement('p');
      p.className = 'form-error';
      p.setAttribute('role', 'alert');
      p.textContent = message;
      var foot = form.querySelector('.form-foot');
      if (foot) foot.parentNode.insertBefore(p, foot);
    }
  }

  /* ---- Assistant --------------------------------------------------------
     Answers from the same fact list the phone attendant uses. Renders as a
     transcript rather than a chat bubble, and says plainly that it is an AI.
  ------------------------------------------------------------------------ */
  if (!window.fetch || !document.body) return;

  var MAX_TURNS = 20;
  var history = [];
  var sent = false;
  var panel, log, input, sendBtn, launcher;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function build() {
    launcher = el('button', 'ask-launch');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.textContent = 'Ask a question';

    panel = el('div', 'ask');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask Monaco Flow');
    panel.hidden = true;

    var head = el('div', 'ask__head');
    head.appendChild(el('span', 'ask__title', 'Monaco Flow — assistant'));
    var close = el('button', 'ask__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '✕';
    head.appendChild(close);

    var note = el('p', 'ask__note',
      'Answered by an AI assistant, from the same facts our phone line uses. A person follows up on anything real.');

    log = el('div', 'ask__log');
    log.setAttribute('aria-live', 'polite');

    var row = el('form', 'ask__row');
    input = el('input', 'ask__input');
    input.type = 'text';
    input.placeholder = 'MAP policy? Who do you buy from?';
    input.setAttribute('aria-label', 'Your question');
    input.maxLength = 500;
    sendBtn = el('button', 'ask__send', 'Send');
    sendBtn.type = 'submit';
    row.appendChild(input);
    row.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(note);
    panel.appendChild(log);
    panel.appendChild(row);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    launcher.addEventListener('click', open);
    close.addEventListener('click', shut);
    row.addEventListener('submit', function (e) { e.preventDefault(); ask(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) shut();
    });
  }

  function open() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.hidden = true;
    if (!history.length) {
      say('assistant', 'Ask about how we buy, MAP, fulfillment, or what we look for in a line. For anything that needs a person, use the vendor form or call (877) 460-7547.', true);
    }
    input.focus();
  }

  function shut() {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function say(role, text, ephemeral) {
    var turn = el('div', 'ask__turn');
    turn.appendChild(el('span', 'ask__who', role === 'assistant' ? 'Monaco Flow' : 'You'));
    turn.appendChild(el('p', null, text));
    log.appendChild(turn);
    log.scrollTop = log.scrollHeight;
    if (!ephemeral) history.push({ role: role, content: text });
    return turn;
  }

  function ask() {
    var text = input.value.trim();
    if (!text) return;
    if (history.length >= MAX_TURNS) {
      say('assistant', 'Let us pick this up properly — use the vendor form or call (877) 460-7547.', true);
      return;
    }
    input.value = '';
    say('user', text);

    input.disabled = true;
    sendBtn.disabled = true;
    var pending = say('assistant', 'Typing…', true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        pending.remove();
        if (!data || !data.ok || !data.reply) throw new Error();
        say('assistant', data.reply);
      })
      .catch(function () {
        pending.remove();
        say('assistant', 'I could not reach the system just then. The vendor form and (877) 460-7547 both work.', true);
      })
      .then(function () {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  // File the transcript once, when the visitor leaves.
  function fileTranscript() {
    if (sent || history.length < 4) return;
    sent = true;
    var body = JSON.stringify({ messages: history });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/chat-end', new Blob([body], { type: 'application/json' }));
    }
  }

  window.addEventListener('pagehide', fileTranscript);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') fileTranscript();
  });

  build();
})();
