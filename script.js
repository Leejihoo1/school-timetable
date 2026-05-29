// script.js (업그레이드 버전)
const BASE_URL = "https://open.neis.go.kr/hub";
const KEY = "772f7ed9093b4ffdbcd0f38b2d18449c"; 

function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

async function fetchSchoolData() {
    const schulCrseScCode = document.getElementById("schulCrseScCode").value;
    const schulNm = document.getElementById("schulNm").value.trim();
    const grade = document.getElementById("grade").value;
    const classNm = document.getElementById("classNm").value;
    const today = getTodayDate();

    if (schulNm.length < 2) {
        alert("학교 이름을 두 글자 이상 정확히 입력해 주세요!");
        return;
    }

    try {
        // [수정] 학교급 코드(SCHUL_KND_SC_CODE)를 함께 보내서 더 정확하게 찾도록 개선
        const schoolRes = await fetch(`${BASE_URL}/schoolInfo?KEY=${KEY}&Type=json&SCHUL_NM=${encodeURIComponent(schulNm)}`);
        const schoolData = await schoolRes.json();

        if (!schoolData.schoolInfo) {
            alert(`'${schulNm}' 학교를 찾을 수 없습니다.\n\n확인사항:\n1. 학교 전체 이름 입력 (예: 서울고등학교)\n2. 특수학교나 기타 학교 여부`);
            return;
        }

        // 검색 결과 중 사용자가 선택한 학교급과 일치하는 학교 찾기
        const info = schoolData.schoolInfo[1].row.find(item => item.SCHUL_KND_SC_CODE === (schulCrseScCode === "2" ? "02" : schulCrseScCode === "3" ? "03" : "04")) 
                     || schoolData.schoolInfo[1].row[0]; // 못 찾으면 첫 번째 결과 사용

        const officeCode = info.ATPT_OFCDC_SC_CODE;
        const schoolCode = info.SD_SCHUL_CODE;

        // 시간표 타입 결정
        let timetableType = "elsTimetable";
        if (schulCrseScCode === "3") timetableType = "misTimetable";
        if (schulCrseScCode === "4") timetableType = "hisTimetable";

        // 데이터 가져오기 (시간표 & 급식)
        const [timeRes, mealRes] = await Promise.all([
            fetch(`${BASE_URL}/${timetableType}?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${today}&GRADE=${grade}&CLASS_NM=${classNm}`),
            fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${today}`)
        ]);

        const timeData = await timeRes.json();
        const mealData = await mealRes.json();

        renderTimetable(timeData[timetableType]);
        renderMeal(mealData.mealServiceDietInfo);

    } catch (error) {
        console.error(error);
        alert("데이터를 가져오는 중 서버 오류가 발생했습니다.");
    }
}

// (renderTimetable, renderMeal 함수는 이전과 동일)
function renderTimetable(data) {
    const tbody = document.getElementById("timetable-body");
    tbody.innerHTML = "";
    if (!data || !data[1]) {
        tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400">오늘은 수업이 없거나 시간표 정보가 등록되지 않았습니다.</td></tr>`;
        return;
    }
    const rows = data[1].row.sort((a, b) => a.PERIO - b.PERIO);
    rows.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `<td class="p-3 text-center font-bold text-indigo-500 bg-indigo-50/20">${item.PERIO}교시</td><td class="p-3 font-medium">${item.ITM_NM}</td>`;
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
