const BASE_URL = "https://open.neis.go.kr/hub";

// ⚠️ 중요: 여기에 네 진짜 인증키를 복사해서 붙여넣어줘!
const KEY = "여기에_발급받은_인증키를_넣으세요"; 

const OFFICE_CODE = "B10";  // 서울시교육청
const SCHOOL_CODE = "7010156"; // 숭문고등학교 코드

// 주말이거나 밤 8시 이후면 자동으로 '다음 수업일' 날짜를 타겟팅하는 함수
function getTargetDate() {
    const today = new Date();
    
    if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
    }
    
    const day = today.getDay();
    if (day === 6) { // 토요일 -> 월요일로
        today.setDate(today.getDate() + 2);
    } else if (day === 0) { // 일요일 -> 월요일로
        today.setDate(today.getDate() + 1);
    }

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

// 상단 헤더에 날짜와 요일 표시
function displayDate(dateStr) {
    const yyyy = dateStr.substring(0, 4);
    const mm = dateStr.substring(4, 6);
    const dd = dateStr.substring(6, 8);
    
    const targetDate = new Date(`${yyyy}-${mm}-${dd}`);
    const week = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = week[targetDate.getDay()];
    
    document.getElementById("current-date-text").innerText = `📅 ${yyyy}년 ${mm}월 ${dd}일 (${dayName}요일) 기준`;
}

// 접속하자마자 자동으로 데이터 가져오는 함수
async function loadDefaultData() {
    const targetDate = getTargetDate(); 
    displayDate(targetDate);
    
    const grade = document.getElementById("grade").value;
    const classNm = document.getElementById("classNm").value;

    try {
        // 나이스 서버에 실시간 시간표와 급식 요청하기
        const [timeRes, mealRes] = await Promise.all([
            fetch(`${BASE_URL}/hisTimetable?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&ALL_TI_YMD=${targetDate}&GRADE=${grade}&CLASS_NM=${classNm}`),
            fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${targetDate}`)
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

// 💡 [완벽 해결] 숭문고의 진짜 과목명(ITRT_CNTNT)을 쏙쏙 골라 띄워주는 함수
function renderTimetable(data) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";

    if (!data || !data[1] || !data[1].row) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400">오늘은 수업이 없거나 시간표 정보가 등록되지 않았습니다. (주말/휴일)</td></tr>`;
        return;
    }

    // 다른 학교 데이터가 섞여 들어오는 것을 막고, 오직 '숭문고등학교' 데이터만 필터링
    const sungmoonRows = data[1].row.filter(item => item.SD_SCHUL_CODE === SCHOOL_CODE);

    if (sungmoonRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400">숭문고등학교의 시간표 데이터를 찾을 수 없습니다.</td></tr>`;
        return;
    }

    // 교시 순서대로 정렬
    const rows = sungmoonRows.sort((a, b) => a.PERIO - b.PERIO);
    
    rows.forEach(item => {
        // 🎯 캡처화면에서 찾아낸 진짜 과목명 필드 'ITRT_CNTNT' 적용!
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

function renderMeal(data) {
    const container = document.getElementById("meal-content");
    if (!data || !data[1] || !data[1].row) {
        container.innerHTML = `<p class="text-gray-400">오늘은 급식 정보가 없습니다.</p>`;
        return;
    }
    let mealString = data[1].row[0].DDISH_NM.replace(/<br\/>/g, "\n").replace(/\([0-9.]+\)/g, "");
    container.className = "bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-gray-700 text-left leading-relaxed font-medium whitespace-pre-line";
    container.innerText = mealString;
}

window.onload = loadDefaultData;
