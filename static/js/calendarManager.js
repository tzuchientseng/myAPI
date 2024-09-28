/**
 * 初始化日曆和編輯功能
 */
document.addEventListener('DOMContentLoaded', function() {
    // let calendarData = {};  // 替代 localStorage 的 calendarData
    // let personnelData = []; // 替代 localStorage 的 personnelData
    // let workNames = []; // 替代 localStorage 的 workNames
    const calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};
    let workNames = JSON.parse(localStorage.getItem('workNames')) || [];
    const personnelData = JSON.parse(localStorage.getItem('personnelData')) || [];

    const yearSelect = document.getElementById('year');
    const monthSelect = document.getElementById('month');
    const calendar = document.getElementById('calendar');
    const editSection = document.getElementById('edit-section');
    const selectedDateSpan = document.getElementById('selected-date');
    const editForm = document.getElementById('edit-form');
    const resetButton = document.getElementById('reset-button');
    const resetListButton = document.getElementById('reset-list-button');
    const workOptionsDiv = document.getElementById('work-options');
    const dateOptionsDiv = document.getElementById('date-options');
    const itemsList = document.getElementById('items-list');
    let selectedDayElement = null;

    // 初始化年份選項
    for (let i = 2024; i <= new Date().getFullYear() + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    // 初始化月份選項
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i - 1;
        option.textContent = i;
        monthSelect.appendChild(option);
    }

    // 當年份或月份變更時，更新日曆
    yearSelect.addEventListener('change', generateCalendar);
    monthSelect.addEventListener('change', generateCalendar);

    /**
     * 生成日曆並處理編輯功能
     */
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
            emptyDiv.classList.add('calendar-day');
            calendar.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            const selectedDate = `${year}-${parseInt(month) + 1}-${day}`;
            dayDiv.innerHTML = `
                <strong>${day}</strong>
                <span class="checkmark">✔</span>
                <div class="actions">
                    <button class="btn btn-sm btn-primary edit-btn">編輯</button>
                </div>
            `;

            // 檢查是否有內容並顯示打勾圖標
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
        }

        updateWorkOptions();
        updateDateOptions();
        displayPersonnelList();
    }

    /**
     * 更新工作詳情顯示區域
     * @param {string} selectedDate - 被選中的日期
     */
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

    /**
     * 刪除指定日期的工作項目
     * @param {string} selectedDate - 被選中的日期
     * @param {string} workName - 要刪除的工作名稱
     */
    function deleteWorkItem(selectedDate, workName) {
        delete calendarData[selectedDate][workName];

        if (Object.keys(calendarData[selectedDate]).length === 0) {
            delete calendarData[selectedDate];
        }

        localStorage.setItem('calendarData', JSON.stringify(calendarData));

        updateWorkDetails(selectedDate);
        generateCalendar();

        editSection.style.display = 'block';
    }

    /**
     * 確認按鈕行為：暫時儲存並繼續編輯
     */
    document.getElementById('confirm-button').addEventListener('click', function(event) {
        event.preventDefault();
        saveTemporaryData();
        editSection.style.display = 'block';
    });

    /**
     * 保存日曆上的工作數據並繼續顯示編輯區域
     */
    editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveTemporaryData();
        editSection.style.display = 'none';
    });

    /**
     * 保存暫時資料
     */
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

                localStorage.setItem('calendarData', JSON.stringify(calendarData));

                selectedDayElement.classList.add('filled');
            }

            editForm['work-name'].value = '';
            editForm['people-count'].value = '';

            updateWorkDetails(selectedDate);
            generateCalendar();

            editSection.style.display = 'block';
        }
    }

    /**
     * 重置當月的工作數據
     */
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

        localStorage.setItem('calendarData', JSON.stringify(calendarData));

        generateCalendar();
        updateWorkOptions();
        updateDateOptions();
        editSection.style.display = 'none';
    });

    /**
     * 重置人員名單
     */
    resetListButton.addEventListener('click', () => {
        personnelData.length = 0;

        localStorage.setItem('personnelData', JSON.stringify(personnelData));

        displayPersonnelList();
    });

    /**
     * 更新工作選項顯示
     */
    function updateWorkOptions() {
        const year = yearSelect.value;
        const month = parseInt(monthSelect.value) + 1;
        workOptionsDiv.innerHTML = '';
        workNames.length = 0;

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

        localStorage.setItem('workNames', JSON.stringify(workNames));

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

    /**
     * 更新日期選項顯示
     */
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

    /**
     * 動態顯示當月的人員名單
     */
    function displayPersonnelList() {
        itemsList.innerHTML = ''; 

        personnelData.forEach((person, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.textContent = `姓名: ${person.name}, 工作: ${person.work.join(', ')}, 次數: ${person.workCount}, 日期: ${person.workDates.join(', ')}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '刪除';
            deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-1');
            deleteButton.onclick = function () {
                deletePerson(index);
            };

            itemDiv.appendChild(deleteButton);
            itemsList.appendChild(itemDiv);
        });
    }

    /**
     * 刪除人員名單中的指定人員
     * @param {number} index - 人員索引
     */
    function deletePerson(index) {
        personnelData.splice(index, 1);

        localStorage.setItem('personnelData', JSON.stringify(personnelData));
        displayPersonnelList();
    }

    /**
     * 添加新的人員至人員名單
     */
    document.getElementById('add-item-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedWorks = Array.from(document.querySelectorAll('input[name="work-option"]:checked')).map(el => el.value);
        const selectedDates = Array.from(document.querySelectorAll('input[name="date-option"]:checked')).map(el => el.value);
        const personName = document.getElementById('name').value.trim();
        const workCount = document.getElementById('work-count').value.trim();

        if (personName) {
            const existingPersonIndex = personnelData.findIndex(person => person.name === personName);

            const newPerson = {
                name: personName,
                work: selectedWorks,
                workCount: workCount,
                workDates: selectedDates
            };

            if (existingPersonIndex !== -1) {
                personnelData[existingPersonIndex] = newPerson;
            } else {
                personnelData.push(newPerson);
            }

            localStorage.setItem('personnelData', JSON.stringify(personnelData));

            displayPersonnelList();

            document.getElementById('add-item-form').reset();
        } else {
            alert('請輸入人員名稱');
        }
    });

    /**
     * 清除所有 local storage 資料
     */
    document.getElementById('clear-storage-button').addEventListener('click', () => {
        localStorage.clear();
        Object.keys(calendarData).forEach(key => delete calendarData[key]);
        workNames.length = 0;
        personnelData.length = 0;
        generateCalendar();
        updateWorkOptions();
        updateDateOptions();
        displayPersonnelList();
        alert('所有資料已被清除');
    });

    // 初始化顯示
    generateCalendar();
    updateWorkOptions();
    updateDateOptions();
    displayPersonnelList();
});

