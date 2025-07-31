// Function to read the Excel file from a zip object
function readExcel(zip, fileName) {
    return new Promise((resolve, reject) => {
        zip.file(fileName).async("arraybuffer").then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            let questions = [];
            let foundSheet = false;

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];

                if (!worksheet || !worksheet['!ref']) {
                    continue;
                }

                const range = XLSX.utils.decode_range(worksheet['!ref']);
                if (range.s.r === range.e.r) {
                    continue;
                }

                const headers = [];
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: range.s.r });
                    const cell = worksheet[cellAddress];
                    if (cell && cell.v) {
                        headers.push(cell.v.toString().trim());
                    } else {
                        headers.push('');
                    }
                }

                if (
                    headers.includes('catalog') &&
                    headers.includes('points') &&
                    headers.includes('question') &&
                    headers.includes('answer') &&
                    headers.includes('IncorrectChoices')
                ) {
                    foundSheet = true;
                    const headerMap = {};
                    headers.forEach((h, i) => headerMap[h] = i);

                    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                        const rowData = {};
                        rowData.catalog = worksheet[XLSX.utils.encode_cell({ c: headerMap['catalog'], r: R })]?.v || '';
                        rowData.points = worksheet[XLSX.utils.encode_cell({ c: headerMap['points'], r: R })]?.v || '';
                        rowData.question = worksheet[XLSX.utils.encode_cell({ c: headerMap['question'], r: R })]?.v || '';
                        rowData.answer = worksheet[XLSX.utils.encode_cell({ c: headerMap['answer'], r: R })]?.v || '';
                        rowData.QuestionMedia = worksheet[XLSX.utils.encode_cell({ c: headerMap['QuestionMedia'], r: R })]?.v || null;
                        rowData.AnswerMedia = worksheet[XLSX.utils.encode_cell({ c: headerMap['AnswerMedia'], r: R })]?.v || null;

                        const incorrectChoicesCell = worksheet[XLSX.utils.encode_cell({ c: headerMap['IncorrectChoices'], r: R })]?.v || '';
                        rowData.IncorrectChoices = incorrectChoicesCell ? incorrectChoicesCell.split(',').map(choice => choice.trim()) : [];

                        if (Object.values(rowData).some(val => val !== null && val !== '' && (Array.isArray(val) ? val.length > 0 : true))) {
                            questions.push(rowData);
                        }
                    }
                    break;
                }
            }

            if (!foundSheet) {
                reject(new Error("لم يتم العثور على ورقة إكسل تحتوي على جميع العناوين المطلوبة."));
            } else {
                resolve(questions);
            }
        }).catch(reject);
    });
}

// Function to find a media file with multiple possible extensions
function findMediaFile(images, baseName) {
    const extensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mp3'];
    for (const ext of extensions) {
        if (images[baseName + ext]) {
            return images[baseName + ext];
        }
    }
    return null;
}

let parsedQuestions = [];
let allPublishedQuestions = {}; // لحفظ جميع الأسئلة المنشورة
const MAX_IMAGE_SIZE_BYTES = 2097152;

document.addEventListener('DOMContentLoaded', () => {
    // Firebase references
    const database = firebase.database();
    const storage = firebase.storage();

    // DOM elements
    const addCatalogBtn = document.getElementById('addCatalogBtn');
    const catalogNameInput = document.getElementById('catalogName');
    const catalogImageInput = document.getElementById('catalogImage');
    const catalogsList = document.getElementById('catalogsList');
    const editModal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close-btn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editCatalogIdInput = document.getElementById('editCatalogId');
    const editCatalogNameInput = document.getElementById('editCatalogName');
    const editCatalogImageInput = document.getElementById('editCatalogImage');
const editCatalogDescriptionInput = document.getElementById('editCatalogDescriptionInput');    const uploadZipBtn = document.getElementById('uploadZipBtn');
    const zipFile = document.getElementById('zipFile');
    const questionsTableBody = document.querySelector('#questionsTable tbody');
    const publishBtn = document.getElementById('publishBtn');
    const deleteAllQuestionsBtn = document.getElementById('deleteAllQuestionsBtn');
    
    // عناصر DOM للقسم الجديد
    const publishedQuestionsTableBody = document.querySelector('#publishedQuestionsTable tbody');
    const catalogFilter = document.getElementById('catalogFilter');
    const deleteSelectedCatalogBtn = document.getElementById('deleteSelectedCatalogBtn');
    const deleteAllPublishedQuestionsBtn = document.getElementById('deleteAllPublishedQuestionsBtn');

    // --- وظيفة عرض الكتالوجات من Firebase ---
    function displayCatalogs(catalogs) {
        catalogsList.innerHTML = '';
        if (!catalogs) {
            catalogsList.innerHTML = '<p>لا توجد كتالوجات حتى الآن.</p>';
            return;
        }
        const ul = document.createElement('ul');
        Object.entries(catalogs).forEach(([key, catalog]) => {
            const li = document.createElement('li');
            li.innerHTML = `
    <img src="${catalog.image}" alt="${catalog.name}" style="width: 50px; height: 50px;">
    <div>
        <strong>${catalog.name}</strong>
        <p style="font-size: 0.9em; color: #555;">${catalog.description || ''}</p>
    </div>
    <div>
        <button class="edit-catalog-btn" data-id="${key}" data-name="${catalog.name}" data-image-url="${catalog.image}">تعديل</button>
        <button class="delete-catalog-btn" data-id="${key}">حذف</button>
    </div>
            `;
            ul.appendChild(li);
        });
        catalogsList.appendChild(ul);
        populateCatalogFilter(catalogs);
    }

    // --- وظيفة حذف الكتالوج ---
    async function deleteCatalog(catalogId) {
        if (!confirm('هل أنت متأكد من حذف هذا الكتالوج؟')) {
            return;
        }
        try {
            const catalogRef = database.ref(`catalogs/${catalogId}`);
            const catalogSnapshot = await catalogRef.once('value');
            const catalogData = catalogSnapshot.val();
            if (catalogData && catalogData.image) {
                const imageRef = storage.refFromURL(catalogData.image);
                await imageRef.delete();
            }
            await catalogRef.remove();
            alert('تم حذف الكتالوج بنجاح!');
        } catch (error) {
            console.error('Error deleting catalog:', error);
            alert('حدث خطأ أثناء حذف الكتالوج. يرجى التحقق من لوحة التحكم.');
        }
    }

    // --- وظيفة تعديل الكتالوج ---
    async function updateCatalog(catalogId, newName, newImageFile, newDescription) { // <--- إضافة newDescription
        try {
            let imageUrl = null;
            if (newImageFile) {
                if (newImageFile.size > MAX_IMAGE_SIZE_BYTES) {
                    alert('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو ' + (MAX_IMAGE_SIZE_BYTES / 1048576) + ' ميجا بايت.');
                    return;
                }
                const imageRef = storage.ref(`catalogs/${newName || catalogId}/${newImageFile.name}`);
                const snapshot = await imageRef.put(newImageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
            }
            const updates = {};
            if (newName) updates.name = newName;
            if (imageUrl) updates.image = imageUrl;
            if (newDescription) updates.description = newDescription; // <--- إضافة هذا السطر
            
            await database.ref(`catalogs/${catalogId}`).update(updates);
            alert('تم تعديل الكتالوج بنجاح!');
        } catch (error) {
            console.error('Error updating catalog:', error);
            alert('حدث خطأ أثناء تعديل الكتالوج. يرجى التحقق من لوحة التحكم.');
        }
    }

    // --- وظيفة مسح الجدول فقط ---
    deleteAllQuestionsBtn.addEventListener('click', () => {
        if (!confirm('هل أنت متأكد من مسح جميع الأسئلة من الجدول؟')) {
            return;
        }
        parsedQuestions = [];
        displayQuestionsInTable();
        alert("تم مسح الجدول بنجاح!");
    });

    // --- الاستماع إلى تغييرات الكتالوجات في Firebase ---
    database.ref('catalogs').on('value', (snapshot) => {
        const catalogs = snapshot.val();
        displayCatalogs(catalogs);
    });

    // --- وظيفة إضافة الكتالوج يدوياً ---
addCatalogBtn.addEventListener('click', async () => {
    const catalogName = catalogNameInput.value.trim();
    const catalogImageFile = catalogImageInput.files[0];
    const catalogDescription = document.getElementById('catalogDescription').value.trim(); // <--- إضافة هذا السطر
    if (!catalogName || !catalogImageFile) {
        alert("يرجى إدخال اسم الكتالوج واختيار صورة.");
        return;
    }
    try {
        const imageRef = storage.ref(`catalogs/${catalogName}/${catalogImageFile.name}`);
        const snapshot = await imageRef.put(catalogImageFile);
        const imageUrl = await snapshot.ref.getDownloadURL();
        await database.ref(`catalogs/${catalogName}`).set({
            name: catalogName,
            image: imageUrl,
            description: catalogDescription // <--- إضافة هذا السطر
        });
            alert(`تم إضافة الكتالوج "${catalogName}" بنجاح!`);
            catalogNameInput.value = '';
            catalogImageInput.value = '';
        } catch (error) {
            console.error("Error adding catalog:", error);
            alert("حدث خطأ أثناء إضافة الكتالوج. يرجى التحقق من لوحة التحكم.");
        }
    });

    // --- إدارة أحداث التعديل والحذف ---
    catalogsList.addEventListener('click', async (e) => { // <--- لاحظ إضافة async هنا
        if (e.target.classList.contains('delete-catalog-btn')) {
            const catalogId = e.target.dataset.id;
            deleteCatalog(catalogId);
        } else if (e.target.classList.contains('edit-catalog-btn')) {
            const catalogId = e.target.dataset.id;
            
            try {
                // **جلب بيانات الكتالوج بالكامل من Firebase**
                const catalogSnapshot = await database.ref(`catalogs/${catalogId}`).once('value');
                const catalogData = catalogSnapshot.val();

                if (catalogData) {
                    editCatalogIdInput.value = catalogId;
                    editCatalogNameInput.value = catalogData.name;
                    
                    // **تعبئة حقل الوصف الجديد**
                    if (editCatalogDescriptionInput) {
                         editCatalogDescriptionInput.value = catalogData.description || '';
                    }

                    editModal.style.display = 'block';
                } else {
                    alert('لم يتم العثور على بيانات الكتالوج.');
                }
            } catch (error) {
                console.error('Error fetching catalog data for edit:', error);
                alert('حدث خطأ أثناء جلب بيانات الكتالوج.');
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == editModal) {
            editModal.style.display = 'none';
        }
    });

    saveEditBtn.addEventListener('click', () => {
        const catalogId = editCatalogIdInput.value;
        const newName = editCatalogNameInput.value.trim();
        const newImageFile = editCatalogImageInput.files[0];
        const newDescription = editCatalogDescriptionInput.value.trim(); // <--- إضافة هذا السطر
        
        if (!newName && !newImageFile && !newDescription) { // <--- تعديل الشرط
            alert('يرجى إدخال اسم جديد أو وصف جديد أو اختيار صورة جديدة.');
            return;
        }
        updateCatalog(catalogId, newName, newImageFile, newDescription); // <--- إضافة newDescription إلى الدالة
        editModal.style.display = 'none';
    });
    
    // --- وظيفة تحميل ملف ZIP وتحليله ---
    uploadZipBtn.addEventListener('click', async () => {
        if (!zipFile.files[0]) {
            alert("يرجى اختيار ملف ZIP.");
            return;
        }
        const zip = new JSZip();
        try {
            const content = await zip.loadAsync(zipFile.files[0]);
            let excelFile = null;
            const images = {};
            content.forEach((relativePath, zipEntry) => {
                const parts = relativePath.split('/');
                
                if (zipEntry.name.endsWith('.xlsx')) {
                    excelFile = relativePath;
                }
                
                if (relativePath.includes('images/') && !zipEntry.dir) {
                    const filename = parts[parts.length - 1];
                    images[filename] = zipEntry;
                }
            });
            
            if (!excelFile) {
                alert("لم يتم العثور على ملف Excel (.xlsx) في الأرشيف المضغوط.");
                return;
            }
            
            const questions = await readExcel(content, excelFile);
            
            parsedQuestions = await Promise.all(questions.map(async (q, index) => {
                const questionNumber = index + 1;
                const questionMedia = findMediaFile(images, `Q${questionNumber}`);
                const answerMedia = findMediaFile(images, `A${questionNumber}`);

                let questionMediaUrl = '';
                if (questionMedia) {
                    const blob = await questionMedia.async("blob");
                    questionMediaUrl = URL.createObjectURL(blob);
                }

                let answerMediaUrl = '';
                if (answerMedia) {
                    const blob = await answerMedia.async("blob");
                    answerMediaUrl = URL.createObjectURL(blob);
                }

                return {
                    id: index,
                    question: q.question,
                    answer: q.answer,
                    catalog: q.catalog,
                    points: q.points,
                    IncorrectChoices: q.IncorrectChoices,
                    questionMedia: questionMedia, // Retain the blob object for later upload
                    answerMedia: answerMedia, // Retain the blob object for later upload
                    questionMediaUrl: questionMediaUrl,
                    answerMediaUrl: answerMediaUrl
                };
            }));
            
            displayQuestionsInTable();
            alert("تم تحليل الملف بنجاح! راجع الجدول قبل النشر.");
        } catch (error) {
            console.error("Error processing ZIP file:", error);
            alert("حدث خطأ أثناء معالجة الملف. يرجى التحقق من التنسيق.");
        }
    });

    // --- وظيفة عرض الأسئلة في الجدول ---
    function displayQuestionsInTable() {
        questionsTableBody.innerHTML = '';
        parsedQuestions.forEach(q => {
            const row = document.createElement('tr');
            
            let questionMediaHTML = 'لا يوجد';
            if (q.questionMediaUrl) {
                const extension = q.questionMedia.name.split('.').pop().toLowerCase();
                if (extension === 'jpg' || extension === 'png' || extension === 'jpeg' || extension === 'gif') {
                    questionMediaHTML = `<img src="${q.questionMediaUrl}" style="width: 100px; height: auto;">`;
                } else if (extension === 'mp4') {
                    questionMediaHTML = `<video src="${q.questionMediaUrl}" controls style="width: 100px; height: auto;"></video>`;
                } else if (extension === 'mp3') {
                    questionMediaHTML = `<audio src="${q.questionMediaUrl}" controls></audio>`;
                }
            }
            
            let answerMediaHTML = 'لا يوجد';
            if (q.answerMediaUrl) {
                const extension = q.answerMedia.name.split('.').pop().toLowerCase();
                if (extension === 'jpg' || extension === 'png' || extension === 'jpeg' || extension === 'gif') {
                    answerMediaHTML = `<img src="${q.answerMediaUrl}" style="width: 100px; height: auto;">`;
                } else if (extension === 'mp4') {
                    answerMediaHTML = `<video src="${q.answerMediaUrl}" controls style="width: 100px; height: auto;"></video>`;
                } else if (extension === 'mp3') {
                    answerMediaHTML = `<audio src="${q.answerMediaUrl}" controls></audio>`;
                }
            }

            const incorrectChoicesHTML = q.IncorrectChoices.join(', ');

            row.innerHTML = `
                <td>${q.id + 1}</td>
                <td><input type="text" value="${q.question}" data-id="${q.id}" data-field="question"></td>
                <td><input type="text" value="${q.answer}" data-id="${q.id}" data-field="answer"></td>
                <td><input type="text" value="${incorrectChoicesHTML}" data-id="${q.id}" data-field="IncorrectChoices"></td>
                <td><input type="text" value="${q.catalog}" data-id="${q.id}" data-field="catalog"></td>
                <td><input type="number" value="${q.points}" data-id="${q.id}" data-field="points"></td>
                <td>${questionMediaHTML}</td>
                <td>${answerMediaHTML}</td>
                <td>
                    <button class="edit-btn" data-id="${q.id}">تعديل</button>
                    <button class="delete-btn" data-id="${q.id}">حذف</button>
                </td>
            `;
            questionsTableBody.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                parsedQuestions = parsedQuestions.filter(q => q.id != id);
                displayQuestionsInTable();
            });
        });
        
        // Add event listeners for editing inputs
        questionsTableBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                const field = e.target.dataset.field;
                const value = e.target.value;
                const questionToUpdate = parsedQuestions.find(q => q.id === id);
                if (questionToUpdate) {
                    if (field === 'IncorrectChoices') {
                        questionToUpdate[field] = value.split(',').map(choice => choice.trim());
                    } else if (field === 'points') {
                        questionToUpdate[field] = parseInt(value, 10);
                    } else {
                        questionToUpdate[field] = value;
                    }
                }
            });
        });
    }

    // --- وظيفة النشر إلى Firebase ---
    publishBtn.addEventListener('click', async () => {
        if (parsedQuestions.length === 0) {
            alert("لا توجد أسئلة للنشر. يرجى تحميل ملف أولاً.");
            return;
        }

        try {
            const newBatchRef = database.ref('questions').push();
            const items = await Promise.all(parsedQuestions.map(async (q) => {
                if (!q.catalog || q.catalog.trim() === '') {
                    throw new Error(`حقل "Catalog" فارغ للسؤال رقم ${q.id + 1}. يرجى تعبئته.`);
                }
                
                let questionMediaUrl = '';
                if (q.questionMedia) {
                    const mediaRef = storage.ref(`questions/${q.catalog}/${q.questionMedia.name}`);
                    const snapshot = await mediaRef.put(await q.questionMedia.async("blob"));
                    questionMediaUrl = await snapshot.ref.getDownloadURL();
                }

                let answerMediaUrl = '';
                if (q.answerMedia) {
                    const mediaRef = storage.ref(`questions/${q.catalog}/${q.answerMedia.name}`);
                    const snapshot = await mediaRef.put(await q.answerMedia.async("blob"));
                    answerMediaUrl = await snapshot.ref.getDownloadURL();
                }
                
                const incorrectChoices = q.IncorrectChoices || [];

                return {
                    question: q.question,
                    answer: q.answer,
                    catalog: q.catalog,
                    points: parseInt(q.points, 10),
                    questionMedia: questionMediaUrl,
                    answerMedia: answerMediaUrl,
                    IncorrectChoices: incorrectChoices
                };
            }));

            await newBatchRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                items: items
            });

            alert("تم نشر جميع الأسئلة والملفات بنجاح إلى Firebase!");
            parsedQuestions = [];
            displayQuestionsInTable();
            loadPublishedQuestions();
        } catch (error) {
            console.error("Error publishing to Firebase:", error);
            alert(`حدث خطأ أثناء النشر إلى Firebase: ${error.message}. يرجى التحقق من لوحة التحكم.`);
        }
    });

    // **جديد:** وظيفة لجلب جميع الأسئلة المنشورة من Firebase
    async function loadPublishedQuestions() {
        try {
            const snapshot = await database.ref('questions').once('value');
            allPublishedQuestions = snapshot.val() || {};
            displayPublishedQuestionsInTable();
        } catch (error) {
            console.error("Error loading published questions:", error);
        }
    }

    // **جديد:** وظيفة لعرض الأسئلة المنشورة في الجدول
    function displayPublishedQuestionsInTable(filter = 'all') {
        publishedQuestionsTableBody.innerHTML = '';
        let index = 0;
        Object.entries(allPublishedQuestions).forEach(([batchId, batchData]) => {
            if (batchData.items) {
                batchData.items.forEach((q, qIndex) => {
                    if (filter === 'all' || q.catalog === filter) {
                        const row = document.createElement('tr');
                        index++;

                        let questionMediaHTML = 'لا يوجد';
                        if (q.questionMedia) {
                            const extension = q.questionMedia.split('.').pop().toLowerCase().split('?')[0];
                            if (extension === 'jpg' || extension === 'png' || extension === 'jpeg' || extension === 'gif') {
                                questionMediaHTML = `<img src="${q.questionMedia}" style="width: 100px; height: auto;">`;
                            } else if (extension === 'mp4') {
                                questionMediaHTML = `<video src="${q.questionMedia}" controls style="width: 100px; height: auto;"></video>`;
                            } else if (extension === 'mp3') {
                                questionMediaHTML = `<audio src="${q.questionMedia}" controls></audio>`;
                            }
                        }

                        let answerMediaHTML = 'لا يوجد';
                        if (q.answerMedia) {
                            const extension = q.answerMedia.split('.').pop().toLowerCase().split('?')[0];
                            if (extension === 'jpg' || extension === 'png' || extension === 'jpeg' || extension === 'gif') {
                                answerMediaHTML = `<img src="${q.answerMedia}" style="width: 100px; height: auto;">`;
                            } else if (extension === 'mp4') {
                                answerMediaHTML = `<video src="${q.answerMedia}" controls style="width: 100px; height: auto;"></video>`;
                            } else if (extension === 'mp3') {
                                answerMediaHTML = `<audio src="${q.answerMedia}" controls></audio>`;
                            }
                        }

                        const incorrectChoicesHTML = Array.isArray(q.IncorrectChoices) ? q.IncorrectChoices.join(', ') : '';

                        row.innerHTML = `
                            <td>${index}</td>
                            <td><input type="text" value="${q.question}" data-batch-id="${batchId}" data-q-index="${qIndex}" data-field="question"></td>
                            <td><input type="text" value="${q.answer}" data-batch-id="${batchId}" data-q-index="${qIndex}" data-field="answer"></td>
                            <td><input type="text" value="${incorrectChoicesHTML}" data-batch-id="${batchId}" data-q-index="${qIndex}" data-field="IncorrectChoices"></td>
                            <td>${q.catalog}</td>
                            <td><input type="number" value="${q.points}" data-batch-id="${batchId}" data-q-index="${qIndex}" data-field="points"></td>
                            <td>${questionMediaHTML}</td>
                            <td>${answerMediaHTML}</td>
                            <td>
                                <button class="save-published-btn" data-batch-id="${batchId}" data-q-index="${qIndex}">حفظ</button>
                                <button class="delete-published-btn" data-batch-id="${batchId}" data-q-index="${qIndex}" data-catalog="${q.catalog}">حذف</button>
                            </td>
                        `;
                        publishedQuestionsTableBody.appendChild(row);
                    }
                });
            }
        });

        // Add event listeners for the published questions table
        document.querySelectorAll('.save-published-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const batchId = e.target.dataset.batchId;
                const qIndex = e.target.dataset.qIndex;
                const row = e.target.closest('tr');
                const inputs = row.querySelectorAll('input');
                const updates = {};
                inputs.forEach(input => {
                    const field = input.dataset.field;
                    let value = input.value;
                    if (field === 'points') {
                        value = parseInt(value, 10);
                    } else if (field === 'IncorrectChoices') {
                        value = value.split(',').map(choice => choice.trim());
                    }
                    updates[field] = value;
                });
                await database.ref(`questions/${batchId}/items/${qIndex}`).update(updates);
                alert("تم حفظ التعديلات بنجاح!");
            });
        });

        document.querySelectorAll('.delete-published-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
                const batchId = e.target.dataset.batchId;
                const qIndex = e.target.dataset.qIndex;
                const itemRef = database.ref(`questions/${batchId}/items/${qIndex}`);
                await itemRef.remove();
                alert("تم حذف السؤال بنجاح!");
                loadPublishedQuestions();
            });
        });
    }

    // **جديد:** وظيفة لملء قائمة الكتالوجات المنسدلة
    function populateCatalogFilter(catalogs) {
        catalogFilter.innerHTML = '<option value="all">كل الكتالوجات</option>';
        if (catalogs) {
            Object.values(catalogs).forEach(catalog => {
                const option = document.createElement('option');
                option.value = catalog.name;
                option.textContent = catalog.name;
                catalogFilter.appendChild(option);
            });
        }
    }

    // **جديد:** معالج حدث لتغيير الفلتر
    catalogFilter.addEventListener('change', (e) => {
        const selectedCatalog = e.target.value;
        displayPublishedQuestionsInTable(selectedCatalog);
    });

    // **جديد:** معالج حدث لزر حذف أسئلة الكتالوج المحدد
    deleteSelectedCatalogBtn.addEventListener('click', async () => {
        const selectedCatalog = catalogFilter.value;
        if (selectedCatalog === 'all' || !confirm(`هل أنت متأكد من حذف جميع الأسئلة من كتالوج "${selectedCatalog}"؟`)) {
            return;
        }

        try {
            let updates = {};
            let foundQuestions = false;
            Object.entries(allPublishedQuestions).forEach(([batchId, batchData]) => {
                if (batchData.items) {
                    batchData.items.forEach((q, qIndex) => {
                        if (q.catalog === selectedCatalog) {
                            updates[`questions/${batchId}/items/${qIndex}`] = null;
                            foundQuestions = true;
                        }
                    });
                }
            });

            if (foundQuestions) {
                await database.ref().update(updates);
                alert(`تم حذف جميع الأسئلة من كتالوج "${selectedCatalog}" بنجاح!`);
                loadPublishedQuestions();
            } else {
                alert(`لم يتم العثور على أسئلة في كتالوج "${selectedCatalog}".`);
            }
        } catch (error) {
            console.error("Error deleting catalog questions:", error);
            alert("حدث خطأ أثناء حذف الأسئلة.");
        }
    });

    // **جديد:** معالج حدث لزر حذف جميع الأسئلة المنشورة
    deleteAllPublishedQuestionsBtn.addEventListener('click', async () => {
        if (!confirm('هل أنت متأكد من حذف جميع الأسئلة المنشورة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }
        try {
            await database.ref('questions').remove();
            allPublishedQuestions = {};
            displayPublishedQuestionsInTable();
            alert("تم حذف جميع الأسئلة المنشورة بنجاح!");
        } catch (error) {
            console.error("Error deleting all published questions:", error);
            alert("حدث خطأ أثناء حذف جميع الأسئلة المنشورة.");
        }
    });

    if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') {
        console.error("XLSX or JSZip library is not loaded. Please add the script tags to admin.html.");
    }
    
    // عند تحميل الصفحة، قم بجلب الأسئلة المنشورة
    loadPublishedQuestions();

});