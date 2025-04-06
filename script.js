// --- DOM Elements ---
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

// --- Audio Elements ---
const eatSound = new Audio('sounds/eat.mp3');
const gameOverSound = new Audio('sounds/game-over.mp3');

// --- Game Constants ---
const GRID_SIZE = 20; // Number of cells in the grid
let CANVAS_WIDTH, CANVAS_HEIGHT;
let CELL_SIZE;

// --- Define color gradient start/end colors ---
// Head has darker color and gradually becomes lighter towards the tail
const SNAKE_HEAD_COLOR_RGB = [22, 101, 52]; // Dark Green (rgb(22, 101, 52))
const SNAKE_TAIL_COLOR_RGB = [134, 239, 172]; // Lighter Green (tailwind green-400)

const FOOD_COLOR = "#ef4444"; // Red (tailwind red-500)
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

// dynamic canvas size based on container width(cater for different screen sizes)
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
  // --- Explicitly clear with white ---
  ctx.fillStyle = "#ffffff"; // White background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Function to interpolate between two RGB colors
// to create a gradient effect on the snake
function interpolateColor(color1, color2, factor) {
  // Factor is between 0 and 1 (0 = color1, 1 = color2)
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// --- drawSnakePart now needs index and length for gradient ---
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

  ctx.fillStyle = segmentColor; // fill with gradient color
  ctx.strokeStyle = BORDER_COLOR; // border color
  ctx.lineWidth = 1; 

  // draw the snake part
  ctx.fillRect(part.x * CELL_SIZE, part.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.strokeRect(part.x * CELL_SIZE, part.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// --- Pass index and length to drawSnakePart ---
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

  // draw the food
  ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function moveSnake() {
  if (!gameActive) return;

  // snake[0] is the head
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall Wrapping
  // when the head hit the wall, it will wrap around(reappear) to the other side
  if (head.x < 0) head.x = GRID_SIZE - 1;
  else if (head.x >= GRID_SIZE) head.x = 0;
  if (head.y < 0) head.y = GRID_SIZE - 1;
  else if (head.y >= GRID_SIZE) head.y = 0;

  // update the new head position
  // by inserting the new head at the beginning of the snake array
  snake.unshift(head);

  // check if the head hit the food
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreElement.textContent = `Score: ${score}`;
    eatSound.play(); // Play eat sound effect

    // create food at a new position
    generateFood();

    // we increase the speed as the game progresses to make it more challenging
    // this can be achieved by reducing the interval time between each game loop
    // so that the snake get redrawn more frequently
    if (score % 5 === 0 && currentSpeed > 50) {
      currentSpeed -= 10;
      clearInterval(gameLoopInterval);
      gameLoopInterval = setInterval(gameLoop, currentSpeed);
    }
  } else {
    // if the head did not hit the food, we remove the last part of the snake
    // making it look like the snake is moving forward
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
  // allow player to restart the game by pressing enter
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

  // just translate condition to booleans for better readability
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  // self-imposed constraint: x-axis has priority over y-axis
  // we also update one axis at a time to avoid the snake moving in diagonal
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

// handle touch control for mobile players
function handleTouchControl(newDx, newDy) {
  // make sure the previous direction is executed before a new direction is set
  if (changingDirection || !gameActive) return;

  // just translate condition to booleans for better readability
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  // self-imposed constraint: x-axis has priority over y-axis
  // we also update one axis at a time to avoid the snake moving in diagonal
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
  // any of the snake parts has the same position as the head
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
  drawSnake();
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
  gameOverSound.play(); // Play game over sound effect
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
