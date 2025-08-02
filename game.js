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
const teamColorSelectionScreen = document.getElementById('team-color-selection-screen'); // New
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
const whoAnsweredModal = document.getElementById('who-answered-modal'); // New
const whoAnsweredTeam1Btn = document.getElementById('who-answered-team1-btn'); // New
const whoAnsweredTeam2Btn = document.getElementById('who-answered-team2-btn'); // New
const whoAnsweredNoneBtn = document.getElementById('who-answered-none-btn'); // New

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
const playModeSelection = document.getElementById('play-mode-selection'); // New
const team1ColorBtn = document.getElementById('team1-color-btn'); // New
const team2ColorBtn = document.getElementById('team2-color-btn'); // New
const colorPickerModal = document.getElementById('color-picker-modal'); // New
const colorGrid = document.getElementById('color-grid'); // New
const colorPickerCancelBtn = document.getElementById('color-picker-cancel-btn'); // New
const startColorSelectionBtn = document.getElementById('startColorSelectionBtn'); // New
const continueToGameBtn = document.getElementById('continueToGameBtn'); // New

// Game state variables
let allQuestions = {};
let allCatalogs = [];
let selectedCatalogs = [];
let teams = {
  team1: { name: '', score: 0, challenges: 2, color: '#c0392b', textColor: '#fff' },
  team2: { name: '', score: 0, challenges: 2, color: '#2980b9', textColor: '#fff' }
};
let currentPlayer = 'team1';
let playMode = 'turnBased'; // Default
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

// Helper functions
const showScreen = (screenId) => {
  screens.forEach(screen => screen.style.display = 'none');
  screenId.style.display = 'flex';
  // Add a class for animation if needed
};

const updateLogo = (size) => {
  const existingLogo = document.querySelector('.game-container img');
  if (existingLogo) {
    existingLogo.remove();
  }
  const logo = document.createElement('img');
  logo.src = LOGO_SRC;
  logo.alt = 'شعار اللعبة';
  if (size === 'small') {
    logo.className = 'small-logo';
  } else {
    logo.className = 'main-logo';
  }
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

const showWhoAnsweredModal = (onTeam1, onTeam2, onNone) => {
  whoAnsweredModal.style.display = 'flex';
  whoAnsweredTeam1Btn.textContent = teams.team1.name;
  whoAnsweredTeam2Btn.textContent = teams.team2.name;
  whoAnsweredTeam1Btn.onclick = () => {
    whoAnsweredModal.style.display = 'none';
    onTeam1();
  };
  whoAnsweredTeam2Btn.onclick = () => {
    whoAnsweredModal.style.display = 'none';
    onTeam2();
  };
  whoAnsweredNoneBtn.onclick = () => {
    whoAnsweredModal.style.display = 'none';
    onNone();
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
      ${catalog.description ? `<div class="info-icon-container" data-description="${catalog.description}">
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

  playMode = document.querySelector('input[name="play-mode"]:checked').value;

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

  document.getElementById('team1-color-btn').textContent = teams.team1.name;
  document.getElementById('team2-color-btn').textContent = teams.team2.name;

  showScreen(teamColorSelectionScreen);
});

// Team Color Selection Logic
let currentTeamForColor = '';
const predefinedColors = [
  { bg: '#c0392b', text: '#fff' }, { bg: '#2980b9', text: '#fff' }, { bg: '#27ae60', text: '#fff' },
  { bg: '#f1c40f', text: '#333' }, { bg: '#8e44ad', text: '#fff' }, { bg: '#d35400', text: '#fff' },
  { bg: '#e84393', text: '#fff' }, // وردي
  { bg: '#1abc9c', text: '#fff' }, // أخضر فاتح
  { bg: '#34495e', text: '#fff' }, // كحلي غامق
  { bg: '#9b59b6', text: '#fff' }, // بنفسجي
  { bg: '#e67e22', text: '#fff' }, // برتقالي
  { bg: '#bdc3c7', text: '#333' } // رمادي فاتح
];

team1ColorBtn.addEventListener('click', () => {
  currentTeamForColor = 'team1';
  showColorPicker();
});

team2ColorBtn.addEventListener('click', () => {
  currentTeamForColor = 'team2';
  showColorPicker();
});

const showColorPicker = () => {
  colorGrid.innerHTML = '';
  predefinedColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-box';
    colorDiv.style.backgroundColor = color.bg;
    colorDiv.addEventListener('click', () => {
      teams[currentTeamForColor].color = color.bg;
      teams[currentTeamForColor].textColor = color.text;
      document.getElementById(currentTeamForColor === 'team1' ? 'team1-color-btn' : 'team2-color-btn').style.backgroundColor = color.bg;
      document.getElementById(currentTeamForColor === 'team1' ? 'team1-color-btn' : 'team2-color-btn').style.color = color.text;
      colorPickerModal.style.display = 'none';
    });
    colorGrid.appendChild(colorDiv);
  });
  colorPickerModal.style.display = 'flex';
};

colorPickerCancelBtn.addEventListener('click', () => {
  colorPickerModal.style.display = 'none';
});

continueToGameBtn.addEventListener('click', () => {
  if (playMode === 'turnBased') {
    document.getElementById('first-team-selection-title').textContent = 'منو اللي راح يبلش؟';
    document.getElementById('team1StartBtn').textContent = teams.team1.name;
    document.getElementById('team2StartBtn').textContent = teams.team2.name;
    showScreen(firstTeamSelectionScreen);
  } else { // answerFirst
    document.getElementById('first-team-selection-title').textContent = 'مستعدين؟';
    document.getElementById('first-team-container').innerHTML = `<button id="startPlayGameBtn" class="styled-button">ابدأ</button>`;
    document.getElementById('startPlayGameBtn').addEventListener('click', startGame);
    showScreen(firstTeamSelectionScreen);
  }
});

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
  if (playMode === 'turnBased') {
    updateCurrentTeamName();
  }
  // Hide turn-based elements in 'answerFirst' mode
  document.getElementById('question-actions-turn-based').style.display = playMode === 'turnBased' ? 'flex' : 'none';
  document.getElementById('question-actions-answer-first').style.display = playMode === 'answerFirst' ? 'flex' : 'none';
};

// =================== game.js (الجزء الثاني) =====================

const updateGameCategoriesDisplay = () => {
  const grid = document.getElementById('categories-buttons-grid');
  grid.innerHTML = '';
  const pointsValues = [200, 200, 400, 400, 600, 600];

  selectedCatalogs.forEach(catalog => {
    const catalogItem = document.createElement('div');
    catalogItem.className = 'category-item';

    catalogItem.innerHTML = `
      <img src="${catalog.image || 'placeholder.jpg'}" alt="${catalog.name}">
      <p>${catalog.name}</p>
      <div class="points-buttons-container">
        <div class="points-buttons left-side" data-catalog-name="${catalog.name}"></div>
        <div class="points-buttons right-side" data-catalog-name="${catalog.name}"></div>
      </div>
    `;

    const leftPointsDiv = catalogItem.querySelector('.left-side');
    const rightPointsDiv = catalogItem.querySelector('.right-side');

    const createButtonsForSide = (sideDiv) => {
      for (let i = 0; i < 6; i++) {
        const points = pointsValues[i];
        // Find an available question for this catalog and points value
        const availableQuestions = catalog.questions.filter(q => q.points === points && !usedQuestions.has(q.question));
        const question = availableQuestions[0];

        const button = document.createElement('button');
        button.dataset.points = points;
        button.textContent = `${points} نقطة`;
        button.dataset.questionText = question ? question.question : '';

        if (!question) {
          button.disabled = true;
          button.classList.add('disabled-btn');
        } else {
          button.addEventListener('click', () => {
            // Mark the question as used immediately and disable the button
            usedQuestions.add(question.question);
            button.disabled = true;
            button.classList.add('disabled-btn');
            showQuestion(catalog.name, points, question.question);
          });
        }
        sideDiv.appendChild(button);
      }
    };

    createButtonsForSide(leftPointsDiv);
    createButtonsForSide(rightPointsDiv);

    grid.appendChild(catalogItem);
  });

  if (checkIfAllButtonsDisabled()) {
    setTimeout(endGame, 1000);
  }
};

const checkIfAllButtonsDisabled = () => {
  const allButtons = document.querySelectorAll('.points-buttons button');
  for (const button of allButtons) {
    if (!button.disabled) {
      return false;
    }
  }
  return true;
};

const showQuestion = async (catalogName, points, questionText) => {
  const catalog = selectedCatalogs.find(c => c.name === catalogName);
  if (!catalog) return;

  const availableQuestion = catalog.questions.find(q => q.points === points && q.question === questionText);
  if (!availableQuestion) {
    showCustomAlert("لا توجد أسئلة متاحة في هذا الكتالوج بهذه النقاط.");
    return;
  }

  currentPoints = points;
  currentQuestion = availableQuestion;

  // The question is already marked as used when the button is clicked

  document.getElementById('questionTeamName').textContent = `الفريق الحالي: ${teams[currentPlayer].name}`;
  // Update the color of the team name
  document.getElementById('questionTeamName').style.color = teams[currentPlayer].textColor;
  document.getElementById('questionTeamName').style.backgroundColor = teams[currentPlayer].color;

  const questionContent = document.getElementById('question-content');
  questionContent.innerHTML = '';

  const questionTextElement = document.createElement('h2');
  questionTextElement.id = 'question-text';
  questionTextElement.textContent = currentQuestion.question || '';
  questionContent.appendChild(questionTextElement);

  if (currentQuestion.questionMedia) {
    const mediaUrl = await getMediaUrl(currentQuestion.questionMedia);
    const mediaElement = createMediaElement(mediaUrl);
    if (mediaElement) {
      questionContent.appendChild(mediaElement);
    }
  }

  showScreen(questionScreen);
  isChoicesUsed = false;
  revealChoicesBtn.style.display = 'block';
  document.getElementById('multiple-choices').innerHTML = '';

  // Show/Hide buttons based on play mode
  document.getElementById('question-actions-turn-based').style.display = playMode === 'turnBased' ? 'flex' : 'none';
  document.getElementById('question-actions-answer-first').style.display = playMode === 'answerFirst' ? 'flex' : 'none';

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
  if (hasDeduction) {
    teams[currentPlayer].score -= deductionValue;
    message += ` تم خصم ${deductionValue} نقطة.`;
  }
  showCustomAlert(message, () => {
    updateScoreDisplay();
    nextTurn();
  });
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
            if (playMode === 'turnBased') {
              handleCorrectAnswer();
            } else {
              handleCorrectAnswer_AnswerFirst();
            }
          } else {
            if (playMode === 'turnBased') {
              handleWrongAnswer();
            } else {
              handleWrongAnswer_AnswerFirst();
            }
          }
        });
      });
    },
    () => {
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

  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
};

const handleCorrectAnswer = () => {
  const pointsToAdd = isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
  teams[currentPlayer].score += pointsToAdd;
  showCustomAlert("إجابة صحيحة!", () => {
    updateScoreDisplay();
    nextTurn();
  });
};

const handleWrongAnswer = () => {
  let message = "إجابة خاطئة.";
  if (hasDeduction) {
    teams[currentPlayer].score -= deductionValue;
    message += ` تم خصم ${deductionValue} نقطة.`;
  }
  showCustomAlert(message, () => {
    updateScoreDisplay();
    nextTurn();
  });
};

// New logic for 'Answer First' mode
const handleCorrectAnswer_AnswerFirst = () => {
  pauseTimer();
  showWhoAnsweredModal(
    () => { // Team 1 answered
      teams.team1.score += isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
      updateScoreDisplay();
      updatePointsButtonColor('team1');
      showScreen(gamePlayScreen);
    },
    () => { // Team 2 answered
      teams.team2.score += isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
      updateScoreDisplay();
      updatePointsButtonColor('team2');
      showScreen(gamePlayScreen);
    },
    () => { // No one answered
      updatePointsButtonColor('none');
      showScreen(gamePlayScreen);
    }
  );
};

const handleWrongAnswer_AnswerFirst = () => {
  pauseTimer();
  showWhoAnsweredModal(
    () => { // Team 1 answered
      let message = `إجابة خاطئة من ${teams.team1.name}.`;
      if (hasDeduction) {
        teams.team1.score -= deductionValue;
        message += ` تم خصم ${deductionValue} نقطة.`;
      }
      showCustomAlert(message, () => {
        updateScoreDisplay();
        updatePointsButtonColor('none');
        showScreen(gamePlayScreen);
      });
    },
    () => { // Team 2 answered
      let message = `إجابة خاطئة من ${teams.team2.name}.`;
      if (hasDeduction) {
        teams.team2.score -= deductionValue;
        message += ` تم خصم ${deductionValue} نقطة.`;
      }
      showCustomAlert(message, () => {
        updateScoreDisplay();
        updatePointsButtonColor('none');
        showScreen(gamePlayScreen);
      });
    },
    () => { // No one answered
      updatePointsButtonColor('none');
      showScreen(gamePlayScreen);
    }
  );
};

const updatePointsButtonColor = (winningTeam) => {
  // Find all buttons for the current question's points
  const buttons = document.querySelectorAll('.points-buttons button[data-points="' + currentPoints + '"]');

  buttons.forEach(button => {
    // Find the corresponding question for this button
    const catalogItem = button.closest('.category-item');
    const catalogName = catalogItem.querySelector('p').textContent;
    const catalog = selectedCatalogs.find(c => c.name === catalogName);
    const question = catalog.questions.find(q => q.points === currentPoints && usedQuestions.has(q.question));

    if (question && question.question === currentQuestion.question) {
      if (winningTeam === 'team1') {
        button.style.backgroundColor = teams.team1.color;
        button.style.color = teams.team1.textColor;
      } else if (winningTeam === 'team2') {
        button.style.backgroundColor = teams.team2.color;
        button.style.color = teams.team2.textColor;
      } else {
        button.style.backgroundColor = 'var(--secondary-color)';
      }
      button.disabled = true;
      button.classList.add('disabled-btn');
    }
  });
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
    const mediaUrl = await getMediaUrl(currentQuestion.answerMedia);
    const mediaElement = createMediaElement(mediaUrl);
    if (mediaElement) {
      answerContent.appendChild(mediaElement);
    }
  }

  showScreen(answerScreen);
});

challengeBtn.addEventListener('click', () => {
  if (teams[currentPlayer].challenges > 0) {
    pauseTimer();
    showChallengeModal(
      () => {
        teams[currentPlayer].challenges--;
        teams[currentPlayer].score += currentPoints;
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
  const pointsToAdd = isChoicesUsed ? currentPoints - (currentPoints / 4) : currentPoints;
  teams[currentPlayer].score += pointsToAdd;
  showCustomAlert("إجابة صحيحة!");
  updateScoreDisplay();
  nextTurn();
});

wrongBtn.addEventListener('click', () => {
  let message = "إجابة خاطئة.";
  if (hasDeduction) {
    teams[currentPlayer].score -= deductionValue;
    message += ` تم خصم ${deductionValue} نقطة.`;
  }
  showCustomAlert(message);
  updateScoreDisplay();
  nextTurn();
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
  currentTeamNameEl.style.color = teams[currentPlayer].textColor;
  currentTeamNameEl.style.backgroundColor = teams[currentPlayer].color;

  // Update the score display border color for the current team
  document.getElementById('team1Score').closest('.score-card-small').style.borderColor = (currentPlayer === 'team1') ? teams.team1.color : 'transparent';
  document.getElementById('team2Score').closest('.score-card-small').style.borderColor = (currentPlayer === 'team2') ? teams.team2.color : 'transparent';
};

const updateScoreDisplay = () => {
  document.getElementById('team1Score').textContent = `${teams.team1.name}: ${teams.team1.score} نقطة`;
  document.getElementById('team2Score').textContent = `${teams.team2.name}: ${teams.team2.score} نقطة`;
};

const endGame = () => {
  pauseTimer();
  showScreen(endGameScreen);

  const endGameTitle = document.getElementById('end-game-title');
  const winnerNameDisplay = document.getElementById('winner-name-display');

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
    winnerNameDisplay.textContent = teams.team1.name;
    team1CardEl.classList.add('winner-card');
    team2CardEl.classList.add('loser-card');
  } else if (teams.team2.score > teams.team1.score) {
    endGameTitle.textContent = "تهانينا للفريق الفائز!";
    winnerNameDisplay.textContent = teams.team2.name;
    team2CardEl.classList.add('winner-card');
    team1CardEl.classList.add('loser-card');
  } else {
    endGameTitle.textContent = "النتيجة تعادل!";
    winnerNameDisplay.textContent = "لا يوجد فائز";
    team1CardEl.classList.add('loser-card');
    team2CardEl.classList.add('loser-card');
  }
};

endGameBtn.addEventListener('click', () => {
  pauseTimer();
  selectedCatalogs = [];
  teams = {
    team1: { name: '', score: 0, challenges: 2, color: '#c0392b', textColor: '#fff' },
    team2: { name: '', score: 0, challenges: 2, color: '#2980b9', textColor: '#fff' }
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

}); // end DOMContentLoaded
