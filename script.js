const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverElement = document.getElementById("gameOver");
const finalScoreElement = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const startMessageElement = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const gameContainer = document.querySelector(".game-container");
const canvasContainer = document.querySelector(".canvas-container");

// --- Game Constants ---
const GRID_SIZE = 20;
let CANVAS_WIDTH, CANVAS_HEIGHT;
let CELL_SIZE;

// --- MODIFICATION: Define gradient start/end colors ---
const SNAKE_HEAD_COLOR_RGB = [22, 101, 52]; // Dark Green (rgb(22, 101, 52))
const SNAKE_TAIL_COLOR_RGB = [134, 239, 172]; // Lighter Green (tailwind green-400)

const FOOD_COLOR = "#ef4444";
const BORDER_COLOR = "#555555"; // Slightly lighter border for contrast on white
const INITIAL_SPEED_MS = 150;

// --- Game State ---
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let changingDirection = false;
let gameLoopInterval = null;
let gameActive = false;
let currentSpeed = INITIAL_SPEED_MS;

// --- Touch Controls ---
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// --- Functions ---

function calculateCanvasSize() {
  const containerWidth = canvasContainer.clientWidth;
  CELL_SIZE = Math.floor(containerWidth / GRID_SIZE);
  CANVAS_WIDTH = CELL_SIZE * GRID_SIZE;
  CANVAS_HEIGHT = CELL_SIZE * GRID_SIZE;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const maxHeight = window.innerHeight * 0.6;
  if (CANVAS_HEIGHT > maxHeight) {
    CELL_SIZE = Math.floor(maxHeight / GRID_SIZE);
    CANVAS_WIDTH = CELL_SIZE * GRID_SIZE;
    CANVAS_HEIGHT = CELL_SIZE * GRID_SIZE;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }
}

function clearCanvas() {
  // --- MODIFICATION: Explicitly clear with white ---
  ctx.fillStyle = "#ffffff"; // White background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Function to interpolate between two RGB colors
function interpolateColor(color1, color2, factor) {
  // Factor is between 0 and 1 (0 = color1, 1 = color2)
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// --- MODIFICATION: drawSnakePart now needs index and length for gradient ---
function drawSnakePart(part, index, length) {
  let segmentColor;
  if (length <= 1) {
    // Only head exists, use head color
    segmentColor = `rgb(${SNAKE_HEAD_COLOR_RGB.join(",")})`;
  } else {
    // Calculate interpolation factor (0 for head, 1 for tail)
    const factor = index / (length - 1);
    segmentColor = interpolateColor(
      SNAKE_HEAD_COLOR_RGB,
      SNAKE_TAIL_COLOR_RGB,
      factor
    );
  }

  ctx.fillStyle = segmentColor;
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.fillRect(part.x * CELL_SIZE, part.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.strokeRect(part.x * CELL_SIZE, part.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// --- MODIFICATION: Pass index and length to drawSnakePart ---
function drawSnake() {
  const snakeLength = snake.length;
  snake.forEach((part, index) => {
    drawSnakePart(part, index, snakeLength);
  });
}

function drawFood() {
  ctx.fillStyle = FOOD_COLOR;
  ctx.strokeStyle = BORDER_COLOR; // Use the same border for consistency
  ctx.lineWidth = 1;
  ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function moveSnake() {
  if (!gameActive) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall Wrapping
  if (head.x < 0) head.x = GRID_SIZE - 1;
  else if (head.x >= GRID_SIZE) head.x = 0;
  if (head.y < 0) head.y = GRID_SIZE - 1;
  else if (head.y >= GRID_SIZE) head.y = 0;

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreElement.textContent = `Score: ${score}`;
    generateFood();
    if (score % 5 === 0 && currentSpeed > 50) {
      currentSpeed -= 10;
      clearInterval(gameLoopInterval);
      gameLoopInterval = setInterval(gameLoop, currentSpeed);
    }
  } else {
    snake.pop();
  }
  changingDirection = false;
}

function generateFood() {
  let newFoodX, newFoodY;
  do {
    newFoodX = Math.floor(Math.random() * GRID_SIZE);
    newFoodY = Math.floor(Math.random() * GRID_SIZE);
  } while (snake.some((part) => part.x === newFoodX && part.y === newFoodY));

  food = { x: newFoodX, y: newFoodY };
}

function handleKeyDown(event) {
  if (
    event.key === "Enter" &&
    !gameActive &&
    !gameOverElement.classList.contains("hidden")
  ) {
    startGame();
    return;
  }

  if (!gameActive || changingDirection) return;

  const keyPressed = event.key;
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  if ((keyPressed === "ArrowLeft" || keyPressed === "a") && !goingRight) {
    dx = -1;
    dy = 0;
    changingDirection = true;
  } else if ((keyPressed === "ArrowUp" || keyPressed === "w") && !goingDown) {
    dx = 0;
    dy = -1;
    changingDirection = true;
  } else if (
    (keyPressed === "ArrowRight" || keyPressed === "d") &&
    !goingLeft
  ) {
    dx = 1;
    dy = 0;
    changingDirection = true;
  } else if ((keyPressed === "ArrowDown" || keyPressed === "s") && !goingUp) {
    dx = 0;
    dy = 1;
    changingDirection = true;
  }
}

function handleTouchControl(newDx, newDy) {
  if (changingDirection || !gameActive) return;
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  if (newDx === -1 && !goingRight) {
    dx = -1;
    dy = 0;
  } else if (newDx === 1 && !goingLeft) {
    dx = 1;
    dy = 0;
  } else if (newDy === -1 && !goingDown) {
    dx = 0;
    dy = -1;
  } else if (newDy === 1 && !goingUp) {
    dx = 0;
    dy = 1;
  } else {
    return;
  }
  changingDirection = true;
}

function checkGameOver() {
  const head = snake[0];
  // Self collision check
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  return false;
}

function gameLoop() {
  if (checkGameOver()) {
    endGame();
    return;
  }
  clearCanvas();
  drawFood();
  moveSnake();
  drawSnake(); // drawSnake now handles the gradient internally
}

function startGame() {
  if (gameActive) return;
  console.log("Starting game...");
  gameActive = true;
  score = 0;
  currentSpeed = INITIAL_SPEED_MS;
  dx = 1;
  dy = 0;
  changingDirection = false;
  scoreElement.textContent = `Score: ${score}`;
  gameOverElement.classList.add("hidden");
  startMessageElement.classList.add("hidden");

  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  generateFood();
  clearCanvas();
  // Draw initial state correctly
  drawFood();
  drawSnake();

  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(gameLoop, currentSpeed);
}

function endGame() {
  console.log("Game Over!");
  gameActive = false;
  clearInterval(gameLoopInterval);
  gameLoopInterval = null;
  finalScoreElement.textContent = score;
  gameOverElement.classList.remove("hidden");
}

function showStartMessage() {
  calculateCanvasSize();
  clearCanvas();
  // Draw a representative snake/food for the start screen
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  // Create a temporary snake for drawing on start screen
  const tempSnake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];
  const tempFood = { x: startX + 2, y: startY };

  // Draw the temporary snake using the gradient logic
  const tempLength = tempSnake.length;
  tempSnake.forEach((part, index) => {
    drawSnakePart(part, index, tempLength); // Use the updated drawSnakePart
  });

  // Draw the food
  ctx.fillStyle = FOOD_COLOR;
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.fillRect(
    tempFood.x * CELL_SIZE,
    tempFood.y * CELL_SIZE,
    CELL_SIZE,
    CELL_SIZE
  );
  ctx.strokeRect(
    tempFood.x * CELL_SIZE,
    tempFood.y * CELL_SIZE,
    CELL_SIZE,
    CELL_SIZE
  );

  // Reset snake and food state variables for actual game start
  snake = [];
  food = { x: 0, y: 0 };

  startMessageElement.classList.remove("hidden");
  gameOverElement.classList.add("hidden");
}

// --- Event Listeners ---
document.addEventListener("keydown", handleKeyDown);
restartButton.addEventListener("click", startGame);
startButton.addEventListener("click", startGame);
btnUp.addEventListener("click", () => handleTouchControl(0, -1));
btnDown.addEventListener("click", () => handleTouchControl(0, 1));
btnLeft.addEventListener("click", () => handleTouchControl(-1, 0));
btnRight.addEventListener("click", () => handleTouchControl(1, 0));
window.addEventListener("resize", () => {
  calculateCanvasSize();
  if (!gameActive && !startMessageElement.classList.contains("hidden")) {
    showStartMessage(); // Redraw start message with correct elements/colors
  } else if (gameActive) {
    clearCanvas(); // Clear with white
    drawFood();
    drawSnake(); // Redraw gradient snake
  } else if (!gameOverElement.classList.contains("hidden")) {
    clearCanvas(); // Clear with white
  }
});

// Initial call
showStartMessage();
