const timestampInput = document.querySelector("#timestampInput");
const cleanedTimestamp = document.querySelector("#cleanedTimestamp");
const timestampResults = document.querySelector("#timestampResults");
const datetimeInput = document.querySelector("#datetimeInput");
const datetimeResults = document.querySelector("#datetimeResults");
const rowTemplate = document.querySelector("#resultRowTemplate");
const toast = document.querySelector("#toast");
const clearTimestamp = document.querySelector("#clearTimestamp");
const useNow = document.querySelector("#useNow");

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
  if (digits.length <= 10) {
    return { type: "秒级", milliseconds: Number(digits) * 1000 };
  }

  if (digits.length <= 13) {
    return { type: "毫秒级", milliseconds: Number(digits) };
  }

  return { type: "毫秒级", milliseconds: Number(digits.slice(0, 13)) };
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderError(target, message) {
  target.innerHTML = `<div class="error-state">${message}</div>`;
}

function renderRows(target, rows) {
  target.innerHTML = "";

  rows.forEach(({ label, value }) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector(".result-label").textContent = label;
    row.querySelector(".result-value").textContent = value;
    row.querySelector(".copy-button").dataset.copyValue = value;
    target.appendChild(row);
  });
}

function formatLocal(date) {
  return formatter.format(date);
}

function updateTimestampResults() {
  const rawValue = timestampInput.value.trim();
  const digits = onlyDigits(rawValue);
  cleanedTimestamp.textContent = digits || "-";

  if (!rawValue) {
    renderEmpty(timestampResults, "输入时间戳后会在这里显示转换结果。");
    return;
  }

  if (!digits) {
    renderError(timestampResults, "没有找到数字，请输入有效的时间戳。");
    return;
  }

  if (digits.length < 9) {
    renderError(timestampResults, "时间戳太短，请检查是否输入完整。");
    return;
  }

  const { type, milliseconds } = detectTimestampType(digits);
  const date = new Date(milliseconds);

  if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
    renderError(timestampResults, "这个时间戳无法转换，请检查输入内容。");
    return;
  }

  renderRows(timestampResults, [
    { label: "时间戳类型", value: type },
    { label: "本地时间", value: formatLocal(date) },
    { label: "UTC 时间", value: date.toUTCString() },
    { label: "ISO 格式", value: date.toISOString() },
  ]);
}

function setDatetimeValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  datetimeInput.value = localDate.toISOString().slice(0, 16);
}

function updateDatetimeResults() {
  const value = datetimeInput.value;

  if (!value) {
    renderEmpty(datetimeResults, "选择日期时间后会显示秒级和毫秒级时间戳。");
    return;
  }

  const milliseconds = new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    renderError(datetimeResults, "这个日期时间无法转换，请重新选择。");
    return;
  }

  renderRows(datetimeResults, [
    { label: "秒级时间戳", value: String(Math.floor(milliseconds / 1000)) },
    { label: "毫秒级时间戳", value: String(milliseconds) },
    { label: "ISO 格式", value: new Date(milliseconds).toISOString() },
  ]);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast("已复制");
  } catch {
    showToast("复制失败，请手动复制");
  }
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

document.addEventListener("click", (event) => {
  const copyButton = event.target.closest(".copy-button");
  if (copyButton) {
    copyText(copyButton.dataset.copyValue);
  }
});

timestampInput.addEventListener("input", updateTimestampResults);
datetimeInput.addEventListener("input", updateDatetimeResults);

clearTimestamp.addEventListener("click", () => {
  timestampInput.value = "";
  updateTimestampResults();
  timestampInput.focus();
});

useNow.addEventListener("click", () => {
  setDatetimeValue(new Date());
  updateDatetimeResults();
});

timestampInput.value = "1,784,512,772,868";
setDatetimeValue(new Date());
updateTimestampResults();
updateDatetimeResults();
