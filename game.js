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
   ÇÖZÜLMÜŞ BÖLÜM
   =========================================

   💡 ─ ─ ┐
          │
   ┌ ─ ─ ┘
   │
   │
   └ ─ ─ 🎯
*/

const solvedLevel = [
    [
        { type: "source", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "corner", rotation: 2 }
    ],

    [
        { type: "corner", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 1 }
    ],

    [
        { type: "straight", rotation: 1 },
        { type: "empty", rotation: 0 },
        { type: "empty", rotation: 0 },
        { type: "empty", rotation: 0 }
    ],

    [
        { type: "corner", rotation: 1 },
        { type: "straight", rotation: 0 },
        { type: "straight", rotation: 0 },
        { type: "target", rotation: 0 }
    ]
];


/* =========================================
   BAĞLANTILAR
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
        JSON.stringify(solvedLevel)
    );

    scrambleBoard();

    renderBoard();

    updateUI();

    checkLight();
}


/* =========================================
   KARIŞTIR
   ========================================= */

function scrambleBoard() {

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const tile = tiles[row][col];

            if (tile.type !== "empty") {

                tile.rotation =
                    Math.floor(Math.random() * 4);

            }
        }
    }
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

            if (data.type === "empty") {
                tile.classList.add("empty");
            }


            const inner =
                document.createElement("div");

            inner.className = "tile-inner";


            /*
               ASIL DÖNÜŞ BURADA.

               Parçanın tamamı 90 derece dönüyor.
            */

            inner.style.transform =
                `rotate(${data.rotation * 90}deg)`;


            const connections =
                getConnections(
                    data.type,
                    0
                );


            /*
               Temel parçayı çiziyoruz.
               Döndürmeyi yukarıdaki transform yapıyor.
            */

            connections.forEach(direction => {

                const connection =
                    document.createElement("div");

                connection.className =
                    "connection";

                connection.dataset.direction =
                    direction;


                let angle = 0;

                if (direction === "N") {
                    angle = 0;
                }

                if (direction === "E") {
                    angle = 90;
                }

                if (direction === "S") {
                    angle = 180;
                }

                if (direction === "W") {
                    angle = 270;
                }


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
                function () {

                    rotateTile(row, col);

                }
            );


            board.appendChild(tile);
        }
    }
}


/* =========================================
   PARÇAYI DÖNDÜR
   ========================================= */

function rotateTile(row, col) {

    if (solved) {
        return;
    }

    const tile = tiles[row][col];

    /*
       Boş kare dönmez.
    */

    if (tile.type === "empty") {
        return;
    }


    /*
       90 DERECE SAĞA
    */

    tile.rotation =
        (tile.rotation + 1) % 4;


    moves++;


    renderBoard();

    updateUI();

    checkLight();
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


        const tile =
            tiles[current.row][current.col];


        const connections =
            getConnections(
                tile.type,
                tile.rotation
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
           HEDEF
        */

        if (tile.type === "target") {

            solved = true;

            if (element) {
                element.classList.add("reached");
            }

            levelComplete();

            return;
        }


        /*
           HER BAĞLANTIYI KONTROL ET
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


            if (nextTile.type === "empty") {
                return;
            }


            const nextConnections =
                getConnections(
                    nextTile.type,
                    nextTile.rotation
                );


            /*
               İKİ PARÇA BİRBİRİNE BAKIYORSA
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


    lightStatus.textContent =
        "KAPALI";

    lightStatus.classList.remove("on");

    message.textContent =
        "Parçaları döndür ve ışığı hedefe ulaştır.";

    message.classList.remove("success");
}


/* =========================================
   KARO BUL
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

    lightStatus.textContent =
        "AÇIK";

    lightStatus.classList.add("on");


    message.textContent =
        "🎉 Tebrikler! Işık hedefe ulaştı!";


    message.classList.add("success");


    completedLevel.textContent =
        "1";

    totalMoves.textContent =
        moves;


    calculateStars();
}


/* =========================================
   YILDIZ
   ========================================= */

function calculateStars() {

    let result = 1;

    if (moves <= 12) {
        result = 3;
    }
    else if (moves <= 20) {
        result = 2;
    }

    stars.textContent =
        "⭐".repeat(result);
}


/* =========================================
   ARAYÜZ
   ========================================= */

function updateUI() {

    levelNumber.textContent =
        "1";

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
