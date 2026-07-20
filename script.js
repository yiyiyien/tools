const timestampInput = document.querySelector("#timestampInput");
const timestampResults = document.querySelector("#timestampResults");
const rowTemplate = document.querySelector("#resultRowTemplate");
const toast = document.querySelector("#toast");
const pasteTimestamp = document.querySelector("#pasteTimestamp");
const clearTimestamp = document.querySelector("#clearTimestamp");

const formatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function normalizeDigitsFromLine(line) {
  // allow commas and spaces as separators, but require at least 9 numeric chars
  const cleaned = line.replace(/[ ,\t\u00A0]/g, "");
  if (!/^\d+$/.test(cleaned)) return "";
  return cleaned;
}

function detectTimestampType(digits) {
  if (digits.length < 13) {
    const normalizedDigits = digits.padEnd(13, "0");
    return { type: "秒级", milliseconds: Number(normalizedDigits) };
  }

  return { type: "毫秒级", milliseconds: Number(digits.slice(0, 13)) };
}

function renderEmpty(target) {
  target.innerHTML = "";
}

function renderRows(target, rows) {
  target.innerHTML = "";

  rows.forEach(({ label, value, note }) => {
    const row = rowTemplate.content.cloneNode(true);
    const noteEl = row.querySelector(".result-note");
    row.querySelector(".result-source").textContent = label;
    row.querySelector(".result-value").textContent = value;
    noteEl.textContent = note || "";
    noteEl.style.display = note ? "block" : "none";
    target.appendChild(row);
  });
}

function handlePaste(event) {
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!text) {
    return;
  }

  event.preventDefault();
  const start = timestampInput.selectionStart ?? timestampInput.value.length;
  const end = timestampInput.selectionEnd ?? timestampInput.value.length;
  const nextValue = `${timestampInput.value.slice(0, start)}${text}${timestampInput.value.slice(end)}`;
  timestampInput.value = nextValue;
  const cursorPosition = start + text.length;
  timestampInput.setSelectionRange(cursorPosition, cursorPosition);
  updateTimestampResults();
}

function formatLocal(date) {
  return formatter.format(date);
}

function updateTimestampResults() {
  const rawValue = timestampInput.value.trim();

  if (!rawValue) {
    renderEmpty(timestampResults);
    return;
  }

  const lines = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    renderEmpty(timestampResults);
    return;
  }

  const rows = lines
    .map((line) => {
      const digits = normalizeDigitsFromLine(line);

      // silently skip lines that aren't purely numeric after normalization
      if (!digits || digits.length < 9) return null;

      const { type, milliseconds } = detectTimestampType(digits);
      const date = new Date(milliseconds);

      if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
        return null;
      }

      return {
        label: line,
        value: formatLocal(date),
        note: type === "毫秒级" ? "" : type,
      };
    })
    .filter(Boolean);

  renderRows(timestampResults, rows);
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

timestampInput.addEventListener("input", updateTimestampResults);
timestampInput.addEventListener("paste", handlePaste);

pasteTimestamp.addEventListener("click", async () => {
  timestampInput.focus();

  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      if (typeof text === "string" && text) {
        timestampInput.value = text;
        updateTimestampResults();
        return;
      }
    }
  } catch {
    // fallback below
  }

  try {
    if (typeof document.execCommand === "function") {
      document.execCommand("paste");
      return;
    }
  } catch {
    // ignore
  }

  showToast("请允许读取剪贴板内容后再试");
});

clearTimestamp.addEventListener("click", () => {
  timestampInput.value = "";
  updateTimestampResults();
  timestampInput.focus();
});

updateTimestampResults();
