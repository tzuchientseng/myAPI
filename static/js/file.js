// 確保在開頭定義 personnelData 變數
let personnelData = [];

// 確保 processFile 函數接收和使用 personnelData
function processFile(file, personnelData) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        parseCSV(text, personnelData); // 傳入 personnelData
    };
    reader.readAsText(file);
}

// 修改 parseCSV 函數以正確處理 personnelData
function parseCSV(text, personnelData) {
    const rows = text.split('\n').filter(Boolean); // 分割行並過濾空行
    rows.forEach(row => {
        const [name, work1, work2, workCount, workDate] = row.split(',').map(item => item.trim());
        if (name && work1 && workCount && workDate) {
            const selectedWorks = [work1, work2].filter(Boolean); // 過濾掉空值
            const selectedDates = [workDate]; // 假設每行只包含一個日期

            // 將資料推到人員資料陣列
            personnelData.push({
                name: name,
                work: selectedWorks,
                workCount: workCount,
                workDates: selectedDates
            });

            // 自動勾選工作選項
            selectedWorks.forEach(work => {
                const workCheckbox = document.querySelector(`input[name="work-option"][value="${work}"]`);
                if (workCheckbox) {
                    workCheckbox.checked = true;
                }
            });

            // 自動勾選日期選項
            selectedDates.forEach(date => {
                const dateCheckbox = document.querySelector(`input[name="date-option"][value="${date}"]`);
                if (dateCheckbox) {
                    dateCheckbox.checked = true;
                }
            });

            displayPersonnelList(); // 更新顯示人員名單
        }
    });
}

// 顯示人員名單的函數
function displayPersonnelList() {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';

    personnelData.forEach(person => {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = `姓名: ${person.name}, 工作: ${person.work.join(', ')}, 次數: ${person.workCount}, 日期: ${person.workDates.join(', ')}`;

        itemsList.appendChild(itemDiv);
    });
}

// 檔案拖曳功能
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

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

