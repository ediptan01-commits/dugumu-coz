const board = document.getElementById("puzzleBoard");
const levelNumber = document.getElementById("levelNumber");
const lightStatus = document.getElementById("lightStatus");
const moveCount = document.getElementById("moveCount");
const completedLevel = document.getElementById("completedLevel");
const totalMoves = document.getElementById("totalMoves");
const stars = document.getElementById("stars");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");

const DIRECTIONS = ["N", "E", "S", "W"];

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


/* =========================================
   SEVİYEYE GÖRE TAHTA BOYUTU
   ========================================= */

function getBoardSize() {

    if (level <= 5) return 4;

    if (level <= 10) return 5;

    if (level <= 15) return 6;

    return 7;
}


/* =========================================
   ANAHTAR
   ========================================= */

function cellKey(row, col) {
    return `${row}-${col}`;
}


/* =========================================
   KOMŞULAR
   ========================================= */

function getNeighbors(row, col) {

    const result = [];

    for (const direction of DIRECTIONS) {

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


/* =========================================
   DİZİYİ KARIŞTIR
   ========================================= */

function shuffle(array) {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


/* =========================================
   TAMAMEN BAĞLI AĞ OLUŞTUR
   ========================================= */

function createSolvedNetwork() {

    const connections = {};

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            connections[
                cellKey(row, col)
            ] = [];
        }
    }


    /*
       RANDOM DFS

       Bütün kareleri birbirine bağlayan
       bir ağaç oluşturuyoruz.

       Böylece hiçbir kare kopuk kalmıyor.
    */

    const visited = new Set();

    const stack = [
        {
            row: 0,
            col: 0
        }
    ];

    visited.add(
        cellKey(0, 0)
    );


    while (stack.length > 0) {

        const current =
            stack[stack.length - 1];


        const available =
            shuffle(
                getNeighbors(
                    current.row,
                    current.col
                )
            ).filter(neighbor => {

                return !visited.has(
                    cellKey(
                        neighbor.row,
                        neighbor.col
                    )
                );

            });


        if (available.length === 0) {

            stack.pop();

            continue;
        }


        const next =
            available[0];


        const currentKey =
            cellKey(
                current.row,
                current.col
            );

        const nextKey =
            cellKey(
                next.row,
                next.col
            );


        /*
           İki kareyi birbirine bağla.
        */

        connections[
            currentKey
        ].push(
            next.direction
        );


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


    return connections;
}


/* =========================================
   KAYNAK VE HEDEF İÇİN UÇLARI BUL
   ========================================= */

function getLeaves(connections) {

    const leaves = [];

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            const list =
                connections[
                    cellKey(row, col)
                ];

            /*
               Tek bağlantılı kareler
               ağın uçlarıdır.
            */

            if (list.length === 1) {

                leaves.push({
                    row,
                    col
                });
            }
        }
    }

    return leaves;
}


/* =========================================
   UZAKLIK HESAPLA
   ========================================= */

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
        cellKey(
            start.row,
            start.col
        )
    ] = 0;


    while (queue.length > 0) {

        const current =
            queue.shift();

        const currentKey =
            cellKey(
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
                cellKey(nr, nc);


            if (
                distances[nextKey] ===
                undefined
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


/* =========================================
   UZAK HEDEF BUL
   ========================================= */

function findTarget(
    connections,
    source,
    leaves
) {

    const distances =
        calculateDistances(
            connections,
            source
        );


    let target = null;
    let longest = -1;


    for (const leaf of leaves) {

        if (
            leaf.row === source.row &&
            leaf.col === source.col
        ) {
            continue;
        }


        const distance =
            distances[
                cellKey(
                    leaf.row,
                    leaf.col
                )
            ];


        if (
            distance !== undefined &&
            distance > longest
        ) {

            longest = distance;

            target = leaf;
        }
    }


    return target;
}


/* =========================================
   YENİ BULMACA ÜRET
   ========================================= */

function generatePuzzle() {

    size = getBoardSize();

    let attempts = 0;


    while (attempts < 100) {

        attempts++;


        /*
           Önce kesin bağlı ağ oluştur.
        */

        const network =
            createSolvedNetwork();


        const leaves =
            getLeaves(network);


        if (leaves.length < 2) {
            continue;
        }


        /*
           Kaynak seç.
        */

        const source =
            leaves[
                Math.floor(
                    Math.random() *
                    leaves.length
                )
            ];


        /*
           Kaynaktan en uzak uç hedef.
        */

        const target =
            findTarget(
                network,
                source,
                leaves
            );


        if (!target) {
            continue;
        }


        /*
           Tahtayı oluştur.
        */

        tiles = [];

        for (let row = 0; row < size; row++) {

            tiles[row] = [];

            for (let col = 0; col < size; col++) {

                const connections =
                    network[
                        cellKey(row, col)
                    ];


                let type = "path";


                if (
                    row === source.row &&
                    col === source.col
                ) {
                    type = "source";
                }


                if (
                    row === target.row &&
                    col === target.col
                ) {
                    type = "target";
                }


                tiles[row][col] = {

                    type,

                    /*
                       Bu, bulmacanın doğru
                       çözümündeki bağlantılar.
                    */

                    solution:
                        [...connections],

                    /*
                       Başlangıçta rastgele
                       döndürülmüş olacak.
                    */

                    rotation:
                        Math.floor(
                            Math.random() * 4
                        )
                };
            }
        }


        /*
           Başlangıçta çözülmüşse
           bir parçayı daha döndür.
        */

        if (isCurrentPuzzleSolved()) {

            const row =
                Math.floor(
                    Math.random() * size
                );

            const col =
                Math.floor(
                    Math.random() * size
                );

            tiles[row][col].rotation =
                (
                    tiles[row][col].rotation +
                    1
                ) % 4;
        }


        return;
    }
}


/* =========================================
   PARÇANIN GERÇEK YÖNLERİ
   ========================================= */

function getConnections(tile) {

    let result =
        [...tile.solution];


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


/* =========================================
   TAHTAYI ÇİZ
   ========================================= */

function renderBoard() {

    board.innerHTML = "";


    board.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    board.style.gridTemplateRows =
        `repeat(${size}, 1fr)`;


    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            const data =
                tiles[row][col];


            const tile =
                document.createElement("button");

            tile.type = "button";

            tile.className = "tile";

            tile.dataset.row = row;
            tile.dataset.col = col;


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
               Tıklayınca görsel olarak
               90° dönecek.
            */

            inner.style.transform =
                `rotate(${data.rotation * 90}deg)`;


            /*
               Temel çözüm bağlantılarını çiz.
               Dönüşü inner yapıyor.
            */

            for (
                const direction
                of data.solution
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
               HER BASIŞTA 90°
            */

            tile.addEventListener(
                "click",
                () => {

                    if (solved) {
                        return;
                    }


                    data.rotation =
                        (
                            data.rotation +
                            1
                        ) % 4;


                    moves++;


                    renderBoard();

                    updateUI();

                    checkNetwork();
                }
            );


            board.appendChild(tile);
        }
    }
}


/* =========================================
   IŞIK AĞINI HESAPLA
   ========================================= */

function checkNetwork() {

    /*
       Önce bütün ışıkları temizle.
    */

    document
        .querySelectorAll(".tile")
        .forEach(tile => {

            tile.classList.remove(
                "lit"
            );

            tile.classList.remove(
                "reached"
            );
        });


    const source =
        findSource();


    const visited =
        new Set();


    const queue = [
        source
    ];


    while (queue.length > 0) {

        const current =
            queue.shift();


        const currentKey =
            cellKey(
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
           Bağlanan parçayı yak.
        */

        if (element) {

            element.classList.add(
                "lit"
            );
        }


        /*
           HEDEF
        */

        if (
            currentTile.type ===
            "target"
        ) {

            if (element) {

                element.classList.add(
                    "reached"
                );
            }
        }


        /*
           Komşuları kontrol et.
        */

        for (
            const direction
            of currentConnections
        ) {

            const [dr, dc] =
                DELTA[direction];


            const nextRow =
                current.row + dr;

            const nextCol =
                current.col + dc;


            if (
                nextRow < 0 ||
                nextRow >= size ||
                nextCol < 0 ||
                nextCol >= size
            ) {
                continue;
            }


            const nextTile =
                tiles[
                    nextRow
                ][
                    nextCol
                ];


            const nextConnections =
                getConnections(
                    nextTile
                );


            /*
               İki taraf da birbirine
               bakıyorsa bağlantı var.
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
        }
    }


    /*
       Bağlantı yüzdesi
    */

    const total =
        size * size;


    const connected =
        visited.size;


    const percent =
        Math.round(
            (connected / total) * 100
        );


    lightStatus.textContent =
        `${percent}%`;


    if (percent === 100) {

        levelComplete();

        return;
    }


    lightStatus.classList.remove(
        "on"
    );


    message.textContent =
        `${connected} / ${total} kare bağlı`;

    message.classList.remove(
        "success"
    );
}


/* =========================================
   KAYNAĞI BUL
   ========================================= */

function findSource() {

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            if (
                tiles[row][col].type ===
                "source"
            ) {

                return {
                    row,
                    col
                };
            }
        }
    }


    return {
        row: 0,
        col: 0
    };
}


/* =========================================
   HEDEFİN BAĞLANIP BAĞLANMADIĞINI BUL
   ========================================= */

function isTargetConnected() {

    const source =
        findSource();


    const target =
        findTargetPosition();


    const visited =
        new Set();


    const queue = [
        source
    ];


    while (queue.length > 0) {

        const current =
            queue.shift();


        const currentKey =
            cellKey(
                current.row,
                current.col
            );


        if (
            visited.has(currentKey)
        ) {
            continue;
        }


        visited.add(currentKey);


        if (
            current.row === target.row &&
            current.col === target.col
        ) {

            return true;
        }


        const currentConnections =
            getConnections(
                tiles[
                    current.row
                ][
                    current.col
                ]
            );


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


            const nextConnections =
                getConnections(
                    tiles[nr][nc]
                );


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


    return false;
}


/* =========================================
   HEDEF KONUMU
   ========================================= */

function findTargetPosition() {

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            if (
                tiles[row][col].type ===
                "target"
            ) {

                return {
                    row,
                    col
                };
            }
        }
    }


    return {
        row: size - 1,
        col: size - 1
    };
}


/* =========================================
   ELEMENT BUL
   ========================================= */

function getTileElement(row, col) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


/* =========================================
   BAŞLANGIÇTA ÇÖZÜLÜ MÜ?
   ========================================= */

function isCurrentPuzzleSolved() {

    const source =
        findSource();


    const target =
        findTargetPosition();


    const visited =
        new Set();


    const queue = [
        source
    ];


    while (queue.length > 0) {

        const current =
            queue.shift();


        const currentKey =
            cellKey(
                current.row,
                current.col
            );


        if (
            visited.has(currentKey)
        ) {
            continue;
        }


        visited.add(currentKey);


        if (
            current.row === target.row &&
            current.col === target.col
        ) {

            return true;
        }


        const connections =
            getConnections(
                tiles[
                    current.row
                ][
                    current.col
                ]
            );


        for (
            const direction
            of connections
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


            const next =
                tiles[nr][nc];


            const nextConnections =
                getConnections(next);


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


    return false;
}


/* =========================================
   BÖLÜM TAMAMLANDI
   ========================================= */

function levelComplete() {

    if (solved) {
        return;
    }


    /*
       Hedef gerçekten bağlı mı?
    */

    if (!isTargetConnected()) {
        return;
    }


    solved = true;


    lightStatus.textContent =
        "100%";

    lightStatus.classList.add(
        "on"
    );


    message.textContent =
        `🎉 Seviye ${level} tamamlandı!`;

    message.classList.add(
        "success"
    );


    completedLevel.textContent =
        level;

    totalMoves.textContent =
        moves;


    calculateStars();


    /*
       Biraz bekle,
       sonraki seviyeye geç.
    */

    setTimeout(() => {

        level++;

        startLevel();

    }, 1400);
}


/* =========================================
   YILDIZ
   ========================================= */

function calculateStars() {

    const optimal =
        size * size;


    let result = 1;


    if (moves <= optimal * 1.3) {

        result = 3;

    }
    else if (
        moves <= optimal * 2
    ) {

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


/* =========================================
   SEVİYE BAŞLAT
   ========================================= */

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

    checkNetwork();
}


/* =========================================
   YENİDEN BAŞLAT
   ========================================= */

resetButton.addEventListener(
    "click",
    () => {

        startLevel();

    }
);


/* =========================================
   OYUNU BAŞLAT
   ========================================= */

startLevel();
