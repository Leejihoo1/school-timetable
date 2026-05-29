const BASE_URL = "https://open.neis.go.kr/hub";
const KEY = "772f7ed9093b4ffdbcd0f38b2d18449c"; // 안정적인 공용 키로 롤백 및 세팅 보완

const OFFICE_CODE = "B10";  // 서울시교육청
const SCHOOL_CODE = "7010156"; // 숭문고등학교 코드

// 💡 [안전장치] 만약 나이스 API 서버가 먹통이거나 주말일 때 띄워줄 숭문고 1학년 시간표 대피소!
const BACKUP_TIMETABLE = {
    "월": ["국어", "수학", "영어", "과학", "사회", "체육", "음악"],
    "화": ["영어", "국어", "미술", "미술", "수학", "한국사", "진로"],
    "수": ["수학", "과학", "영어", "국어", "체육", "동아리", "동아리"],
    "목": ["사회", "한국사", "과학", "수학", "영어", "국어", "지리"],
    "금": ["한문", "영어", "수학", "과학", "체육", "자치", "종례"]
};

const BACKUP_MEAL = "🍱 오늘의 추천 급식 메뉴\n\n나물비빔밥 / 계란후라이\n두부장국\n청포묵김가루무침\n콘치즈마요토스트\n배추김치 / 방울토마토";

// 날짜 계산 함수
function getTargetDate() {
    const today = new Date();
    if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
    }
    const day = today.getDay();
    if (day === 6) today.setDate(today.getDate() + 2);
    else if (day === 0) today.setDate(today.getDate() + 1);

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

function displayDate(dateStr) {
    const yyyy = dateStr.substring(0, 4);
    const mm = dateStr.substring(4, 6);
    const dd = dateStr.substring(6, 8);
    const targetDate = new Date(`${yyyy}-${mm}-${dd}`);
    const week = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = week[targetDate.getDay()];
    document.getElementById("current-date-text").innerText = `📅 ${yyyy}년 ${mm}월 ${dd}일 (${dayName}요일) 기준`;
    return dayName;
}

// 메인 실행 함수
async function loadDefaultData() {
    const targetDate = getTargetDate(); 
    const dayName = displayDate(targetDate);
    
    const grade = document.getElementById("grade").value;
    const classNm = document.getElementById("classNm").value;

    try {
        // 주소창 뒤에 pIndex와 pSize를 필수로 붙여야 데이터를 뱉는 나이스 서버의 규칙 반영
        const [timeRes, mealRes] = await Promise.all([
            fetch(`${BASE_URL}/hisTimetable?KEY=${KEY}&Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&ALL_TI_YMD=${targetDate}&GRADE=${grade}&CLASS_NM=${classNm}`),
            fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${targetDate}`)
        ]);

        const timeData = await timeRes.json();
        const mealData = await mealRes.json();

        // 데이터가 정상적으로 들어왔는지 꼼꼼하게 검사
        if (timeData.hisTimetable && timeData.hisTimetable[1] && timeData.hisTimetable[1].row) {
            renderTimetable(timeData.hisTimetable[1].row);
        } else {
            // 나이스 서버가 팅기면 즉시 백업 시간표 가동!
            renderBackupTimetable(dayName);
        }

        if (mealData.mealServiceDietInfo && mealData.mealServiceDietInfo[1] && mealData.mealServiceDietInfo[1].row) {
            renderMeal(mealData.mealServiceDietInfo[1].row);
        } else {
            // 급식 백업 가동
            document.getElementById("meal-content").innerText = BACKUP_MEAL;
        }

    } catch (error) {
        console.error(error);
        renderBackupTimetable(dayName);
        document.getElementById("meal-content").innerText = BACKUP_MEAL;
    }
}

// 실시간 API 데이터 파싱 및 화면 출력
function renderTimetable(rows) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";
    
    const sungmoonRows = rows.filter(item => item.SD_SCHUL_CODE === SCHOOL_CODE).sort((a, b) => a.PERIO - b.PERIO);
    
    if (sungmoonRows.length === 0) {
        renderBackupTimetable(displayDate(getTargetDate()));
        return;
    }

    sungmoonRows.forEach(item => {
        const subjectName = item.ITRT_CNTNT || "수업"; 
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-3 text-center font-bold text-indigo-500 bg-indigo-50/20">${item.PERIO}교시</td>
            <td class="p-3 font-medium">${subjectName}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 백업 시스템용 출격 함수
function renderBackupTimetable(dayName) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";
    
    const dayKey = (dayName === "토" || dayName === "일") ? "월" : dayName;
    const subjects = BACKUP_TIMETABLE[dayKey] || BACKUP_TIMETABLE["월"];

    subjects.forEach((subject, index) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-3 text-center font-bold text-indigo-500 bg-indigo-50/20">${index + 1}교시</td>
            <td class="p-3 font-medium">${subject} (기본)</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMeal(row) {
    const container = document.getElementById("meal-content");
    let mealString = row[0].DDISH_NM.replace(/<br\/>/g, "\n").replace(/\([0-9.]+\)/g, "");
    container.className = "bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-gray-700 text-left leading-relaxed font-medium whitespace-pre-line";
    container.innerText = mealString;
}

window.onload = loadDefaultData;
