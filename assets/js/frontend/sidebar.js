(function setActiveSidebarLink() {
  function normalize(pathname) {
    var path = pathname.replace(/\/+$/, "");
    return path.replace(/\/index\.html$/i, "");
  }

  function resolvePath(href) {
    return normalize(new URL(href, window.location.href).pathname);
  }

  var current = normalize(window.location.pathname);
  var links = document.querySelectorAll(".sidebar nav a");

  links.forEach(function (link) {
    var href = resolvePath(link.getAttribute("href"));
    if (href === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
})();
