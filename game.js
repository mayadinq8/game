// Global variables
let firebaseApp;
let db;
let categories = [];
let selectedCategories = [];
let allQuestions = [];
let currentCategoryIndex = 0;
let currentQuestionIndex = 0;
let team1 = { name: "الفريق الأول", score: 0, color: '#c0392b' };
let team2 = { name: "الفريق الثاني", score: 0, color: '#2980b9' };
let currentTeam = team1;
let usedQuestionButtons = new Set();
let timer;
let timerSeconds;
let playMode = 'turnBased';
let deductionPoints = 0;
let questionsUsedCount = 0;

// DOM elements
const mainScreen = document.getElementById('main-screen');
const categorySelectionScreen = document.getElementById('category-selection-screen');
const teamSetupScreen = document.getElementById('team-setup-screen');
const teamColorSelectionScreen = document.getElementById('team-color-selection-screen');
const firstTeamSelectionScreen = document.getElementById('first-team-selection-screen');
const gamePlayScreen = document.getElementById('game-play-screen');
const questionScreen = document.getElementById('question-screen');
const answerScreen = document.getElementById('answer-screen');
const endGameScreen = document.getElementById('end-game-screen');
const startGameBtn = document.getElementById('startGameBtn');
const categoriesGrid = document.getElementById('categories-grid');
const nextBtn = document.getElementById('nextBtn');
const team1NameInput = document.getElementById('team1Name');
const team2NameInput = document.getElementById('team2Name');
const startPlayBtn = document.getElementById('startPlayBtn');
const team1StartBtn = document.getElementById('team1StartBtn');
const team2StartBtn = document.getElementById('team2StartBtn');
const team1ScoreDisplay = document.getElementById('team1Score');
const team2ScoreDisplay = document.getElementById('team2Score');
const currentTeamNameDisplay = document.getElementById('currentTeamName');
const gameCategoriesGrid = document.getElementById('categories-buttons-grid');
const questionContent = document.getElementById('question-content');
const answerContent = document.getElementById('answer-content');
const correctBtn = document.getElementById('correctBtn');
const wrongBtn = document.getElementById('wrongBtn');
const choicesArea = document.getElementById('choices-area');
const multipleChoicesDiv = document.getElementById('multiple-choices');
const challengeBtn = document.getElementById('challengeBtn');
const endGameBtn = document.getElementById('endGameBtn');
const timerCheckbox = document.getElementById('timerCheckbox');
const timerInputArea = document.getElementById('timer-input-area');
const timerInput = document.getElementById('timerInput');
const deductionCheckbox = document.getElementById('deductionCheckbox');
const deductionInputArea = document.getElementById('deduction-input-area');
const deductionInput = document.getElementById('deductionInput');
const team1ColorBtn = document.getElementById('team1-color-btn');
const team2ColorBtn = document.getElementById('team2-color-btn');
const continueToGameBtn = document.getElementById('continueToGameBtn');
const questionTeamNameDisplay = document.getElementById('questionTeamName');
const showAnswerFirstBtn = document.getElementById('showAnswerFirstBtn');
const whoAnsweredModal = document.getElementById('who-answered-modal');
const whoAnsweredTeam1Btn = document.getElementById('who-answered-team1-btn');
const whoAnsweredTeam2Btn = document.getElementById('who-answered-team2-btn');
const whoAnsweredNoneBtn = document.getElementById('who-answered-none-btn');
const scoreCardTeam1 = document.getElementById('score-card-team1');
const scoreCardTeam2 = document.getElementById('score-card-team2');
const teamSetupScreenRadioButtons = document.querySelectorAll('input[name="play-mode"]');
const questionActionsTurnBased = document.getElementById('question-actions-turn-based');
const questionActionsAnswerFirst = document.getElementById('question-actions-answer-first');


// Firebase initialization
function initFirebase() {
    try {
        //  --------------------------------------------------------------
        //  هام جدًا:
        //  تم تحديث إعدادات مشروع Firebase الخاصة بك بناءً على المعلومات التي قدمتها.
        const firebaseConfig = {
            apiKey: "AIzaSyBLyoIoXp2aJCnhFqIFufMVBz0fzCS-FYY",
            authDomain: "game-303eb.firebaseapp.com",
            databaseURL: "https://game-303eb-default-rtdb.firebaseio.com",
            projectId: "game-303eb",
            storageBucket: "game-303eb.firebasestorage.app",
            messagingSenderId: "22261863844",
            appId: "1:22261863844:web:66f8541079b9025ec69d31",
            measurementId: "G-RKN2F3HVHS"
        };
        //  --------------------------------------------------------------
        
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebaseApp.database();
        console.log("Firebase initialized successfully.");
        // Fetch categories after initialization
        fetchCategories();
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showCustomAlert("حدث خطأ في تهيئة Firebase. تأكد من أن إعدادات Firebase صحيحة.", () => {
            // Optional: redirect or reload
        });
    }
}

// Helper function to switch screens
function switchScreen(screenToShow) {
    const screens = [mainScreen, categorySelectionScreen, teamSetupScreen, teamColorSelectionScreen, firstTeamSelectionScreen, gamePlayScreen, questionScreen, answerScreen, endGameScreen];
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    screenToShow.classList.add('active');
    screenToShow.style.display = 'flex';
}

// Show a custom alert modal instead of alert()
function showCustomAlert(message, onOk = null, onCancel = null) {
    const modal = document.getElementById('custom-alert-modal');
    const msgElement = document.getElementById('custom-alert-message');
    const okBtn = document.getElementById('custom-alert-ok-btn');
    const cancelBtn = document.getElementById('custom-alert-cancel-btn');

    msgElement.textContent = message;

    okBtn.onclick = () => {
        modal.style.display = 'none';
        if (onOk) onOk();
    };

    if (onCancel) {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            onCancel();
        };
    } else {
        cancelBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
}

// Fetch categories from Firebase
async function fetchCategories() {
    try {
        const snapshot = await db.ref('categories').once('value');
        const data = snapshot.val();
        if (data) {
            categories = Object.values(data);
            displayCategories();
        } else {
            showCustomAlert('لا توجد أقسام متاحة. يرجى إضافة أقسام أولاً.');
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        showCustomAlert("حدث خطأ أثناء جلب الأقسام. يرجى التحقق من اتصالك.", () => {
            fetchCategories(); // Retry on OK
        });
    }
}

// Display categories for selection
function displayCategories() {
    categoriesGrid.innerHTML = '';
    categories.forEach(category => {
        const card = document.createElement('div');
        card.classList.add('category-card');
        card.innerHTML = `
            <img src="${category.image_url}" alt="${category.title}">
            <h3>${category.title}</h3>
        `;
        card.addEventListener('click', () => toggleCategory(card, category));
        categoriesGrid.appendChild(card);
    });
    switchScreen(categorySelectionScreen);
}

// Handle category selection
function toggleCategory(card, category) {
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        selectedCategories = selectedCategories.filter(cat => cat.title !== category.title);
    } else if (selectedCategories.length < 6) {
        card.classList.add('selected');
        selectedCategories.push(category);
    }

    if (selectedCategories.length === 6) {
        nextBtn.disabled = false;
    } else {
        nextBtn.disabled = true;
    }
}

// Fetch questions for selected categories
async function fetchQuestions() {
    allQuestions = [];
    try {
        const promises = selectedCategories.map(cat =>
            db.ref(`questions/${cat.id}`).once('value').then(snapshot => {
                const questions = snapshot.val();
                if (questions) {
                    return Object.values(questions);
                }
                return [];
            })
        );
        const results = await Promise.all(promises);
        results.forEach((questions, index) => {
            allQuestions.push({
                categoryTitle: selectedCategories[index].title,
                questions: questions
            });
        });
        console.log("All questions fetched:", allQuestions);
        questionsUsedCount = 0;
        switchScreen(teamSetupScreen);
    } catch (error) {
        console.error("Error fetching questions:", error);
        showCustomAlert("حدث خطأ أثناء جلب الأسئلة. يرجى المحاولة مرة أخرى.");
    }
}

// Set up teams and display on screen
function setupTeams() {
    team1.name = team1NameInput.value || "الفريق الأول";
    team2.name = team2NameInput.value || "الفريق الثاني";
    team1StartBtn.textContent = team1.name;
    team2StartBtn.textContent = team2.name;

    // Get play mode from radio buttons
    const playModeSelection = document.querySelector('input[name="play-mode"]:checked');
    if (playModeSelection) {
        playMode = playModeSelection.value;
    }
    
    // Get deduction points
    deductionPoints = deductionCheckbox.checked ? parseInt(deductionInput.value) : 0;
    
    switchScreen(teamColorSelectionScreen);
}

// Display category buttons for the game
function displayGameCategories() {
    gameCategoriesGrid.innerHTML = '';
    
    allQuestions.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.innerHTML = `<h3>${category.categoryTitle}</h3>`;
        
        const pointsButtons = document.createElement('div');
        pointsButtons.classList.add('points-buttons');

        // Points values based on game logic
        const pointsValues = [100, 200, 300, 400, 500];

        pointsValues.forEach(points => {
            const button = document.createElement('button');
            button.textContent = points;
            button.classList.add('points-btn');
            button.dataset.categoryId = index;
            button.dataset.points = points;
            
            // Set initial button style based on play mode
            if (playMode === 'turnBased') {
                button.style.backgroundColor = 'var(--secondary-color)';
                button.style.color = '#fff';
            } else { // answerFirst
                button.style.backgroundColor = '#7f8c8d'; // Grey
            }

            button.addEventListener('click', () => handleQuestionButtonClick(button, index, points));
            pointsButtons.appendChild(button);
        });

        categoryItem.appendChild(pointsButtons);
        gameCategoriesGrid.appendChild(categoryItem);
    });

    switchScreen(gamePlayScreen);
}

// Handle question button click
function handleQuestionButtonClick(button, categoryIndex, points) {
    if (usedQuestionButtons.has(button.id)) {
        showCustomAlert("هذا السؤال تم استخدامه بالفعل.");
        return;
    }

    // Assign a unique ID to the button
    const buttonId = `cat-${categoryIndex}-points-${points}`;
    button.id = buttonId;
    
    // Find the question with the matching points value that hasn't been used
    const categoryQuestions = allQuestions[categoryIndex].questions;
    const question = categoryQuestions.find(q => q.points == points && !q.used);

    if (question) {
        question.used = true;
        questionsUsedCount++;
        button.disabled = true;
        usedQuestionButtons.add(buttonId);
        
        // Store the question for later use
        window.currentQuestion = question;
        window.currentQuestionButtonId = buttonId; // Store button ID to update later

        displayQuestionScreen(question);
    } else {
        showCustomAlert('لا يوجد سؤال متاح بهذه النقاط في هذا القسم.');
        button.disabled = true;
    }
}

// Display the question screen
function displayQuestionScreen(question) {
    questionContent.innerHTML = '';
    choicesArea.style.display = 'none';
    multipleChoicesDiv.innerHTML = '';
    
    // Hide or show question actions based on play mode
    if (playMode === 'turnBased') {
        questionActionsTurnBased.style.display = 'flex';
        questionActionsAnswerFirst.style.display = 'none';
        questionTeamNameDisplay.textContent = `دور ${currentTeam.name}`;
        questionTeamNameDisplay.style.color = currentTeam.color;
        questionTeamNameDisplay.style.display = 'block';
    } else { // answerFirst
        questionActionsTurnBased.style.display = 'none';
        questionActionsAnswerFirst.style.display = 'flex';
        questionTeamNameDisplay.style.display = 'none';
    }

    const questionText = document.createElement('p');
    questionText.id = 'question-text';
    questionText.innerHTML = question.text;
    questionContent.appendChild(questionText);

    // Add media if available
    if (question.media_url) {
        const mediaContainer = document.createElement('div');
        mediaContainer.classList.add('media-container');
        if (question.media_type === 'image') {
            const img = document.createElement('img');
            img.src = question.media_url;
            mediaContainer.appendChild(img);
        } else if (question.media_type === 'video') {
            const video = document.createElement('video');
            video.src = question.media_url;
            video.controls = true;
            mediaContainer.appendChild(video);
        } else if (question.media_type === 'audio') {
            const audio = document.createElement('audio');
            audio.src = question.media_url;
            audio.controls = true;
            mediaContainer.appendChild(audio);
        }
        questionContent.appendChild(mediaContainer);
    }

    if (timerCheckbox.checked) {
        startTimer(timerInput.value);
    }

    switchScreen(questionScreen);
}

// Display multiple choices
function displayChoices(question) {
    multipleChoicesDiv.innerHTML = '';
    choicesArea.style.display = 'block';
    
    const choices = [question.correct_answer, ...question.wrong_answers];
    choices.sort(() => Math.random() - 0.5);
    
    choices.forEach(choice => {
        const choiceBtn = document.createElement('button');
        choiceBtn.classList.add('choice-btn');
        choiceBtn.textContent = choice;
        choiceBtn.addEventListener('click', () => handleChoiceClick(choiceBtn, choice, question));
        multipleChoicesDiv.appendChild(choiceBtn);
    });
}

// Handle multiple choice button click (turn-based only)
function handleChoiceClick(button, choiceText, question) {
    if (choiceText === question.correct_answer) {
        showCustomAlert("إجابة صحيحة!");
        updateScore(currentTeam, question.points);
        showAnswer(question);
    } else {
        showCustomAlert("إجابة خاطئة!");
        if (deductionPoints > 0) {
            updateScore(currentTeam, -deductionPoints);
        }
        // Change turn and show answer
        switchTurn();
        showAnswer(question);
    }
}

// Show the answer screen
function showAnswer(question) {
    answerContent.innerHTML = '';
    const answerText = document.createElement('p');
    answerText.id = 'answer-text';
    answerText.innerHTML = `**${question.correct_answer}**`;
    answerContent.appendChild(answerText);
    
    // Add media if available
    if (question.media_url) {
        const mediaContainer = document.createElement('div');
        mediaContainer.classList.add('media-container');
        if (question.media_type === 'image') {
            const img = document.createElement('img');
            img.src = question.media_url;
            mediaContainer.appendChild(img);
        } else if (question.media_type === 'video') {
            const video = document.createElement('video');
            video.src = question.media_url;
            video.controls = true;
            mediaContainer.appendChild(video);
        } else if (question.media_type === 'audio') {
            const audio = document.createElement('audio');
            audio.src = question.media_url;
            audio.controls = true;
            mediaContainer.appendChild(audio);
        }
        answerContent.appendChild(mediaContainer);
    }

    stopTimer();
    switchScreen(answerScreen);
}

// Update the score and UI
function updateScore(team, points) {
    team.score += points;
    updateScoreDisplay();
}

// Update the score display
function updateScoreDisplay() {
    team1ScoreDisplay.textContent = `${team1.name}: ${team1.score}`;
    team2ScoreDisplay.textContent = `${team2.name}: ${team2.score}`;

    // Set score card background colors
    scoreCardTeam1.style.backgroundColor = team1.color;
    scoreCardTeam2.style.backgroundColor = team2.color;
    scoreCardTeam1.style.color = '#fff';
    scoreCardTeam2.style.color = '#fff';

    if (playMode === 'turnBased') {
        if (currentTeam === team1) {
            scoreCardTeam1.classList.add('active');
            scoreCardTeam2.classList.remove('active');
            scoreCardTeam1.style.borderColor = team1.color;
            scoreCardTeam2.style.borderColor = 'transparent';
        } else {
            scoreCardTeam2.classList.add('active');
            scoreCardTeam1.classList.remove('active');
            scoreCardTeam2.style.borderColor = team2.color;
            scoreCardTeam1.style.borderColor = 'transparent';
        }
    }
}

// Switch the current team
function switchTurn() {
    if (playMode === 'turnBased') {
        currentTeam = (currentTeam === team1) ? team2 : team1;
        currentTeamNameDisplay.textContent = `دور ${currentTeam.name}`;
        currentTeamNameDisplay.style.backgroundColor = currentTeam.color;
        updateScoreDisplay();
    }
}

// Check for game end
function checkGameEnd() {
    if (questionsUsedCount >= 30) { // Assuming 6 categories * 5 questions = 30
        endGame();
    } else {
        switchScreen(gamePlayScreen);
    }
}

// End the game and display results
function endGame() {
    let winner;
    if (team1.score > team2.score) {
        winner = team1;
    } else if (team2.score > team1.score) {
        winner = team2;
    } else {
        winner = null; // Tie
    }

    const endGameTitle = document.getElementById('end-game-title');
    const winnerNameDisplay = document.getElementById('winner-name-display');
    const team1NameEndScreen = document.getElementById('team1-name-end-screen');
    const team2NameEndScreen = document.getElementById('team2-name-end-screen');
    const team1FinalScore = document.getElementById('team1-final-score');
    const team2FinalScore = document.getElementById('team2-final-score');
    const team1ScoreCard = document.getElementById('team1-score-card');
    const team2ScoreCard = document.getElementById('team2-score-card');
    
    if (winner) {
        endGameTitle.textContent = "الفائز هو:";
        winnerNameDisplay.textContent = winner.name;
        winnerNameDisplay.style.backgroundColor = winner.color;
        
        if (winner === team1) {
            team1ScoreCard.classList.add('winner-card');
            team2ScoreCard.classList.add('loser-card');
        } else {
            team2ScoreCard.classList.add('winner-card');
            team1ScoreCard.classList.add('loser-card');
        }
    } else {
        endGameTitle.textContent = "تعادل!";
        winnerNameDisplay.textContent = "";
        winnerNameDisplay.style.backgroundColor = 'transparent';
        team1ScoreCard.classList.remove('winner-card');
        team2ScoreCard.classList.remove('winner-card');
        team1ScoreCard.classList.add('loser-card');
        team2ScoreCard.classList.add('loser-card');
    }

    team1NameEndScreen.textContent = team1.name;
    team2NameEndScreen.textContent = team2.name;
    team1FinalScore.textContent = team1.score;
    team2FinalScore.textContent = team2.score;

    switchScreen(endGameScreen);
}

// Timer functions
function startTimer(seconds) {
    if (timer) clearInterval(timer);
    timerSeconds = parseInt(seconds);
    questionTimerDisplay.textContent = `الوقت المتبقي: ${timerSeconds}`;
    questionTimerDisplay.style.display = 'block';

    timer = setInterval(() => {
        timerSeconds--;
        questionTimerDisplay.textContent = `الوقت المتبقي: ${timerSeconds}`;
        if (timerSeconds <= 0) {
            clearInterval(timer);
            showCustomAlert("انتهى الوقت!", () => {
                // Handle timeout logic, e.g., switch turn or deduct points
                if (playMode === 'turnBased') {
                    if (deductionPoints > 0) {
                        updateScore(currentTeam, -deductionPoints);
                    }
                    switchTurn();
                    showAnswer(window.currentQuestion);
                } else { // answerFirst
                    showAnswer(window.currentQuestion);
                }
            });
        }
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    questionTimerDisplay.style.display = 'none';
}

// Event listeners
// Changed this line to re-fetch categories when starting a new game
startGameBtn.addEventListener('click', () => {
    fetchCategories();
});

nextBtn.addEventListener('click', fetchQuestions);
startPlayBtn.addEventListener('click', () => {
    setupTeams();
    switchScreen(teamColorSelectionScreen);
});

// Color selection logic
team1ColorBtn.addEventListener('click', () => {
    const colorPickerModal = document.getElementById('color-picker-modal');
    const colorGrid = document.getElementById('color-grid');
    colorGrid.innerHTML = '';
    const colors = ['#c0392b', '#e74c3c', '#9b59b6', '#3498db', '#2980b9', '#1abc9c', '#2ecc71', '#f1c40f', '#f39c12', '#d35400'];
    colors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;
        colorBox.addEventListener('click', () => {
            team1.color = color;
            team1ColorBtn.style.backgroundColor = color;
            colorPickerModal.style.display = 'none';
        });
        colorGrid.appendChild(colorBox);
    });
    document.getElementById('color-picker-cancel-btn').onclick = () => colorPickerModal.style.display = 'none';
    colorPickerModal.style.display = 'flex';
});

team2ColorBtn.addEventListener('click', () => {
    const colorPickerModal = document.getElementById('color-picker-modal');
    const colorGrid = document.getElementById('color-grid');
    colorGrid.innerHTML = '';
    const colors = ['#c0392b', '#e74c3c', '#9b59b6', '#3498db', '#2980b9', '#1abc9c', '#2ecc71', '#f1c40f', '#f39c12', '#d35400'];
    colors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;
        colorBox.addEventListener('click', () => {
            team2.color = color;
            team2ColorBtn.style.backgroundColor = color;
            colorPickerModal.style.display = 'none';
        });
        colorGrid.appendChild(colorBox);
    });
    document.getElementById('color-picker-cancel-btn').onclick = () => colorPickerModal.style.display = 'none';
    colorPickerModal.style.display = 'flex';
});

continueToGameBtn.addEventListener('click', () => {
    switchScreen(firstTeamSelectionScreen);
    whoAnsweredTeam1Btn.textContent = team1.name;
    whoAnsweredTeam2Btn.textContent = team2.name;
});


team1StartBtn.addEventListener('click', () => {
    currentTeam = team1;
    startGamePlay();
});

team2StartBtn.addEventListener('click', () => {
    currentTeam = team2;
    startGamePlay();
});

function startGamePlay() {
    updateScoreDisplay();
    displayGameCategories();
    if (playMode === 'turnBased') {
        currentTeamNameDisplay.textContent = `دور ${currentTeam.name}`;
        currentTeamNameDisplay.style.backgroundColor = currentTeam.color;
        currentTeamNameDisplay.style.display = 'block';
    } else { // answerFirst
        currentTeamNameDisplay.style.display = 'none';
    }
}

// Question actions (turn-based mode)
const revealChoicesBtn = document.getElementById('revealChoicesBtn');
const answerBtn = document.getElementById('answerBtn');
challengeBtn.addEventListener('click', () => {
    document.getElementById('challenge-modal').style.display = 'flex';
});

answerBtn.addEventListener('click', () => {
    displayChoices(window.currentQuestion);
});

// Question actions (answer-first mode)
showAnswerFirstBtn.addEventListener('click', () => {
    whoAnsweredModal.style.display = 'flex';
});


// Who answered modal logic
whoAnsweredTeam1Btn.addEventListener('click', () => {
    handleAnswerFirstResult(team1, window.currentQuestion);
});

whoAnsweredTeam2Btn.addEventListener('click', () => {
    handleAnswerFirstResult(team2, window.currentQuestion);
});

whoAnsweredNoneBtn.addEventListener('click', () => {
    handleAnswerFirstResult(null, window.currentQuestion);
});

function handleAnswerFirstResult(winningTeam, question) {
    whoAnsweredModal.style.display = 'none';
    const pointsBtn = document.getElementById(window.currentQuestionButtonId);
    
    if (winningTeam) {
        showCustomAlert(`${winningTeam.name} أجاب بشكل صحيح!`);
        updateScore(winningTeam, question.points);
        pointsBtn.style.backgroundColor = winningTeam.color;
    } else {
        showCustomAlert("لم يجب أحد بشكل صحيح.");
        pointsBtn.style.backgroundColor = '#7f8c8d'; // keep it grey
    }
    
    pointsBtn.disabled = true;
    showAnswer(question);
}


// Answer screen actions
correctBtn.addEventListener('click', () => {
    // This is for manual score update, not used in the automated flow but good for flexibility
    updateScore(currentTeam, window.currentQuestion.points);
    switchTurn();
    checkGameEnd();
});

wrongBtn.addEventListener('click', () => {
    // This is for manual score update
    if (deductionPoints > 0) {
        updateScore(currentTeam, -deductionPoints);
    }
    switchTurn();
    checkGameEnd();
});

// End game button
endGameBtn.addEventListener('click', () => {
    // Reset game state and return to main screen
    team1.score = 0;
    team2.score = 0;
    currentTeam = team1;
    selectedCategories = [];
    allQuestions = [];
    usedQuestionButtons = new Set();
    questionsUsedCount = 0;
    const allButtons = document.querySelectorAll('.points-btn');
    allButtons.forEach(btn => {
        btn.disabled = false;
    });
    switchScreen(mainScreen);
});


// Toggle timer input
timerCheckbox.addEventListener('change', () => {
    timerInputArea.style.display = timerCheckbox.checked ? 'block' : 'none';
});

deductionCheckbox.addEventListener('change', () => {
    deductionInputArea.style.display = deductionCheckbox.checked ? 'block' : 'none';
});

// Initial setup
window.onload = () => {
    initFirebase();
};
