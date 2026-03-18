(function renderSidebar() {
  var NAV_ITEMS = [
    { label: "Configuracoes", path: "modulos/configuracoes/index.html" },
    { label: "Modulo 01", path: "modulos/modulo-01/index.html" },
    { label: "Modulo 02", path: "modulos/modulo-02/index.html" },
    { label: "Modulo 03", path: "modulos/modulo-03/index.html" },
  ];

  function normalize(pathname) {
    var path = pathname.replace(/\/+$/, "");
    return path.replace(/\/index\.html$/i, "");
  }

  function getProjectRootUrl() {
    var currentScript = document.currentScript;
    if (!currentScript || !currentScript.src) {
      return new URL("./", window.location.href);
    }

    return new URL("../../../", currentScript.src);
  }

  function toPathSegments(pathname) {
    return pathname.split("/").filter(Boolean);
  }

  function toRelativeHref(targetUrl) {
    var currentUrl = new URL(window.location.href);
    var currentDirUrl = new URL("./", currentUrl);
    var currentSegments = toPathSegments(currentDirUrl.pathname);
    var targetSegments = toPathSegments(targetUrl.pathname);
    var commonLength = 0;

    while (
      commonLength < currentSegments.length &&
      commonLength < targetSegments.length &&
      currentSegments[commonLength] === targetSegments[commonLength]
    ) {
      commonLength += 1;
    }

    var upSegments = currentSegments.length - commonLength;
    var downSegments = targetSegments.slice(commonLength);
    var relativeParts = [];
    var index;

    for (index = 0; index < upSegments; index += 1) {
      relativeParts.push("..");
    }

    relativeParts = relativeParts.concat(downSegments);

    return relativeParts.length ? relativeParts.join("/") : ".";
  }

  function setActiveSidebarLink(sidebarElement) {
    var current = normalize(window.location.pathname);
    var links = sidebarElement.querySelectorAll("nav a");

    links.forEach(function (link) {
      var href = normalize(new URL(link.getAttribute("href"), window.location.href).pathname);
      if (href === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function mountSidebar(sidebarElement) {
    var projectRootUrl = getProjectRootUrl();
    var homeUrl = new URL("index.html", projectRootUrl);
    var navHtml = NAV_ITEMS.map(function (item) {
      var targetUrl = new URL(item.path, projectRootUrl);
      return '<a href="' + toRelativeHref(targetUrl) + '">' + item.label + "</a>";
    }).join("");

    sidebarElement.innerHTML =
      '<h2><a class="sidebar-home-link" href="' +
      toRelativeHref(homeUrl) +
      '">Painel</a></h2><nav>' +
      navHtml +
      "</nav>";
  }

  var sidebarElement = document.querySelector("[data-sidebar]");

  if (!sidebarElement) {
    return;
  }

  mountSidebar(sidebarElement);
  setActiveSidebarLink(sidebarElement);
})();
