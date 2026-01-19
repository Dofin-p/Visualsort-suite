const chart = document.getElementById("chart");
const input = document.getElementById("input-values");
const applyBtn = document.getElementById("apply-btn");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const errorEl = document.getElementById("error");
const statusAlgo = document.getElementById("status-algo");
const statusI = document.getElementById("status-i");
const statusJ = document.getElementById("status-j");
const statusMin = document.getElementById("status-min");
const statusMinWrap = document.getElementById("status-min-wrap");
const statusKey = document.getElementById("status-key");
const statusKeyWrap = document.getElementById("status-key-wrap");
const statusPivot = document.getElementById("status-pivot");
const statusPivotWrap = document.getElementById("status-pivot-wrap");
const statusRange = document.getElementById("status-range");
const statusRangeWrap = document.getElementById("status-range-wrap");
const statusStep = document.getElementById("status-step");
const logList = document.getElementById("log-list");
const codeContainer = document.getElementById("code-lines");
const tabs = document.querySelectorAll(".tab");
const heroEyebrow = document.getElementById("hero-eyebrow");
const heroTitle = document.getElementById("hero-title");
const heroSub = document.getElementById("hero-sub");
const mainTitle = document.getElementById("main-title");

const DEFAULT_VALUES = [8, 3, 1, 5, 2, 7];
const MAX_ITEMS = 15;
const STEP_INTERVAL = 700;

const ALGORITHMS = {
  bubble: {
    key: "bubble",
    label: "Bubble Sort",
    short: "Bubble",
    title: "隣同士の交換が見えるバブルソート",
    description: "右端へ大きな値が泡のように浮かび上がる様子を、コード行と同期して追いかけます。",
    mainTitle: "バブルソート可視化",
    code: [
      "for (let i = 0; i < n - 1; i++) {",
      "  let swapped = false;",
      "  for (let j = 0; j < n - i - 1; j++) {",
      "    // compare",
      "    if (arr[j] > arr[j + 1]) {",
      "      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];",
      "      swapped = true;",
      "    }",
      "  }",
      "  if (!swapped) break;",
      "}",
    ],
    generator: generateBubbleSteps,
  },
  selection: {
    key: "selection",
    label: "Selection Sort",
    short: "Select",
    title: "最小値を選んで先頭へ送るセレクションソート",
    description: "未確定領域から最小値を探し、紫のハイライトで追跡しながら左端に並べます。",
    mainTitle: "選択ソート可視化",
    code: [
      "for (let i = 0; i < n - 1; i++) {",
      "  let minIdx = i;",
      "  for (let j = i + 1; j < n; j++) {",
      "    if (arr[j] < arr[minIdx]) {",
      "      minIdx = j;",
      "    }",
      "  }",
      "  if (minIdx !== i) {",
      "    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];",
      "  }",
      "}",
    ],
    generator: generateSelectionSteps,
  },
  insertion: {
    key: "insertion",
    label: "Insertion Sort",
    short: "Insert",
    title: "手札を揃えるように滑り込む挿入ソート",
    description: "1枚ずつ適切な位置へ潜り込む動きを、左側の整列エリアとともに可視化します。",
    mainTitle: "挿入ソート可視化",
    code: [
      "for (let i = 1; i < n; i++) {",
      "  let j = i;",
      "  while (j > 0 && arr[j - 1] > arr[j]) {",
      "    [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];",
      "    j--;",
      "  }",
      "}",
    ],
    generator: generateInsertionSteps,
  },
  quick: {
    key: "quick",
    label: "Quick Sort",
    short: "Quick",
    title: "ピボットを基準に左右へ分割するクイックソート",
    description: "ピボット選択→分割→再帰の流れを、範囲とピボットを追跡しながら理解できます。",
    mainTitle: "クイックソート可視化",
    code: [
      "function quick(arr, low, high) {",
      "  if (low >= high) return;",
      "  const pivot = arr[high];",
      "  let i = low;",
      "  for (let j = low; j < high; j++) {",
      "    if (arr[j] < pivot) swap(arr, i++, j);",
      "  }",
      "  swap(arr, i, high);",
      "  quick(arr, low, i - 1);",
      "  quick(arr, i + 1, high);",
      "}",
    ],
    generator: generateQuickSteps,
  },
};

let steps = [];
let codeLineElements = [];
let currentStep = 0;
let playing = false;
let timer = null;
let currentValues = [...DEFAULT_VALUES];
let currentAlgo = "bubble";
const barMap = new Map();

function toSnapshot(items) {
  return items.map((item) => ({ id: item.id, value: item.value }));
}

function createItems(values) {
  const stamp = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;
  return values.map((value, index) => ({
    id: `${stamp}-${index}`,
    value,
  }));
}

function makeLeftSorted(count) {
  return Array.from({ length: Math.max(0, count) }, (_, idx) => idx);
}

function makeRightSorted(boundary, length) {
  const sorted = [];
  for (let idx = boundary + 1; idx < length; idx++) {
    sorted.push(idx);
  }
  return sorted;
}

function pushStep(stepList, payload) {
  stepList.push({
    active: payload.active ?? [],
    special: payload.special ?? [],
    sortedIndices: payload.sortedIndices ?? null,
    sortedIndex: payload.sortedIndex ?? null,
    keyValue: payload.keyValue ?? null,
    minIdx: payload.minIdx ?? null,
    pivotValue: payload.pivotValue ?? null,
    rangeLow: payload.rangeLow ?? null,
    rangeHigh: payload.rangeHigh ?? null,
    ...payload,
    array: toSnapshot(payload.array),
  });
}

function generateBubbleSteps(values) {
  const arr = createItems(values);
  const list = [];
  let sortedBoundary = values.length - 1;

  pushStep(list, {
    type: "start",
    i: null,
    j: null,
    active: [],
    sortedIndex: sortedBoundary,
    array: arr,
    line: 1,
    log: "ソートを開始します。",
  });

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
        log: `${left}と${right}を比較します。`,
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
          log: `${left}の方が大きいので交換します。`,
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
      sortedIndices: makeRightSorted(sortedBoundary, arr.length),
      array: arr,
      line: 9,
      log: "右端の値が確定しました。",
    });

    if (!swapped) {
      pushStep(list, {
        type: "sorted-all",
        i,
        j: null,
        active: [],
        sortedIndex: -1,
        sortedIndices: makeLeftSorted(arr.length),
        array: arr,
        line: 10,
        log: "交換が発生しないので終了します。",
      });
      break;
    }
  }

  return list;
}

function generateSelectionSteps(values) {
  const arr = createItems(values);
  const list = [];

  pushStep(list, {
    type: "start",
    i: null,
    j: null,
    active: [],
    special: [],
    sortedIndices: [],
    array: arr,
    line: 1,
    log: "最小値探索を開始します。",
  });

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    pushStep(list, {
      type: "mark-min",
      i,
      j: null,
      active: [i],
      special: [minIdx],
      sortedIndices: makeLeftSorted(i),
      array: arr,
      line: 2,
      minIdx,
      log: `${arr[i].value}を暫定最小値とします。`,
    });

    for (let j = i + 1; j < arr.length; j++) {
      const candidate = arr[j].value;
      const currentMin = arr[minIdx].value;
      pushStep(list, {
        type: "compare",
        i,
        j,
        active: [j],
        special: [minIdx],
        sortedIndices: makeLeftSorted(i),
        array: arr,
        line: 4,
        minIdx,
        log: `${candidate}と最小値${currentMin}を比較します。`,
      });

      if (candidate < currentMin) {
        minIdx = j;
        pushStep(list, {
          type: "mark-min",
          i,
          j,
          active: [j],
          special: [minIdx],
          sortedIndices: makeLeftSorted(i),
          array: arr,
          line: 5,
          minIdx,
          log: `${candidate}が新しい最小値です。`,
        });
      }
    }

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      pushStep(list, {
        type: "swap",
        i,
        j: minIdx,
        active: [i, minIdx],
        special: [minIdx],
        sortedIndices: makeLeftSorted(i),
        array: arr,
        line: 9,
        minIdx,
        log: `${i}番目と${minIdx}番目を交換します。`,
      });
    }

    const sorted = makeLeftSorted(i + 1);
    pushStep(list, {
      type: "sorted",
      i,
      j: null,
      active: [],
      special: [],
      sortedIndices: sorted,
      array: arr,
      line: 11,
      minIdx: null,
      log: `${i}番目の要素を確定しました。`,
    });
  }

  pushStep(list, {
    type: "sorted-all",
    i: null,
    j: null,
    active: [],
    special: [],
    sortedIndices: makeLeftSorted(arr.length),
    array: arr,
    line: 11,
    minIdx: null,
    log: "全て整列しました。",
  });

  return list;
}

function generateInsertionSteps(values) {
  const arr = createItems(values);
  const list = [];

  pushStep(list, {
    type: "start",
    i: null,
    j: null,
    active: [],
    array: arr,
    line: 1,
    log: "挿入ソートを開始します。",
  });

  for (let i = 1; i < arr.length; i++) {
    let j = i;
    const keyValue = arr[i].value;

    pushStep(list, {
      type: "activate",
      i,
      j,
      active: [i],
      sortedIndices: makeLeftSorted(i),
      array: arr,
      line: 2,
      keyValue,
      log: `${keyValue}の挿入位置を探します。`,
    });

    while (j > 0) {
      const left = arr[j - 1].value;
      const current = arr[j].value;
      pushStep(list, {
        type: "compare",
        i,
        j,
        active: [j - 1, j],
        sortedIndices: makeLeftSorted(i),
        array: arr,
        line: 3,
        keyValue,
        log: `${left}と${current}を比較します。`,
      });

      if (left <= current) {
        break;
      }

      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      pushStep(list, {
        type: "swap",
        i,
        j,
        active: [j - 1, j],
        sortedIndices: makeLeftSorted(i),
        array: arr,
        line: 4,
        keyValue,
        log: `${current}を左へ移動します。`,
      });

      j -= 1;
    }

    const sorted = makeLeftSorted(i + 1);
    pushStep(list, {
      type: "sorted",
      i,
      j,
      active: [j],
      sortedIndices: sorted,
      array: arr,
      line: 7,
      keyValue,
      log: `${i}番目まで整列済みです。`,
    });
  }

  pushStep(list, {
    type: "sorted-all",
    i: null,
    j: null,
    active: [],
    sortedIndices: makeLeftSorted(arr.length),
    array: arr,
    line: 7,
    log: "全て整列しました。",
  });

  return list;
}

function generateQuickSteps(values) {
  const arr = createItems(values);
  const list = [];
  const sortedSet = new Set();

  pushStep(list, {
    type: "start",
    i: null,
    j: null,
    active: [],
    array: arr,
    line: 1,
    log: "クイックソートを開始します。",
  });

  const stack = [];
  if (arr.length > 0) {
    stack.push({ low: 0, high: arr.length - 1 });
  }

  while (stack.length) {
    const { low, high } = stack.pop();

    if (low >= high) {
      sortedSet.add(low);
      pushStep(list, {
        type: "sorted",
        i: null,
        j: null,
        active: [],
        sortedIndices: Array.from(sortedSet),
        array: arr,
        line: 2,
        rangeLow: low,
        rangeHigh: high,
        log: `区間 ${low}-${high} は要素数1のため確定です。`,
      });
      continue;
    }

    const pivotIdx = high;
    const pivotValue = arr[pivotIdx].value;
    let store = low;

    pushStep(list, {
      type: "pivot",
      i: null,
      j: null,
      active: [pivotIdx],
      special: [pivotIdx],
      sortedIndices: Array.from(sortedSet),
      array: arr,
      line: 3,
      pivotValue,
      rangeLow: low,
      rangeHigh: high,
      log: `区間 ${low}-${high} のピボットを ${pivotValue} に設定します。`,
    });

    for (let j = low; j < high; j++) {
      const current = arr[j].value;
      pushStep(list, {
        type: "compare",
        i: null,
        j,
        active: [j, pivotIdx],
        special: [pivotIdx],
        sortedIndices: Array.from(sortedSet),
        array: arr,
        line: 5,
        pivotValue,
        rangeLow: low,
        rangeHigh: high,
        log: `${current} とピボット ${pivotValue} を比較します。`,
      });

      if (current < pivotValue) {
        if (store !== j) {
          [arr[store], arr[j]] = [arr[j], arr[store]];
          pushStep(list, {
            type: "swap",
            i: null,
            j,
            active: [store, j],
            special: [pivotIdx],
            sortedIndices: Array.from(sortedSet),
            array: arr,
            line: 6,
            pivotValue,
            rangeLow: low,
            rangeHigh: high,
            log: `${current} を左側へ移動します。`,
          });
        }
        store += 1;
      }
    }

    if (store !== pivotIdx) {
      [arr[store], arr[pivotIdx]] = [arr[pivotIdx], arr[store]];
      pushStep(list, {
        type: "swap",
        i: null,
        j: pivotIdx,
        active: [store, pivotIdx],
        special: [store],
        sortedIndices: Array.from(sortedSet),
        array: arr,
        line: 8,
        pivotValue,
        rangeLow: low,
        rangeHigh: high,
        log: `ピボットを位置 ${store} に確定させます。`,
      });
    }

    sortedSet.add(store);
    pushStep(list, {
      type: "sorted",
      i: null,
      j: null,
      active: [store],
      special: [],
      sortedIndices: Array.from(sortedSet),
      array: arr,
      line: 8,
      pivotValue,
      rangeLow: low,
      rangeHigh: high,
      log: `ピボット ${pivotValue} を確定し、左右を分割します。`,
    });

    const leftHigh = store - 1;
    const rightLow = store + 1;
    if (leftHigh >= low) {
      stack.push({ low, high: leftHigh });
      pushStep(list, {
        type: "recurse",
        i: null,
        j: null,
        active: [],
        sortedIndices: Array.from(sortedSet),
        array: arr,
        line: 9,
        pivotValue,
        rangeLow: low,
        rangeHigh: leftHigh,
        log: `左区間 ${low}-${leftHigh} を再帰的に処理します。`,
      });
    }
    if (high >= rightLow) {
      stack.push({ low: rightLow, high });
      pushStep(list, {
        type: "recurse",
        i: null,
        j: null,
        active: [],
        sortedIndices: Array.from(sortedSet),
        array: arr,
        line: 10,
        pivotValue,
        rangeLow: rightLow,
        rangeHigh: high,
        log: `右区間 ${rightLow}-${high} を再帰的に処理します。`,
      });
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
  chart.style.setProperty("--count", items.length || 1);
  ensureBars(items);
  const maxValue = Math.max(...items.map((item) => item.value), 0);
  const sortedSet = new Set(step.sortedIndices || []);

  items.forEach((item, index) => {
    const bar = barMap.get(item.id);
    if (!bar) return;
    const height = maxValue ? (item.value / maxValue) * 100 : 0;
    const translate = `translateX(${index * 100}%)`;
    bar.style.transform = translate;
    bar.style.height = `${height}%`;
    const inner = bar.querySelector(".bar-inner");
    inner.textContent = item.value.toString();

    const isSortedByBoundary =
      typeof step.sortedIndex === "number" &&
      (step.sortedIndex < 0 || index > step.sortedIndex);
    const isSorted =
      (sortedSet.size > 0 && sortedSet.has(index)) || isSortedByBoundary;

    bar.classList.toggle("active", step.active?.includes(index));
    bar.classList.toggle(
      "swapping",
      step.type === "swap" && step.active?.includes(index)
    );
    bar.classList.toggle("sorted", isSorted);
    bar.classList.toggle("mark", step.special?.includes(index));
  });
}

function updateStatus(step) {
  statusAlgo.textContent = ALGORITHMS[currentAlgo].short;
  statusI.textContent = step.i === null || step.i === undefined ? "-" : step.i.toString();
  statusJ.textContent = step.j === null || step.j === undefined ? "-" : step.j.toString();
  statusStep.textContent = (currentStep + 1).toString();

  const showMin = step.minIdx !== null && step.minIdx !== undefined;
  statusMinWrap.classList.toggle("show", showMin);
  statusMin.textContent = showMin ? step.minIdx.toString() : "-";

  const showKey = step.keyValue !== null && step.keyValue !== undefined;
  statusKeyWrap.classList.toggle("show", showKey);
  statusKey.textContent = showKey ? step.keyValue.toString() : "-";

  const showPivot = step.pivotValue !== null && step.pivotValue !== undefined;
  statusPivotWrap.classList.toggle("show", showPivot);
  statusPivot.textContent = showPivot ? step.pivotValue.toString() : "-";

  const showRange =
    step.rangeLow !== null &&
    step.rangeLow !== undefined &&
    step.rangeHigh !== null &&
    step.rangeHigh !== undefined;
  statusRangeWrap.classList.toggle("show", showRange);
  statusRange.textContent = showRange
    ? `${step.rangeLow}-${step.rangeHigh}`
    : "-";
}

function updateLog(index) {
  logList.innerHTML = "";
  const logs = steps.slice(0, index + 1).map((step) => step.log || "");
  logs.slice(-6).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    logList.appendChild(li);
  });
}

function highlightLine(line) {
  codeLineElements.forEach((li) => {
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
  const nextIndex = Math.min(Math.max(currentStep + delta, 0), steps.length - 1);
  currentStep = nextIndex;
  renderStep(currentStep);
}

function setCodeLines(lines) {
  codeContainer.innerHTML = "";
  codeLineElements = lines.map((line, idx) => {
    const li = document.createElement("li");
    li.dataset.line = (idx + 1).toString();
    li.textContent = line;
    codeContainer.appendChild(li);
    return li;
  });
}

function setNewValues(values) {
  currentValues = [...values];
  stopPlaying();
  barMap.clear();
  chart.innerHTML = "";
  const generator = ALGORITHMS[currentAlgo].generator;
  steps = generator(values);
  currentStep = 0;
  renderStep(currentStep);
}

function setAlgorithm(algoKey, options = { regenerate: true }) {
  const config = ALGORITHMS[algoKey];
  if (!config) return;
  currentAlgo = algoKey;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.algo === algoKey;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  heroEyebrow.textContent = config.label;
  heroTitle.textContent = config.title;
  heroSub.textContent = config.description;
  mainTitle.textContent = config.mainTitle;
  setCodeLines(config.code);
  if (options.regenerate) {
    setNewValues(currentValues);
  }
}

applyBtn.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) {
    clearError();
    setNewValues(DEFAULT_VALUES);
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

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const algoKey = tab.dataset.algo;
    setAlgorithm(algoKey);
  });
});

setAlgorithm(currentAlgo, { regenerate: false });
setNewValues(currentValues);
