const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const moveCountEl = document.getElementById("moveCount");
const crossingCountEl = document.getElementById("crossingCount");
const levelNumberEl = document.getElementById("levelNumber");
const resetButton = document.getElementById("resetButton");

let ropes = [];
let selected = null;
let moves = 0;
let gameFinished = false;

const NODE_RADIUS = 18;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
}

function createLevel() {

    const width = Math.max(300, canvas.clientWidth);
    const height = Math.max(300, canvas.clientHeight);

    ropes = [
        {
            color: "#ff5b5b",
            start: {
                x: width * 0.18,
                y: height * 0.20
            },
            end: {
                x: width * 0.82,
                y: height * 0.80
            }
        },

        {
            color: "#4d9cff",
            start: {
                x: width * 0.82,
                y: height * 0.20
            },
            end: {
                x: width * 0.18,
                y: height * 0.80
            }
        }
    ];

    moves = 0;
    gameFinished = false;

    updateUI();
    draw();
}

function draw() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    drawBackground(width, height);

    for (const rope of ropes) {
        drawRope(
            rope.start,
            rope.end,
            rope.color
        );
    }

    for (const rope of ropes) {
        drawNode(rope.start, rope.color);
        drawNode(rope.end, rope.color);
    }
}

function drawBackground(width, height) {

    ctx.fillStyle = "#11182c";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;

    const gap = 35;

    for (let x = 0; x < width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = 0; y < height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawRope(start, end, color) {

    // Gölge
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();

    // İp
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawNode(point, color) {

    // Dış halka
    ctx.beginPath();
    ctx.arc(
        point.x,
        point.y,
        NODE_RADIUS + 7,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();

    // Düğüm
    ctx.beginPath();
    ctx.arc(
        point.x,
        point.y,
        NODE_RADIUS,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function getPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function findNode(position) {

    for (const rope of ropes) {

        const nodes = [
            {
                rope: rope,
                point: rope.start,
                type: "start"
            },
            {
                rope: rope,
                point: rope.end,
                type: "end"
            }
        ];

        for (const node of nodes) {

            const distance = Math.hypot(
                node.point.x - position.x,
                node.point.y - position.y
            );

            if (distance < NODE_RADIUS + 20) {
                return node;
            }
        }
    }

    return null;
}

canvas.addEventListener("pointerdown", function(event) {

    if (gameFinished) {
        return;
    }

    const position = getPosition(event);

    selected = findNode(position);

    if (selected) {
        canvas.setPointerCapture(event.pointerId);
    }
});

canvas.addEventListener("pointermove", function(event) {

    if (!selected) {
        return;
    }

    const position = getPosition(event);

    const margin = 25;

    selected.point.x = Math.max(
        margin,
        Math.min(
            canvas.clientWidth - margin,
            position.x
        )
    );

    selected.point.y = Math.max(
        margin,
        Math.min(
            canvas.clientHeight - margin,
            position.y
        )
    );

    draw();

    updateCrossings();
});

canvas.addEventListener("pointerup", function(event) {

    if (!selected) {
        return;
    }

    moves++;

    selected = null;

    updateUI();

    checkComplete();

    try {
        canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
        // Dokunma zaten bırakılmışsa sorun yok.
    }
});

function updateCrossings() {

    let crossings = 0;

    for (let i = 0; i < ropes.length; i++) {

        for (let j = i + 1; j < ropes.length; j++) {

            if (
                intersects(
                    ropes[i].start,
                    ropes[i].end,
                    ropes[j].start,
                    ropes[j].end
                )
            ) {
                crossings++;
            }
        }
    }

    crossingCountEl.textContent = crossings;

    return crossings;
}

function intersects(a, b, c, d) {

    function orientation(p, q, r) {

        return (
            (q.x - p.x) * (r.y - p.y) -
            (q.y - p.y) * (r.x - p.x)
        );
    }

    const o1 = orientation(a, b, c);
    const o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a);
    const o4 = orientation(c, d, b);

    return (
        o1 * o2 < 0 &&
        o3 * o4 < 0
    );
}

function checkComplete() {

    const crossings = updateCrossings();

    if (crossings === 0 && !gameFinished) {

        gameFinished = true;

        setTimeout(function() {

            alert(
                "🎉 DÜĞÜM ÇÖZÜLDÜ!\n\n" +
                "Hamle: " + moves
            );

        }, 150);
    }
}

function updateUI() {

    moveCountEl.textContent = moves;
    levelNumberEl.textContent = "1";

    updateCrossings();
}

resetButton.addEventListener(
    "click",
    function() {
        createLevel();
    }
);

window.addEventListener(
    "resize",
    function() {
        resizeCanvas();
    }
);

// Oyunu başlat
resizeCanvas();
createLevel();
