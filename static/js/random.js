/*
 * Local Storage 會爆掉
 */
// let calendarData = {};  // 用來替代 localStorage 中的 calendarData
// let originalPersonnelData = [];  // 用來替代 localStorage 中的 personnelData

document.addEventListener('DOMContentLoaded', async function() {
    // 從 localStorage 中讀取數據
    const calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};
    const originalPersonnelData = JSON.parse(localStorage.getItem('personnelData')) || [];
    const randomTables = [];

    console.log('calendarData:', JSON.stringify(calendarData, null, 4));
    console.log('personnelData:', JSON.stringify(originalPersonnelData, null, 4));

    // 打亂數組順序的函數
    async function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 生成隨機工作表的主函數
    async function generateRandomSchedule() {
        for (let i = 0; i < 3; i++) { // 生成三個範本
            let randomTable = {};
            let personnelData = JSON.parse(JSON.stringify(originalPersonnelData)); // 深拷貝人員數據

            // 初始化 randomTable
            for (let date in calendarData) {
                randomTable[date] = {};
                for (let work in calendarData[date]) {
                    randomTable[date][work] = [];
                }
            }

            // 隨機打亂人員順序，確保輪流分配是隨機的
            personnelData = await shuffleArray(personnelData);

            // 輪流分配工作
            let index = 0;
            let totalPersonnel = personnelData.length;

            while (true) {
                let assigned = false;
                let person = personnelData[index];

                if (person.workCount > 0) {
                    let availableDates = person.workDates.filter(date => calendarData[date]); // 過濾出可以工作的日期
                    availableDates = await shuffleArray(availableDates); // 隨機打亂可以工作的日期

                    for (let date of availableDates) {
                        if (assigned) break;

                        for (let work of person.work) {
                            // 檢查這個工作是否還有空位且這個人還沒被分配到該日期
                            if (randomTable[date][work].length < parseInt(calendarData[date][work], 10) &&
                                !randomTable[date][work].includes(person.name)) {
                                randomTable[date][work].push(person.name);
                                person.workCount--;
                                assigned = true;
                                break;
                            }
                        }
                    }
                }

                index = (index + 1) % totalPersonnel;

                // 如果沒有任何人員被分配，則跳出循環
                if (!assigned && personnelData.every(p => p.workCount === 0)) {
                    break;
                }
            }

            randomTables.push(randomTable);
        }

        // 將生成的表保存回 localStorage
        localStorage.setItem('randomTables', JSON.stringify(randomTables));
        console.log('Three random tables generated and saved:', randomTables);
    }

    // 調用主函數生成工作表
    await generateRandomSchedule();
});
