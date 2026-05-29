const BASE_URL = "https://open.neis.go.kr/hub";
// ⚠️ 중요: 발급받은 네 진짜 인증키를 여기에 넣어줘! 급식 가져올 때 씁니다.
const KEY = "802ac05b14724937ac1b903562a21903"; 

const OFFICE_CODE = "B10";  // 서울시교육청
const SCHOOL_CODE = "7010156"; // 숭문고 코드

// 🎯여기에 숭문고 1학년 진짜 요일별 시간표를 적어두면 끝!
// 금요일은 네가 알려준 진짜 시간표로 완전히 고정했어! 나머지 요일도 알면 바꿔줘!
const REAL_TIMETABLE = {
    "월": ["공통국어1", "공통수학1", "공통영어1", "통합과학1", "통합사회1", "체육1", "음악"],
    "화": ["공통영어1", "공통국어1", "미술", "미술", "공통수학1", "한국사1", "진로"],
    "수": ["공통수학1", "통합과학1", "공통영어1", "공통국어1", "체육1", "과학탐구실험1", "정보"],
    "목": ["통합사회1", "한국사1", "통합과학1", "공통수학1", "공통영어1", "공통국어1", "기술가정"],
    "금": ["정보", "공통수학1", "한국사1", "공통영어1", "공통국어1", "동아리활동", "동아리활동"]
};

// 주말이거나 밤늦게 접속했을 때 언제나 '가장 가까운 평일' 날짜와 요일을 계산하는 함수
function getTodayInfo() {
    const today = new Date();
    let day = today.getDay(); // 0:일, 1:월, ..., 5:금, 6:토

    // 금요일 밤 8시 이후이거나 토요일, 일요일이면 무조건 '월요일' 급식과 시간표를 타겟팅
    if ((day === 5 && today.getHours() >= 20) || day === 6 || day === 0) {
        if (day === 5) today.setDate(today.getDate() + 3);
        else if (day === 6) today.setDate(today.getDate() + 2);
        else if (day === 0) today.setDate(today.getDate() + 1);
        day = 1; // 월요일로 고정
    } 
    // 평일(월~목) 밤 8시 이후라면 '내일' 시간표와 급식을 미리 보여줌
    else if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
        day = today.getDay();
    }

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const week = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = week[day];

    return { ymd: `${yyyy}${mm}${dd}`, yyyy, mm, dd, dayName };
}

// 화면 상단 날짜 표시
function displayDate(info) {
    document.getElementById("current-date-text").innerText = `📅 ${info.yyyy}년 ${info.mm}월 ${info.dd}일 (${info.dayName}요일) 기준`;
}

// 웹사이트가 켜지면 실행되는 함수
async function loadDefaultData() {
    const info = getTodayInfo(); // 계산된 날짜 정보
    displayDate(info);
    
    // 1. 우리가 직접 입력한 진짜 숭문고 시간표 출력
    renderRealTimetable(info.dayName);

    // 2. 급식은 나이스에서 실시간으로 안전하게 긁어오기
    try {
        const mealRes = await fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${info.ymd}`);
        const mealData = await mealRes.json();
        renderMeal(mealData.mealServiceDietInfo);
    } catch (error) {
        console.error(error);
        document.getElementById("meal-content").innerHTML = `<p class="text-gray-400">급식 정보를 가져오지 못했습니다.</p>`;
    }
}

// 요일에 맞춰 진짜 시간표를 그려주는 함수
function renderRealTimetable(dayName) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";

    const subjects = REAL_TIMETABLE[dayName] || REAL_TIMETABLE["월"];

    subjects.forEach((subject, index) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-3 text-center font-bold text-indigo-500 bg-indigo-50/20">${index + 1}교시</td>
            <td class="p-3 font-medium">${subject}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMeal(data) {
    const container = document.getElementById("meal-content");
    if (!data || !data[1] || !data[1].row) {
        container.innerHTML = `<p class="text-gray-400">해당 날짜에는 급식 정보가 없습니다.</p>`;
        return;
    }
    let mealString = data[1].row[0].DDISH_NM.replace(/<br\/>/g, "\n").replace(/\([0-9.]+\)/g, "");
    container.className = "bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-gray-700 text-left leading-relaxed font-medium whitespace-pre-line";
    container.innerText = mealString;
}

window.onload = loadDefaultData;
