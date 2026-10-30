const canvas = document.getElementById("canvas");
const area = document.getElementById("canvas-area");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("color-picker");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const sizeSlider = document.getElementById("size-slider");
const sizeValue = document.getElementById("size-value");
const brushBtn = document.getElementById("brush-btn");
const eraserBtn = document.getElementById("eraser-btn");

// Make the canvas fill its area
canvas.width = area.clientWidth;
canvas.height = area.clientHeight;

// ----- Tool settings -----
let brushSize = 10;
let erasing = false;

sizeSlider.addEventListener("input", () => {
  brushSize = Number(sizeSlider.value);
  sizeValue.textContent = brushSize;
});

function setTool(isEraser) {
  erasing = isEraser;
  brushBtn.classList.toggle("active", !isEraser);
  eraserBtn.classList.toggle("active", isEraser);
}

brushBtn.addEventListener("click", () => setTool(false));
eraserBtn.addEventListener("click", () => setTool(true));

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
  ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = brushSize * (e.pressure || 0.5) * 2;
  ctx.lineCap = "round";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
// ----- Block pinch-zoom on the page -----
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());

// ----- Resize canvas when the iPad rotates -----
function resizeCanvas() {
  const newWidth = area.clientWidth;
  const newHeight = area.clientHeight;
  if (newWidth === canvas.width && newHeight === canvas.height) return;

  // Save the current drawing on a temporary canvas
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext("2d").drawImage(canvas, 0, 0);

  // Resize (this clears the main canvas), then put the drawing back
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(temp, 0, 0);

  // Old undo snapshots have the wrong size now, so start history fresh
  undoStack = [];
  redoStack = [];
  saveState();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 200));
