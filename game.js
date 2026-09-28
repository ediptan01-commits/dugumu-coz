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

let tiles = [];
let moves = 0;
let solved = false;


/* =========================================
   YÖNLER
   ========================================= */

const DIR = {
    N: { row: -1, col: 0 },
    E: { row: 0, col: 1 },
    S: { row: 1, col: 0 },
    W: { row: 0, col: -1 }
};

const OPPOSITE = {
    N: "S",
    E: "W",
    S: "N",
    W: "E"
};


/* =========================================
   BÖLÜM
   ÇÖZÜLMÜŞ HALİ
   =========================================

   💡 ─ ─ ┐
          │
          │
          │
          🎯
*/

const level1 = [
    [
        { type: "source",   solution: 0, rotation: 1 },
        { type: "straight", solution: 0, rotation: 1 },
        { type: "straight", solution: 0, rotation: 1 },
        { type: "corner",   solution: 1, rotation: 2 }
    ],

    [
        { type: "corner",   solution: 0, rotation: 1 },
        { type: "straight", solution: 1, rotation: 0 },
        { type: "corner",   solution: 0, rotation: 2 },
        { type: "straight", solution: 1, rotation: 0 }
    ],

    [
        { type: "straight", solution: 0, rotation: 1 },
        { type: "corner",   solution: 1, rotation: 0 },
        { type: "straight", solution: 0, rotation: 1 },
        { type: "straight", solution: 1, rotation: 2 }
    ],

    [
        { type: "corner",   solution: 2, rotation: 0 },
        { type: "straight", solution: 1, rotation: 1 },
        { type: "corner",   solution: 0, rotation: 3 },
        { type: "target",   solution: 0, rotation: 1 }
    ]
];


/* =========================================
   PARÇA BAĞLANTILARI
   ========================================= */

function getConnections(type, rotation) {

    let base = [];

    if (type === "straight") {
        base = ["E", "W"];
    }

    if (type === "corner") {
        base = ["N", "E"];
    }

    if (type === "source") {
        base = ["E"];
    }

    if (type === "target") {
        base = ["W"];
    }

    let result = [...base];

    for (let i = 0; i < rotation; i++) {

        result = result.map(direction => {

            if (direction === "N") return "E";
            if (direction === "E") return "S";
            if (direction === "S") return "W";
            if (direction === "W") return "N";

            return direction;
        });
    }

    return result;
}


/* =========================================
   OYUNU BAŞLAT
   ========================================= */

function startGame() {

    moves = 0;
    solved = false;

    tiles = JSON.parse(
        JSON.stringify(level1)
    );

    renderBoard();
    updateUI();
    checkLight();
}


/* =========================================
   TAHTAYI OLUŞTUR
   ========================================= */

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


            /*
               PARÇANIN ROTASYONU
            */

            inner.style.transform =
                `rotate(${data.rotation * 90}deg)`;


            /*
               Temel bağlantılar.
               Rotasyonu .tile-inner uyguluyor.
            */

            const connections =
                getConnections(
                    data.type,
                    0
                );


            connections.forEach(direction => {

                const connection =
                    document.createElement("div");

                connection.className =
                    "connection";

                let angle = 0;

                if (direction === "N") angle = 0;
                if (direction === "E") angle = 90;
                if (direction === "S") angle = 180;
                if (direction === "W") angle = 270;

                connection.style.transform =
                    `translate(-50%, -100%) rotate(${angle}deg)`;


                inner.appendChild(connection);
            });


            tile.appendChild(inner);


            /*
               HER BASIŞTA 90 DERECE
            */

            tile.addEventListener(
                "click",
                () => {

                    if (solved) return;

                    data.rotation =
                        (data.rotation + 1) % 4;

                    moves++;

                    renderBoard();

                    updateUI();

                    checkLight();
                }
            );


            board.appendChild(tile);
        }
    }
}


/* =========================================
   IŞIĞI HESAPLA
   ========================================= */

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
           KOMŞU KAROLARI KONTROL ET
        */

        connections.forEach(direction => {

            const move =
                DIR[direction];

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
               İKİ TARAF DA BİRBİRİNE BAĞLANIYORSA
            */

            if (
                nextConnections.includes(
                    OPPOSITE[direction]
                )
            ) {

                queue.push({
                    row: nextRow,
                    col: nextCol
                });
            }

        });
    }


    lightStatus.textContent = "KAPALI";

    lightStatus.classList.remove("on");

    message.textContent =
        "Parçaları döndür ve ışığı hedefe ulaştır.";

    message.classList.remove("success");
}


/* =========================================
   KARO ELEMENTİNİ BUL
   ========================================= */

function getTileElement(row, col) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


/* =========================================
   BÖLÜM TAMAMLANDI
   ========================================= */

function levelComplete() {

    lightStatus.textContent = "AÇIK";

    lightStatus.classList.add("on");

    message.textContent =
        "🎉 Tebrikler! Işık hedefe ulaştı!";

    message.classList.add("success");

    completedLevel.textContent = "1";

    totalMoves.textContent =
        moves;

    calculateStars();
}


/* =========================================
   YILDIZ
   ========================================= */

function calculateStars() {

    let result = 1;

    if (moves <= 10) {
        result = 3;
    }
    else if (moves <= 18) {
        result = 2;
    }

    stars.textContent =
        "⭐".repeat(result);
}


/* =========================================
   ARAYÜZ
   ========================================= */

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


/* =========================================
   YENİDEN BAŞLAT
   ========================================= */

resetButton.addEventListener(
    "click",
    startGame
);


/* =========================================
   BAŞLAT
   ========================================= */

startGame();
