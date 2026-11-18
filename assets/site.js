/* Flavor Forum: renders the talk lists and the single-talk page from talks.js */
(function () {
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  function parts(iso) {
    var p = iso.split("-");
    return { y: +p[0], m: +p[1] - 1, d: +p[2] };
  }
  function longDate(iso) {
    var p = parts(iso);
    return p.d + " " + MONTHS[p.m] + " " + p.y;
  }
  function shortDate(iso) {
    var p = parts(iso);
    return p.d + " " + MONTHS[p.m].slice(0, 3);
  }
  function monthYear(iso) {
    var p = parts(iso);
    return MONTHS[p.m] + " " + p.y;
  }
  function plain(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function link(t) {
    return "talk.html?id=" + encodeURIComponent(t.id);
  }

  var talks = (window.TALKS || []).slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  function row(t, withYear) {
    return '<li><a class="talk-row" href="' + link(t) + '">' +
      '<span class="talk-date">' + esc(shortDate(t.date)) + (withYear ? '<br>' + parts(t.date).y : '') + '</span>' +
      '<span class="talk-main">' +
      '<span class="talk-title">' + t.title + '</span>' +
      '<span class="talk-who">' + esc(t.speaker) + ' <span class="sep">·</span> ' + esc(t.affiliation) + '</span>' +
      '</span>' +
      '<span class="talk-arrow" aria-hidden="true">→</span>' +
      '</a></li>';
  }

  /* Home page: three most recent talks and the running count */
  var recent = document.getElementById("recent-talks");
  if (recent) {
    recent.innerHTML = talks.slice(0, 3).map(function (t) { return row(t, true); }).join("");
  }
  var count = document.getElementById("talk-count");
  if (count && talks.length) {
    count.textContent = talks.length + " talks since " + monthYear(talks[talks.length - 1].date) + ".";
  }

  /* Past talks page: grouped by year */
  var list = document.getElementById("talk-list");
  if (list) {
    var html = "", year = null;
    talks.forEach(function (t) {
      var y = parts(t.date).y;
      if (y !== year) {
        if (year !== null) html += "</ol></section>";
        html += '<section class="year"><h2 class="year-head">' + y + '</h2><ol class="talks">';
        year = y;
      }
      html += row(t);
    });
    if (year !== null) html += "</ol></section>";
    list.innerHTML = html || "<p>No talks yet.</p>";
  }

  /* Single talk page */
  var page = document.getElementById("talk-page");
  if (page) {
    var id = new URLSearchParams(window.location.search).get("id");
    var i = -1;
    for (var k = 0; k < talks.length; k++) if (talks[k].id === id) i = k;
    if (i < 0) {
      page.innerHTML = '<p class="kicker">Talk not found</p>' +
        '<h1 class="talk-h1">We could not find this talk.</h1>' +
        '<p>The link may be old or mistyped. See the <a href="past-talks.html">list of past talks</a>.</p>';
      return;
    }
    var t = talks[i];
    document.title = plain(t.title) + " · Flavor Forum";

    var out = '<p class="kicker">Flavor Forum talk · ' + esc(monthYear(t.date)) + '</p>' +
      '<h1 class="talk-h1">' + t.title + '</h1>' +
      '<dl class="facts">' +
      '<div><dt>Speaker</dt><dd>' + esc(t.speaker) + '</dd></div>' +
      '<div><dt>Affiliation</dt><dd>' + esc(t.affiliation) + '</dd></div>' +
      '<div><dt>Date</dt><dd>' + esc(longDate(t.date)) + '</dd></div>' +
      '<div><dt>Time</dt><dd>' + esc(t.time) + '</dd></div>' +
      '</dl>' +
      '<section class="block"><h2>Abstract</h2>' +
      t.abstract.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
      (t.paper ? '<p class="paper">Related paper: <a href="' + esc(t.paper.url) + '" rel="noopener">' + esc(t.paper.label) + '</a></p>' : "") +
      '</section>';
    if (t.bio) {
      out += '<section class="block speaker"><h2>About the speaker</h2>' +
        '<p>' + t.bio + '</p><p class="note">As at the time of the talk.</p></section>';
    }
    var newer = talks[i - 1], older = talks[i + 1];
    out += '<nav class="pager" aria-label="More talks">' +
      (older ? '<a class="prev" href="' + link(older) + '"><span>← Earlier talk</span>' + older.title + '</a>' : '<span></span>') +
      (newer ? '<a class="next" href="' + link(newer) + '"><span>Later talk →</span>' + newer.title + '</a>' : '<span></span>') +
      '</nav>';
    page.innerHTML = out;
  }
})();
