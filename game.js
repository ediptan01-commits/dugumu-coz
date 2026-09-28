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

let level = 1;
let size = 4;
let moves = 0;
let solved = false;
let tiles = [];

// =========================================
// OYUNCU KAYDI
// =========================================

let gold = Number(
    localStorage.getItem("isikYollariGold") || 0
);

let unlockedLevel = Number(
    localStorage.getItem("isikYollariUnlockedLevel") || 1
);


// =========================================
// ALTIN ELEMANLARI
// =========================================

const goldCount =
    document.getElementById("goldCount");

const footerGold =
    document.getElementById("footerGold");

const hintButton =
    document.getElementById("hintButton");


// =========================================
// KAYDET
// =========================================

function saveProgress() {

    localStorage.setItem(
        "isikYollariGold",
        gold
    );

    localStorage.setItem(
        "isikYollariUnlockedLevel",
        unlockedLevel
    );
}


// =========================================
// ALTIN GÖSTER
// =========================================

function updateGoldUI() {

    if (goldCount) {
        goldCount.textContent =
            `${gold} 🪙`;
    }

    if (footerGold) {
        footerGold.textContent =
            `${gold} 🪙`;
    }
}


// =========================================
// ALTIN KAZAN
// =========================================

function addGold(amount) {

    gold += amount;

    saveProgress();

    updateGoldUI();
}


// İlk açılışta göster
updateGoldUI();

level = unlockedLevel;

/* =========================================
   TAHTA BOYUTU
   ========================================= */

function getBoardSize() {

    if (level <= 5) {
        return 4;
    }

    if (level <= 10) {
        return 5;
    }

    if (level <= 15) {
        return 6;
    }

    return 7;
}


/* =========================================
   HÜCRE ANAHTARI
   ========================================= */

function key(row, col) {
    return `${row}-${col}`;
}


/* =========================================
   RASTGELE DİZİ
   ========================================= */

function shuffle(array) {

    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {

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
   KOMŞULAR
   ========================================= */

function getNeighbors(row, col) {

    const result = [];

    for (const direction of DIRS) {

        const [dr, dc] =
            DELTA[direction];

        const nr =
            row + dr;

        const nc =
            col + dc;

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
   ÇÖZÜM AĞINI OLUŞTUR
   ========================================= */

function createSolutionNetwork() {

    const network = {};

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            network[
                key(row, col)
            ] = [];
        }
    }


    /*
       Tüm kareleri birbirine bağlayan
       garanti bir ağ oluşturuyoruz.
    */

    const visited = new Set();

    const stack = [
        {
            row: 0,
            col: 0
        }
    ];

    visited.add(
        key(0, 0)
    );


    while (stack.length > 0) {

        const current =
            stack[
                stack.length - 1
            ];


        const available =
            shuffle(
                getNeighbors(
                    current.row,
                    current.col
                )
            ).filter(item => {

                return !visited.has(
                    key(
                        item.row,
                        item.col
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
            key(
                current.row,
                current.col
            );

        const nextKey =
            key(
                next.row,
                next.col
            );


        network[
            currentKey
        ].push(
            next.direction
        );


        network[
            nextKey
        ].push(
            OPPOSITE[
                next.direction
            ]
        );


        visited.add(nextKey);


        stack.push({
            row: next.row,
            col: next.col
        });
    }


    return network;
}


/* =========================================
   AĞIN UÇLARINI BUL
   ========================================= */

function getLeaves(network) {

    const leaves = [];

    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            const connections =
                network[
                    key(row, col)
                ];


            if (
                connections.length === 1
            ) {

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
   MESAFE
   ========================================= */

function getDistances(network, start) {

    const distances = {};

    const queue = [
        start
    ];


    distances[
        key(
            start.row,
            start.col
        )
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
            const direction
            of network[currentKey]
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
   HEDEFİ SEÇ
   ========================================= */

function chooseTarget(
    network,
    source,
    leaves
) {

    const distances =
        getDistances(
            network,
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
                key(
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
   YENİ BULMACA
   ========================================= */

function generatePuzzle() {

    size =
        getBoardSize();


    /*
       Önce tamamen bağlı çözüm ağı.
    */

    const network =
        createSolutionNetwork();


    const leaves =
        getLeaves(network);


    const source =
        leaves[
            Math.floor(
                Math.random() *
                leaves.length
            )
        ];


    const target =
        chooseTarget(
            network,
            source,
            leaves
        );


    tiles = [];


    for (let row = 0; row < size; row++) {

        tiles[row] = [];


        for (let col = 0; col < size; col++) {

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
                   Doğru çözüm.
                */

                solution:
                    [...network[
                        key(row, col)
                    ]],

                /*
                   Başlangıçta çözülmüş.
                */

                rotation: 0
            };
        }
    }


    /*
       Kontrollü karıştırma.
    */

    scramblePuzzle(
        source,
        target
    );
}


/* =========================================
   ZORLUĞA GÖRE KARIŞTIR
   ========================================= */

function scramblePuzzle(
    source,
    target
) {

    const candidates = [];


    for (let row = 0; row < size; row++) {

        for (let col = 0; col < size; col++) {

            /*
               Kaynak ve hedefi sabit tut.
            */

            if (
                row === source.row &&
                col === source.col
            ) {
                continue;
            }

            if (
                row === target.row &&
                col === target.col
            ) {
                continue;
            }


            candidates.push({
                row,
                col
            });
        }
    }


    const shuffled =
        shuffle(candidates);


    /*
       Seviyeye göre kaç parça
       karıştırılacak.
    */

    let amount;

    if (level <= 5) {

        amount =
            Math.min(
                4 + level,
                shuffled.length
            );

    }
    else if (level <= 10) {

        amount =
            Math.min(
                7 + level,
                shuffled.length
            );

    }
    else if (level <= 15) {

        amount =
            Math.min(
                12 + level,
                shuffled.length
            );

    }
    else {

        amount =
            Math.min(
                18 + level,
                shuffled.length
            );
    }


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const position =
            shuffled[i];


        const tile =
            tiles[
                position.row
            ][
                position.col
            ];


        /*
           1-3 kere döndür.
        */

        tile.rotation =
            1 +
            Math.floor(
                Math.random() * 3
            );
    }


    /*
       Bulmaca tesadüfen tamamen
       çözülmüşse bir taşı değiştir.
    */

    if (isSolvedFromSource()) {

        const position =
            shuffled[0];


        tiles[
            position.row
        ][
            position.col
        ].rotation =
            (
                tiles[
                    position.row
                ][
                    position.col
                ].rotation + 1
            ) % 4;
    }
}


/* =========================================
   GERÇEK BAĞLANTILAR
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
   TAHTAYI OLUŞTUR
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


            if (
                data.type === "source"
            ) {

                tile.classList.add(
                    "source"
                );
            }


            if (
                data.type === "target"
            ) {

                tile.classList.add(
                    "target"
                );
            }


            const inner =
                document.createElement("div");


            inner.className =
                "tile-inner";


            /*
               Görsel olarak döndür.
            */

            inner.style.transform =
                `rotate(${data.rotation * 90}deg)`;


            /*
               Çözüm bağlantılarını çiz.
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
               DOKUNMA
            */

            tile.addEventListener(
                "click",
                () => {

                    if (solved) {
                        return;
                    }


                    /*
                       90 derece.
                    */

                    data.rotation =
                        (
                            data.rotation + 1
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
   BAĞLANTI HESAPLA
   ========================================= */

function checkNetwork() {

    /*
       Önce temizle.
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


    const target =
        findTarget();


    const visited =
        new Set();


    const queue = [
        source
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
           Bağlanan parçayı yak.
        */

        if (element) {

            element.classList.add(
                "lit"
            );
        }


        /*
           Hedefe ulaştık mı?
        */

        if (
            current.row === target.row &&
            current.col === target.col
        ) {

            if (element) {

                element.classList.add(
                    "reached"
                );
            }
        }


        /*
           Komşular.
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
               KARŞILIKLI BAĞLANTI
            */

            if (
                nextConnections.includes(
                    OPPOSITE[
                        direction
                    ]
                )
            ) {

                queue.push({
                    row: nextRow,
                    col: nextCol
                });
            }
        }
    }


    const total =
        size * size;


    const connected =
        visited.size;


    const percent =
        Math.round(
            connected /
            total *
            100
        );


    lightStatus.textContent =
        `${percent}%`;


    /*
       Tüm ağ bağlandı.
    */

    // HEDEFE ULAŞILDIYSA BÖLÜM TAMAM
if (
    visited.has(
        key(
            target.row,
            target.col
        )
    ) &&
    connected === total
) {
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
   KAYNAK
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
   HEDEF
   ========================================= */

function findTarget() {

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
   KARO ELEMENTİ
   ========================================= */

function getTileElement(
    row,
    col
) {

    return document.querySelector(
        `.tile[data-row="${row}"][data-col="${col}"]`
    );
}


/* =========================================
   BAŞLANGIÇTA ÇÖZÜLMÜŞ MÜ?
   ========================================= */

function isSolvedFromSource() {

    const source =
        findSource();


    const target =
        findTarget();


    const visited =
        new Set();


    const queue = [
        source
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


            const nextConnections =
                getConnections(
                    tiles[nr][nc]
                );


            if (
                nextConnections.includes(
                    OPPOSITE[
                        direction
                    ]
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


    solved = true;
    
// Bölüm ödülü
addGold(50);

// Bir sonraki bölümü aç
if (level >= unlockedLevel) {
    unlockedLevel = level + 1;
    saveProgress();
}

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
       Sonraki bölüm.
    */

    setTimeout(() => {

        level++;

        startLevel();

    }, 1600);
}


/* =========================================
   YILDIZ
   ========================================= */

function calculateStars() {

    /*
       Daha az hamle = daha fazla yıldız.
    */

    const optimal =
        Math.max(
            4,
            Math.floor(
                size * size * 0.7
            )
        );


    let result = 1;


    if (
        moves <= optimal
    ) {

        result = 3;

    }
    else if (
        moves <= optimal * 1.7
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
   BAŞLAT
   ========================================= */

startLevel();
