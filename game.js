alert("YENİ GAME.JS ÇALIŞIYOR");
const board = document.getElementById("puzzleBoard");
const levelNumber = document.getElementById("levelNumber");
const lightStatus = document.getElementById("lightStatus");
const moveCount = document.getElementById("moveCount");
const completedLevel = document.getElementById("completedLevel");
const totalMoves = document.getElementById("totalMoves");
const stars = document.getElementById("stars");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");

const SIZE = 4;

let moves = 0;
let solved = false;
let tiles = [];

/*
    Bağlantılar:

    N = Yukarı
    E = Sağ
    S = Aşağı
    W = Sol
*/

const directions = {
    N: { row: -1, col: 0 },
    E: { row: 0, col: 1 },
    S: { row: 1, col: 0 },
    W: { row: 0, col: -1 }
};

const opposite = {
    N: "S",
    E: "W",
    S: "N",
    W: "E"
};


/* ========================================
   BÖLÜM 1
   ======================================== */

const level1 = [
    [
        { type: "source", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "corner", rotation: 0 }
    ],

    [
        { type: "corner", rotation: 2 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 1 }
    ],

    [
        { type: "straight", rotation: 1 },
        { type: "straight", rotation: 1 },
        { type: "straight", rotation: 1 },
        { type: "straight", rotation: 1 }
    ],

    [
        { type: "corner", rotation: 2 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "target", rotation: 0 }
    ]
];


/* ========================================
   PARÇANIN BAĞLANTILARI
   ======================================== */

function getConnections(type, rotation) {

    let connections = [];

    if (type === "straight") {
        connections = ["E", "W"];
    }

    if (type === "corner") {
        connections = ["N", "E"];
    }

    if (type === "source") {
        connections = ["E"];
    }

    if (type === "target") {
        connections = ["W"];
    }

    for (let i = 0; i < rotation; i++) {

        connections = connections.map(direction => {

            if (direction === "N") return "E";
            if (direction === "E") return "S";
            if (direction === "S") return "W";
            if (direction === "W") return "N";

        });

    }

    return connections;
}


/* ========================================
   OYUNU BAŞLAT
   ======================================== */

function startGame() {

    moves = 0;
    solved = false;

    tiles = JSON.parse(
        JSON.stringify(level1)
    );

    scrambleBoard();

    renderBoard();

    updateUI();

    checkLight();
}


/* ========================================
   KARIŞTIR
   ======================================== */

function scrambleBoard() {

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            tiles[row][col].rotation =
                Math.floor(Math.random() * 4);

        }

    }
}


/* ========================================
   TAHTAYI ÇİZ
   ======================================== */

function renderBoard() {

    board.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const data = tiles[row][col];

            const tile =
                document.createElement("button");

            tile.type = "button";

            tile.className = "tile";

            tile.dataset.row = row;
            tile.dataset.col = col;

            if (data.type === "source") {
                tile.classList.add("source");
            }

            if (data.type === "target") {
                tile.classList.add("target");
            }


            const inner =
                document.createElement("div");

            inner.className = "tile-inner";


            const connections =
                getConnections(
                    data.type,
                    data.rotation
                );


            /*
                HER BAĞLANTI AYRI BİR KOL
            */

            connections.forEach(direction => {

                const connection =
                    document.createElement("div");

                connection.className =
                    "connection";

                connection.dataset.direction =
                    direction;

                const angle =
                    getAngle(direction);

                connection.style.transform =
                    `translate(-50%, -100%) rotate(${angle}deg)`;

                inner.appendChild(connection);

            });


            tile.appendChild(inner);

            /*
                HER BASIŞTA DÖN
            */

            tile.addEventListener(
                "click",
                () => rotateTile(row, col)
            );


            board.appendChild(tile);
        }
    }
}


/* ========================================
   YÖN AÇISI
   ======================================== */

function getAngle(direction) {

    switch (direction) {

        case "N":
            return 0;

        case "E":
            return 90;

        case "S":
            return 180;

        case "W":
            return 270;

        default:
            return 0;
    }
}


/* ========================================
   PARÇAYI DÖNDÜR
   ======================================== */

function rotateTile(row, col) {

    if (solved) {
        return;
    }

    /*
       HER PARÇA DÖNEBİLİR
    */

    tiles[row][col].rotation =
        (tiles[row][col].rotation + 1) % 4;

    moves++;

    renderBoard();

    updateUI();

    checkLight();
}


/* ========================================
   IŞIĞI HESAPLA
   ======================================== */

function checkLight() {

    document
        .querySelectorAll(".tile")
        .forEach(tile => {

            tile.classList.remove("lit");
            tile.classList.remove("reached");

        });


    const visited = new Set();

    const queue = [
        {
            row: 0,
            col: 0
        }
    ];


    while (queue.length > 0) {

        const current =
            queue.shift();

        const key =
            `${current.row}-${current.col}`;


        if (visited.has(key)) {
            continue;
        }

        visited.add(key);


        const currentTile =
            tiles[current.row][current.col];


        const connections =
            getConnections(
                currentTile.type,
                currentTile.rotation
            );


        const element =
            getTileElement(
                current.row,
                current.col
            );


        if (element) {
            element.classList.add("lit");
        }


        /*
            HEDEFE ULAŞILDI
        */

        if (currentTile.type === "target") {

            solved = true;

            if (element) {
                element.classList.add("reached");
            }

            levelComplete();

            return;
        }


        /*
            BAĞLANTILARI TAKİP ET
        */

        connections.forEach(direction => {

            const move =
                directions[direction];


            const nextRow =
                current.row + move.row;

            const nextCol =
                current.col + move.col;


            if (
                nextRow < 0 ||
                nextRow >= SIZE ||
                nextCol < 0 ||
                nextCol >= SIZE
            ) {
                return;
            }


            const nextTile =
                tiles[nextRow][nextCol];


            const nextConnections =
                getConnections(
                    nextTile.type,
                    nextTile.rotation
                );


            /*
                İKİ PARÇADA DA BAĞLANTI VARSA
            */

            if (
                nextConnections.includes(
                    opposite[direction]
                )
            ) {

                queue.push({
                    row: nextRow,
                    col: nextCol
                });

            }

        });

    }


    lightStatus.textContent =
        "KAPALI";

    lightStatus.classList.remove("on");

    message.textContent =
        "Parçaları döndür ve ışığı hedefe ulaştır.";

    message.classList.remove("success");
}


/* ========================================
   KAROYU BUL
   ======================================== */

function getTileElement(row, col) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


/* ========================================
   BÖLÜM TAMAMLANDI
   ======================================== */

function levelComplete() {

    lightStatus.textContent =
        "AÇIK";

    lightStatus.classList.add("on");

    message.textContent =
        `🎉 Tebrikler! Bölüm tamamlandı.`;

    message.classList.add("success");

    completedLevel.textContent =
        "1";

    totalMoves.textContent =
        moves;

    calculateStars();
}


/* ========================================
   YILDIZ
   ======================================== */

function calculateStars() {

    let earned = 1;

    if (moves <= 12) {
        earned = 3;
    }
    else if (moves <= 20) {
        earned = 2;
    }

    stars.textContent =
        "⭐".repeat(earned);
}


/* ========================================
   ARAYÜZ
   ======================================== */

function updateUI() {

    levelNumber.textContent = "1";

    moveCount.textContent =
        moves;

    totalMoves.textContent =
        moves;

    completedLevel.textContent =
        "1";

    if (!solved) {
        stars.textContent = "0";
    }
}


/* ========================================
   YENİDEN BAŞLAT
   ======================================== */

resetButton.addEventListener(
    "click",
    startGame
);


/* ========================================
   BAŞLAT
   ======================================== */

startGame();
