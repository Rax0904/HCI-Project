(() => {
  const TRIAL_COUNT = 5;
  const names = { green: "Green", red: "Red", both: "Both" };
  const targetSelect = document.querySelector("#target");
  const startButton = document.querySelector("#start");
  const downloadButton = document.querySelector("#download");
  const stimulus = document.querySelector("#stimulus");
  const status = document.querySelector("#status");
  const summary = document.querySelector("#summary");
  let rows = [];
  let run = null;

  function clearTimer() {
    if (run?.timer) clearTimeout(run.timer);
    if (run) run.timer = null;
  }

  function planNext() {
    if (!run || run.index >= TRIAL_COUNT) return finish();
    const delayMs = 1000 + Math.random() * 4000;
    run.timer = setTimeout(showTrial, delayMs);
    status.textContent = `Get ready… (${run.index + 1} of ${TRIAL_COUNT})`;
  }

  function showTrial() {
    if (!run) return;
    run.timer = null;
    const color = run.target === "both"
      ? ["green", "red"][Math.floor(Math.random() * 2)]
      : run.target;
    run.current = { color, shownAt: performance.now(), clicked: false };
    stimulus.className = color;
    status.textContent = `Flash ${run.index + 1} of ${TRIAL_COUNT}`;
    run.timer = setTimeout(() => {
      if (!run?.current) return;
      const missed = run.current;
      record({ ...missed, number: run.index + 1 }, null);
      run.current = null;
      nextAfterFlash("Target missed. Get ready for the next flash.");
    }, 1500);
  }

  function record(trial, reactionMs) {
    rows.push({
      trial_no: trial.number,
      target_colour: names[trial.color],
      reaction_time_ms: reactionMs == null ? "" : reactionMs.toFixed(2)
    });
  }

  function nextAfterFlash(message) {
    clearTimer();
    stimulus.className = "";
    run.index++;
    status.textContent = message;
    if (run.index >= TRIAL_COUNT) setTimeout(() => run && finish(), 650);
    else run.timer = setTimeout(planNext, 650);
  }

  stimulus.addEventListener("click", () => {
    if (!run?.current || run.current.clicked) return;
    const trial = run.current;
    trial.clicked = true;
    const reaction = performance.now() - trial.shownAt;
    record({ ...trial, number: run.index + 1 }, reaction);
    run.current = null;
    nextAfterFlash(`Recorded: ${reaction.toFixed(0)} ms`);
  });

  function finish() {
    if (!run) return;
    clearTimer();
    const target = names[run.target];
    const completed = rows.filter(row => row.reaction_time_ms !== "");
    const mean = completed.length ? completed.reduce((sum, row) => sum + Number(row.reaction_time_ms), 0) / completed.length : null;
    stimulus.className = "";
    status.textContent = "Test complete.";
    summary.textContent = `${completed.length} reaction time${completed.length === 1 ? "" : "s"} recorded for ${target}${mean == null ? "" : ` · mean ${mean.toFixed(0)} ms`}.`;
    run = null;
    startButton.disabled = false;
    targetSelect.disabled = false;
    downloadButton.disabled = rows.length === 0;
  }

  startButton.addEventListener("click", () => {
    rows = [];
    run = { target: targetSelect.value, index: 0, current: null, timer: null };
    startButton.disabled = true;
    targetSelect.disabled = true;
    downloadButton.disabled = true;
    summary.textContent = "";
    stimulus.className = "";
    status.textContent = `Your target is ${names[run.target]}. Wait for the first flash.`;
    planNext();
  });

  downloadButton.addEventListener("click", () => {
    const columns = ["trial_no", "target_colour", "reaction_time_ms"];
    const escapeCsv = value => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [columns.join(","), ...rows.map(row => columns.map(column => escapeCsv(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reaction-times-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });
})();
