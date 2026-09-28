const board = document.getElementById("puzzleBoard");
const levelNumber = document.getElementById("levelNumber");
const lightStatus = document.getElementById("lightStatus");
const moveCount = document.getElementById("moveCount");
const completedLevel = document.getElementById("completedLevel");
const totalMoves = document.getElementById("totalMoves");
const stars = document.getElementById("stars");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");

const DIRS = ["N", "E", "S", "W"];

const DELTA = {
    N: [-1, 0],
    E: [0, 1],
    S: [1, 0],
    W: [0, -1]
};

const OPPOSITE = {
    N: "S",
    E: "W",
    S: "N",
    W: "E"
};

let size = 4;
let level = 1;
let moves = 0;
let solved = false;
let tiles = [];


// ========================================
// TAHTA BOYUTU
// ========================================

function getBoardSize() {

    if (level <= 5) return 4;

    if (level <= 10) return 5;

    if (level <= 15) return 6;

    return 7;
}


// ========================================
// YARDIMCI
// ========================================

function key(row, col) {
    return `${row}-${col}`;
}


function randomItem(array) {
    return array[
        Math.floor(Math.random() * array.length)
    ];
}


function shuffle(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {

        const j =
            Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] =
            [copy[j], copy[i]];
    }

    return copy;
}


// ========================================
// KOMŞULAR
// ========================================

function getNeighbors(row, col) {

    const result = [];

    for (const direction of DIRS) {

        const [dr, dc] =
            DELTA[direction];

        const nr = row + dr;
        const nc = col + dc;

        if (
            nr >= 0 &&
            nr < size &&
            nc >= 0 &&
            nc < size
        ) {
            result.push({
                row: nr,
                col: nc,
                direction
            });
        }
    }

    return result;
}


// ========================================
// OTOMATİK BULMACA ÜRET
// ========================================

function generatePuzzle() {

    const connections = {};

    for (let r = 0; r < size; r++) {

        for (let c = 0; c < size; c++) {

            connections[key(r, c)] = [];
        }
    }


    /*
       RANDOM SPANNING TREE

       Bütün kareleri birbirine bağlayan
       garanti çözülebilir bir ağ oluşturur.
    */

    const visited = new Set();

    const stack = [
        {
            row: 0,
            col: 0
        }
    ];

    visited.add(key(0, 0));


    while (stack.length > 0) {

        const current =
            stack[stack.length - 1];

        const neighbors =
            shuffle(
                getNeighbors(
                    current.row,
                    current.col
                )
            ).filter(n =>
                !visited.has(
                    key(n.row, n.col)
                )
            );


        if (neighbors.length === 0) {

            stack.pop();

            continue;
        }


        const next = neighbors[0];

        const currentKey =
            key(
                current.row,
                current.col
            );

        const nextKey =
            key(
                next.row,
                next.col
            );


        connections[
            currentKey
        ].push(next.direction);


        connections[
            nextKey
        ].push(
            OPPOSITE[next.direction]
        );


        visited.add(nextKey);

        stack.push({
            row: next.row,
            col: next.col
        });
    }


    /*
       AĞIN UÇLARINI BUL
    */

    const leaves = [];

    for (let r = 0; r < size; r++) {

        for (let c = 0; c < size; c++) {

            if (
                connections[
                    key(r, c)
                ].length === 1
            ) {
                leaves.push({
                    row: r,
                    col: c
                });
            }
        }
    }


    /*
       Kaynak ve hedef farklı uçlar.
    */

    const source =
        randomItem(leaves);


    /*
       Hedeften uzak bir uç seç.
    */

    const distances =
        calculateDistances(
            connections,
            source
        );


    let target = null;
    let maxDistance = -1;

    for (const leaf of leaves) {

        if (
            leaf.row === source.row &&
            leaf.col === source.col
        ) {
            continue;
        }

        const distance =
            distances[
                key(
                    leaf.row,
                    leaf.col
                )
            ] || 0;

        if (distance > maxDistance) {

            maxDistance = distance;

            target = leaf;
        }
    }


    /*
       Tüm parçaları oluştur.
    */

    tiles = [];

    for (let r = 0; r < size; r++) {

        tiles[r] = [];

        for (let c = 0; c < size; c++) {

            const con =
                connections[
                    key(r, c)
                ];

            let type = "path";

            if (
                r === source.row &&
                c === source.col
            ) {
                type = "source";
            }
            else if (
                r === target.row &&
                c === target.col
            ) {
                type = "target";
            }


            tiles[r][c] = {

                type,

                baseConnections: [...con],

                rotation:
                    Math.floor(
                        Math.random() * 4
                    )
            };
        }
    }


    /*
       Çözülmüş kalma ihtimalini engelle.
    */

    if (isSolved()) {

        const r =
            Math.floor(
                Math.random() * size
            );

        const c =
            Math.floor(
                Math.random() * size
            );

        tiles[r][c].rotation =
            (tiles[r][c].rotation + 1) % 4;
    }
}


// ========================================
// AĞ MESAFESİ
// ========================================

function calculateDistances(
    connections,
    start
) {

    const distances = {};

    const queue = [
        {
            row: start.row,
            col: start.col
        }
    ];

    distances[
        key(start.row, start.col)
    ] = 0;


    while (queue.length > 0) {

        const current =
            queue.shift();

        const currentKey =
            key(
                current.row,
                current.col
            );

        const currentDistance =
            distances[currentKey];


        for (
            const direction of
            connections[currentKey]
        ) {

            const [dr, dc] =
                DELTA[direction];

            const nr =
                current.row + dr;

            const nc =
                current.col + dc;

            const nextKey =
                key(nr, nc);


            if (
                distances[nextKey] === undefined
            ) {

                distances[nextKey] =
                    currentDistance + 1;

                queue.push({
                    row: nr,
                    col: nc
                });
            }
        }
    }

    return distances;
}


// ========================================
// PARÇANIN GERÇEK BAĞLANTILARI
// ========================================

function getConnections(tile) {

    let result =
        [...tile.baseConnections];


    for (
        let i = 0;
        i < tile.rotation;
        i++
    ) {

        result =
            result.map(direction => {

                if (direction === "N")
                    return "E";

                if (direction === "E")
                    return "S";

                if (direction === "S")
                    return "W";

                return "N";
            });
    }

    return result;
}


// ========================================
// TAHTAYI ÇİZ
// ========================================

function renderBoard() {

    board.innerHTML = "";

    board.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    board.style.gridTemplateRows =
        `repeat(${size}, 1fr)`;


    for (let r = 0; r < size; r++) {

        for (let c = 0; c < size; c++) {

            const data =
                tiles[r][c];


            const tile =
                document.createElement("button");

            tile.type = "button";

            tile.className = "tile";

            tile.dataset.row = r;
            tile.dataset.col = c;


            if (data.type === "source") {

                tile.classList.add(
                    "source"
                );
            }


            if (data.type === "target") {

                tile.classList.add(
                    "target"
                );
            }


            const inner =
                document.createElement("div");

            inner.className =
                "tile-inner";


            /*
               Döndürme
            */

            inner.style.transform =
                `rotate(${data.rotation * 90}deg)`;


            /*
               Temel yolları çiz.
            */

            for (
                const direction
                of data.baseConnections
            ) {

                const connection =
                    document.createElement("div");

                connection.className =
                    "connection";


                let angle = 0;

                if (direction === "N")
                    angle = 0;

                if (direction === "E")
                    angle = 90;

                if (direction === "S")
                    angle = 180;

                if (direction === "W")
                    angle = 270;


                connection.style.transform =
                    `translate(-50%, -100%) rotate(${angle}deg)`;


                inner.appendChild(
                    connection
                );
            }


            tile.appendChild(inner);


            /*
               Her basışta 90 derece
            */

            tile.addEventListener(
                "click",
                () => {

                    if (solved)
                        return;


                    data.rotation =
                        (data.rotation + 1) % 4;


                    moves++;


                    renderBoard();

                    checkConnections();

                    updateUI();
                }
            );


            board.appendChild(tile);
        }
    }
}


// ========================================
// OTOMATİK BAĞLANTI SİSTEMİ
// ========================================

function checkConnections() {

    const visited = new Set();

    const queue = [
        {
            row: findSource().row,
            col: findSource().col
        }
    ];


    while (queue.length > 0) {

        const current =
            queue.shift();

        const currentKey =
            key(
                current.row,
                current.col
            );


        if (
            visited.has(currentKey)
        ) {
            continue;
        }


        visited.add(currentKey);


        const currentTile =
            tiles[
                current.row
            ][
                current.col
            ];


        const currentConnections =
            getConnections(
                currentTile
            );


        const element =
            getTileElement(
                current.row,
                current.col
            );


        /*
           Bağlanan parçayı ışıklandır.
        */

        if (element) {

            element.classList.add(
                "lit"
            );
        }


        /*
           Komşular
        */

        for (
            const direction
            of currentConnections
        ) {

            const [dr, dc] =
                DELTA[direction];

            const nr =
                current.row + dr;

            const nc =
                current.col + dc;


            if (
                nr < 0 ||
                nr >= size ||
                nc < 0 ||
                nc >= size
            ) {
                continue;
            }


            const nextTile =
                tiles[nr][nc];


            const nextConnections =
                getConnections(
                    nextTile
                );


            /*
               İki yol aynı noktaya
               bakıyorsa otomatik bağlanır.
            */

            if (
                nextConnections.includes(
                    OPPOSITE[direction]
                )
            ) {

                queue.push({
                    row: nr,
                    col: nc
                });
            }
        }
    }


    const connected =
        visited.size;

    const total =
        size * size;


    const percent =
        Math.round(
            (connected / total) * 100
        );


    /*
       Bağlantı yüzdesini göster.
    */

    if (percent === 100) {

        levelComplete();

    }
    else {

        lightStatus.textContent =
            `${percent}%`;

        lightStatus.classList.remove(
            "on"
        );

        message.textContent =
            `${connected} / ${total} kare bağlı`;
    }
}


// ========================================
// KAYNAĞI BUL
// ========================================

function findSource() {

    for (let r = 0; r < size; r++) {

        for (let c = 0; c < size; c++) {

            if (
                tiles[r][c].type ===
                "source"
            ) {

                return {
                    row: r,
                    col: c
                };
            }
        }
    }

    return {
        row: 0,
        col: 0
    };
}


// ========================================
// KARO ELEMENTİ
// ========================================

function getTileElement(row, col) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


// ========================================
// TAMAMLANMA
// ========================================

function levelComplete() {

    solved = true;

    lightStatus.textContent =
        "100%";

    lightStatus.classList.add(
        "on"
    );


    message.textContent =
        `🎉 SEVİYE ${level} TAMAMLANDI!`;

    message.classList.add(
        "success"
    );


    completedLevel.textContent =
        level;

    totalMoves.textContent =
        moves;


    calculateStars();


    /*
       1.5 saniye sonra sonraki
       seviyeye geç.
    */

    setTimeout(() => {

        level++;

        startLevel();

    }, 1500);
}


// ========================================
// YILDIZ
// ========================================

function calculateStars() {

    let result = 1;

    const goodMoves =
        size * size * 2;


    if (moves <= goodMoves) {

        result = 3;

    }
    else if (
        moves <= goodMoves * 1.5
    ) {

        result = 2;

    }


    stars.textContent =
        "⭐".repeat(result);
}


// ========================================
// ÇÖZÜLMÜŞ MÜ?
// ========================================

function isSolved() {

    /*
       Geçici kontrol.
       Gerçek kontrol checkConnections
       tarafından yapılır.
    */

    return false;
}


// ========================================
// ARAYÜZ
// ========================================

function updateUI() {

    levelNumber.textContent =
        level;

    moveCount.textContent =
        moves;

    totalMoves.textContent =
        moves;

    completedLevel.textContent =
        level;

    if (!solved) {

        stars.textContent =
            "0";
    }
}


// ========================================
// SEVİYE BAŞLAT
// ========================================

function startLevel() {

    size =
        getBoardSize();

    moves = 0;

    solved = false;

    message.classList.remove(
        "success"
    );


    generatePuzzle();

    renderBoard();

    updateUI();

    checkConnections();
}


// ========================================
// YENİDEN BAŞLAT
// ========================================

resetButton.addEventListener(
    "click",
    () => {

        startLevel();

    }
);


// ========================================
// BAŞLAT
// ========================================

startLevel();
