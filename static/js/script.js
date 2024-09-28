let personnelData = []; // 全域宣告
let calendarData = {}; // 初始日曆數據

document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('auth-form');
    const mainContent = document.getElementById('main-content');
    const logoutButton = document.getElementById('logout-button');
    const savePersonnelButton = document.getElementById('save-personnel-button');
    const saveWorkButton = document.getElementById('save-work-button');
    const generateScheduleButton = document.getElementById('generate-schedule-button');
    const scheduleResult = document.getElementById('schedule-result');
    const calendar = document.getElementById('calendar'); // 日曆容器
    const itemsList = document.getElementById('items-list'); // 人員名單容器
    const yearSelect = document.getElementById('year');
    const monthSelect = document.getElementById('month');
    let copiedData = null; // 用於儲存複製的工作資料

    // 自動檢查是否有有效的 token 來保持登入狀態
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/get-data', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.calendarData && data.personnelData) {
                authForm.parentElement.parentElement.style.display = 'none';
                mainContent.style.display = 'block';
                logoutButton.style.display = 'block';
                savePersonnelButton.style.display = 'block';
                saveWorkButton.style.display = 'block';
                generateScheduleButton.style.display = 'block';

                calendarData = data.calendarData;
                personnelData = data.personnelData;

                displayCalendarData(calendarData);
                displayPersonnelList();
            } else {
                localStorage.removeItem('token');
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
            localStorage.removeItem('token');
        });
    }

    // 驗證並生成隨機工作表
    generateScheduleButton.addEventListener('click', function() {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                title: '尚未登入',
                text: '請先登入',
                icon: 'warning',
                confirmButtonColor: '#f39c12'
            });
            return;
        }

        fetch('/generate-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.random_table && Object.keys(data.random_table).length > 0) {
                const year = parseInt(yearSelect.value);
                const month = parseInt(monthSelect.value) + 1;

                // 清空之前的顯示結果
                scheduleResult.innerHTML = '';

                // 生成行事曆
                const calendar = document.createElement('div');
                calendar.classList.add('calendar');

                const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                for (let i = 0; i < 7; i++) {
                    const dayHeader = document.createElement('div');
                    dayHeader.classList.add('calendar-header');
                    dayHeader.textContent = daysOfWeek[i];
                    calendar.appendChild(dayHeader);
                }

                const daysInMonth = new Date(year, month, 0).getDate();
                const firstDayIndex = new Date(year, month - 1, 1).getDay();
                for (let i = 0; i < firstDayIndex; i++) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.classList.add('calendar-day', 'empty');
                    calendar.appendChild(emptyDiv);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                    const dayDiv = document.createElement('div');
                    dayDiv.classList.add('calendar-day');
                    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    dayDiv.innerHTML = `<strong>${day}</strong>`;

                    // 檢查該日期是否有工作表結果
                    if (data.random_table[selectedDate]) {
                        const workDetails = Object.entries(data.random_table[selectedDate])
                            .map(([workName, workCount]) => `${workName}: ${workCount}`)
                            .join('<br>');
                        dayDiv.innerHTML += `<div class="schedule-details">${workDetails}</div>`;
                        dayDiv.classList.add('filled');
                    }

                    calendar.appendChild(dayDiv);
                }

                // 將生成的行事曆插入到 scheduleResult 容器中
                scheduleResult.appendChild(calendar);

            } else {
                Swal.fire({
                    title: '生成失敗',
                    text: '無法生成隨機工作表',
                    icon: 'error',
                    confirmButtonColor: '#f39c12'
                });
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
            Swal.fire({
                title: '錯誤',
                text: '生成過程中發生錯誤',
                icon: 'error',
                confirmButtonColor: '#f39c12'
            });
        });
    });

    // 登入表單提交事件
    authForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                authForm.parentElement.parentElement.style.display = 'none';
                mainContent.style.display = 'block';
                logoutButton.style.display = 'block';
                savePersonnelButton.style.display = 'block';
                saveWorkButton.style.display = 'block';
                generateScheduleButton.style.display = 'block';

                calendarData = data.calendarData || {};
                personnelData = data.personnelData || [];

                displayCalendarData(calendarData);
                displayPersonnelList();
            } else {
                Swal.fire({
                    title: '登入失敗',
                    text: '請檢查帳號和密碼',
                    icon: 'error',
                    confirmButtonColor: '#f39c12'
                });
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
            Swal.fire({
                title: '錯誤',
                text: '登入過程中發生錯誤',
                icon: 'error',
                confirmButtonColor: '#f39c12'
            });
        });
    });

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('token');
        authForm.parentElement.parentElement.style.display = 'block';
        mainContent.style.display = 'none';
        logoutButton.style.display = 'none';
        savePersonnelButton.style.display = 'none';
        saveWorkButton.style.display = 'none';
        generateScheduleButton.style.display = 'none';
        calendar.innerHTML = '';
        itemsList.innerHTML = '';
        scheduleResult.innerHTML = '';
    });

    saveWorkButton.addEventListener('click', function() {
        saveDataToBackend('calendarData');
    });

    savePersonnelButton.addEventListener('click', function() {
        saveDataToBackend('personnelData');
    });

    function saveDataToBackend(type) {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                title: '尚未登入',
                text: '請先登入',
                icon: 'warning',
                confirmButtonColor: '#f39c12'
            });
            return;
        }

        const data = {
            calendarData: type === 'calendarData' ? calendarData : null,
            personnelData: type === 'personnelData' ? personnelData : null
        };

        fetch('/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            Swal.fire({
                title: '保存成功',
                text: data.msg || '資料已保存成功',
                icon: 'success',
                confirmButtonColor: '#f39c12'
            });
        })
        .catch(error => {
            console.error('錯誤:', error);
            Swal.fire({
                title: '錯誤',
                text: '保存過程中發生錯誤',
                icon: 'error',
                confirmButtonColor: '#f39c12'
            });
        });
    }

    function displayCalendarData(data) {
        calendarData = data;
        generateCalendar();
    }

    function displayPersonnelList() {
        itemsList.innerHTML = '';

        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value) + 1;
        const currentMonthStr = `${year}-${month.toString().padStart(2, '0')}`;

        const filteredPersonnel = personnelData.filter(person => 
            person.workDates.some(date => date.startsWith(currentMonthStr))
        );

        filteredPersonnel.forEach(person => {
            const itemDiv = document.createElement('div');
            const currentMonthDates = person.workDates.filter(date => date.startsWith(currentMonthStr));
            itemDiv.innerHTML = `
                姓名: ${person.name}, 工作: ${person.work.join(', ')}, 次數: ${person.workCount}, 
                日期: ${currentMonthDates.join(', ')}
                <button class="btn btn-primary btn-sm ms-1 edit-btn">編輯</button>
                <button class="btn btn-danger btn-sm ms-1 delete-btn">刪除</button>
            `;

            const editBtn = itemDiv.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editPerson(person.name));

            const deleteBtn = itemDiv.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deletePerson(person.name));

            itemsList.appendChild(itemDiv);
        });
    }

    function deletePerson(name) {
        personnelData = personnelData.filter(p => p.name !== name);
        displayPersonnelList();
    }

    function editPerson(name) {
        const person = personnelData.find(p => p.name === name);
        if (person) {
            document.getElementById('name').value = person.name;
            document.getElementById('work-count').value = person.workCount;

            document.querySelectorAll('input[name="work-option"]').forEach(cb => {
                cb.checked = person.work.includes(cb.value);
            });

            document.querySelectorAll('input[name="date-option"]').forEach(cb => {
                cb.checked = person.workDates.includes(cb.value);
            });

            // 移除編輯後的舊資料
            personnelData = personnelData.filter(p => p.name !== name);
        }
    }

    // 初始化日曆和編輯功能
    const editSection = document.getElementById('edit-section');
    const selectedDateSpan = document.getElementById('selected-date');
    const editForm = document.getElementById('edit-form');
    const resetButton = document.getElementById('reset-button');
    const resetListButton = document.getElementById('reset-list-button');
    const workOptionsDiv = document.getElementById('work-options');
    const dateOptionsDiv = document.getElementById('date-options');
    let selectedDayElement = null;

    for (let i = 2024; i <= new Date().getFullYear() + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i - 1;
        option.textContent = i;
        monthSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', generateCalendar);
    monthSelect.addEventListener('change', generateCalendar);

    function generateCalendar() {
        const year = yearSelect.value;
        const month = monthSelect.value;
        if (!year || month === '') return;

        calendar.innerHTML = '';
        editSection.style.display = 'none';

        const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        for (let i = 0; i < 7; i++) {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('calendar-header');
            dayHeader.textContent = daysOfWeek[i];
            calendar.appendChild(dayHeader);
        }

        const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-day', 'empty');
            calendar.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            const selectedDate = `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dayDiv.innerHTML = `
                <strong>${day}</strong>
                <span class="checkmark">✔</span>
                <div class="actions">
                    <button class="btn btn-sm btn-primary edit-btn">編輯</button>
                    <button class="btn btn-sm btn-secondary copy-btn">複製</button>
                </div>
            `;

            if (calendarData[selectedDate] && Object.keys(calendarData[selectedDate]).length > 0) {
                dayDiv.classList.add('filled');
            }

            calendar.appendChild(dayDiv);

            const editBtn = dayDiv.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                selectedDayElement = dayDiv;
                selectedDateSpan.textContent = selectedDate;
                editSection.style.display = 'block';

                editForm['work-name'].value = '';
                editForm['people-count'].value = '';

                updateWorkDetails(selectedDate);
            });

            const copyBtn = dayDiv.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                copiedData = calendarData[selectedDate] ? { ...calendarData[selectedDate] } : null;
                if (copiedData) {
                    Swal.fire({
                        title: '複製成功',
                        text: '工作內容已複製，可以在其他日期貼上',
                        icon: 'success',
                        confirmButtonColor: '#f39c12'
                    });
                } else {
                    Swal.fire({
                        title: '無工作內容',
                        text: '此日期無工作內容可複製',
                        icon: 'warning',
                        confirmButtonColor: '#f39c12'
                    });
                }
            });

            dayDiv.addEventListener('mouseover', () => {
                if (copiedData && !calendarData[selectedDate]) {
                    let pasteBtn = dayDiv.querySelector('.paste-btn');
                    if (!pasteBtn) {
                        pasteBtn = document.createElement('button');
                        pasteBtn.classList.add('btn', 'btn-sm', 'btn-success', 'paste-btn');
                        pasteBtn.textContent = '貼上';
                        dayDiv.querySelector('.actions').appendChild(pasteBtn);

                        pasteBtn.addEventListener('click', () => {
                            if (!calendarData[selectedDate]) {
                                calendarData[selectedDate] = { ...copiedData };
                            }
                            generateCalendar();
                        });
                    }
                }
            });

            dayDiv.addEventListener('mouseleave', () => {
                const pasteBtn = dayDiv.querySelector('.paste-btn');
                if (pasteBtn) {
                    pasteBtn.remove();
                }
            });
        }

        updateWorkOptions();
        updateDateOptions();
        displayPersonnelList();
    }

    function updateWorkDetails(selectedDate) {
        const workDetailsDiv = document.getElementById('work-details');
        workDetailsDiv.innerHTML = ''; 

        if (calendarData[selectedDate]) {
            for (const [workName, peopleCount] of Object.entries(calendarData[selectedDate])) {
                const workDetail = document.createElement('div');
                workDetail.textContent = `工作名稱: ${workName}, 人數: ${peopleCount}`;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = '刪除';
                deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1');
                deleteButton.onclick = function () {
                    deleteWorkItem(selectedDate, workName);
                };

                workDetail.appendChild(deleteButton);
                workDetailsDiv.appendChild(workDetail);
            }
        }
    }

    function deleteWorkItem(selectedDate, workName) {
        delete calendarData[selectedDate][workName];

        if (Object.keys(calendarData[selectedDate]).length === 0) {
            delete calendarData[selectedDate];
        }

        updateWorkDetails(selectedDate);
        generateCalendar();

        editSection.style.display = 'block';
    }

    document.getElementById('confirm-button').addEventListener('click', function(event) {
        event.preventDefault();
        saveTemporaryData();
        editSection.style.display = 'block';
    });

    editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveTemporaryData();
        editSection.style.display = 'none';
    });

    function saveTemporaryData() {
        if (selectedDayElement) {
            const workName = editForm['work-name'].value.trim();
            const peopleCount = editForm['people-count'].value.trim();
            const selectedDate = selectedDateSpan.textContent;

            if (workName && peopleCount) {
                if (!calendarData[selectedDate]) {
                    calendarData[selectedDate] = {};
                }
                calendarData[selectedDate][workName] = peopleCount;

                selectedDayElement.classList.add('filled');
            }

            editForm['work-name'].value = '';
            editForm['people-count'].value = '';

            updateWorkDetails(selectedDate);
            generateCalendar();

            editSection.style.display = 'block';
        }
    }

    resetButton.addEventListener('click', () => {
        const year = yearSelect.value;
        const month = monthSelect.value;

        if (!year || month === '') return;

        for (let date in calendarData) {
            const [dateYear, dateMonth] = date.split('-').map(Number);
            if (dateYear === parseInt(year) && dateMonth === parseInt(month) + 1) {
                delete calendarData[date];
            }
        }

        generateCalendar();
        updateWorkOptions();
        updateDateOptions();
        editSection.style.display = 'none';
    });

    resetListButton.addEventListener('click', () => {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value) + 1;

        if (!year || month === '') return;

        const currentMonthStr = `${year}-${month.toString().padStart(2, '0')}`;

        personnelData = personnelData.map(person => ({
            ...person,
            workDates: person.workDates.filter(date => !date.startsWith(currentMonthStr))
        }));

        displayPersonnelList();
    });

    function updateWorkOptions() {
        const year = yearSelect.value;
        const month = parseInt(monthSelect.value) + 1;
        workOptionsDiv.innerHTML = '';
        const workNames = [];

        for (let date in calendarData) {
            const [dateYear, dateMonth] = date.split('-').map(Number);
            if (dateYear === parseInt(year) && dateMonth === month) {
                for (let workName in calendarData[date]) {
                    if (!workNames.includes(workName)) {
                        workNames.push(workName);
                    }
                }
            }
        }

        workNames.forEach(workName => {
            const checkboxOption = document.createElement('div');
            checkboxOption.classList.add('form-check');
            checkboxOption.innerHTML = `
                <input class="form-check-input" type="checkbox" name="work-option" value="${workName}" id="work-${workName}">
                <label class="form-check-label" for="work-${workName}">${workName}</label>
            `;
            workOptionsDiv.appendChild(checkboxOption);
        });
    }

    function updateDateOptions() {
        const year = yearSelect.value;
        const month = parseInt(monthSelect.value) + 1;
        dateOptionsDiv.innerHTML = '';

        for (let date in calendarData) {
            const [dateYear, dateMonth] = date.split('-').map(Number);
            if (dateYear === parseInt(year) && dateMonth === month) {
                const checkboxOption = document.createElement('div');
                checkboxOption.classList.add('form-check');
                checkboxOption.innerHTML = `
                    <input class="form-check-input" type="checkbox" name="date-option" value="${date}" id="date-${date}">
                    <label class="form-check-label" for="date-${date}">${date}</label>
                `;
                dateOptionsDiv.appendChild(checkboxOption);
            }
        }
    }

    generateCalendar();
    updateWorkOptions();
    updateDateOptions();
    displayPersonnelList();

    // 新增人員表單提交事件
    const addItemForm = document.getElementById('add-item-form');
    addItemForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const workCount = document.getElementById('work-count').value.trim();

        const selectedWorks = Array.from(document.querySelectorAll('input[name="work-option"]:checked')).map(cb => cb.value);
        const selectedDates = Array.from(document.querySelectorAll('input[name="date-option"]:checked')).map(cb => cb.value);

        if (name && workCount && selectedWorks.length > 0 && selectedDates.length > 0) {
            personnelData.push({
                name: name,
                work: selectedWorks,
                workCount: workCount,
                workDates: selectedDates
            });

            displayPersonnelList();

            // 清空表單
            document.getElementById('name').value = '';
            document.getElementById('work-count').value = '';
            document.querySelectorAll('input[name="work-option"]:checked').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="date-option"]:checked').forEach(cb => cb.checked = false);
        } else {
            Swal.fire({
                title: '錯誤',
                text: '請填寫所有欄位並選擇工作和日期',
                icon: 'error',
                confirmButtonColor: '#f39c12'
            });
        }
    });

    function parseCSV(text) {
        const rows = text.split('\n').filter(Boolean);
        const headers = rows.shift().split(',');
        const workTypes = headers.slice(1, -5); // 工作類型
        const dateCols = headers.slice(-4); // 日期列

        personnelData = rows.map(row => {
            const values = row.split(',');
            const name = values[0];
            const works = workTypes.filter((_, index) => values[index + 1] === 'V');
            const workCount = values[values.length - 5];
            const workDates = dateCols.filter((_, index) => values[values.length - 4 + index] === 'O')
                                      .map(convertDateFormat);

            return {
                name,
                work: works,
                workCount,
                workDates
            };
        });

        updateWorkAndDateOptions(workTypes, dateCols.map(convertDateFormat));
        displayPersonnelList();
    }

    function convertDateFormat(dateString) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    function updateWorkAndDateOptions(works, dates) {
        const workOptionsDiv = document.getElementById('work-options');
        const dateOptionsDiv = document.getElementById('date-options');

        workOptionsDiv.innerHTML = works.map(work => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="work-option" value="${work}" id="work-${work}">
                <label class="form-check-label" for="work-${work}">${work}</label>
            </div>
        `).join('');

        dateOptionsDiv.innerHTML = dates.map(date => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="date-option" value="${date}" id="date-${date}">
                <label class="form-check-label" for="date-${date}">${date}</label>
            </div>
        `).join('');
    }

    function processFile(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    }

    const dropArea = document.getElementById('drop-area');
    const fileElem = document.getElementById('fileElem');

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        dropArea.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length) {
            processFile(files[0]);
        }
    });

    dropArea.addEventListener('click', () => {
        fileElem.click();
    });

    fileElem.addEventListener('change', () => {
        if (fileElem.files.length) {
            processFile(fileElem.files[0]);
        }
    });
});