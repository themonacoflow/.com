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
     Sends to wholesale@themonacoflow.com.

     By default the form opens the sender's mail client with the inquiry
     already written, so it works with no backend and nothing to maintain.
     To collect submissions server-side instead, set FORM_ENDPOINT to a
     Formspree / Getform / Cloudflare Worker URL — no other change needed.
  ------------------------------------------------------------------------ */
  var FORM_ENDPOINT = '';

  var form = document.getElementById('vendor-form');
  if (!form) return;

  var LABELS = {
    brand: 'Brand / manufacturer',
    relationship: 'Submitting as',
    website: 'Catalog or website',
    contact: 'Contact name',
    role: 'Title',
    email: 'Business email',
    phone: 'Phone',
    category: 'Primary category',
    amazon: 'Current Amazon presence',
    map: 'MAP policy',
    notes: 'Notes'
  };

  function value(name) {
    var el = form.elements[name];
    return el && el.value ? el.value.trim() : '';
  }

  function body() {
    var lines = ['Vendor inquiry submitted from themonacoflow.com', ''];
    Object.keys(LABELS).forEach(function (key) {
      if (key === 'notes') return;
      lines.push(LABELS[key] + ': ' + (value(key) || '—'));
    });
    lines.push('', LABELS.notes + ':', value('notes') || '—');
    return lines.join('\n');
  }

  function confirmSent(heading, message) {
    var card = form.parentNode;
    var done = document.createElement('div');
    done.className = 'form-done';
    done.setAttribute('role', 'status');
    var h = document.createElement('h3');
    h.textContent = heading;
    var p = document.createElement('p');
    p.textContent = message;
    var a = document.createElement('a');
    a.className = 'btn btn--ink';
    a.href = 'mailto:wholesale@themonacoflow.com';
    a.textContent = 'Email wholesale@themonacoflow.com';
    done.appendChild(h);
    done.appendChild(p);
    done.appendChild(a);
    card.replaceChild(done, form);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var subject = 'Vendor inquiry — ' + (value('brand') || 'new brand');

    if (FORM_ENDPOINT) {
      var data = new FormData(form);
      data.append('_subject', subject);
      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function () {
          confirmSent('Inquiry received.', 'We reply to qualified vendor inquiries within one business day.');
        })
        .catch(function () {
          window.location.href = 'mailto:wholesale@themonacoflow.com?subject=' +
            encodeURIComponent(subject) + '&body=' + encodeURIComponent(body());
        });
      return;
    }

    window.location.href = 'mailto:wholesale@themonacoflow.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body());

    window.setTimeout(function () {
      confirmSent(
        'Your inquiry is drafted.',
        'Your mail client should be open with the details filled in. Send it and we will reply within one business day.'
      );
    }, 800);
  });
})();
