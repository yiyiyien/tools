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

function renderError(target, message) {
  target.innerHTML = `<div class="error-state">${message}</div>`;
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

  const rows = lines.map((line) => {
    const digits = onlyDigits(line);

    if (!digits) {
      return {
        label: line || "空行",
        value: "无效时间戳",
        note: "",
      };
    }

    if (digits.length < 9) {
      return {
        label: line,
        value: "时间戳太短",
        note: "",
      };
    }

    const { type, milliseconds } = detectTimestampType(digits);
    const date = new Date(milliseconds);

    if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
      return {
        label: line,
        value: "无法转换",
        note: "",
      };
    }

    return {
      label: line,
      value: formatLocal(date),
      note: type === "毫秒级" ? "" : type,
    };
  });

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

pasteTimestamp.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    timestampInput.value = text;
    updateTimestampResults();
    timestampInput.focus();
  } catch {
    showToast("无法读取剪贴板内容");
  }
});

clearTimestamp.addEventListener("click", () => {
  timestampInput.value = "";
  updateTimestampResults();
  timestampInput.focus();
});

updateTimestampResults();
