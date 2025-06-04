// ==========================================
// 1. CONFIGURAÇÕES E CONSTANTES
// ==========================================

// Array principal de frases
let phrases = [/* dados das frases */
    {
        "id": 1,
        "english": "This is an apple.",
        "portuguese": "Isto é uma maçã.",
        "difficulty": "fácil",
        "category": "frutas"
    },
    {
        "id": 2,
        "english": "The cat is sleeping under the bed.",
        "portuguese": "O gato está dormindo debaixo da cama.",
        "difficulty": "médio",
        "category": "animais"
    },
    {
        "id": 3,
        "english": "Purple is a mix of red and blue.",
        "portuguese": "Roxo é uma mistura de vermelho e azul.",
        "difficulty": "difícil",
        "category": "cores"
    },
    {
        "id": 4,
        "english": "She counted from one to one hundred without stopping.",
        "portuguese": "Ela contou de um a cem sem parar.",
        "difficulty": "extremo",
        "category": "números"
    },
    {
        "id": 5,
        "english": "My brother and sister live in different cities.",
        "portuguese": "Meu irmão e minha irmã moram em cidades diferentes.",
        "difficulty": "médio",
        "category": "família"
    },
    {
        "id": 6,
        "english": "The kitchen is next to the living room.",
        "portuguese": "A cozinha fica ao lado da sala de estar.",
        "difficulty": "fácil",
        "category": "casa"
    },
    {
        "id": 7,
        "english": "They ate pasta with tomato sauce for dinner.",
        "portuguese": "Eles comeram macarrão com molho de tomate no jantar.",
        "difficulty": "difícil",
        "category": "comida"
    },
    {
        "id": 8,
        "english": "Life is short, enjoy every moment.",
        "portuguese": "A vida é curta, aproveite cada momento.",
        "difficulty": "extremo",
        "category": "frases-gerais"
    }
];

//Constantes do sistema
const DIFFICULTIES = ['fácil', 'médio', 'difícil', 'extremo'];
const CATEGORIES = {/* categorias */
    'frutas': 'Frutas',
    'animais': 'Animais',
    'cores': 'Cores',
    'números': 'Números',
    'família': 'Família',
    'casa': 'Casa',
    'comida': 'Comida',
    'frases-gerais': 'Frases Gerais'
};
const SCORE_SYSTEM = {// sistema de pontuação, Sistema de Score Avançado
    points: {
        'fácil': 10,
        'médio': 20,
        'difícil': 30,
        'extremo': 50
    },
    bonuses: {
        perfectRound: 100,    // Bonus por acertar tudo
        streak: 5,           // Bonus por sequência
        fastAnswer: 10       // Bonus por resposta rápida
    }
};
const LEVEL_SYSTEM = {/* sistema de níveis */
    baseXP: 100,        // XP necessário para o nível 1
    multiplier: 1.5,    // Multiplicador de XP por nível
    maxLevel: 50,       // Nível máximo
    rewards: {
        1: { type: 'unlock', message: 'Bem-vindo ao jogo!' },
        5: { type: 'bonus', value: 100, message: '🎉 Bonus de 100 pontos!' },
        10: { type: 'unlock', message: '🔓 Modo difícil desbloqueado!' },
        15: { type: 'bonus', value: 250, message: '🎁 Bonus de 250 pontos!' },
        20: { type: 'unlock', message: '🏆 Modo extremo desbloqueado!' },
        25: { type: 'bonus', value: 500, message: '💎 Bonus de 500 pontos!' },
        30: { type: 'title', value: 'Poliglota', message: '👑 Título desbloqueado: Poliglota!' },
        40: { type: 'bonus', value: 1000, message: '🌟 Mega bonus de 1000 pontos!' },
        50: { type: 'title', value: 'Mestre', message: '🏅 Título máximo: Mestre dos Idiomas!' }
    }
};

// Estados globais
let playerStats = {/* estatísticas do jogador */
    totalScore: 0,
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    maxStreak: 0,
    scoreHistory: [],
    // Novos campos para níveis
    level: 1,
    currentXP: 0,
    totalXP: 0,
    titles: [],
    currentTitle: null
};
let gameState = {/* estado atual do jogo */
    availableQuestions: [],
    currentQuestion: null,
    selectedWords: [],
    score: 0,
    totalQuestions: 0,
    currentQuestionNum: 0,
    gameActive: false,
    // Novos campos para score avançado
    currentStreak: 0,
    roundStartTime: null,
    roundScore: 0
};
let editingId = null;

// IndexedDB functions, Configurações do IndexedDB
const DB_NAME = 'EnglishLearningGame';
const DB_VERSION = 1;
const STORE_NAME = 'phrases';

let db;

// ==========================================
// 2. FUNÇÕES DE INICIALIZAÇÃO
// ==========================================
// Inicializar banco de dados
async function initDB() {/* inicializa IndexedDB */
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('difficulty', 'difficulty', { unique: false });
            }
        };
    });
}
// Carregar estatísticas salvas
function loadPlayerStats() {/* carrega stats do localStorage */
    try {
        const saved = localStorage.getItem('playerStats');
        if (saved) {
            playerStats = { ...playerStats, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}
// Inicializar dropdowns de seleção  
function initializeDropdowns() {/* preenche selects de categoria/dificuldade */
    const categorySelect = document.getElementById('categorySelect');
    const difficultySelect = document.getElementById('difficultySelect');
    const categorySelect2 = document.getElementById('categorySelect2');
    const difficultySelect2 = document.getElementById('difficultySelect2');

    // Preencher categorias
    Object.keys(CATEGORIES).forEach(key => {
        const option1 = new Option(CATEGORIES[key], key);
        const option2 = new Option(CATEGORIES[key], key);
        categorySelect.add(option1);
        categorySelect2.add(option2);
    });

    // Preencher dificuldades
    DIFFICULTIES.forEach(difficulty => {
        const option1 = new Option(difficulty.charAt(0).toUpperCase() + difficulty.slice(1), difficulty);
        const option2 = new Option(difficulty.charAt(0).toUpperCase() + difficulty.slice(1), difficulty);
        difficultySelect.add(option1);
        difficultySelect2.add(option2);
    });
}
// Função principal de inicialização
async function init() {/* inicializa toda a aplicação */
    try {
        await initDB();
        await mergePhrases(); // Usar mergePhrases em vez de loadPhrases
        loadPlayerStats(); // ✅ CORRETO
        initializeDropdowns();
        loadPhrasesList();
        updateGameStatus();
        console.log(`${phrases.length} frases carregadas`);
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        // Fallback para dados em memória se IndexedDB falhar
        initializeDropdowns();
        loadPhrasesList();
        updateGameStatus();
    }
}
// ==========================================
// 3. FUNÇÕES DE GERENCIAMENTO DE DADOS
// ==========================================
// Salvar frases no IndexedDB
async function savePhrases() {/* salva frases no banco */
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing data
    await store.clear();

    // Add all phrases
    for (const phrase of phrases) {
        await store.add(phrase);
    }
}
// Carregar frases do IndexedDB
async function loadPhrases() {/* carrega frases do banco */
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const dbPhrases = request.result;

            // Se não há frases no IndexedDB, usar as frases do script
            if (dbPhrases.length === 0 && phrases.length > 0) {
                // Salvar as frases iniciais no IndexedDB
                savePhrases().then(() => {
                    console.log('Frases iniciais salvas no IndexedDB');
                    resolve(phrases);
                });
            } else {
                // Usar as frases do IndexedDB
                phrases = dbPhrases;
                resolve(phrases);
            }
        };
        request.onerror = () => reject(request.error);
    });
}
// Mesclar frases (script + banco)
async function mergePhrases() {/* combina frases do script com banco */
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const dbPhrases = request.result;

            if (dbPhrases.length === 0) {
                // Se IndexedDB está vazio, usar frases do script
                console.log('IndexedDB vazio, usando frases do script');
                await savePhrases();
                resolve(phrases);
            } else {
                // Se IndexedDB tem dados, verificar se há frases novas no script
                const dbIds = new Set(dbPhrases.map(p => p.id));
                const newPhrases = phrases.filter(p => !dbIds.has(p.id));

                if (newPhrases.length > 0) {
                    console.log(`Encontradas ${newPhrases.length} novas frases no script`);
                    // Mesclar frases novas
                    phrases = [...dbPhrases, ...newPhrases];
                    await savePhrases();
                } else {
                    // Use apenas as frases do IndexedDB
                    phrases = dbPhrases;
                }
                resolve(phrases);
            }
        };
        request.onerror = () => reject(request.error);
    });
}
// Salvar estatísticas
function savePlayerStats() {/* salva stats no localStorage */
    try {
        localStorage.setItem('playerStats', JSON.stringify(playerStats));
    } catch (error) {
        console.error('Erro ao salvar estatísticas:', error);
    }
}
// ==========================================
// 4. SISTEMA DE PONTUAÇÃO E NÍVEIS
// ==========================================
// Calcular XP necessário para nível
function getXPForLevel(level) {/* calcula XP por nível */
    if (level <= 1) return 0;
    return Math.floor(LEVEL_SYSTEM.baseXP * Math.pow(LEVEL_SYSTEM.multiplier, level - 2));
}
// XP necessário para próximo nível
function getXPNeededForNextLevel(currentLevel) {/* XP para subir */
    return getXPForLevel(currentLevel + 1);
}
// XP total acumulado até nível
function getTotalXPForLevel(level) {/* XP total do nível */
    let total = 0;
    for (let i = 1; i <= level; i++) {
        total += getXPForLevel(i);
    }
    return total;
}
// Adicionar XP ao jogador
function addXP(amount) {/* adiciona XP e verifica level up */
    const oldLevel = playerStats.level;
    playerStats.currentXP += amount;
    playerStats.totalXP += amount;

    // Verificar se subiu de nível
    const xpNeeded = getXPNeededForNextLevel(playerStats.level);
    if (playerStats.currentXP >= xpNeeded && playerStats.level < LEVEL_SYSTEM.maxLevel) {
        levelUp(oldLevel);
    }

    savePlayerStats();
    return playerStats.level > oldLevel;
}
// Subir de nível
function levelUp(oldLevel) {/* processo de subir nível */
    playerStats.currentXP -= getXPNeededForNextLevel(oldLevel);
    playerStats.level++;

    // Verificar recompensas
    const reward = LEVEL_SYSTEM.rewards[playerStats.level];
    if (reward) {
        processLevelReward(reward, playerStats.level);
    }

    showLevelUpAnimation(oldLevel, playerStats.level);
}
// Processar recompensas de nível
function processLevelReward(reward, level) {/* aplica recompensas */
    switch (reward.type) {
        case 'bonus':
            playerStats.totalScore += reward.value;
            break;
        case 'title':
            if (!playerStats.titles.includes(reward.value)) {
                playerStats.titles.push(reward.value);
                if (!playerStats.currentTitle) {
                    playerStats.currentTitle = reward.value;
                }
            }
            break;
        case 'unlock':
            // Funcionalidades desbloqueadas serão tratadas na UI
            break;
    }
}
// Animação de level up
function showLevelUpAnimation(oldLevel, newLevel) {/* mostra animação */
    const levelUpDiv = document.createElement('div');
    levelUpDiv.className = 'level-up-animation';
    levelUpDiv.innerHTML = `
        <div class="level-up-content">
            <h2>🎉 LEVEL UP! 🎉</h2>
            <div class="level-change">
                <span class="old-level">${oldLevel}</span>
                <span class="arrow">→</span>
                <span class="new-level">${newLevel}</span>
            </div>
            <p>Parabéns! Você alcançou o nível ${newLevel}!</p>
            ${LEVEL_SYSTEM.rewards[newLevel] ? `<p class="reward">${LEVEL_SYSTEM.rewards[newLevel].message}</p>` : ''}
        </div>
    `;

    document.body.appendChild(levelUpDiv);

    setTimeout(() => {
        levelUpDiv.remove();
    }, 4000);

    speak(`Parabéns! Você subiu para o nível ${newLevel}!`, 'pt');
}
// Calcular porcentagem de progresso
function getProgressPercentage() {/* % para próximo nível */
    if (playerStats.level >= LEVEL_SYSTEM.maxLevel) return 100;
    const xpNeeded = getXPNeededForNextLevel(playerStats.level);
    return Math.min(100, Math.round((playerStats.currentXP / xpNeeded) * 100));
}
// Calcular pontuação da resposta
function calculateScore(difficulty, isCorrect, timeSpent = 0) {/* calcula pontos */
    if (!isCorrect) return 0;

    let points = SCORE_SYSTEM.points[difficulty] || 10;

    // Bonus por resposta rápida (menos de 10 segundos)
    if (timeSpent < 10000) {
        points += SCORE_SYSTEM.bonuses.fastAnswer;
    }

    // Bonus por sequência
    if (gameState.currentStreak >= 3) {
        points += SCORE_SYSTEM.bonuses.streak * Math.floor(gameState.currentStreak / 3);
    }

    return points;
}
// Atualizar sequência de acertos
function updateStreak(isCorrect) {/* gerencia streaks */
    if (isCorrect) {
        gameState.currentStreak++;
        playerStats.streak++;
        if (playerStats.streak > playerStats.maxStreak) {
            playerStats.maxStreak = playerStats.streak;
        }
    } else {
        gameState.currentStreak = 0;
        playerStats.streak = 0;
    }
}
// ==========================================
// 5. FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO
// ==========================================
// Exportar frases para JSON, Import/Export functions
function exportPhrases() {/* exporta dados */
    if (phrases.length === 0) {
        alert('Não há frases para exportar!');
        return;
    }

    const dataStr = JSON.stringify(phrases, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `english-phrases-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(link.href);
}
// Importar frases de arquivo
async function importPhrases(event) {/* importa dados */
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importedPhrases = JSON.parse(text);

        // Validate structure
        if (!Array.isArray(importedPhrases)) {
            throw new Error('Formato inválido: esperado um array de frases');
        }

        // Validate each phrase
        for (const phrase of importedPhrases) {
            if (!phrase.english || !phrase.portuguese || !phrase.category || !phrase.difficulty) {
                throw new Error('Formato inválido: frases devem ter english, portuguese, category e difficulty');
            }
        }

        // Verificar duplicatas por conteúdo (não por ID)
        const existingPhrases = new Set(phrases.map(p => `${p.english.toLowerCase()}|${p.portuguese.toLowerCase()}`));
        const newPhrases = importedPhrases.filter(phrase =>
            !existingPhrases.has(`${phrase.english.toLowerCase()}|${phrase.portuguese.toLowerCase()}`)
        );

        if (newPhrases.length === 0) {
            alert('⚠️ Nenhuma frase nova encontrada. Todas as frases já existem.');
            event.target.value = '';
            return;
        }

        // Generate new IDs to avoid conflicts
        const maxId = phrases.length > 0 ? Math.max(...phrases.map(p => p.id)) : 0;
        newPhrases.forEach((phrase, index) => {
            phrase.id = maxId + index + 1;
        });

        // Merge with existing phrases
        phrases = [...phrases, ...newPhrases];

        // Save to IndexedDB
        await savePhrases();

        // Refresh display
        loadPhrasesList();

        const duplicates = importedPhrases.length - newPhrases.length;
        let message = `✅ ${newPhrases.length} frases importadas com sucesso!`;
        if (duplicates > 0) {
            message += `\n⚠️ ${duplicates} frases duplicadas foram ignoradas.`;
        }
        alert(message);

    } catch (error) {
        alert(`❌ Erro ao importar: ${error.message}`);
    }

    // Clear file input
    event.target.value = '';
}
// Função para adicionar frases via script (para desenvolvedores)
async function addPhrasesToScript(newPhrases) {/* adiciona por código */
    if (!Array.isArray(newPhrases)) {
        console.error('addPhrasesToScript: parâmetro deve ser um array');
        return;
    }

    const maxId = phrases.length > 0 ? Math.max(...phrases.map(p => p.id)) : 0;

    newPhrases.forEach((phrase, index) => {
        if (phrase.english && phrase.portuguese && phrase.category && phrase.difficulty) {
            phrase.id = maxId + index + 1;
            phrases.push(phrase);
        }
    });

    await savePhrases();
    loadPhrasesList();
    console.log(`${newPhrases.length} frases adicionadas via script`);
}
// ==========================================
// 6. FUNÇÕES DE NAVEGAÇÃO (TABS)
// ==========================================

// Tab functionality, Event listeners para tabs
document.querySelectorAll('.tab').forEach(tab => {/* gerencia tabs */
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'manage') {
            loadPhrasesList();
        }
    });
});
// ==========================================
// 7. FUNÇÕES DE ÁUDIO E UTILIDADES
// ==========================================
// Speech synthesis functions, // Sintetizador de voz
function speak(text, lang) {/* fala texto */
    if (!document.getElementById('enableVoice').checked) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}
// Embaralhar array
function shuffleArray(array) {/* randomiza ordem */
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// ==========================================
// 8. FUNÇÕES DE INTERFACE DO JOGO
// ==========================================
// Atualizar status visual do jogo
function updateGameStatus() {/* atualiza UI com stats */
    document.getElementById('currentScore').textContent = gameState.score;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    document.getElementById('currentQuestionNum').textContent = gameState.currentQuestionNum;
    document.getElementById('totalPhrases').textContent = phrases.length;
    document.getElementById('remainingQuestions').textContent = gameState.availableQuestions.length;

    // Adicionar informação de nível
    const statusCards = document.querySelector('.game-status');
    let levelCard = document.querySelector('.level-card');

    if (!levelCard) {
        levelCard = document.createElement('div');
        levelCard.className = 'status-card level-card';
        statusCards.appendChild(levelCard);
    }

    const progressPercent = getProgressPercentage();
    const nextLevelXP = getXPNeededForNextLevel(playerStats.level);

    levelCard.innerHTML = `
        <h3>⭐ Nível ${playerStats.level}</h3>
        <div class="xp-bar">
            <div class="xp-progress" style="width: ${progressPercent}%"></div>
        </div>
        <div class="xp-text">${playerStats.currentXP}/${nextLevelXP} XP</div>
        ${playerStats.currentTitle ? `<div class="player-title">👑 ${playerStats.currentTitle}</div>` : ''}
    `;

    // Streak card (mantém o código existente)
    let streakCard = document.querySelector('.streak-card');
    if (gameState.currentStreak > 0) {
        if (!streakCard) {
            streakCard = document.createElement('div');
            streakCard.className = 'status-card streak-card';
            statusCards.appendChild(streakCard);
        }
        streakCard.innerHTML = `
            <h3>🔥 Sequência</h3>
            <div class="status-value">${gameState.currentStreak}</div>
        `;
    } else if (streakCard) {
        streakCard.remove();
    }
}
// Filtrar frases por categoria/dificuldade
function getFilteredPhrases() {/* aplica filtros */
    const selectedCategory = document.getElementById('categorySelect').value;
    const selectedDifficulty = document.getElementById('difficultySelect').value;

    return phrases.filter(phrase => {
        const categoryMatch = selectedCategory === 'all' || phrase.category === selectedCategory;
        const difficultyMatch = selectedDifficulty === 'all' || phrase.difficulty === selectedDifficulty;
        return categoryMatch && difficultyMatch;
    });
}
// ==========================================
// 9. FUNÇÕES PRINCIPAIS DO JOGO
// ==========================================
// Iniciar novo jogo
function startGame() {/* inicia partida */
    const filteredPhrases = getFilteredPhrases();

    if (phrases.length === 0) {
        alert('Adicione algumas frases primeiro na aba "Gerenciar Frases"');
        return;
    }

    if (filteredPhrases.length === 0) {
        alert('Nenhuma frase encontrada com os filtros selecionados. Tente outras opções.');
        return;
    }

    gameState = {
        availableQuestions: [...filteredPhrases],
        currentQuestion: null,
        selectedWords: [],
        score: 0,
        totalQuestions: 0,
        currentQuestionNum: 0,
        gameActive: true
    };

    // Adicionar após definir o gameState
    gameState.roundStartTime = Date.now();
    gameState.roundScore = 0;
    gameState.currentStreak = 0;

    updateGameStatus();
    nextQuestion();
}
// Próxima pergunta
function nextQuestion() {/* carrega próxima questão */
    if (gameState.availableQuestions.length === 0) {
        endGame();
        return;
    }

    // Get random question from available questions
    const randomIndex = Math.floor(Math.random() * gameState.availableQuestions.length);
    gameState.currentQuestion = gameState.availableQuestions[randomIndex];
    gameState.availableQuestions.splice(randomIndex, 1);

    gameState.totalQuestions++;
    gameState.currentQuestionNum++;
    gameState.selectedWords = [];

    gameState.roundStartTime = Date.now(); // Reset timer para cada pergunta

    updateGameStatus();
    renderQuestion();
    hideFeedback();

    // Show reset button
    document.getElementById('resetBtn').style.display = 'inline-block';
}
// Renderizar pergunta na tela
function renderQuestion() {/* mostra pergunta atual */
    const words = gameState.currentQuestion.portuguese.split(' ');
    const shuffledWords = shuffleArray(words);

    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = `
                <div class="question">Qual o significado de:</div>
                <div class="english-phrase">"${gameState.currentQuestion.english}"</div>
                
                <div class="answer-area">
                    <h4>🎯 Monte a tradução na ordem correta:</h4>
                    <div class="selected-words empty" id="selectedWordsArea">
                        Clique nas palavras abaixo para formar a frase
                    </div>
                    
                    <div class="word-buttons" id="wordButtons">
                        ${shuffledWords.map((word, index) => `
                            <button class="word-btn" onclick="selectWord('${word}', ${index})" id="word-${index}">
                                ${word}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="game-actions">
                        <button class="btn" onclick="checkAnswer()" id="checkBtn">✅ Verificar Resposta</button>
                        <button class="btn btn-secondary" onclick="showAnswer()">👁️ Ver Resposta</button>
                        <button class="btn btn-secondary" onclick="clearSelection()">🗑️ Limpar</button>
                    </div>
                </div>
            `;

    // Speak the question
    setTimeout(() => {
        speak("Qual o significado de", 'pt');
        setTimeout(() => {
            speak(gameState.currentQuestion.english, 'en');
        }, 1500);
    }, 500);
}
// Selecionar palavra
function selectWord(word, buttonIndex) {/* adiciona palavra à resposta */
    const button = document.getElementById(`word-${buttonIndex}`);
    if (button.disabled) return;

    gameState.selectedWords.push(word);
    button.disabled = true;

    updateSelectedWordsDisplay();
}
// Remover palavra selecionada
function removeSelectedWord(wordIndex) {/* remove palavra da resposta */
    const word = gameState.selectedWords[wordIndex];
    gameState.selectedWords.splice(wordIndex, 1);

    // Re-enable the button
    const buttons = document.querySelectorAll('.word-btn');
    buttons.forEach(btn => {
        if (btn.textContent.trim() === word && btn.disabled) {
            btn.disabled = false;
            return;
        }
    });

    updateSelectedWordsDisplay();
}
// Atualizar área de palavras selecionadas
function updateSelectedWordsDisplay() {/* atualiza UI das palavras */
    const selectedWordsArea = document.getElementById('selectedWordsArea');

    if (gameState.selectedWords.length === 0) {
        selectedWordsArea.innerHTML = 'Clique nas palavras abaixo para formar a frase';
        selectedWordsArea.className = 'selected-words empty';
    } else {
        selectedWordsArea.innerHTML = gameState.selectedWords.map((word, index) =>
            `<button class="selected-word" onclick="removeSelectedWord(${index})">${word}</button>`
        ).join('');
        selectedWordsArea.className = 'selected-words has-words';
    }
}
// Limpar seleção atual
function clearSelection() {/* limpa resposta */
    gameState.selectedWords = [];

    // Re-enable all buttons
    const buttons = document.querySelectorAll('.word-btn');
    buttons.forEach(btn => btn.disabled = false);

    updateSelectedWordsDisplay();
}
// Verificar resposta do usuário
function checkAnswer() {/* valida resposta */
    if (gameState.selectedWords.length === 0) {
        alert('Selecione algumas palavras primeiro!');
        return;
    }

    const userAnswer = gameState.selectedWords.join(' ').toLowerCase().trim();
    const correctAnswer = gameState.currentQuestion.portuguese.toLowerCase().trim();

    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
        const timeSpent = Date.now() - gameState.roundStartTime;
        const earnedPoints = calculateScore(gameState.currentQuestion.difficulty, true, timeSpent);

        gameState.score += earnedPoints;
        gameState.roundScore += earnedPoints;

        // Adicionar XP baseado na dificuldade
        const xpGained = SCORE_SYSTEM.points[gameState.currentQuestion.difficulty] / 2;
        const leveledUp = addXP(xpGained);

        if (leveledUp) {
            feedbackMsg += ` 🆙 LEVEL UP!`;
        }

        // Atualizar estatísticas
        updateStreak(true);
        playerStats.correctAnswers++;
        playerStats.totalScore += earnedPoints;

        let feedbackMsg = `🎉 Perfeito! +${earnedPoints} pontos!`;

        // Mensagens especiais
        if (timeSpent < 5000) {
            feedbackMsg += ' ⚡ Resposta relâmpago!';
        }
        if (gameState.currentStreak >= 3) {
            feedbackMsg += ` 🔥 Sequência de ${gameState.currentStreak}!`;
        }

        showFeedback(feedbackMsg, 'correct');
        speak('Perfeito! Você acertou!', 'pt');

        const buttons = document.querySelectorAll('.word-btn');
        buttons.forEach(btn => btn.disabled = true);

        setTimeout(() => {
            if (gameState.availableQuestions.length > 0) {
                nextQuestion();
            } else {
                endGame();
            }
        }, 2000);

    } else {
        updateStreak(false);
        showFeedback(`❌ Incorreto! A resposta correta é: "${gameState.currentQuestion.portuguese}"`, 'incorrect');
        speak('Incorreto. A resposta correta é:', 'pt');
        setTimeout(() => {
            speak(gameState.currentQuestion.portuguese, 'pt');
        }, 1500);
    }

    // Atualizar estatísticas gerais
    playerStats.questionsAnswered++;
    savePlayerStats();
    updateGameStatus();

}
// Mostrar resposta correta
function showAnswer() {/* revela resposta */
    showFeedback(`💡 A resposta é: "${gameState.currentQuestion.portuguese}"`, 'correct');
    speak('A resposta é:', 'pt');
    setTimeout(() => {
        speak(gameState.currentQuestion.portuguese, 'pt');
    }, 1000);

    // Show correct order
    gameState.selectedWords = gameState.currentQuestion.portuguese.split(' ');
    updateSelectedWordsDisplay();

    // Disable all word buttons
    const buttons = document.querySelectorAll('.word-btn');
    buttons.forEach(btn => btn.disabled = true);
}
// Resetar rodada atual
function resetRound() {/* reinicia pergunta */
    gameState.selectedWords = [];
    updateSelectedWordsDisplay();

    // Re-enable all buttons
    const buttons = document.querySelectorAll('.word-btn');
    buttons.forEach(btn => btn.disabled = false);

    hideFeedback();
}
// Finalizar jogo
function endGame() {/* encerra partida */
    const percentage = Math.round((gameState.score / gameState.totalQuestions) * 100);

    // Bonus por jogo perfeito
    if (percentage === 100) {
        gameState.roundScore += SCORE_SYSTEM.bonuses.perfectRound;
        playerStats.totalScore += SCORE_SYSTEM.bonuses.perfectRound;
    }

    // Salvar histórico
    playerStats.gamesPlayed++;
    playerStats.scoreHistory.push({
        date: new Date().toISOString(),
        score: gameState.roundScore,
        percentage: percentage,
        questions: gameState.totalQuestions
    });

    // Manter apenas os últimos 50 jogos
    if (playerStats.scoreHistory.length > 50) {
        playerStats.scoreHistory = playerStats.scoreHistory.slice(-50);
    }

    savePlayerStats();

    const gameContent = document.getElementById('gameContent');

    let message = '';
    if (percentage >= 90) {
        message = '🏆 Excelente! Você é um mestre!';
    } else if (percentage >= 70) {
        message = '🎉 Muito bem! Continue assim!';
    } else if (percentage >= 50) {
        message = '👍 Bom trabalho! Pratique mais!';
    } else {
        message = '💪 Continue tentando! A prática leva à perfeição!';
    }

    const perfectBonus = percentage === 100 ? SCORE_SYSTEM.bonuses.perfectRound : 0;

    gameContent.innerHTML = `
        <div class="game-complete">
            <h2>🎮 Jogo Concluído!</h2>
            <p>${message}</p>
            
            <div class="score-summary">
                <div class="score-item">
                    <span class="score-label">Pontuação da Rodada:</span>
                    <span class="score-value">${gameState.roundScore} pontos</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Acertos:</span>
                    <span class="score-value">${gameState.score}/${gameState.totalQuestions} (${percentage}%)</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Maior Sequência:</span>
                    <span class="score-value">${playerStats.maxStreak} acertos</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Pontuação Total:</span>
                    <span class="score-value">${playerStats.totalScore} pontos</span>
                </div>
                ${perfectBonus > 0 ? `
                <div class="score-item bonus">
                    <span class="score-label">🏆 Bonus Perfeito:</span>
                    <span class="score-value">+${perfectBonus} pontos</span>
                </div>
                ` : ''}
            </div>
            
            <button class="btn" onclick="startGame()" style="font-size: 1.2rem; padding: 15px 30px;">
                🔄 Jogar Novamente
            </button>
            <button class="btn btn-secondary" onclick="showStats()" style="margin-left: 10px;">
                📊 Ver Estatísticas
            </button>
        </div>
    `;

    document.getElementById('resetBtn').style.display = 'none';
    gameState.gameActive = false;

    speak(`Jogo concluído! Você fez ${gameState.roundScore} pontos.`, 'pt');
}
// ==========================================
// 10. FUNÇÕES DE ESTATÍSTICAS
// ==========================================
// Mostrar tela de estatísticas
function showStats() {/* exibe stats detalhadas */
    const gameContent = document.getElementById('gameContent');
    const avgScore = playerStats.gamesPlayed > 0 ? Math.round(playerStats.totalScore / playerStats.gamesPlayed) : 0;
    const accuracy = playerStats.questionsAnswered > 0 ? Math.round((playerStats.correctAnswers / playerStats.questionsAnswered) * 100) : 0;

    gameContent.innerHTML = `
        <div class="stats-view">
            <h2>📊 Suas Estatísticas</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${playerStats.totalScore}</div>
                    <div class="stat-label">Pontos Totais</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${playerStats.gamesPlayed}</div>
                    <div class="stat-label">Jogos Jogados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgScore}</div>
                    <div class="stat-label">Média por Jogo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${accuracy}%</div>
                    <div class="stat-label">Precisão</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${playerStats.maxStreak}</div>
                    <div class="stat-label">Maior Sequência</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${playerStats.correctAnswers}</div>
                    <div class="stat-label">Total de Acertos</div>
                </div>

            </div>
<div class="stat-card level-card-big">
    <div class="stat-number">⭐ ${playerStats.level}</div>
    <div class="stat-label">Nível Atual</div>
    <div class="level-progress">
        <div class="xp-bar-big">
            <div class="xp-progress" style="width: ${getProgressPercentage()}%"></div>
        </div>
        <small>${playerStats.currentXP}/${getXPNeededForNextLevel(playerStats.level)} XP</small>
    </div>
</div>
<div class="stat-card">
    <div class="stat-number">${playerStats.totalXP}</div>
    <div class="stat-label">XP Total</div>
</div>
${playerStats.titles.length > 0 ? `
<div class="stat-card titles-card">
    <div class="stat-number">${playerStats.titles.length}</div>
    <div class="stat-label">Títulos Conquistados</div>
    <div class="titles-list">${playerStats.titles.join(', ')}</div>
</div>
` : ''}
            
            <div style="margin-top: 30px;">
                <button class="btn" onclick="startGame()">🎮 Novo Jogo</button>
                <button class="btn btn-secondary" onclick="resetStats()" style="margin-left: 10px;">🔄 Resetar Estatísticas</button>
            </div>
        </div>
    `;
}
// Resetar todas as estatísticas
function resetStats() {/* limpa dados salvos */
    if (confirm('Tem certeza que deseja resetar todas as estatísticas?')) {
        playerStats = {
            totalScore: 0,
            gamesPlayed: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            streak: 0,
            maxStreak: 0,
            scoreHistory: []
        };
        savePlayerStats();
        showStats();
    }
}
// ==========================================
// 11. FUNÇÕES DE FEEDBACK VISUAL
// ==========================================
// Mostrar feedback na tela
function showFeedback(message, type) {/* exibe mensagem */
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    feedback.style.display = 'block';
}
// Esconder feedback
function hideFeedback() {/* oculta mensagem */
    document.getElementById('feedback').style.display = 'none';
}
// ==========================================
// 12. FUNÇÕES DE GERENCIAMENTO DE FRASES
// ==========================================

// Carregar lista de frases
function loadPhrasesList() {/* exibe lista no gerenciador */
    const list = document.getElementById('phrasesList');

    if (phrases.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma frase cadastrada. Adicione sua primeira frase!</p>';
        return;
    }

    list.innerHTML = phrases.map(phrase => `
    <div class="phrase-item">
        <div class="phrase-content">
            <div class="phrase-english">${phrase.english}</div>
            <div class="phrase-portuguese">${phrase.portuguese}</div>
            <!-- ADICIONAR ESTAS LINHAS: -->
            <div class="phrase-meta">
                <span class="category-badge">${CATEGORIES[phrase.category] || phrase.category}</span>
                <span class="difficulty-badge difficulty-${phrase.difficulty}">${phrase.difficulty}</span>
            </div>
        </div>
        <div class="phrase-actions">
            <button class="btn btn-secondary btn-small" onclick="editPhrase(${phrase.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-small" onclick="deletePhrase(${phrase.id})">🗑️ Excluir</button>
        </div>
    </div>
`).join('');
}
// Abrir modal de adição
function openAddModal() {/* modal para nova frase */
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Adicionar Nova Frase';
    document.getElementById('englishPhrase').value = '';
    document.getElementById('portugueseTranslation').value = '';
    document.getElementById('phraseModal').style.display = 'block';
}
// Editar frase existente
function editPhrase(id) {/* modal para editar */
    const phrase = phrases.find(p => p.id === id);
    if (!phrase) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Frase';
    document.getElementById('englishPhrase').value = phrase.english;
    document.getElementById('portugueseTranslation').value = phrase.portuguese;
    // ADICIONAR ESTAS LINHAS:
    document.getElementById('categorySelect2').value = phrase.category || '';
    document.getElementById('difficultySelect2').value = phrase.difficulty || '';
    document.getElementById('phraseModal').style.display = 'block';
}
// Excluir frase
async function deletePhrase(id) {/* remove frase */
    if (confirm('Tem certeza que deseja excluir esta frase?')) {
        phrases = phrases.filter(p => p.id !== id);
        await savePhrases();
        loadPhrasesList();
    }
}
// Limpar todas as frases
async function clearAllPhrases() {/* remove todas */
    if (confirm('Tem certeza que deseja excluir todas as frases? Esta ação não pode ser desfeita.')) {
        phrases = [];
        await savePhrases();
        loadPhrasesList();
    }
}
// Fechar modal
function closeModal() {/* fecha janela modal */
    document.getElementById('phraseModal').style.display = 'none';
}
// ==========================================
// 13. EVENT LISTENERS
// ==========================================

// Form submission, Formulário de frases
document.getElementById('phraseForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const englishPhrase = document.getElementById('englishPhrase').value.trim();
    const portugueseTranslation = document.getElementById('portugueseTranslation').value.trim();
    const category = document.getElementById('categorySelect2').value;
    const difficulty = document.getElementById('difficultySelect2').value;

    if (!englishPhrase || !portugueseTranslation || !category || !difficulty) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    if (editingId) {
        const phrase = phrases.find(p => p.id === editingId);
        if (phrase) {
            phrase.english = englishPhrase;
            phrase.portuguese = portugueseTranslation;
            phrase.category = category;
            phrase.difficulty = difficulty;
        }
    } else {
        const newId = Math.max(...phrases.map(p => p.id), 0) + 1;
        phrases.push({
            id: newId,
            english: englishPhrase,
            portuguese: portugueseTranslation,
            category: category,
            difficulty: difficulty
        });
    }

    await savePhrases();
    closeModal();
    loadPhrasesList();
});
// ==========================================
// 14. INICIALIZAÇÃO FINAL
// ==========================================

// Chamada da função principal
init();