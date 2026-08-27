(function () {
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var line = document.querySelector(".page-head .prompt-line");
  if (!line) return;

  var textEl = line.querySelector("span:not(.cursor)");
  var staticCursor = line.querySelector(".cursor");
  if (!textEl) return;

  var fullText = textEl.textContent;

  if (reduceMotion) return;

  if (staticCursor) staticCursor.style.display = "none";

  var typeCursor = document.createElement("span");
  typeCursor.className = "type-cursor";
  textEl.textContent = "";
  line.appendChild(typeCursor);

  var i = 0;
  function typeNext() {
    i++;
    textEl.textContent = fullText.slice(0, i);
    if (i < fullText.length) {
      setTimeout(typeNext, 22 + Math.random() * 35);
    } else {
      typeCursor.remove();
      if (staticCursor) staticCursor.style.display = "";
    }
  }
  setTimeout(typeNext, 150);
})();