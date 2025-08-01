document.addEventListener('DOMContentLoaded', () => {
    // Firebase references
    const database = firebase.database();
    const storage = firebase.storage();

    // DOM elements
    const screens = document.querySelectorAll('.screen');
    const mainScreen = document.getElementById('main-screen');
    const categorySelectionScreen = document.getElementById('category-selection-screen');
    const teamSetupScreen = document.getElementById('team-setup-screen');
    const firstTeamSelectionScreen = document.getElementById('first-team-selection-screen');
    const gamePlayScreen = document.getElementById('game-play-screen');
    const questionScreen = document.getElementById('question-screen');
    const answerScreen = document.getElementById('answer-screen');
    const endGameScreen = document.getElementById('end-game-screen');

    // -- إضافة جديدة لشاشات البوب-أب
    const customAlertModal = document.getElementById('custom-alert-modal');
    const customAlertMessage = document.getElementById('custom-alert-message');
    const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');
    const customAlertCancelBtn = document.getElementById('custom-alert-cancel-btn');
    const challengeModal = document.getElementById('challenge-modal');
    const challengeCompleteBtn = document.getElementById('challenge-complete-btn');
    const challengeCancelBtn = document.getElementById('challenge-cancel-btn');
    const revealChoicesConfirmModal = document.getElementById('reveal-choices-confirm-modal');
    const revealChoicesConfirmBtn = document.getElementById('reveal-choices-confirm-btn');
    const revealChoicesCancelBtn = document.getElementById('reveal-choices-cancel-btn');

    // Buttons and inputs
    const startGameBtn = document.getElementById('startGameBtn');
    const categoriesGrid = document.getElementById('categories-grid');
    const nextBtn = document.getElementById('nextBtn');
    const team1NameInput = document.getElementById('team1Name');
    const team2NameInput = document.getElementById('team2Name');
    const timerCheckbox = document.getElementById('timerCheckbox');
    const timerInputArea = document.getElementById('timer-input-area');
    const timerInput = document.getElementById('timerInput');
    const deductionCheckbox = document.getElementById('deductionCheckbox');
    const deductionInputArea = document.getElementById('deduction-input-area');
    const deductionInput = document.getElementById('deductionInput');
    const startPlayBtn = document.getElementById('startPlayBtn');
    const team1StartBtn = document.getElementById('team1StartBtn');
    const team2StartBtn = document.getElementById('team2StartBtn');
    const revealChoicesBtn = document.getElementById('revealChoicesBtn');
    const challengeBtn = document.getElementById('challengeBtn');
    const answerBtn = document.getElementById('answerBtn');
    const correctBtn = document.getElementById('correctBtn');
    const wrongBtn = document.getElementById('wrongBtn');
    const endGameBtn = document.getElementById('endGameBtn');

    // New game mode elements
    const gameModeSelection = document.getElementById('gameModeSelection');
    const team1ColorSelector = document.getElementById('team1ColorSelector');
    const team2ColorSelector = document.getElementById('team2ColorSelector');
    const teamSetupContainer = document.querySelector('.team-setup-container');
    const startGameFirstToAnswerBtn = document.getElementById('startGameFirstToAnswerBtn');
    const whoAnsweredModal = document.getElementById('who-answered-modal');
    const whoAnsweredTeam1Btn = document.getElementById('who-answered-team1-btn');
    const whoAnsweredTeam2Btn = document.getElementById('who-answered-team2-btn');
    const whoAnsweredNoneBtn = document.getElementById('who-answered-none-btn');

    // Game state variables
    let allQuestions = {};
    let allCatalogs = [];
    let selectedCatalogs = [];
    let teams = {
        team1: { name: '', score: 0, challenges: 2, color: '#3498db', textColor: '#fff' },
        team2: { name: '', score: 0, challenges: 2, color: '#e74c3c', textColor: '#fff' }
    };
    let currentPlayer = 'team1';
    let hasTimer = false;
    let timerValue = 0;
    let hasDeduction = false;
    let deductionValue = 0;
    let currentQuestion = null;
    let currentPoints = 0;
    let timerInterval = null;
    let isChoicesUsed = false;
    let usedQuestions = new Set();
    const LOGO_SRC = 'logogame.png';
    let gameMode = 'turnBased'; // 'turnBased' or 'firstToAnswer'
    let currentQuestionButton = null; // To store the button that was clicked

    // Helper functions
    const showScreen = (screenId) => {
        screens.forEach(screen => screen.style.display = 'none');
        screenId.style.display = 'flex';
    };

    const updateLogo = (size) => {
        const existingLogo = document.querySelector('.game-container img.logo');
        if (existingLogo) {
            existingLogo.remove();
        }
        const logo = document.createElement('img');
        logo.src = LOGO_SRC;
        logo.alt = 'شعار اللعبة';
        logo.className = `logo ${size}-logo`;
        document.querySelector('.game-container').prepend(logo);
    };

    const showCustomAlert = (message, onConfirmCallback = () => {}, onCancelCallback = null) => {
        const modal = document.getElementById('custom-alert-modal');
        const messageElement = document.getElementById('custom-alert-message');
        const okBtn = document.getElementById('custom-alert-ok-btn');
        const cancelBtn = document.getElementById('custom-alert-cancel-btn');

        messageElement.textContent = message;
        okBtn.textContent = onCancelCallback ? 'نعم' : 'موافق';
        okBtn.onclick = () => {
            modal.style.display = 'none';
            onConfirmCallback();
        };

        if (onCancelCallback) {
            cancelBtn.style.display = 'inline-block';
            cancelBtn.onclick = () => {
                modal.style.display = 'none';
                onCancelCallback();
            };
        } else {
            cancelBtn.style.display = 'none';
        }
        modal.style.display = 'flex';
    };
    
    const showConfirmAlert = (message, onConfirm, onCancel) => {
        const modal = document.getElementById('reveal-choices-confirm-modal');
        if (!modal) {
            if (window.confirm(message)) {
                onConfirm();
            } else {
                onCancel();
            }
            return;
        }

        const messageElement = modal.querySelector('.alert-message');
        const confirmBtn = modal.querySelector('#reveal-choices-confirm-btn');
        const cancelBtn = modal.querySelector('#reveal-choices-cancel-btn');

        messageElement.textContent = message;
        modal.style.display = 'flex';

        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            onConfirm();
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            onCancel();
        };
    };

    const showChallengeModal = (onConfirm, onCancel) => {
        challengeModal.style.display = 'flex';
        challengeCompleteBtn.onclick = () => {
            challengeModal.style.display = 'none';
            onConfirm();
        };
        challengeCancelBtn.onclick = () => {
            challengeModal.style.display = 'none';
            onCancel();
        };
    };

    const createMediaElement = (mediaUrl) => {
        if (!mediaUrl) return null;
        
        const url = new URL(mediaUrl);
        const filename = url.pathname.split('/').pop().split('?')[0];
        const mediaType = filename.split('.').pop();
        
        let mediaElement;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        const videoExtensions = ['mp4', 'webm', 'ogg'];
        const audioExtensions = ['mp3', 'wav'];

        if (imageExtensions.includes(mediaType.toLowerCase())) {
            mediaElement = document.createElement('img');
            mediaElement.className = 'question-media-image';
        } else if (videoExtensions.includes(mediaType.toLowerCase())) {
            mediaElement = document.createElement('video');
            mediaElement.className = 'question-media-video';
            mediaElement.controls = true;
        } else if (audioExtensions.includes(mediaType.toLowerCase())) {
            mediaElement = document.createElement('audio');
            mediaElement.className = 'question-media-audio';
            mediaElement.controls = true;
        }

        if (mediaElement) {
            mediaElement.src = mediaUrl;
        }
        return mediaElement;
    };
    
    const getMediaUrl = async (mediaPath) => {
        if (!mediaPath) return null;
        if (mediaPath.startsWith('https://firebasestorage')) {
            return mediaPath;
        }
        try {
            const mediaRef = storage.ref(mediaPath);
            return await mediaRef.getDownloadURL();
        } catch (error) {
            console.error("Error fetching media URL:", error);
            return null;
        }
    };
    
    const fetchCatalogs = async () => {
        try {
            const catalogsSnapshot = await database.ref('catalogs').once('value');
            const catalogsData = catalogsSnapshot.val();
            const questionsSnapshot = await database.ref('questions').once('value');
            const questionsData = questionsSnapshot.val();

            if (!catalogsData) {
                console.error("لا توجد كتالوجات في قاعدة البيانات.");
                return;
            }

            const catalogsMap = {};
            for (const catalogName in catalogsData) {
                if (catalogsData.hasOwnProperty(catalogName)) {
                    catalogsMap[catalogName] = {
                        name: catalogName,
                        image: catalogsData[catalogName].image,
                        description: catalogsData[catalogName].description || '',
                        questions: []
                    };
                }
            }
            
            if (questionsData) {
                for (const batchKey in questionsData) {
                    const batchItems = questionsData[batchKey].items;
                    if (batchItems) {
                        Object.values(batchItems).forEach(item => {
                            const catalogName = item.catalog;
                            if (catalogsMap[catalogName]) {
                                catalogsMap[catalogName].questions.push(item);
                            }
                        });
                    }
                }
            }
            allCatalogs = Object.values(catalogsMap);

        } catch (error) {
            console.error("Error fetching catalogs:", error);
            showCustomAlert("فشل في جلب الكتالوجات من Firebase.");
        }
    };
    
    const displayCategorySelection = () => {
        categoriesGrid.innerHTML = '';
        allCatalogs.forEach(catalog => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <img src="${catalog.image || 'placeholder.jpg'}" alt="${catalog.name}">
                <p>${catalog.name}</p>
                ${catalog.description ? 
                    `<div class="info-icon-container" data-description="${catalog.description}">
                        <span class="info-icon">!</span>
                    </div>` : ''}
            `;
            
            const infoIconBtn = card.querySelector('.info-icon-container');
            if (infoIconBtn) {
                infoIconBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const description = e.currentTarget.dataset.description;
                    showCustomAlert(description);
                });
            }
            
            card.addEventListener('click', () => {
                if (card.classList.contains('selected')) {
                    card.classList.remove('selected');
                    selectedCatalogs = selectedCatalogs.filter(c => c.name !== catalog.name);
                } else {
                    if (selectedCatalogs.length < 6) {
                        card.classList.add('selected');
                        selectedCatalogs.push(catalog);
                    } else {
                        showCustomAlert("يمكنك اختيار 6 كتالوجات فقط.");
                    }
                }
                nextBtn.disabled = selectedCatalogs.length !== 6;
            });
            categoriesGrid.appendChild(card);
        });
    };

    startGameBtn.addEventListener('click', async () => {
        selectedCatalogs = [];
        usedQuestions = new Set();
        updateLogo('small');
        await fetchCatalogs();
        if (allCatalogs.length > 0) {
            showScreen(categorySelectionScreen);
            displayCategorySelection();
        } else {
            showCustomAlert("لا توجد كتالوجات متاحة لبدء لعبة جديدة. يرجى إضافة كتالوجات في Firebase.");
            showScreen(mainScreen);
            updateLogo('large');
        }
    });

    nextBtn.addEventListener('click', () => {
        showScreen(teamSetupScreen);
    });
    
    gameModeSelection.addEventListener('change', (e) => {
        gameMode = e.target.value;
    });

    deductionCheckbox.addEventListener('change', (e) => {
        deductionInputArea.style.display = e.target.checked ? 'block' : 'none';
        hasDeduction = e.target.checked;
    });

    timerCheckbox.addEventListener('change', (e) => {
        timerInputArea.style.display = e.target.checked ? 'block' : 'none';
        hasTimer = e.target.checked;
    });

    startPlayBtn.addEventListener('click', () => {
        const team1Name = team1NameInput.value || 'الفريق الأول';
        const team2Name = team2NameInput.value || 'الفريق الثاني';
        teams.team1.name = team1Name;
        teams.team2.name = team2Name;

        if (hasTimer) {
            timerValue = parseInt(timerInput.value, 10);
            if (isNaN(timerValue) || timerValue <= 0) {
                showCustomAlert("يرجى إدخال مدة مؤقت صحيحة.");
                return;
            }
        }
        
        if (hasDeduction) {
            deductionValue = parseInt(deductionInput.value, 10);
            if (isNaN(deductionValue) || deductionValue < 0) {
                showCustomAlert("يرجى إدخال قيمة خصم صحيحة.");
                return;
            }
        }
        
        document.getElementById('team1NameDisplay').textContent = teams.team1.name;
        document.getElementById('team2NameDisplay').textContent = teams.team2.name;

        // Update color selectors display
        team1ColorSelector.style.backgroundColor = teams.team1.color;
        team2ColorSelector.style.backgroundColor = teams.team2.color;

        if (gameMode === 'turnBased') {
            document.getElementById('first-team-selection-title').textContent = 'منو اللي راح يبلش؟';
            teamSetupContainer.style.display = 'flex';
            startGameFirstToAnswerBtn.style.display = 'none';
        } else {
            document.getElementById('first-team-selection-title').textContent = 'مستعدين؟';
            teamSetupContainer.style.display = 'none';
            startGameFirstToAnswerBtn.style.display = 'block';
        }
        showScreen(firstTeamSelectionScreen);
    });

    // Color selectors logic
    team1ColorSelector.addEventListener('click', () => showColorPicker('team1', team1ColorSelector));
    team2ColorSelector.addEventListener('click', () => showColorPicker('team2', team2ColorSelector));

    startGameFirstToAnswerBtn.addEventListener('click', () => startGame());

    const showColorPicker = (teamId, targetElement) => {
        // Remove existing picker if it's open
        const existingPicker = document.querySelector('.color-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        const pickerContainer = document.createElement('div');
        pickerContainer.className = 'color-picker';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e'];
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.style.backgroundColor = color;
            colorBtn.className = 'color-btn';
            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                teams[teamId].color = color;
                targetElement.style.backgroundColor = color;
                targetElement.textContent = 'تم الاختيار';
                pickerContainer.remove();
            });
            pickerContainer.appendChild(colorBtn);
        });
        targetElement.insertAdjacentElement('afterend', pickerContainer);
    };

    team1StartBtn.addEventListener('click', () => {
        currentPlayer = 'team1';
        startGame();
    });

    team2StartBtn.addEventListener('click', () => {
        currentPlayer = 'team2';
        startGame();
    });

    const startGame = () => {
        showScreen(gamePlayScreen);
        updateGameCategoriesDisplay();
        updateScoreDisplay();
        if (gameMode === 'turnBased') {
            document.getElementById('currentTeamName').style.display = 'block';
            document.getElementById('challengeBtn').style.display = 'block';
            document.getElementById('answerBtn').style.display = 'block';
            document.getElementById('correctBtn').style.display = 'block';
            document.getElementById('wrongBtn').style.display = 'block';
            updateCurrentTeamName();
        } else {
            document.getElementById('currentTeamName').style.display = 'none';
            document.getElementById('challengeBtn').style.display = 'none';
            document.getElementById('answerBtn').style.display = 'block';
            document.getElementById('correctBtn').style.display = 'none';
            document.getElementById('wrongBtn').style.display = 'none';
            // Also need to hide buttons on question screen for first to answer mode
            const questionActions = document.querySelector('#question-screen .question-actions');
            if (questionActions) {
                questionActions.style.display = 'none';
            }
        }
    };

    const updateGameCategoriesDisplay = () => {
        const grid = document.getElementById('game-categories-grid');
        grid.innerHTML = '';
        
        selectedCatalogs.forEach(catalog => {
            const catalogItem = document.createElement('div');
            catalogItem.className = 'category-item';
            
            catalogItem.innerHTML = `
                <img src="${catalog.image || 'placeholder.jpg'}" alt="${catalog.name}">
                <p>${catalog.name}</p>
                <div class="points-buttons-container">
                    <div class="points-buttons right-side"></div>
                    <div class="points-buttons left-side"></div>
                </div>
            `;
            
            const pointsRightDiv = catalogItem.querySelector('.right-side');
            const pointsLeftDiv = catalogItem.querySelector('.left-side');
            const pointsValues = [200, 200, 400, 400, 600, 600];
            
            const createPointsButtons = (container, teamId) => {
                pointsValues.forEach(points => {
                    const button = document.createElement('button');
                    button.dataset.points = points;
                    button.dataset.catalog = catalog.name;
                    button.dataset.teamId = teamId;
                    button.textContent = `${points}`;
                    
                    if (gameMode === 'turnBased') {
                        button.style.backgroundColor = teams[teamId].color;
                        button.style.color = teams[teamId].textColor;
                    } else {
                        button.classList.add('first-to-answer-btn');
                    }
                    
                    const allQuestionsInPoints = catalog.questions.filter(q => q.points === points);
                    const usedCount = Array.from(usedQuestions).filter(qKey => {
                        const [qCatalog, qPoints, qTeamId] = qKey.split('|');
                        return qCatalog === catalog.name && parseInt(qPoints, 10) === points;
                    }).length;

                    if (usedCount >= allQuestionsInPoints.length) {
                        button.disabled = true;
                        button.classList.add('disabled-btn');
                    }
                    
                    button.addEventListener('click', (e) => {
                        // Store the clicked button element
                        currentQuestionButton = e.target;
                        if (gameMode === 'turnBased' && currentPlayer !== teamId) {
                            showCustomAlert('هذا دور الفريق الآخر!');
                            return;
                        }
                        
                        e.target.disabled = true;
                        showQuestion(catalog.name, points, e.target);
                    });
                    
                    container.appendChild(button);
                });
            };

            createPointsButtons(pointsRightDiv, 'team1');
            createPointsButtons(pointsLeftDiv, 'team2');

            grid.appendChild(catalogItem);
        });
        
        if (checkIfAllButtonsDisabled()) {
            setTimeout(endGame, 1000); 
        }
    };
    
    const checkIfAllButtonsDisabled = () => {
        const allButtons = document.querySelectorAll('.points-buttons-container button');
        for (const button of allButtons) {
            if (!button.disabled) {
                return false;
            }
        }
        return true; 
    };

    const showQuestion = async (catalogName, points, sourceButton) => {
        const catalog = selectedCatalogs.find(c => c.name === catalogName);
        if (!catalog) return;
        
        const availableQuestions = catalog.questions.filter(q => q.points === points && !usedQuestions.has(q.question));
        
        if (availableQuestions.length === 0) {
            showCustomAlert("لا توجد أسئلة متاحة في هذا الكتالوج بهذه النقاط.");
            return;
        }

        currentPoints = points;
        currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        usedQuestions.add(currentQuestion.question);
        
        document.getElementById('questionTeamName').textContent = gameMode === 'turnBased' ? `الفريق الحالي: ${teams[currentPlayer].name}` : 'استعدوا للإجابة!';
        
        const questionContent = document.getElementById('question-content');
        questionContent.innerHTML = '';
        
        const questionTextElement = document.createElement('h2');
        questionTextElement.id = 'question-text';
        questionTextElement.textContent = currentQuestion.question || '';
        questionContent.appendChild(questionTextElement);
        
        if (currentQuestion.questionMedia) {
            const mediaElement = createMediaElement(currentQuestion.questionMedia);
            if (mediaElement) {
                questionContent.appendChild(mediaElement);
            }
        }

        showScreen(questionScreen);
        isChoicesUsed = false;
        document.getElementById('revealChoicesBtn').style.display = 'block';
        document.getElementById('multiple-choices').innerHTML = '';
        
        if (hasTimer) {
            startTimer();
        }
    };
    
    const pauseTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    };
    
    const resumeTimer = () => {
        if (!timerInterval && hasTimer) {
            startTimer();
        }
    };

    const startTimer = () => {
        let timeLeft = timerValue;
        const timerDisplay = document.getElementById('questionTimerDisplay');
        timerDisplay.textContent = `الوقت المتبقي: ${timeLeft} ثانية`;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `الوقت المتبقي: ${timeLeft} ثانية`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerUp();
            }
        }, 1000);
    };

    const timerUp = () => {
        let message = "انتهى الوقت!";
        if (gameMode === 'turnBased') {
            if (hasDeduction) {
                teams[currentPlayer].score -= deductionValue;
                message += ` تم خصم ${deductionValue} نقطة.`;
            }
            showCustomAlert(message, () => {
                updateScoreDisplay();
                nextTurn();
            });
        } else {
            showCustomAlert(message, () => {
                showScreen(gamePlayScreen);
            });
        }
    };

    revealChoicesBtn.addEventListener('click', () => {
        if (isChoicesUsed) return;
        
        const deduction = hasDeduction ? deductionValue : (currentPoints / 4);

        showCustomAlert(
            `هل أنت متأكد؟ سيتم خصم ${deduction} نقطة من نقاط هذا السؤال.`,
            () => { // onConfirm
                isChoicesUsed = true;
                revealChoicesBtn.style.display = 'none';
                const choices = generateChoices(currentQuestion.answer, currentQuestion.IncorrectChoices);
                const choicesGrid = document.getElementById('multiple-choices');
                choicesGrid.innerHTML = '';
                choices.forEach(choice => {
                    const choiceBtn = document.createElement('button');
                    choiceBtn.textContent = choice;
                    choicesGrid.appendChild(choiceBtn);
                    choiceBtn.addEventListener('click', () => {
                        if (choice === currentQuestion.answer) {
                            handleCorrectAnswer();
                        } else {
                            handleWrongAnswer();
                        }
                    });
                });
            },
            () => { // onCancel
                // لا شيء يحدث، فقط إغلاق النافذة
            }
        );
    });

    const generateChoices = (correctAnswer, incorrectAnswers) => {
        let choices = [correctAnswer];
        let incorrectPool = [];

        if (incorrectAnswers) {
            let choicesString = '';

            if (typeof incorrectAnswers === 'string') {
                choicesString = incorrectAnswers;
            } else if (Array.isArray(incorrectAnswers)) {
                choicesString = incorrectAnswers.join(',');
            } else if (typeof incorrectAnswers === 'object' && incorrectAnswers[0]) {
                choicesString = incorrectAnswers[0];
            }
            
            if (choicesString.length > 0) {
                incorrectPool = choicesString.split(/[،,]/).map(choice => choice.trim()).filter(c => c.length > 0);
            }
        }
        
        while (choices.length < 4 && incorrectPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * incorrectPool.length);
            choices.push(incorrectPool.splice(randomIndex, 1)[0]);
        }
        
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        return choices;
    };
    
    const handleCorrectAnswer = (answeredByTeam) => {
        const pointsToAdd = isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
        const teamId = answeredByTeam || currentPlayer;
        
        teams[teamId].score += pointsToAdd;
        
        // Update the button color of the answered question
        if (currentQuestionButton) {
            currentQuestionButton.style.backgroundColor = teams[teamId].color;
            currentQuestionButton.style.color = teams[teamId].textColor;
            currentQuestionButton.classList.add('disabled-btn');
            currentQuestionButton.disabled = true;
        }

        if (gameMode === 'turnBased') {
            showCustomAlert("إجابة صحيحة!", () => {
                updateScoreDisplay();
                nextTurn();
            });
        } else {
            showCustomAlert(`${teams[teamId].name} أجاب بشكل صحيح!`, () => {
                updateScoreDisplay();
                showScreen(gamePlayScreen);
            });
        }
    };

    const handleWrongAnswer = () => {
        let message = "إجابة خاطئة.";
        if (gameMode === 'turnBased') {
            if (hasDeduction) {
                teams[currentPlayer].score -= deductionValue;
                message += ` تم خصم ${deductionValue} نقطة.`;
            }
            showCustomAlert(message, () => {
                updateScoreDisplay();
                nextTurn();
            });
        } else {
            showCustomAlert(message, () => {
                showScreen(gamePlayScreen);
            });
        }
    };

    answerBtn.addEventListener('click', async () => {
        pauseTimer();
        
        const answerContent = document.getElementById('answer-content');
        answerContent.innerHTML = '';
        
        const answerTextElement = document.createElement('h2');
        answerTextElement.id = 'answer-text';
        answerTextElement.textContent = currentQuestion.answer || '';
        answerContent.appendChild(answerTextElement);
        
        if (currentQuestion.answerMedia) {
            const mediaElement = createMediaElement(currentQuestion.answerMedia);
            if (mediaElement) {
                answerContent.appendChild(mediaElement);
            }
        }
        
        showScreen(answerScreen);

        if (gameMode === 'firstToAnswer') {
            // For "first to answer" mode, show the "who answered" modal after revealing the answer
            showWhoAnsweredModal();
        }
    });
    
    challengeBtn.addEventListener('click', () => {
        if (teams[currentPlayer].challenges > 0) {
            pauseTimer();
            showChallengeModal(
                () => {
                    teams[currentPlayer].challenges--;
                    teams[currentPlayer].score += currentPoints;
                    
                    if (currentQuestionButton) {
                        currentQuestionButton.style.backgroundColor = teams[currentPlayer].color;
                        currentQuestionButton.style.color = teams[currentPlayer].textColor;
                        currentQuestionButton.classList.add('disabled-btn');
                        currentQuestionButton.disabled = true;
                    }

                    showCustomAlert(`${teams[currentPlayer].name} استخدم تحدي! تم إضافة ${currentPoints} نقطة.`, () => {
                        updateScoreDisplay();
                        nextTurn();
                    });
                },
                () => {
                    resumeTimer();
                }
            );
        } else {
            showCustomAlert("لقد استخدمت كل تحدياتك المتاحة (مرتين فقط لكل فريق).");
        }
    });

    correctBtn.addEventListener('click', () => {
        handleCorrectAnswer(currentPlayer);
    });

    wrongBtn.addEventListener('click', () => {
        handleWrongAnswer();
    });

    const nextTurn = () => {
        pauseTimer();
        currentPlayer = (currentPlayer === 'team1') ? 'team2' : 'team1';
        updateCurrentTeamName();
        showScreen(gamePlayScreen);
        updateGameCategoriesDisplay(); 
    };
    
    const updateCurrentTeamName = () => {
        const currentTeamNameEl = document.getElementById('currentTeamName');
        currentTeamNameEl.textContent = `الفريق الحالي: ${teams[currentPlayer].name}`;
        currentTeamNameEl.style.backgroundColor = teams[currentPlayer].color;
        currentTeamNameEl.style.color = teams[currentPlayer].textColor;
    };

    const updateScoreDisplay = () => {
        document.getElementById('team1Score').textContent = `${teams.team1.name}: ${teams.team1.score} نقطة`;
        document.getElementById('team2Score').textContent = `${teams.team2.name}: ${teams.team2.score} نقطة`;
    };

    const showWhoAnsweredModal = () => {
        document.getElementById('who-answered-modal-title').textContent = 'منو اللي جاوب صح؟';
        whoAnsweredTeam1Btn.textContent = teams.team1.name;
        whoAnsweredTeam2Btn.textContent = teams.team2.name;
        
        whoAnsweredTeam1Btn.onclick = () => {
            const pointsToAdd = isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
            teams.team1.score += pointsToAdd;
            
            if (currentQuestionButton) {
                currentQuestionButton.style.backgroundColor = teams.team1.color;
                currentQuestionButton.style.color = teams.team1.textColor;
                currentQuestionButton.classList.add('disabled-btn');
                currentQuestionButton.disabled = true;
            }

            updateScoreDisplay();
            showCustomAlert(`${teams.team1.name} إجابة صحيحة! تم إضافة ${pointsToAdd} نقطة.`, () => {
                showScreen(gamePlayScreen);
            });
            whoAnsweredModal.style.display = 'none';
        };

        whoAnsweredTeam2Btn.onclick = () => {
            const pointsToAdd = isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
            teams.team2.score += pointsToAdd;
            
            if (currentQuestionButton) {
                currentQuestionButton.style.backgroundColor = teams.team2.color;
                currentQuestionButton.style.color = teams.team2.textColor;
                currentQuestionButton.classList.add('disabled-btn');
                currentQuestionButton.disabled = true;
            }

            updateScoreDisplay();
            showCustomAlert(`${teams.team2.name} إجابة صحيحة! تم إضافة ${pointsToAdd} نقطة.`, () => {
                showScreen(gamePlayScreen);
            });
            whoAnsweredModal.style.display = 'none';
        };
        
        whoAnsweredNoneBtn.onclick = () => {
             if (currentQuestionButton) {
                currentQuestionButton.classList.add('disabled-btn');
                currentQuestionButton.disabled = true;
            }
            showCustomAlert('لم يجاوب أحد بشكل صحيح.', () => {
                showScreen(gamePlayScreen);
            });
            whoAnsweredModal.style.display = 'none';
        };

        whoAnsweredModal.style.display = 'flex';
    };

    const endGame = () => {
        pauseTimer();
        showScreen(endGameScreen);

        const endGameTitle = document.getElementById('end-game-title');
        const team1NameEl = document.getElementById('team1-name-end-screen');
        const team2NameEl = document.getElementById('team2-name-end-screen');
        const team1ScoreEl = document.getElementById('team1-final-score');
        const team2ScoreEl = document.getElementById('team2-final-score');
        const team1CardEl = document.getElementById('team1-score-card');
        const team2CardEl = document.getElementById('team2-score-card');

        team1CardEl.classList.remove('winner-card', 'loser-card');
        team2CardEl.classList.remove('winner-card', 'loser-card');

        team1NameEl.textContent = teams.team1.name;
        team2NameEl.textContent = teams.team2.name;
        team1ScoreEl.textContent = `${teams.team1.score} نقطة`;
        team2ScoreEl.textContent = `${teams.team2.score} نقطة`;

        if (teams.team1.score > teams.team2.score) {
            endGameTitle.textContent = "تهانينا للفريق الفائز!";
            team1CardEl.classList.add('winner-card');
            team2CardEl.classList.add('loser-card');
        } else if (teams.team2.score > teams.team1.score) {
            endGameTitle.textContent = "تهانينا للفريق الفائز!";
            team2CardEl.classList.add('winner-card');
            team1CardEl.classList.add('loser-card');
        } else {
            endGameTitle.textContent = "النتيجة تعادل!";
            team1CardEl.classList.add('loser-card');
            team2CardEl.classList.add('loser-card');
        }
    };

    endGameBtn.addEventListener('click', () => {
        pauseTimer();
        selectedCatalogs = [];
        teams = {
            team1: { name: '', score: 0, challenges: 2, color: '#3498db', textColor: '#fff' },
            team2: { name: '', score: 0, challenges: 2, color: '#e74c3c', textColor: '#fff' }
        };
        usedQuestions = new Set();
        updateLogo('large');
        initApp();
    });

    const initApp = () => {
        updateLogo('large');
        startGameBtn.style.display = 'block';
        showScreen(mainScreen);
    };

    initApp();
});
