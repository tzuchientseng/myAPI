import random
from copy import deepcopy

def shuffle_array(array):
    """隨機打亂數組順序的函數"""
    array = deepcopy(array)
    random.shuffle(array)
    return array

def generate_random_schedule(calendar_data, personnel_data):
    # 將 calendar_data 按日期排序（日期越接近現在的放在越前面）

    # 初始化 random_table
    random_table = {}
    for date, works in calendar_data.items():
        random_table[date] = {work: [] for work in works}

    # 隨機分配人員到工作
    for person in shuffle_array(personnel_data):  # 隨機打亂人員順序
        available_dates = shuffle_array([date for date in person['workDates'] if date in calendar_data])  # 隨機打亂可用日期
        
        for date in available_dates:
            available_works = shuffle_array(person['work'])  # 隨機打亂工作順序
            for work in available_works:
                # 檢查這個人是否已經在該日期分配過該工作
                if len(random_table[date][work]) < int(calendar_data[date][work]) and person['name'] not in random_table[date][work]:
                    random_table[date][work].append(person['name'])
                    person['workCount'] -= 1
                    break  # 成功分配後跳出內層循環，避免重複分配

            if person['workCount'] == 0:
                break  # 如果人員的工作次數已經用完，停止分配該人員

    return random_table


# 測試數據
calendar_data = {
    "2024-1-13": {"guitar": "1", "vocal": "1"},
    "2024-1-20": {"guitar": "1", "vocal": "1"},
    "2024-1-27": {"guitar": "2", "vocal": "1"},
    "2024-1-6": {"guitar": "1", "vocal": "1"}
}

personnel_data = [
    {"name": "曾子謙", "work": ["vocal", "guitar"], "workCount": 3, "workDates": ["2024-1-13", "2024-1-20", "2024-1-27"]},
    {"name": "莊婧伊", "work": ["vocal"], "workCount": 2, "workDates": ["2024-1-6", "2024-1-13", "2024-1-20", "2024-1-27"]},
    {"name": "Tommy", "work": ["guitar"], "workCount": 5, "workDates": ["2024-1-6", "2024-1-13", "2024-1-20", "2024-1-27"]}
]

# 生成隨機工作表
random_schedule = generate_random_schedule(calendar_data, personnel_data)
(random_schedule)

