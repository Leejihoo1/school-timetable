// 나이스 오픈 API 기본 주소 (인증키 없이 사용 가능한 공공 데이터 주소)
const BASE_URL = "https://open.neis.go.kr/hub";
const KEY = "772f7ed9093b4ffdbcd0f38b2d18449c"; // 교육청 공공 API 오픈 키 (테스트용)

// 오늘 날짜 YYYYMMDD 형태로 만들기 (예: 20260529)
function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

async function fetchSchoolData() {
    const schulCrseScCode = document.getElementById("schulCrseScCode").value; // 학교급 (초/중/고)
    const schulNm = document.getElementById("schulNm").value.trim();
    const grade = document.getElementById("grade").value;
    const classNm = document.getElementById("classNm").value;
    const today = getTodayDate();

    if (!schulNm) {
        alert("학교 이름을 입력해 주세요!");
        return;
    }

    try {
        // 1. 학교 코드를 찾기 위한 기본 정보 조회
        const schoolRes = await fetch(`${BASE_URL}/schoolInfo?KEY=${KEY}&Type=json&SCHUL_NM=${encodeURIComponent(schulNm)}`);
        const schoolData = await schoolRes.json();

        if (!schoolData.schoolInfo) {
            alert("학교를 찾을 수 없습니다. 정확한 이름을 입력해 주세요.");
            return;
        }

        const officeCode = schoolData.schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE; // 시도교육청코드
        const schoolCode = schoolData.schoolInfo[1].row[0].SD_SCHUL_CODE;   // 표준학교코드

        // 2. 시간표 가져오기
        let timetableType = "elsTimetable"; // 초등 기본
        if (schulCrseScCode === "3") timetableType = "misTimetable"; // 중등
        if (schulCrseScCode === "4") timetableType = "hisTimetable"; // 고등

        const timeRes = await fetch(`${BASE_URL}/${timetableType}?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${today}&GRADE=${grade}&CLASS_NM=${classNm}`);
        const timeData = await timeRes.json();

        // 3. 급식 정보 가져오기
        const mealRes = await fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${today}`);
        const mealData = await mealRes.json();

        // 화면에 데이터 뿌리기
        renderTimetable(timeData[timetableType]);
        renderMeal(mealData.mealServiceDietInfo);

    } catch (error) {
        console.error(error);
        alert("데이터를 가져오는 중 오류가 발생했습니다.");
    }
}

// 시간표 화면 그려주는 함수
function renderTimetable(data) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = ""; // 기존 내용 지우기

    if (!data || !data[1] || !data[1].row) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400">오늘 혹은 해당 학년/반의 시간표 데이터가 없습니다. (주말/휴일 등)</td></tr>`;
        return;
    }

    // 교시 순서대로 정렬해서 넣기
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

// 급식 화면 그려주는 함수
function renderMeal(data) {
    const container = document.getElementById("meal-content");
    container.innerHTML = "";

    if (!data || !data[1] || !data[1].row) {
        container.innerHTML = `<p class="text-gray-400">오늘은 급식 정보가 없습니다.</p>`;
        return;
    }

    // 나이스 급식 데이터의 <br/> 태그와 알레르기 유도 문자(숫자) 정제하기
    let mealString = data[1].row[0].DDISH_NM;
    mealString = mealString.replace(/<br\/>/g, "\n"); // 줄바꿈 변경
    mealString = mealString.replace(/\([0-9.]+\)/g, ""); // (1.2.5.) 같은 알레르기 숫자 제거

    container.className = "bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-gray-700 text-left leading-relaxed font-medium whitespace-pre-line";
    container.innerText = mealString;
}
