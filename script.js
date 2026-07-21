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

function normalizeDigits(line) {
  const normalized = line.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 48)
  );

  return normalized.replace(/[，\uFF0C\u3001]/g, ",");
}

function isDigit(ch) {
  return ch >= "0" && ch <= "9";
}

function isAsciiLetter(ch) {
  return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
}

function isTimestampSeparator(ch) {
  return ch === "," || ch === "_";
}

function hasSupportedTimestampLength(value) {
  return /^\d{10,13}$/.test(value);
}

function extractTimestampCandidates(line) {
  const normalized = normalizeDigits(line);
  const candidates = [];
  const seen = new Set();

  function addCandidate(candidate) {
    const digits = candidate.replace(/[,\s_]/g, "");

    if (hasSupportedTimestampLength(digits) && !seen.has(candidate)) {
      seen.add(candidate);
      candidates.push(candidate);
    }
  }

  for (let start = 0; start < normalized.length; start++) {
    const previous = normalized[start - 1] || "";

    if (
      !isDigit(normalized[start]) ||
      isDigit(previous) ||
      isAsciiLetter(previous) ||
      isTimestampSeparator(previous)
    ) {
      continue;
    }

    let candidate = "";
    let digitCount = 0;

    for (let end = start; end < normalized.length; end++) {
      const ch = normalized[end];

      if (isDigit(ch)) {
        digitCount += 1;
      } else if (isTimestampSeparator(ch)) {
        // Keep scanning through numeric separators.
      } else {
        break;
      }

      candidate += ch;

      if (digitCount > 13) {
        break;
      }

      const next = normalized[end + 1] || "";
      const digits = candidate.replace(/[,\s_]/g, "");

      if (
        isDigit(ch) &&
        hasSupportedTimestampLength(digits) &&
        !isDigit(next) &&
        !isAsciiLetter(next) &&
        !isTimestampSeparator(next)
      ) {
        addCandidate(candidate);
      }
    }
  }

  const spacedTimestampPattern = /(?:^|[^\dA-Za-z])(\d{1,4}(?:\s+\d{1,4}){2,6})(?=$|[^\dA-Za-z])/g;
  let match;

  while ((match = spacedTimestampPattern.exec(normalized)) !== null) {
    addCandidate(match[1]);
  }

  return candidates;
}

function extractErrorCodes(line) {
  const matches = line.match(/\b0x[0-9a-f]{8}\b/gi) || [];
  return [...new Set(matches)];
}

function detectTimestampType(candidate) {
  const digits = candidate.replace(/[,\s_]/g, "");
  const secondsDigits = digits.slice(0, 10);

  if (/^\d{10,13}$/.test(digits)) {
    return {
      type: "秒级",
      digits: secondsDigits,
      milliseconds: Number(secondsDigits) * 1000,
      note: "",
    };
  }

  return null;
}

function isReasonableTimestamp(milliseconds) {
  const date = new Date(milliseconds);
  const min = new Date("2000-01-01T00:00:00Z").getTime();
  const max = Date.now() + 365 * 24 * 60 * 60 * 1000;

  return (
    Number.isFinite(milliseconds) &&
    !Number.isNaN(date.getTime()) &&
    milliseconds >= min &&
    milliseconds <= max
  );
}

function renderEmpty(target) {
  target.innerHTML = "";
}

function renderRows(target, rows) {
  target.innerHTML = "";

  rows.forEach(({ label, value, note, errorCodes }) => {
    const row = rowTemplate.content.cloneNode(true);
    const noteEl = row.querySelector(".result-note");
    const errorCodesEl = row.querySelector(".result-error-codes");
    row.querySelector(".result-source").textContent = label;
    row.querySelector(".result-value").textContent = value;
    errorCodesEl.textContent = errorCodes.join(" ");
    errorCodesEl.hidden = errorCodes.length === 0;
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

  const rows = lines
    .flatMap((line) => {
      const errorCodes = extractErrorCodes(line);

      return extractTimestampCandidates(line)
        .map((candidate) => {
          const parsed = detectTimestampType(candidate);

          if (!parsed || !isReasonableTimestamp(parsed.milliseconds)) {
            return null;
          }

          return {
            label: line,
            value: formatLocal(new Date(parsed.milliseconds)),
            note: parsed.note,
            errorCodes,
          };
        })
        .filter(Boolean);
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

function replaceInputValue(value) {
  timestampInput.focus();
  timestampInput.select();

  if (typeof document.execCommand === "function" && document.execCommand("insertText", false, value)) {
    return;
  }

  timestampInput.setRangeText(value, 0, timestampInput.value.length, "end");
  updateTimestampResults();
}

timestampInput.addEventListener("input", updateTimestampResults);

pasteTimestamp.addEventListener("click", async () => {
  timestampInput.focus();

  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      if (typeof text === "string" && text) {
        replaceInputValue(text);
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
  replaceInputValue("");
});

updateTimestampResults();
