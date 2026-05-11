(function () {
  var current = document.currentScript;
  var script = document.createElement("script");
  script.src = new URL("/widget.js", current.src).toString();
  script.async = false;

  for (var i = 0; i < current.attributes.length; i += 1) {
    var attr = current.attributes[i];
    if (attr.name === "src" || attr.name === "defer" || attr.name === "async") continue;
    script.setAttribute(attr.name, attr.value);
  }

  current.parentNode.insertBefore(script, current.nextSibling);
})();
