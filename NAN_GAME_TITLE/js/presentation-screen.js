(function initPresentationScreen(global) {
  "use strict";

  function variantFor(title = "") {
    const value = String(title).toUpperCase();
    if (/METRIC|VERIFIED|SUBMISSION|EVIDENCE/.test(value)) return "metric";
    if (/COMPARE|PATTERN/.test(value)) return "compare";
    if (/LOG|HISTORY|AUDIT|RESTORE/.test(value)) return "timeline";
    if (/PATH|CONNECTED|CLOUD ITEM|ARCHIVE|AUTOMATION DETAILS/.test(value)) return "flow";
    return "report";
  }

  function createRow(row) {
    const paragraph = document.createElement("p");
    const [label, ...valueParts] = String(row).split("·").map((item) => item.trim());
    const value = valueParts.join(" · ");
    if (value) {
      const caption = document.createElement("span");
      const content = document.createElement("b");
      caption.textContent = label;
      content.textContent = value;
      paragraph.append(caption, content);
    } else {
      const content = document.createElement("b");
      content.textContent = label;
      paragraph.append(content);
    }
    return paragraph;
  }

  function apply(panel, data) {
    if (!panel || !data) return;
    panel.dataset.variant = data.variant || variantFor(data.title);
    const title = panel.querySelector(":scope > small, :scope > strong");
    const rows = panel.querySelector(":scope > div");
    if (title) title.textContent = data.title || "";
    if (rows) rows.replaceChildren(...(data.rows || []).map(createRow));
  }

  global.PresentationScreen = Object.freeze({ apply, variantFor });
})(window);
