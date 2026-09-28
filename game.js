// =========================================
// IŞIK YOLLARI - OYUN MOTORU
// =========================================

const board = document.getElementById("puzzleBoard");
const levelNumber = document.getElementById("levelNumber");
const lightStatus = document.getElementById("lightStatus");
const moveCount = document.getElementById("moveCount");
const completedLevel = document.getElementById("completedLevel");
const totalMoves = document.getElementById("totalMoves");
const stars = document.getElementById("stars");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");


// =========================================
// OYUN AYARLARI
// =========================================

const SIZE = 4;

let currentLevel = 1;
let moves = 0;
let solved = false;

let tiles = [];


// =========================================
// YÖNLER
// =========================================

const DIRECTIONS = {
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


// =========================================
// BÖLÜM 1
// =========================================
//
// Yol:
//
// 💡 → ─ → ─ → ┐
//              ↓
// ┌ → ─ → ─ → ↓
// ↑            ↓
// ↑            ↓
// └ ← ← ← ← ← 🎯
//
// =========================================

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


// =========================================
// PARÇA BAĞLANTILARI
// =========================================

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

    // Rotasyon uygula
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


// =========================================
// OYUNU BAŞLAT
// =========================================

function startGame() {

    moves = 0;
    solved = false;

    tiles = JSON.parse(JSON.stringify(level1));

    // Bulmacayı karıştır
    scrambleBoard();

    updateUI();

    renderBoard();

    checkLight();
}


// =========================================
// BULMACAYI KARIŞTIR
// =========================================

function scrambleBoard() {

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const tile = tiles[row][col];

            if (
                tile.type !== "source" &&
                tile.type !== "target"
            ) {

                tile.rotation =
                    Math.floor(Math.random() * 4);

            }
        }
    }

    // Başlangıçta çözülmüş olma ihtimalini engelle
    solved = false;
}


// =========================================
// TAHTAYI OLUŞTUR
// =========================================

function renderBoard() {

    board.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const tileData = tiles[row][col];

            const tile = document.createElement("button");

            tile.className = "tile";

            tile.type = "button";

            tile.dataset.row = row;
            tile.dataset.col = col;

            // Özel parçalar
            if (tileData.type === "source") {
                tile.classList.add("source");
            }

            if (tileData.type === "target") {
                tile.classList.add("target");
            }

            // İç alan
            const inner = document.createElement("div");

            inner.className = "tile-inner";

            // Bağlantıları oluştur
            const connections =
                getConnections(
                    tileData.type,
                    tileData.rotation
                );

            connections.forEach(direction => {

                const connection =
                    document.createElement("div");

                connection.className =
                    "connection";

                connection.dataset.direction =
                    direction;

                const rotation =
                    getDirectionRotation(direction);

                connection.style.transform =
                    `translate(-50%, -100%) rotate(${rotation}deg)`;

                inner.appendChild(connection);

            });

            tile.appendChild(inner);

            // Tıklayınca döndür
            tile.addEventListener(
                "click",
                () => rotateTile(row, col)
            );

            board.appendChild(tile);
        }
    }
}


// =========================================
// YÖN AÇISI
// =========================================

function getDirectionRotation(direction) {

    if (direction === "N") return 0;
    if (direction === "E") return 90;
    if (direction === "S") return 180;
    if (direction === "W") return 270;

    return 0;
}


// =========================================
// PARÇAYI DÖNDÜR
// =========================================

function rotateTile(row, col) {

    if (solved) return;

    const tile = tiles[row][col];

    // Kaynak ve hedef dönmesin
    if (
        tile.type === "source" ||
        tile.type === "target"
    ) {
        return;
    }

    tile.rotation =
        (tile.rotation + 1) % 4;

    moves++;

    updateUI();

    renderBoard();

    checkLight();
}


// =========================================
// IŞIĞI HESAPLA
// =========================================

function checkLight() {

    // Önce bütün karoların ışığını temizle
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

        const current = queue.shift();

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


        // Ekrandaki karoyu bul
        const element =
            getTileElement(
                current.row,
                current.col
            );

        if (element) {
            element.classList.add("lit");
        }


        // Hedefe ulaştık mı?
        if (currentTile.type === "target") {

            solved = true;

            if (element) {
                element.classList.add("reached");
            }

            levelComplete();

            return;
        }


        // Bağlantıları kontrol et
        connections.forEach(direction => {

            const move =
                DIRECTIONS[direction];

            const nextRow =
                current.row + move.row;

            const nextCol =
                current.col + move.col;


            // Tahta dışına çıkma
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


            // Karşılıklı bağlantı var mı?
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


    // Hedefe ulaşılmadı
    lightStatus.textContent = "KAPALI";
    lightStatus.classList.remove("on");

    message.textContent =
        "Parçaları döndür ve ışığı hedefe ulaştır.";

    message.classList.remove("success");
}


// =========================================
// KARO ELEMENTİNİ BUL
// =========================================

function getTileElement(row, col) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


// =========================================
// BÖLÜM TAMAMLANDI
// =========================================

function levelComplete() {

    lightStatus.textContent = "AÇIK";

    lightStatus.classList.add("on");

    message.textContent =
        `Tebrikler! Bölüm ${currentLevel} tamamlandı.`;

    message.classList.add("success");

    completedLevel.textContent =
        currentLevel;

    totalMoves.textContent =
        moves;

    calculateStars();
}


// =========================================
// YILDIZ HESAPLA
// =========================================

function calculateStars() {

    let earnedStars = 1;

    if (moves <= 12) {
        earnedStars = 3;
    }
    else if (moves <= 20) {
        earnedStars = 2;
    }

    stars.textContent =
        "⭐".repeat(earnedStars);
}


// =========================================
// ARAYÜZÜ GÜNCELLE
// =========================================

function updateUI() {

    levelNumber.textContent =
        currentLevel;

    moveCount.textContent =
        moves;

    totalMoves.textContent =
        moves;

    completedLevel.textContent =
        currentLevel;

    stars.textContent =
        "0";

    lightStatus.textContent =
        "KAPALI";

    lightStatus.classList.remove("on");
}


// =========================================
// YENİDEN BAŞLAT
// =========================================

resetButton.addEventListener(
    "click",
    startGame
);


// =========================================
// OYUNU BAŞLAT
// =========================================

startGame();
