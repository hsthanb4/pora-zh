(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('ul.toc a'));
  if (!links.length) return;
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) map[id] = a;
  });
  var targets = Object.keys(map)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var current = null;
  function setActive(id) {
    if (id === current) return;
    if (current && map[current]) map[current].classList.remove('active');
    current = id;
    if (map[current]) map[current].classList.add('active');
  }

  var visible = new Map();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
      else visible.delete(e.target.id);
    });
    if (visible.size) {
      var best = null, bestTop = Infinity;
      visible.forEach(function (top, id) {
        if (top < bestTop) { bestTop = top; best = id; }
      });
      setActive(best);
    } else {
      // fall back: last heading above viewport top
      var last = null;
      targets.forEach(function (t) {
        if (t.getBoundingClientRect().top < 120) last = t.id;
      });
      if (last) setActive(last);
    }
  }, { rootMargin: '-72px 0px -60% 0px', threshold: [0, 1] });

  targets.forEach(function (t) { io.observe(t); });
  setActive(targets.length ? targets[0].id : null);
})();
