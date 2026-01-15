const chart = document.getElementById("chart");
const input = document.getElementById("input-values");
const applyBtn = document.getElementById("apply-btn");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const errorEl = document.getElementById("error");
const statusI = document.getElementById("status-i");
const statusJ = document.getElementById("status-j");
const statusStep = document.getElementById("status-step");
const logList = document.getElementById("log-list");
const codeLines = document.querySelectorAll("#code-lines li");

const DEFAULT_VALUES = [8, 3, 1, 5, 2, 7];
const MAX_ITEMS = 15;
const STEP_INTERVAL = 700;

let steps = [];
let currentStep = 0;
let playing = false;
let timer = null;
const barMap = new Map();

function toSnapshot(items) {
  return items.map((item) => ({ id: item.id, value: item.value }));
}

function makeLog(message) {
  return message;
}

function pushStep(stepList, payload) {
  stepList.push({
    ...payload,
    array: toSnapshot(payload.array),
  });
}

function generateSteps(values) {
  const arr = values.map((value, index) => ({
    id: `${Date.now()}-${index}-${value}`,
    value,
  }));
  const list = [];

  pushStep(list, {
    type: "start",
    i: null,
    j: null,
    active: [],
    sortedIndex: values.length - 1,
    array: arr,
    line: 1,
    log: makeLog("ソートを開始します。"),
  });

  let sortedBoundary = values.length - 1;

  for (let i = 0; i < arr.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j++) {
      const left = arr[j].value;
      const right = arr[j + 1].value;
      pushStep(list, {
        type: "compare",
        i,
        j,
        active: [j, j + 1],
        sortedIndex: sortedBoundary,
        array: arr,
        line: 5,
        log: makeLog(
          `${left}と${right}を比較します。`
        ),
      });

      if (left > right) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        pushStep(list, {
          type: "swap",
          i,
          j,
          active: [j, j + 1],
          sortedIndex: sortedBoundary,
          array: arr,
          line: 6,
          log: makeLog(
            `${left}の方が大きいので交換します。`
          ),
        });
      }
    }
    sortedBoundary = arr.length - i - 2;
    pushStep(list, {
      type: "sorted",
      i,
      j: null,
      active: [],
      sortedIndex: sortedBoundary,
      array: arr,
      line: 9,
      log: makeLog("右端の値が確定しました。"),
    });

    if (!swapped) {
      pushStep(list, {
        type: "sorted-all",
        i,
        j: null,
        active: [],
        sortedIndex: -1,
        array: arr,
        line: 10,
        log: makeLog("交換が発生しないので終了します。"),
      });
      break;
    }
  }

  return list;
}

function setError(message) {
  errorEl.textContent = message;
}

function clearError() {
  errorEl.textContent = "";
}

function isFullWidth(inputValue) {
  return /[０-９]/.test(inputValue);
}

function parseInput(value) {
  if (isFullWidth(value)) {
    return { error: "半角数字をカンマ区切りで入力してください。" };
  }
  if (!/^\s*\d+(\s*,\s*\d+)*\s*$/.test(value)) {
    return { error: "半角数字をカンマ区切りで入力してください。" };
  }
  const numbers = value
    .split(",")
    .map((num) => Number(num.trim()))
    .filter((num) => Number.isFinite(num));
  if (numbers.length > MAX_ITEMS) {
    return { error: "画面に収まりきらないため、15個以下に調整してください。" };
  }
  return { numbers };
}

function ensureBars(items) {
  items.forEach((item) => {
    if (barMap.has(item.id)) return;
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.dataset.id = item.id;
    const inner = document.createElement("div");
    inner.className = "bar-inner";
    const label = document.createElement("span");
    inner.appendChild(label);
    bar.appendChild(inner);
    chart.appendChild(bar);
    barMap.set(item.id, bar);
  });
}

function updateBars(step) {
  const items = step.array;
  chart.style.setProperty("--count", items.length);
  ensureBars(items);
  const maxValue = Math.max(...items.map((item) => item.value));

  items.forEach((item, index) => {
    const bar = barMap.get(item.id);
    if (!bar) return;
    const height = maxValue ? (item.value / maxValue) * 100 : 0;
    const translate = `translateX(${index * 100}%)`;
    bar.style.transform = translate;
    bar.style.height = `${height}%`;
    const inner = bar.querySelector(".bar-inner");
    inner.textContent = item.value.toString();
    bar.classList.toggle("active", step.active.includes(index));
    bar.classList.toggle("swapping", step.type === "swap" && step.active.includes(index));
    const isSorted =
      step.sortedIndex < 0 || index > step.sortedIndex;
    bar.classList.toggle("sorted", isSorted);
  });
}

function updateStatus(step) {
  statusI.textContent = step.i === null ? "-" : step.i.toString();
  statusJ.textContent = step.j === null ? "-" : step.j.toString();
  statusStep.textContent = (currentStep + 1).toString();
}

function updateLog(index) {
  logList.innerHTML = "";
  const logs = steps.slice(0, index + 1).map((step) => step.log);
  logs.slice(-6).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    logList.appendChild(li);
  });
}

function highlightLine(line) {
  codeLines.forEach((li) => {
    li.classList.toggle("active", Number(li.dataset.line) === line);
  });
}

function renderStep(index) {
  const step = steps[index];
  if (!step) return;
  updateBars(step);
  updateStatus(step);
  updateLog(index);
  highlightLine(step.line);
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === steps.length - 1;
}

function stopPlaying() {
  playing = false;
  playBtn.textContent = "Play";
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function play() {
  if (playing) {
    stopPlaying();
    return;
  }
  playing = true;
  playBtn.textContent = "Pause";
  timer = setInterval(() => {
    if (currentStep >= steps.length - 1) {
      stopPlaying();
      return;
    }
    currentStep += 1;
    renderStep(currentStep);
  }, STEP_INTERVAL);
}

function goStep(delta) {
  stopPlaying();
  const nextIndex = Math.min(
    Math.max(currentStep + delta, 0),
    steps.length - 1
  );
  currentStep = nextIndex;
  renderStep(currentStep);
}

function setNewValues(values) {
  barMap.clear();
  chart.innerHTML = "";
  steps = generateSteps(values);
  currentStep = 0;
  renderStep(currentStep);
}

applyBtn.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) {
    setNewValues(DEFAULT_VALUES);
    clearError();
    return;
  }
  const result = parseInput(value);
  if (result.error) {
    setError(result.error);
    return;
  }
  clearError();
  setNewValues(result.numbers);
});

playBtn.addEventListener("click", play);
prevBtn.addEventListener("click", () => goStep(-1));
nextBtn.addEventListener("click", () => goStep(1));

setNewValues(DEFAULT_VALUES);
