(function setActiveSidebarLink() {
  function normalize(pathname) {
    var path = pathname.replace(/\/+$/, "");
    return path.replace(/\/index\.html$/i, "");
  }

  var current = normalize(window.location.pathname);
  var links = document.querySelectorAll(".sidebar nav a");

  links.forEach(function (link) {
    var href = normalize(new URL(link.getAttribute("href"), window.location.origin).pathname);
    if (href === current) {
      link.classList.add("active");
    }
  });
})();
