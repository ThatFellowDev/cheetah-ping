/**
 * Self-contained picker script injected into proxied pages.
 * Highlights elements on hover and sends CSS selectors back to parent via postMessage.
 */
export const PICKER_SCRIPT = `
<style>
  #cp-overlay {
    position: fixed;
    pointer-events: none;
    z-index: 999999;
    border: 2px solid #f59e0b;
    background: rgba(251, 191, 36, 0.12);
    border-radius: 3px;
    transition: all 0.08s ease-out;
    display: none;
  }
  #cp-tooltip {
    position: fixed;
    pointer-events: none;
    z-index: 1000000;
    background: #1a1a1a;
    color: #f59e0b;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid rgba(245, 158, 11, 0.3);
    white-space: nowrap;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  #cp-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000001;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    padding: 8px 16px;
    letter-spacing: 0.01em;
  }
  body { padding-top: 36px !important; }
</style>
<div id="cp-overlay"></div>
<div id="cp-tooltip"></div>
<div id="cp-banner">Click any element to select it for monitoring</div>
<script>
(function() {
  var overlay = document.getElementById('cp-overlay');
  var tooltip = document.getElementById('cp-tooltip');
  var banner = document.getElementById('cp-banner');
  var pickerEls = [overlay, tooltip, banner];
  var lastTarget = null;

  function isPickerEl(el) {
    return pickerEls.indexOf(el) !== -1;
  }

  function getNthOfType(el) {
    var parent = el.parentElement;
    if (!parent) return 1;
    var tag = el.tagName;
    var n = 0;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].tagName === tag) {
        n++;
        if (parent.children[i] === el) return n;
      }
    }
    return 1;
  }

  function isUtilityClass(cls) {
    if (cls.length > 25) return true;
    if (/^[a-z]{1,3}-[a-z0-9\\[\\]\\/:.-]+$/.test(cls)) return true;
    if (/[0-9a-f]{6,}/i.test(cls)) return true;
    if (cls.startsWith('css-') || cls.startsWith('sc-') || cls.startsWith('_')) return true;
    return false;
  }

  function generateSelector(el) {
    if (isPickerEl(el)) return '';
    if (el.tagName === 'BODY' || el.tagName === 'HTML') return el.tagName.toLowerCase();

    // 1. Unique ID
    if (el.id && /^[a-zA-Z]/.test(el.id)) {
      var idSel = '#' + CSS.escape(el.id);
      try { if (document.querySelectorAll(idSel).length === 1) return idSel; } catch(e) {}
    }

    // 2. Data attributes
    var attrs = el.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (a.name.indexOf('data-') === 0 && a.value && a.name !== 'data-slot') {
        var dataSel = el.tagName.toLowerCase() + '[' + a.name + '="' + CSS.escape(a.value) + '"]';
        try { if (document.querySelectorAll(dataSel).length === 1) return dataSel; } catch(e) {}
      }
    }

    // 3. Non-utility class
    var classes = Array.from(el.classList).filter(function(c) { return !isUtilityClass(c); });
    for (var j = 0; j < classes.length; j++) {
      var clsSel = el.tagName.toLowerCase() + '.' + CSS.escape(classes[j]);
      try { if (document.querySelectorAll(clsSel).length === 1) return clsSel; } catch(e) {}
    }

    // 4. Build path up the DOM
    var path = [];
    var current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      var tag = current.tagName.toLowerCase();
      var segment = tag;

      if (current.id && /^[a-zA-Z]/.test(current.id)) {
        segment = '#' + CSS.escape(current.id);
        path.unshift(segment);
        break;
      }

      var nth = getNthOfType(current);
      var siblings = current.parentElement ? current.parentElement.querySelectorAll(':scope > ' + tag) : [];
      if (siblings.length > 1) {
        segment = tag + ':nth-of-type(' + nth + ')';
      }

      path.unshift(segment);

      // Check if current path is unique
      var candidate = path.join(' > ');
      try {
        if (document.querySelectorAll(candidate).length === 1) {
          // Try to simplify by removing middle segments
          for (var k = 1; k < path.length - 1; k++) {
            var shorter = path.slice(0, k).concat(path.slice(k + 1)).join(' > ');
            try {
              if (document.querySelectorAll(shorter).length === 1) {
                path = path.slice(0, k).concat(path.slice(k + 1));
                k--;
              }
            } catch(e2) {}
          }
          return path.join(' > ');
        }
      } catch(e) {}

      current = current.parentElement;
      if (path.length > 6) break;
    }

    return path.join(' > ') || el.tagName.toLowerCase();
  }

  document.addEventListener('mouseover', function(e) {
    var target = e.target;
    if (isPickerEl(target) || target === lastTarget) return;
    lastTarget = target;

    var rect = target.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    var sel = generateSelector(target);
    tooltip.textContent = sel || target.tagName.toLowerCase();
    tooltip.style.display = 'block';

    var tooltipTop = rect.top - 30;
    if (tooltipTop < 40) tooltipTop = rect.bottom + 6;
    tooltip.style.top = tooltipTop + 'px';
    tooltip.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 410)) + 'px';
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (isPickerEl(e.target)) return;
    if (!e.relatedTarget || isPickerEl(e.relatedTarget)) return;
  }, true);

  document.addEventListener('click', function(e) {
    if (isPickerEl(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var sel = generateSelector(e.target);
    var text = (e.target.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120);

    window.parent.postMessage({
      type: 'ELEMENT_PICKED',
      selector: sel,
      tagName: e.target.tagName.toLowerCase(),
      textPreview: text
    }, window.location.origin);
  }, true);

  // Signal ready
  window.parent.postMessage({ type: 'PICKER_READY' }, window.location.origin);
})();
</script>
`;
