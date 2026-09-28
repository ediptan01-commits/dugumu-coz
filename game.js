const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const moveCount = document.getElementById("moveCount");
const crossingCount = document.getElementById("crossingCount");
const levelNumber = document.getElementById("levelNumber");
const resetButton = document.getElementById("resetButton");

let ropes = [];
let selectedNode = null;
let moves = 0;
let gameCompleted = false;


/* =========================
   OYUN AYARLARI
========================= */

const ropeColors = [
    "#ff5c5c",
    "#5c9dff",
    "#ffc857",
    "#62d394"
];

const NODE_RADIUS = 16;


/* =========================
   CANVAS BOYUTU
========================= */

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    drawGame();
}


/* =========================
   BÖLÜM OLUŞTUR
========================= */

function createLevel() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    /*
       Her ip iki düğümden oluşuyor.
       Başlangıçta ipler birbirinin üzerinden
       geçiyor.
    */

    ropes = [

        {
            id: 0,
            color: ropeColors[0],
            start: {
                x: width * 0.20,
                y: height * 0.20
            },
            end: {
                x: width * 0.80,
                y: height * 0.80
            }
        },

        {
            id: 1,
            color: ropeColors[1],
            start: {
                x: width * 0.80,
                y: height * 0.20
            },
            end: {
                x: width * 0.20,
                y: height * 0.80
            }
        }
    ];

    moves = 0;
    gameCompleted = false;

    updateUI();

    drawGame();
}


/* =========================
   İPLERİ ÇİZ
========================= */

function drawGame() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    /*
       Hafif arka plan noktaları
    */

    drawGrid(
        width,
        height
    );

    /*
       Önce ipleri çiziyoruz.
    */

    ropes.forEach(rope => {

        drawRope(
            rope.start,
            rope.end,
            rope.color
        );

    });

    /*
       Daha sonra düğümleri çiziyoruz.
    */

    ropes.forEach(rope => {

        drawNode(
            rope.start,
            rope.color
        );

        drawNode(
            rope.end,
            rope.color
        );

    });
}


/* =========================
   IZGARA
========================= */

function drawGrid(width, height) {

    ctx.save();

    ctx.globalAlpha = 0.08;

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 1;

    const spacing = 35;

    for (
        let x = 0;
        x < width;
        x += spacing
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(x, height);

        ctx.stroke();
    }

    for (
        let y = 0;
        y < height;
        y += spacing
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(width, y);

        ctx.stroke();
    }

    ctx.restore();
}


/* =========================
   İP ÇİZİMİ
========================= */

function drawRope(start, end, color) {

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        start.x,
        start.y
    );

    ctx.lineTo(
        end.x,
        end.y
    );

    /*
       İpin gölgesi
    */

    ctx.lineWidth = 14;

    ctx.strokeStyle =
        "rgba(0,0,0,0.25)";

    ctx.stroke();

    /*
       İpin kendisi
    */

    ctx.lineWidth = 8;

    ctx.strokeStyle = color;

    ctx.lineCap = "round";

    ctx.stroke();

    ctx.restore();
}


/* =========================
   DÜĞÜM ÇİZİMİ
========================= */

function drawNode(point, color) {

    ctx.save();

    /*
       Dış halka
    */

    ctx.beginPath();

    ctx.arc(
        point.x,
        point.y,
        NODE_RADIUS + 5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.12)";

    ctx.fill();

    /*
       Düğüm
    */

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

    ctx.restore();
}


/* =========================
   PARMAK POZİSYONU
========================= */

function getPointerPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {

        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top
    };
}


/* =========================
   DÜĞÜM BUL
========================= */

function findNode(position) {

    for (const rope of ropes) {

        const nodes = [
            {
                rope,
                type: "start",
                point: rope.start
            },

            {
                rope,
                type: "end",
                point: rope.end
            }
        ];

        for (const node of nodes) {

            const distance =
                Math.hypot(
                    node.point.x -
                        position.x,

                    node.point.y -
                        position.y
                );

            if (
                distance <=
                NODE_RADIUS + 15
            ) {

                return node;
            }
        }
    }

    return null;
}


/* =========================
   PARMAK BASILDI
========================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (gameCompleted) {
            return;
        }

        const position =
            getPointerPosition(event);

        selectedNode =
            findNode(position);

        if (selectedNode) {

            canvas.setPointerCapture(
                event.pointerId
            );
        }
    }
);


/* =========================
   SÜRÜKLEME
========================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (!selectedNode) {
            return;
        }

        const position =
            getPointerPosition(event);

        /*
           Düğümü oyun alanında tut.
        */

        const margin = 25;

        position.x =
            Math.max(
                margin,
                Math.min(
                    canvas.clientWidth -
                        margin,
                    position.x
                )
            );

        position.y =
            Math.max(
                margin,
                Math.min(
                    canvas.clientHeight -
                        margin,
                    position.y
                )
            );

        selectedNode.point.x =
            position.x;

        selectedNode.point.y =
            position.y;

        drawGame();

        updateCrossings();
    }
);


/* =========================
   PARMAK BIRAKILDI
========================= */

canvas.addEventListener(
    "pointerup",
    event => {

        if (!selectedNode) {
            return;
        }

        moves++;

        selectedNode = null;

        updateUI();

        checkLevelComplete();

        canvas.releasePointerCapture(
            event.pointerId
        );
    }
);


/* =========================
   KESİŞME KONTROLÜ
========================= */

function updateCrossings() {

    let crossings = 0;

    for (
        let i = 0;
        i < ropes.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < ropes.length;
            j++
        ) {

            if (
                linesIntersect(
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

    crossingCount.textContent =
        crossings;

    return crossings;
}


/* =========================
   ÇİZGİ KESİŞMESİ
========================= */

function linesIntersect(
    a,
    b,
    c,
    d
) {

    const orientation =
        (p, q, r) => {

            return (
                (q.x - p.x) *
                    (r.y - p.y)

                -
                (q.y - p.y) *
                    (r.x - p.x)
            );
        };

    const o1 =
        orientation(a, b, c);

    const o2 =
        orientation(a, b, d);

    const o3 =
        orientation(c, d, a);

    const o4 =
        orientation(c, d, b);

    return (
        o1 * o2 < 0 &&
        o3 * o4 < 0
    );
}


/* =========================
   BÖLÜM TAMAMLANDI MI?
========================= */

function checkLevelComplete() {

    const crossings =
        updateCrossings();

    if (
        crossings === 0 &&
        !gameCompleted
    ) {

        gameCompleted = true;

        setTimeout(() => {

            alert(
                "🎉 Düğüm çözüldü!"
            );

        }, 100);
    }
}


/* =========================
   ARAYÜZ
========================= */

function updateUI() {

    moveCount.textContent =
        moves;

    updateCrossings();

    levelNumber.textContent =
        "1";
}


/* =========================
   YENİDEN BAŞLAT
========================= */

resetButton.addEventListener(
    "click",
    () => {

        createLevel();

    }
);


/* =========================
   BAŞLAT
========================= */

window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

    }
);

resizeCanvas();

createLevel();
