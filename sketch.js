let circles = [];
const maxCircles = 20; // Maximum number of circles on the canvas
const newCircleInterval = 2000; // Interval for creating new circles (milliseconds)
const circleLifetime = 5000; // Lifetime of circles (milliseconds)
let lastNewCircleTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight); // Use the window's dimensions
  noFill();
  stroke(255);
  background(255);

  // Generate a random number of initial circles between a minimum and maximum value
  const minInitialCircles = 5; // Adjust as needed
  const maxInitialCircles = 15; // Adjust as needed
  const numInitialCircles = int(random(minInitialCircles, maxInitialCircles + 1));

  // Create the random number of initial circles
  for (let i = 0; i < numInitialCircles; i++) {
    addNewCircle();
  }
}

function draw() {
  background(255);

  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];
    circle.interact(circles);
    circle.move();
    circle.display();

    // Remove circles that have faded away or are too small
    if (millis() - circle.birthTime > circleLifetime || circle.radius < 10) {
      circles.splice(i, 1);
    }
  }

  // Create new circles periodically
  if (millis() - lastNewCircleTime > newCircleInterval && circles.length < maxCircles) {
    addNewCircle();
    lastNewCircleTime = millis();
  }
}

function mouseMoved() {
  for (let circle of circles) {
    circle.move(mouseX, mouseY);
  }
}

function addNewCircle() {
  let radius = random(20, 60); // Limit the circle size
  let x = random(radius, width - radius);
  let y = random(radius, height - radius);
  let color = getRandomColor();
  circles.push(new Circle(x, y, radius, color));
}

function getRandomColor() {
  let colors = [
    [random(180, 220), random(220, 255), random(180, 220), 100], // Light Green
    [random(220, 255), random(180, 220), random(180, 220), 100], // Light Red
    [random(180, 220), random(180, 220), random(220, 255), 100]  // Light Blue
  ];
  return random(colors);
}

class Circle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speedX = 0;
    this.speedY = 0;
    this.birthTime = millis();
  }

  interact(otherCircles) {
    for (let otherCircle of otherCircles) {
      if (otherCircle !== this) {
        let dx = otherCircle.x - this.x;
        let dy = otherCircle.y - this.y;
        let distance = dist(this.x, this.y, otherCircle.x, otherCircle.y);
        let minDist = this.radius + otherCircle.radius + 10; // Added a small buffer to prevent overlap

        if (distance < minDist) {
          let angle = atan2(dy, dx);
          let targetX = this.x + cos(angle) * minDist;
          let targetY = this.y + sin(angle) * minDist;

          this.speedX = (targetX - this.x) * 0.05;
          this.speedY = (targetY - this.y) * 0.05;
        }
      }
    }
  }

  move(targetX, targetY) {
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    let angle = atan2(dy, dx);
    let distance = dist(this.x, this.y, targetX, targetY);

    if (distance > 1) {
      let acceleration = 0.2;
      this.speedX += cos(angle) * acceleration;
      this.speedY += sin(angle) * acceleration;
    }

    // Apply some friction to slow down the movement
    this.speedX *= 0.9;
    this.speedY *= 0.9;

    this.x += this.speedX;
    this.y += this.speedY;

    // Keep circles within the window's dimensions
    this.x = constrain(this.x, this.radius, width - this.radius);
    this.y = constrain(this.y, this.radius, height - this.radius);
  }

  display() {
    let elapsedTime = millis() - this.birthTime;
    this.color[3] = map(elapsedTime, 0, circleLifetime, 200, 0); // Fade away over time
    noStroke(); // Remove circle borders
    fill(this.color);
    ellipse(this.x, this.y, this.radius * 2);
  }
}

// Resize canvas when the window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
