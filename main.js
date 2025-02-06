// 캔버스 초기화
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

// 캔버스 크기 설정
function resizeCanvas() {
  canvas.width = 800;
  canvas.height = 600;
}

// 페이지 로드 시 캔버스 크기 설정
window.addEventListener("load", resizeCanvas);
