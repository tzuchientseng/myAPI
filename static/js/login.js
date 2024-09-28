document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('auth-form');
    const savePersonnelButton = document.getElementById('save-personnel-button');
    const saveWorkButton = document.getElementById('save-work-button');

    authForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // 發送登入請求
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
                savePersonnelButton.style.display = 'block';
                saveWorkButton.style.display = 'block';

                // 自動獲取兩份資料
                fetch('/get-data', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                })
                .then(response => response.json())
                .then(data => {
                    // 儲存並顯示數據
                    localStorage.setItem('calendarData', JSON.stringify(data.calendarData));
                    localStorage.setItem('personnelData', JSON.stringify(data.personnelData));
                    
                    // 更新頁面顯示
                    displayCalendarData(data.calendarData);
                    displayPersonnelData(data.personnelData);
                })
                .catch(error => {
                    console.error('錯誤:', error);
                    alert('獲取數據過程中發生錯誤');
                });
            } else {
                alert('登入失敗，請檢查帳號和密碼');
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
            alert('登入過程中發生錯誤');
        });
    });

    function displayCalendarData(calendarData) {
        // 根據接收到的 calendarData 更新日曆顯示
        generateCalendar(); // 或者根據具體需求編寫自定義更新邏輯
    }

    function displayPersonnelData(personnelData) {
        // 根據接收到的 personnelData 更新人員列表顯示
        displayPersonnelList(); // 或者根據具體需求編寫自定義更新邏輯
    }
});

