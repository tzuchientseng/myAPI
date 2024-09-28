const calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};
const personnelData = JSON.parse(localStorage.getItem('personnelData')) || [];

console.log('calendarData:', JSON.stringify(calendarData, null, 4));
console.log('personnelData:', JSON.stringify(personnelData, null, 4));

// 使用 forEach 迴圈來遍歷 personnelData 並列印每個人員的資料
personnelData.forEach(person => {
    console.log(`姓名: ${person.name}, 工作: ${person.work.join(', ')}, 次數: ${person.workCount}, 日期: ${person.workDates.join(', ')}`);
});

/*
calendarData: {
    "2024-1-6": {
        "vocal": "6",
        "drum": "1",
        "bass": "1",
        "ag": "1"
    },
    "2024-1-13": {
        "vocal": "6",
        "drum": "1",
        "ag": "1",
        "bass": "1"
    },
    "2024-1-20": {
        "vocal": "6",
        "drum": "1",
        "ag": "1",
        "bass": "1"
    },
    "2024-1-27": {
        "vocal": "6",
        "drum": "1",
        "ag": "1",
        "bass": "1"
    }
}
random.js:5 personnelData: [
    {
        "name": "莊婷伊",
        "work": [
            "vocal"
        ],
        "workCount": "1",
        "workDates": [
            "2024-1-6",
            "2024-1-13",
            "2024-1-20",
            "2024-1-27"
        ]
    },
    {
        "name": "林鈺莉",
        "work": [
            "vocal",
            "drum",
            "ag"
        ],
        "workCount": "0",
        "workDates": [
            "2024-1-6",
            "2024-1-13",
            "2024-1-20",
            "2024-1-27"
        ]
    },
    {
        "name": "曾子謙",
        "work": [
            "vocal",
            "ag"
        ],
        "workCount": "3",
        "workDates": [
            "2024-1-6",
            "2024-1-13",
            "2024-1-20",
            "2024-1-27"
        ]
    }
]
random.js:9 姓名: 莊婷伊, 工作: vocal, 次數: 1, 日期: 2024-1-6, 2024-1-13, 2024-1-20, 2024-1-27
random.js:9 姓名: 林鈺莉, 工作: vocal, drum, ag, 次數: 0, 日期: 2024-1-6, 2024-1-13, 2024-1-20, 2024-1-27
random.js:9 姓名: 曾子謙, 工作: vocal, ag, 次數: 3, 日期: 2024-1-6, 2024-1-13, 2024-1-20, 2024-1-27
*/
