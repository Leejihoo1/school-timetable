const BASE_URL = "https://open.neis.go.kr/hub";
const KEY = "772f7ed9093b4ffdbcd0f38b2d18449c"; 

// 숭문고등학교 고정 정보
const OFFICE_CODE = "B10";  // 서울시교육청
const SCHOOL_CODE = "7010156"; // 숭문고 코드

// 테스트용 날짜 고정 (2026년 5월 27일 수요일)
// 실제 학교 다닐 때 평일에 쓰려면 이 부분을 아래 주석 처리된 진짜 날짜 코드로 바꾸면 돼!
function getTodayDate() {
    return "20260527"; 
}

/* 실제 실시간 날짜로 쓰려면 위 함수를 지우고 이 주석을 푸세요!
function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}
*/

// 상단 헤더에 날짜 표시해주기
function displayDate() {
    const dateStr = getTodayDate();
    const yyyy = dateStr.substring(0, 4);
    const mm = dateStr.substring(4, 6);
    const dd = dateStr.substring(6, 8);
    document.getElementById("current-date-text").innerText = `📅 ${yyyy}년 ${mm}월 ${dd}일 기준`;
}

// 접속하자마자 자동으로 데이터 가져오는 함수
async function loadDefaultData() {
    displayDate();
    const grade = document.getElementById("grade").value;
    const classNm = document.getElementById("classNm").value;
    const today = getTodayDate();

    try {
        // 고등학교 시간표(hisTimetable)와 급식 정보 동시에 요청
        const [timeRes, mealRes] = await Promise.all([
            fetch(`${BASE_URL}/hisTimetable?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&ALL_TI_YMD=${today}&GRADE=${grade}&CLASS_NM=${classNm}`),
            fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${today}`)
        ]);

        const timeData = await timeRes.json();
        const mealData = await mealRes.json();

        renderTimetable(timeData.hisTimetable);
        renderMeal(mealData.mealServiceDietInfo);

    } catch (error) {
        console.error(error);
        alert("데이터를 가져오는 중 오류가 발생했습니다.");
    }
}

function renderTimetable(data) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";

    if (!data || !data[1]) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400">오늘은 수업이 없거나 시간표 정보가 없습니다.</td></tr>`;
        return;
    }

    const rows = data[1].row.sort((a, b) => a.PERIO - b.PERIO);
    rows.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-3 text-center font-bold text-indigo-500 bg-indigo-50/20">${item.PERIO}교시</td>
            <td class="p-3 font-medium">${item.ITM_NM}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMeal(data) {
    const container = document.getElementById("meal-content");
    if (!data || !data[1]) {
        container.innerHTML = `<p class="text-gray-400">오늘은 급식 정보가 없습니다.</p>`;
        return;
    }
    let mealString = data[1].row[0].DDISH_NM.replace(/<br\/>/g, "\n").replace(/\([0-9.]+\)/g, "");
    container.className = "bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-gray-700 text-left leading-relaxed font-medium whitespace-pre-line";
    container.innerText = mealString;
}

// 웹사이트가 켜지면 자동으로 이 함수를 실행해라!
window.onload = loadDefaultData;
