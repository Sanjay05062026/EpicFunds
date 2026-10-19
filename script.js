(function () {
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var phone = document.getElementById('phone');
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var hostName = document.getElementById('hostName');
  if (hostName && location.host) hostName.textContent = location.host;

  var toastEl = document.createElement('div');
  toastEl.className = 'ef-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  phone.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  var openSelect = null;
  var CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7.5"></polyline></svg>';

  each(phone.querySelectorAll('select'), function (sel) {
    var wrap = sel.parentNode;
    wrap.classList.add('ef-select');
    var chevron = wrap.querySelector('svg');
    if (chevron) chevron.classList.add('ef-chevron');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ef-select-btn';
    btn.setAttribute('style', sel.getAttribute('style') || '');
    btn.id = sel.id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var value = document.createElement('span');
    value.className = 'ef-select-value';
    btn.appendChild(value);

    var list = document.createElement('ul');
    list.className = 'ef-list';
    list.id = sel.id + '-list';
    list.setAttribute('role', 'listbox');
    btn.setAttribute('aria-controls', list.id);

    var label = document.querySelector('label[for="' + sel.id + '"]');
    if (label) {
      label.setAttribute('for', btn.id);
      label.id = label.id || sel.id + '-label';
      list.setAttribute('aria-labelledby', label.id);
    }

    each(sel.options, function (opt, idx) {
      var li = document.createElement('li');
      li.className = 'ef-option';
      li.id = sel.id + '-opt-' + idx;
      li.setAttribute('role', 'option');
      li.innerHTML = '<span></span>' + CHECK;
      li.firstChild.textContent = opt.text;
      li.addEventListener('mousemove', function () { setActive(idx); });
      li.addEventListener('click', function () { choose(idx); close(); btn.focus(); });
      list.appendChild(li);
    });

    sel.style.display = 'none';
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(btn, sel);
    wrap.appendChild(list);

    var activeIdx = sel.selectedIndex;
    function sync() {
      value.textContent = sel.options[sel.selectedIndex].text;
      each(list.children, function (li, i) { li.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false'); });
    }
    function setActive(idx) {
      activeIdx = idx;
      each(list.children, function (li, i) { li.classList.toggle('active', i === idx); });
      btn.setAttribute('aria-activedescendant', list.children[idx].id);
    }
    function choose(idx) {
      sel.selectedIndex = idx;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    }
    function open() {
      if (openSelect && openSelect !== api) openSelect.close();
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      setActive(sel.selectedIndex);
      openSelect = api;
      requestAnimationFrame(function () { list.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    }
    function close() {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      if (openSelect === api) openSelect = null;
    }
    var api = { wrap: wrap, close: close };

    btn.addEventListener('click', function () { if (wrap.classList.contains('open')) close(); else open(); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('open');
      var n = sel.options.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { open(); return; }
        setActive((activeIdx + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
        list.children[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) {
        e.preventDefault();
        choose(activeIdx);
        close();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab' && isOpen) {
        close();
      }
    });
    sync();
  });

  document.addEventListener('click', function (e) {
    if (openSelect && !openSelect.wrap.contains(e.target)) openSelect.close();
  });

  var RATE = 0.135 / 12;
  function inr(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }
  function recalcEmi() {
    var scr = document.getElementById('ApplyLoan');
    var amt = scr && scr.querySelector('#amount');
    if (!amt) return;
    var P = parseInt((amt.value || '').replace(/[^0-9]/g, ''), 10) || 0;
    var pressed = scr.querySelector('button[aria-pressed="true"]');
    var n = pressed ? parseInt(pressed.textContent, 10) || 36 : 36;
    var f = Math.pow(1 + RATE, n);
    var emi = P > 0 ? Math.round(P * RATE * f / (f - 1)) : 0;
    var total = emi * n;
    var set = function (key, text) { var el = scr.querySelector('[data-calc="' + key + '"]'); if (el) el.textContent = text; };
    set('emi', inr(emi));
    set('tenure', n + ' months');
    set('interest', inr(Math.max(total - P, 0)));
    set('total', inr(total));

    var note = amt.parentNode.nextElementSibling;
    if (note) {
      var over = P > 600000;
      note.textContent = over ? 'Exceeds your eligible limit of ₹6,00,000' : 'Eligible up to ₹6,00,000';
      note.style.color = over ? '#A8362A' : '';
    }
  }
  var amountInput = document.querySelector('#ApplyLoan #amount');
  if (amountInput) {
    amountInput.setAttribute('inputmode', 'numeric');
    amountInput.addEventListener('input', recalcEmi);
    amountInput.addEventListener('blur', function () {
      var v = parseInt(amountInput.value.replace(/[^0-9]/g, ''), 10);
      if (v) amountInput.value = v.toLocaleString('en-IN');
    });
  }
  var incomeInput = document.querySelector('#ApplyLoan #income');
  if (incomeInput) incomeInput.setAttribute('inputmode', 'numeric');
  var emailInput = document.querySelector('#Login #email');
  if (emailInput) { emailInput.setAttribute('inputmode', 'email'); emailInput.setAttribute('autocomplete', 'username'); }

  function applyFilter(screen, filter) {
    each(screen.querySelectorAll('[data-status]'), function (chip) {
      var card = chip.closest('a') || chip.parentNode;
      card.hidden = !(filter === 'all' || chip.getAttribute('data-status') === filter);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.phone button[aria-pressed]') : null;
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    var group = Array.prototype.filter.call(b.parentNode.children, function (el) { return el.hasAttribute('aria-pressed'); });
    var current = group.filter(function (el) { return el.getAttribute('aria-pressed') === 'true'; })[0];
    if (current) {
      var onStyle = current.getAttribute('style');
      current.setAttribute('style', b.getAttribute('style'));
      current.setAttribute('aria-pressed', 'false');
      b.setAttribute('style', onStyle);
    }
    b.setAttribute('aria-pressed', 'true');
    var filter = b.getAttribute('data-filter');
    if (filter) applyFilter(b.closest('.screen'), filter);
    if (b.closest('#ApplyLoan')) recalcEmi();
  });

  var currentId = null;
  function show(dir) {
    var id = (location.hash || '#Login').slice(1);
    var target = document.getElementById(id);
    if (!target || !target.classList.contains('screen')) { id = 'Login'; target = document.getElementById(id); }
    if (openSelect) openSelect.close();
    screens.forEach(function (s) {
      s.classList.remove('enter-forward', 'enter-back', 'enter-fade');
      s.classList.toggle('active', s === target);
    });
    if (dir && id !== currentId) { void target.offsetWidth; target.classList.add('enter-' + dir); }
    each(target.querySelectorAll('main'), function (m) { m.scrollTop = 0; });
    currentId = id;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || !phone.contains(a)) return;
    var href = a.getAttribute('href') || '';
    if (href === '#') { e.preventDefault(); toast('Coming soon'); return; }
    if (href.charAt(0) !== '#') return;
    e.preventDefault();

    var label = a.getAttribute('aria-label');
    var isBack = label === 'Back' || label === 'Close';
    var inTabBar = !!a.closest('nav');
    var finishes = a.hasAttribute('data-toast') || currentId === 'PaymentSuccess';
    var replace = isBack || inTabBar || finishes;
    var dir = isBack ? 'back' : (inTabBar || finishes || currentId === 'Login') ? 'fade' : 'forward';

    if (location.hash !== href) {
      if (replace) history.replaceState(null, '', href); else history.pushState(null, '', href);
    }
    show(dir);
    var msg = a.getAttribute('data-toast');
    if (msg) toast(msg);
  });

  var mobile = window.matchMedia('(max-width:600px)');
  function fit() {
    var wrap = document.getElementById('phoneWrap');
    if (mobile.matches) { wrap.style.transform = ''; wrap.style.margin = ''; return; }
    var s = Math.min(1, (window.innerHeight - 48) / 844, (window.innerWidth - 24) / 390);
    wrap.style.transform = s < 1 ? 'scale(' + s + ')' : '';
    wrap.style.margin = s < 1 ? (844 * (s - 1) / 2) + 'px ' + (390 * (s - 1) / 2) + 'px' : '';
  }

  window.addEventListener('popstate', function () { show('back'); });
  window.addEventListener('resize', fit);
  show(null);
  fit();
})();
