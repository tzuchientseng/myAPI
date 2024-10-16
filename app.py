from flask import Flask, request, jsonify, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import json
import os
import random
from copy import deepcopy
from datetime import timedelta, datetime
import logging

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = '你的秘密密鑰'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=3)  # 設置 JWT token 有效期為 3 小時
CORS(app, resources={r"/*": {"origins": "*"}})
jwt = JWTManager(app)

# 設置日誌
logging.basicConfig(level=logging.DEBUG)

# 模擬的用戶資料
users = {
    "admin": "open",
    "guest": "guest",
    "worship": "jesus"
}

# 渲染首頁的路由
@app.route('/')
def index():
    return render_template('index.html')

# 渲染工作頁面的路由
@app.route('/work')
def work():
    return render_template('work.html')

# 渲染APi文檔
@app.route('/docs')
def docs():
    return render_template('docs.html')

# 確保 data 資料夾存在
def ensure_data_folder():
    script_dir = os.path.dirname(__file__)
    data_folder = os.path.join(script_dir, 'data')
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)
    return data_folder

# 從 JSON 文件中讀取數據
def load_data_from_json(username):
    try:
        data_folder = ensure_data_folder()
        file_path = os.path.join(data_folder, f'{username}_data.json')
        with open(file_path, 'r') as f:
            data = json.load(f)
            calendar_data = data.get('calendarData', {})
            personnel_data = data.get('personnelData', [])
            
            # 轉換日期格式
            calendar_data = {convert_date_format(k): v for k, v in calendar_data.items()}
            for person in personnel_data:
                person['workDates'] = [convert_date_format(date) for date in person['workDates']]
            
            return calendar_data, personnel_data
    except FileNotFoundError:
        app.logger.warning(f"Data file not found for user: {username}")
        return {}, []
    except json.JSONDecodeError:
        app.logger.error(f"Invalid JSON in data file for user: {username}")
        return {}, []

# 保存數據到 JSON 文件
def save_data_to_json(username, calendar_data, personnel_data):
    data_folder = ensure_data_folder()
    file_path = os.path.join(data_folder, f'{username}_data.json')

    try:
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    except FileNotFoundError:
        existing_data = {}

    if calendar_data is not None:
        existing_data['calendarData'] = calendar_data
    if personnel_data is not None:
        existing_data['personnelData'] = personnel_data

    with open(file_path, 'w') as f:
        json.dump(existing_data, f)

# 定義隨機打亂數組順序的函數
def shuffle_array(array):
    """隨機打亂數組順序的函數"""
    array = deepcopy(array)
    random.shuffle(array)
    return array

# 隨機生成工作表的函數
def generate_random_schedule(calendar_data, personnel_data):
    if not calendar_data or not personnel_data:
        app.logger.error("Empty calendar_data or personnel_data")
        return {}

    random_table = {}
    all_work_types = set()

    # 收集所有工作類型
    for person in personnel_data:
        all_work_types.update(person['work'])

    # 確保每個日期都有所有工作類型
    for date, works in calendar_data.items():
        random_table[date] = {work: [] for work in all_work_types}
        for work in all_work_types:
            if work not in works:
                calendar_data[date][work] = "0"  # 設置默認值為 "0"

    for person in shuffle_array(personnel_data):
        try:
            person['workCount'] = int(person['workCount'])
        except ValueError:
            app.logger.warning(f"Invalid workCount for {person['name']}: {person['workCount']}")
            continue

        available_dates = shuffle_array([date for date in person['workDates'] if date in calendar_data])
        
        for date in available_dates:
            if date not in calendar_data:
                app.logger.warning(f"Date {date} not in calendar_data")
                continue

            available_works = shuffle_array(person['work'])
            for work in available_works:
                if work not in calendar_data[date]:
                    app.logger.warning(f"Work {work} not in calendar_data for date {date}")
                    continue

                if len(random_table[date][work]) < int(calendar_data[date][work]) and person['name'] not in random_table[date][work]:
                    random_table[date][work].append(person['name'])
                    person['workCount'] -= 1
                    break

            if person['workCount'] == 0:
                break

    return random_table

# 轉換日期格式的函數
def convert_date_format(date_string):
    if '/' in date_string:
        # 從 DD/MM/YYYY 轉換為 YYYY-MM-DD
        date_obj = datetime.strptime(date_string, "%d/%m/%Y")
        return date_obj.strftime("%Y-%m-%d")
    elif '-' in date_string:
        # 確保格式為 YYYY-MM-DD
        date_parts = date_string.split('-')
        if len(date_parts[0]) == 4:
            return date_string
        else:
            # 如果年份不在前面，重新排序
            return f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
    else:
        # 如果格式不符合預期，返回原始字符串
        return date_string

# 登錄邏輯
@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if username in users and users[username] == password:
        access_token = create_access_token(identity=username)
        calendar_data, personnel_data = load_data_from_json(username)
        
        return jsonify(
            token=access_token,
            calendarData=calendar_data,
            personnelData=personnel_data
        ), 200
    else:
        return jsonify({"msg": "登入失敗"}), 401

# 保存數據邏輯
@app.route('/save-data', methods=['POST'])
@jwt_required()
def save_data():
    username = get_jwt_identity()
    data = request.json
    calendar_data = data.get('calendarData')
    personnel_data = data.get('personnelData')

    if calendar_data and personnel_data:
        all_work_types = set()
        for person in personnel_data:
            all_work_types.update(person['work'])

        for date in calendar_data:
            for work_type in all_work_types:
                if work_type not in calendar_data[date]:
                    calendar_data[date][work_type] = "0"

    save_data_to_json(username, calendar_data, personnel_data)

    return jsonify({"msg": f"{username} 的資料已保存成功"}), 200

# 提取數據邏輯
@app.route('/get-data', methods=['GET'])
@jwt_required()
def get_data():
    username = get_jwt_identity()
    calendar_data, personnel_data = load_data_from_json(username)

    return jsonify({
        "calendarData": calendar_data,
        "personnelData": personnel_data
    }), 200

# 生成隨機工作表的路由
@app.route('/generate-schedule', methods=['POST'])
@jwt_required()
def generate_schedule():
    try:
        username = get_jwt_identity()
        calendar_data, personnel_data = load_data_from_json(username)

        if not calendar_data or not personnel_data:
            app.logger.error(f"No data found for user: {username}")
            return jsonify({"error": "No data found"}), 404

        random_table = generate_random_schedule(calendar_data, personnel_data)
        return jsonify(random_table=random_table), 200
    except Exception as e:
        app.logger.error(f"Error in generate_schedule: {str(e)}")
        return jsonify({"error": "An error occurred while generating the schedule"}), 500

"""
Math API

curl -X POST -H "Content-Type: application/json" \
     -d '{"data": [10, 20, 30, 40, 50]}' \
     http://localhost:5000/confidence-interval

curl -X POST -H "Content-Type: application/json" -d "{\"data\": [10, 20, 30, 40, 50], \"CI\": 90}" http://localhost:5000/CI
curl -X POST -H "Content-Type: application/json" -d "{\"data\": [10, 20, 30, 40, 50], \"CI\": 90}" https://my-api-project-83a1e4f4e00f.herokuapp.com/CI

"""
from statistic import *


# 用於計算平均數的信賴區間，將數據 [10, 20, 30, 40, 50] 和 CI 90 發送到伺服器
# curl -X POST -H "Content-Type: application/json" -d "{\"data\": [10, 20, 30, 40, 50], \"CI\": 90}" https://my-api-project-83a1e4f4e00f.herokuapp.com/CI
# 計算均值的信賴區間
@app.route('/CI', methods=['POST'])
def calculate_confidence_interval():
    try:
        data = request.json.get("data")
        ci = request.json.get("CI", 95.0)  # 默認信心水準為 95.0
        
        if not data:
            return jsonify({"error": "Missing data"}), 400
        
        des_data = DesData(data)
        lower_bound, upper_bound = des_data.bound(ci)
        
        return jsonify({
            "confidence_level": ci,
            "mean": des_data.mean(),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        }), 200
    except Exception as e:
        app.logger.error(f"Error in calculate_confidence_interval: {str(e)}")
        return jsonify({"error": "An error occurred while calculating the confidence interval"}), 500

# 用於計算二項信賴區間，將成功次數 40、總試驗次數 100 和 CI 95 發送到伺服器
# curl -X POST -H "Content-Type: application/json" -d "{\"successes\": 40, \"trials\": 100, \"CI\": 95}" https://my-api-project-83a1e4f4e00f.herokuapp.com/PCI
# 計算二項信賴區間 (PCI)
@app.route('/PCI', methods=['POST'])
def calculate_proportion_confidence_interval():
    try:
        successes = request.json.get("successes")
        trials = request.json.get("trials")
        ci = request.json.get("CI", 95.0)  # 默認信心水準為 95.0
        
        if successes is None or trials is None:
            return jsonify({"error": "Missing successes or trials"}), 400
        
        if trials == 0:
            return jsonify({"error": "Number of trials must be greater than 0"}), 400
        
        des_data = DesData()
        lower_bound, upper_bound = des_data.p_ci(ci, successes, trials)
        
        return jsonify({
            "confidence_level": ci,
            "proportion": successes / trials,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        }), 200
    except Exception as e:
        app.logger.error(f"Error in calculate_proportion_confidence_interval: {str(e)}")
        return jsonify({"error": "An error occurred while calculating the proportion confidence interval"}), 500

# 用於計算變異數的信賴區間，將數據 [10, 20, 30, 40, 50] 和 CI 95 發送到伺服器
# curl -X POST -H "Content-Type: application/json" -d "{\"data\": [10, 20, 30, 40, 50], \"CI\": 95}" https://my-api-project-83a1e4f4e00f.herokuapp.com/VarCI
# 計算變異數的信賴區間
@app.route('/VarCI', methods=['POST'])
def calculate_variance_confidence_interval():
    try:
        data = request.json.get("data")
        ci = request.json.get("CI", 95.0)  # 默認信心水準為 95.0
        
        if not data:
            return jsonify({"error": "Missing data"}), 400
        
        des_data = DesData(data)
        lower_bound, upper_bound = des_data.var_ci(ci)
        
        return jsonify({
            "confidence_level": ci,
            "variance": des_data.samp_vari(),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        }), 200
    except Exception as e:
        app.logger.error(f"Error in calculate_variance_confidence_interval: {str(e)}")
        return jsonify({"error": "An error occurred while calculating the variance confidence interval"}), 500

# 用於進行雙樣本平均數 t 檢定，將兩組數據 [10, 20, 30, 40, 50] 和 [5, 15, 25, 35, 45] 與顯著水準 alpha 0.05 發送到伺服器
# curl -X POST -H "Content-Type: application/json" -d "{\"data1\": [10, 20, 30, 40, 50], \"data2\": [5, 15, 25, 35, 45], \"alpha\": 0.05}" https://my-api-project-83a1e4f4e00f.herokuapp.com/TwoSampleTTest
# 雙樣本平均數的t檢定
@app.route('/TwoSampleTTest', methods=['POST'])
def calculate_two_sample_t_test():
    try:
        data1 = request.json.get("data1")
        data2 = request.json.get("data2")
        alpha = request.json.get("alpha", 0.05)  # 默認顯著水準 α = 0.05
        
        if not data1 or not data2:
            return jsonify({"error": "Missing data1 or data2"}), 400
        
        infer_data = Infer2Data(data1, data2)
        test_result = infer_data.two_sample_t_test(alpha)
        
        return jsonify({
            "result": test_result
        }), 200
    except Exception as e:
        app.logger.error(f"Error in calculate_two_sample_t_test: {str(e)}")
        return jsonify({"error": "An error occurred while performing the two-sample t-test"}), 500

# 用於計算描述性統計量，將數據 [10, 20, 30, 40, 50] 發送到伺服器
# curl -X POST -H "Content-Type: application/json" -d "{\"data\": [10, 20, 30, 40, 50]}" https://my-api-project-83a1e4f4e00f.herokuapp.com/Descriptive
# 計算描述性統計
@app.route('/Descriptive', methods=['POST'])
def calculate_descriptive_statistics():
    try:
        data = request.json.get("data")
        
        if not data or not isinstance(data, list):
            return jsonify({"error": "Invalid or missing data"}), 400
        
        des_data = DesData(data)
        
        # 處理 mode，確保當多眾數或無眾數時正確返回
        try:
            mode_value = des_data.mode()
            if mode_value is None:  # 如果無眾數或有多個眾數
                mode_value = "No mode"  # 沒有明顯的眾數
        except Exception as e:
            print(f"Error during mode calculation: {e}")
            mode_value = f"Error calculating mode: {str(e)}"
        
        return jsonify({
            "mean": des_data.mean(),
            "variance": des_data.vari(),
            "standard_deviation": des_data.dev(),
            "sample_variance": des_data.samp_vari(),
            "sample_standard_deviation": des_data.samp_dev(),
            "median": des_data.median(),
            "mode": mode_value,  # 返回 mode 的結果
        }), 200
    except Exception as e:
        app.logger.error(f"Error in calculate_descriptive_statistics: {str(e)}")
        return jsonify({"error": "An error occurred while calculating descriptive statistics"}), 500

"""
- 定價 - 成本 = 單筆營利
- 銷售數量
`(單筆營利)*銷售數量=營業額`
m 表示月份
m = 1 10*100 = 1000
m = 2 12*90 = 1080
m = 3 15*80 = 1200
m = 4 20*10 = 200
m = 5 8*110 = 880
m = 6 7*120 = 840

---
Input:
{
    "monthly_data": {
        "m1": {"profit": 10, "sales": 100},
        "m2": {"profit": 12, "sales": 90},
        "m3": {"profit": 15, "sales": 80},
        "m4": {"profit": 20, "sales": 10},
        "m5": {"profit": 8, "sales": 110},
        "m6": {"profit": 7, "sales": 120}
    }
}
Output: 
{
    "max_profit": 11.46,
    "max_revenue": 1022.35
}
"""
import numpy as np
from flask import Flask, request, jsonify
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR

def parse_data(data):
    monthly_data = data['monthly_data']
    profits = []
    sales = []
    for month, values in monthly_data.items():
        profits.append(values['profit'])
        sales.append(values['sales'])
    return np.array(profits).reshape(-1, 1), np.array(sales)

def calculate_confidence_interval(data, confidence=0.95):
    mean = np.mean(data)
    std = np.std(data)
    z = 1.96  # 對應 95% 信賴區間
    lower_bound = mean - z * std
    upper_bound = mean + z * std
    return lower_bound, upper_bound

# 線性回歸 API
@app.route('/calculate_max_revenue', methods=['POST'])
def calculate_max_revenue():
    data = request.get_json()
    
    if not data or 'monthly_data' not in data:
        return jsonify({'error': 'Invalid input, please provide monthly_data dictionary'}), 400

    # 解析數據
    profits, sales = parse_data(data)

    # 計算 profits 的信賴區間
    lower_bound, upper_bound = calculate_confidence_interval(profits)

    # 過濾掉 profits 和 sales 中不在信賴區間範圍內的數據
    filtered_profits = []
    filtered_sales = []
    for profit, sale in zip(profits, sales):
        if lower_bound <= profit <= upper_bound:
            filtered_profits.append(profit)
            filtered_sales.append(sale)

    # 確保數據經過過濾後還有足夠的樣本點
    if len(filtered_profits) < 2:
        return jsonify({'error': 'Not enough data points after filtering'}), 400

    # 將過濾後的數據轉換為 numpy array 並進行擬合
    filtered_profits = np.array(filtered_profits).reshape(-1, 1)
    filtered_sales = np.array(filtered_sales)

    # 使用線性回歸擬合篩選後的數據
    model = LinearRegression()
    model.fit(filtered_profits, filtered_sales)

    # 生成基於信賴區間的預測範圍
    profit_range = np.linspace(lower_bound, upper_bound, 100).reshape(-1, 1)
    predicted_sales = model.predict(profit_range)
    
    # 計算營業額 Z = X * Y
    revenue = profit_range.flatten() * predicted_sales
    
    # 找到最大營業額的單筆營利
    max_revenue_index = np.argmax(revenue)
    max_profit = profit_range[max_revenue_index][0]
    max_revenue = revenue[max_revenue_index]
    
    # 取出最後一個月的 profit
    last_month_profit = profits[-1][0]

    suggestion = None
    if max_profit < last_month_profit:
        suggestion = "The price seems too high compared to last month, it's recommended to decrease the price."
    elif max_profit > last_month_profit:
        suggestion = "The price seems too low compared to last month, it's recommended to increase the price."
    else:
        suggestion = "The current pricing is close to last month's profit point, no need for changes."

    return jsonify({
        'max_profit': max_profit,
        'max_revenue': max_revenue,
        'suggestion': suggestion
    })

# 多項式回歸 API
# curl -X POST -H "Content-Type: application/json" -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" https://my-api-project-83a1e4f4e00f.herokuapp.com/polynomial_regression
# 發送月度營利數據，並使用多項式回歸計算最大營業額
# curl -X POST -H "Content-Type: application/json" \
# -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" \
# https://my-api-project-83a1e4f4e00f.herokuapp.com/polynomial_regression
@app.route('/polynomial_regression', methods=['POST'])
def polynomial_regression():
    data = request.get_json()
    if not data or 'monthly_data' not in data:
        return jsonify({'error': 'Invalid input, please provide monthly_data dictionary'}), 400

    profits, sales = parse_data(data)

    poly = PolynomialFeatures(degree=2)
    X_poly = poly.fit_transform(profits)
    model = LinearRegression()
    model.fit(X_poly, sales)

    profit_range = np.linspace(profits.min(), profits.max(), 100).reshape(-1, 1)
    predicted_sales = model.predict(poly.transform(profit_range))
    revenue = profit_range.flatten() * predicted_sales
    max_revenue_index = np.argmax(revenue)
    
    return jsonify({
        'max_profit': profit_range[max_revenue_index][0],
        'max_revenue': revenue[max_revenue_index]
    })

# 決策樹回歸 API
# curl -X POST -H "Content-Type: application/json" -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" https://my-api-project-83a1e4f4e00f.herokuapp.com/decision_tree_regression
# 發送月度營利數據，並使用決策樹回歸計算最大營業額
# curl -X POST -H "Content-Type: application/json" \
# -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" \
# https://my-api-project-83a1e4f4e00f.herokuapp.com/decision_tree_regression
@app.route('/decision_tree_regression', methods=['POST'])
def decision_tree_regression():
    data = request.get_json()
    if not data or 'monthly_data' not in data:
        return jsonify({'error': 'Invalid input, please provide monthly_data dictionary'}), 400

    profits, sales = parse_data(data)

    tree_model = DecisionTreeRegressor()
    tree_model.fit(profits, sales)

    profit_range = np.linspace(profits.min(), profits.max(), 100).reshape(-1, 1)
    predicted_sales = tree_model.predict(profit_range)
    revenue = profit_range.flatten() * predicted_sales
    max_revenue_index = np.argmax(revenue)
    
    return jsonify({
        'max_profit': profit_range[max_revenue_index][0],
        'max_revenue': revenue[max_revenue_index]
    })

# 隨機森林回歸 API
# curl -X POST -H "Content-Type: application/json" -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" https://my-api-project-83a1e4f4e00f.herokuapp.com/random_forest_regression
# 發送月度營利數據，並使用隨機森林回歸計算最大營業額
# curl -X POST -H "Content-Type: application/json" \
# -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" \
#https://my-api-project-83a1e4f4e00f.herokuapp.com/random_forest_regression
@app.route('/random_forest_regression', methods=['POST'])
def random_forest_regression():
    data = request.get_json()
    if not data or 'monthly_data' not in data:
        return jsonify({'error': 'Invalid input, please provide monthly_data dictionary'}), 400

    profits, sales = parse_data(data)

    forest_model = RandomForestRegressor(n_estimators=100)
    forest_model.fit(profits, sales)

    profit_range = np.linspace(profits.min(), profits.max(), 100).reshape(-1, 1)
    predicted_sales = forest_model.predict(profit_range)
    revenue = profit_range.flatten() * predicted_sales
    max_revenue_index = np.argmax(revenue)
    
    return jsonify({
        'max_profit': profit_range[max_revenue_index][0],
        'max_revenue': revenue[max_revenue_index]
    })


# 支持向量回歸 (SVR) API
# curl -X POST -H "Content-Type: application/json" -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" https://my-api-project-83a1e4f4e00f.herokuapp.com/svr_regression
# 發送月度營利數據，並使用支持向量回歸計算最大營業額
# curl -X POST -H "Content-Type: application/json" \
# -d "{\"monthly_data\": {\"m1\": {\"profit\": 10, \"sales\": 100}, \"m2\": {\"profit\": 12, \"sales\": 90}, \"m3\": {\"profit\": 15, \"sales\": 80}, \"m4\": {\"profit\": 20, \"sales\": 10}, \"m5\": {\"profit\": 8, \"sales\": 110}, \"m6\": {\"profit\": 7, \"sales\": 120}}}" \
# https://my-api-project-83a1e4f4e00f.herokuapp.com/svr_regression
@app.route('/svr_regression', methods=['POST'])
def svr_regression():
    data = request.get_json()
    if not data or 'monthly_data' not in data:
        return jsonify({'error': 'Invalid input, please provide monthly_data dictionary'}), 400

    profits, sales = parse_data(data)

    svr_model = SVR(kernel='rbf')
    svr_model.fit(profits, sales)

    profit_range = np.linspace(profits.min(), profits.max(), 100).reshape(-1, 1)
    predicted_sales = svr_model.predict(profit_range)
    revenue = profit_range.flatten() * predicted_sales
    max_revenue_index = np.argmax(revenue)
    
    return jsonify({
        'max_profit': profit_range[max_revenue_index][0],
        'max_revenue': revenue[max_revenue_index]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

