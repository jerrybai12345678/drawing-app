const canvas = document.getElementById("canvas");
const area = document.getElementById("canvas-area");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("color-picker");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

// Make the canvas fill its area
canvas.width = area.clientWidth;
canvas.height = area.clientHeight;

// ----- Undo / redo history -----
const MAX_HISTORY = 30;
let undoStack = [];
let redoStack = [];

function snapshot() {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateButtons() {
  undoBtn.disabled = undoStack.length <= 1;
  redoBtn.disabled = redoStack.length === 0;
}

function saveState() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateButtons();
}

function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
  updateButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  const state = redoStack.pop();
  undoStack.push(state);
  ctx.putImageData(state, 0, 0);
  updateButtons();
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// Save the blank canvas as the starting point
saveState();

// ----- Drawing -----
let drawing = false;

function endStroke() {
  if (!drawing) return;
  drawing = false;
  saveState();
}

canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointerleave", endStroke);
canvas.addEventListener("pointercancel", endStroke);
canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = e.pressure * 10 || 5;
  ctx.lineCap = "round";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
