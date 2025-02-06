import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px", overflow: "auto" }}>
          <h1>비즈니스 오케스트레이션 시스템</h1>
          <div>
            <h2>시스템 개요</h2>
            <p>비즈니스 프로세스를 자동화하고 관리하는 통합 시스템입니다.</p>
            <p>왼쪽 메뉴에서 원하는 기능을 선택하여 시작하세요.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
