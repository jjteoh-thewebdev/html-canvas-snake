# Building the Classic Nokia Snake Game with HTML Canvas 🐍

Growing up as a Millennial, I remember I used to play this game on my dad's old Nokia phone with a small yellowish screen. Today, we'll be using HTML Canvas and JavaScript to create this nostalgic game. By the end of this tutorial, you'll have a fully functional snake game that you can play right in your browser! [Bonus: we'll be building it in functional programming style]

## How to Play 🎮

Before we dive into the code, let's understand how the game works:

### Basic Rules
1. **Control the Snake**: Use arrow keys (↑, ↓, ←, →) or the on-screen buttons(play on mobile device) to move the snake.
2. **Eat the Food**: Guide the snake to eat the food (red square).
3. **Grow Longer**: Each time you eat food, your snake grows longer.
4. **Slither Faster**: Each time you eat food, your snake move faster, but capped at a certain speed. 
4. **Score Points**: Each food eaten gives you 1 point.
5. **Avoid Collisions**: Don't let the snake hit itself or the game ends.
6. **Wall Wrapping**: When the snake hits a wall, it wraps around to the opposite side.

### Game Controls
- **Arrow Keys**: Move the snake in four directions
- **A, W, S, D**: Alternative keyboard controls
- **Touch Controls**: On-screen buttons for mobile devices
- **Enter**: Start/Restart the game

### Game Features
- **Responsive Design**: Play on any device size
- **Smooth Controls**: Precise movement and direction changes
- **Visual Feedback**: Snake color gradient from head to tail
- **Score Tracking**: Keep track of your progress
- **Game Over Screen**: Shows your final score and restart option

## What You'll Learn 🎯

- HTML Canvas basics
- Functional Programming
- Game loop implementation
- Collision detection
- Keyboard and touch controls
- Responsive design
- Modern JavaScript features

## Prerequisites 📚

- Basic knowledge of HTML, CSS, and JavaScript
- A text editor (VS Code, Sublime Text, etc.)
- A modern web browser

## Let's Get Started! 🚀

### 1. Setting Up the Project Structure

First, create three files in your project directory(refer my [github repo](https://github.com/jjteoh-thewebdev/html-canvas-snake)):
- `index.html` - The main HTML file
- `style.css` - For styling our game
- `script.js` - Where the game logic lives


### 2. The Game Logic

Now, let's dive into the JavaScript code that makes our snake game work. We'll break it down into key components:

#### 2.1 Game Setup

We first define what we need for the game, such like the game board(canvas), the game components(e.g. snake, food and etc.) and game initial state.

```javascript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const GRID_SIZE = 20;
let CELL_SIZE;
let CANVAS_WIDTH, CANVAS_HEIGHT;
...

// Game state
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let gameActive = false;
...
```

#### 2.2 Initialization

In order to support any screen size, we will have to dynamically calculate the right game board size to fit into the screen. Ideally, we want 20 X 20 grid for our game, so we divide by the screen size to get the length of the cell.

```javascript
function calculateCanvasSize() {
  const containerWidth = canvasContainer.clientWidth;
  CELL_SIZE = Math.floor(containerWidth / GRID_SIZE);
  CANVAS_WIDTH = CELL_SIZE * GRID_SIZE;
  CANVAS_HEIGHT = CELL_SIZE * GRID_SIZE;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

function clearCanvas() {
  // --- Explicitly clear with white ---
  ctx.fillStyle = "#ffffff"; // White background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
```

#### 2.3 Drawing Snake, Food

To differentiate between the head and tail, we apply color gradient to the snake. The head will be in dark green while the tail will be in light green.

```javascript
function interpolateColor(color1, color2, factor) {
  // Factor is between 0 and 1 (0 = color1, 1 = color2)
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawSnake() {
  snake.forEach((part, index) => {
    const color = interpolateColor(
      [22, 101, 52], // Dark green
      [134, 239, 172], // Light green
      index / (snake.length - 1)
    );
    ctx.fillStyle = color;
    ctx.fillRect(part.x * CELL_SIZE, part.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  });
}

function drawFood() {
  ctx.fillStyle = "#ef4444"; // Red
  ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}
```

#### 2.4 Game Loop

The game loop is the heart of our game. It continuously updates the game state and redraws the canvas.

```javascript
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
```

#### 2.5 Controls

The snake's movement is controlled by two variables: `dx` and `dy` (delta x and delta y). These variables represent the direction and speed of movement:

- `dx = 1`: Moving right
- `dx = -1`: Moving left
- `dy = 1`: Moving down
- `dy = -1`: Moving up
- `dx = 0, dy = 0`: Not moving

When the snake moves, we update its position by adding these values to the current position. For example:
```javascript
// Current head position
const head = { x: snake[0].x, y: snake[0].y };

// New head position after movement
const newHead = { 
  x: head.x + dx, 
  y: head.y + dy 
};
```

The snake's body follows the head by moving each segment to the position of the segment in front of it. This creates the illusion of a continuous snake moving across the screen.

```javascript
function handleKeyDown(event) {
 // ... handling keyboard controls
}

function handleTouchControl(newDx, newDy) {
    // ... handling touch controls
}
```
#### 2.6 Wall Wrapping
In our implementation, when the snake hits a wall, it wraps around to the opposite side of the screen instead of ending the game. This is achieved by checking the snake's position after movement:

```javascript
// Wall wrapping logic
if (newHead.x < 0) newHead.x = GRID_SIZE - 1;        // Left wall
else if (newHead.x >= GRID_SIZE) newHead.x = 0;      // Right wall
if (newHead.y < 0) newHead.y = GRID_SIZE - 1;        // Top wall
else if (newHead.y >= GRID_SIZE) newHead.y = 0;      // Bottom wall
```

This creates a continuous playing field where the snake can move endlessly. The `GRID_SIZE` constant (set to 20 in our game) defines the boundaries of our grid. When the snake's position exceeds these boundaries, it's teleported to the opposite side of the grid.

#### 2.7 Collision Detection
We check for collisions between:
- Snake and walls
- Snake and food
- Snake and itself

We have discussed the first two collisions, for detecting snake collide itself, we check if the new head position is identical with the position of any of its body part.

```javascript
for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
    }
}
```

## Discussion 💭

### Why setInterval Instead of requestAnimationFrame?

When implementing the game loop, we chose `setInterval` over `requestAnimationFrame` for several reasons:

#### Technical Considerations
- Our game speed is relatively slow (150ms between updates, fastest at 50ms)
- The snake moves in discrete grid cells rather than smooth animations
- We need consistent game speed regardless of device performance
- The game logic is simple and doesn't require frame-perfect timing

#### Advantages of setInterval for Our Use Case
1. **Predictable Timing**: We can set exact milliseconds between updates
2. **Consistent Speed**: Game speed remains the same across different devices
3. **Simplicity**: Easier to implement and understand for beginners
4. **Grid-Based Movement**: Perfect for our discrete cell-by-cell movement

#### When to Use requestAnimationFrame
`requestAnimationFrame` would be better suited for games that require:
- Smooth animations
- Physics-based movement
- Complex visual effects
- Frame-perfect timing
- High-performance graphics

While `requestAnimationFrame` is generally considered better for animations, our classic Snake game's simple mechanics and grid-based movement make `setInterval` the more appropriate choice.

## Tips for Enhancement 🚀

1. Add different difficulty levels
2. Implement a high score system using localStorage
3. Add sound effects
4. Create different food types with different point values
5. Add power-ups

## Conclusion 🎉

Congratulations! You've just built a classic Snake game using HTML Canvas. This project covers many fundamental concepts in game development and web programming. Feel free to experiment and add your own features!

Remember, the best way to learn is by doing. Try modifying the code, adding new features, or even creating your own version of the game. Happy coding! 💻

## Resources 📚

- [MDN Canvas Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [JavaScript Game Development](https://developer.mozilla.org/en-US/docs/Games)
- [HTML5 Game Development](https://www.w3schools.com/graphics/game_intro.asp)

---

*Did you enjoy this tutorial? Share your version of the game with us! We'd love to see what you create. 🎮*
