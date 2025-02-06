"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./page.module.css";
import { useState, useEffect } from "react";

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
}

interface CanvasData {
  nodes: Node[];
  version: string;
  lastSaved: string;
}

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>(() => {
    // localStorage에서 노드 데이터를 불러옴
    const saved = localStorage.getItem("canvasNodes");
    return saved ? JSON.parse(saved) : [];
  });

  // 노드가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("canvasNodes", JSON.stringify(nodes));
  }, [nodes]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("nodeType");

    // 드롭된 위치 계산
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 새 노드 추가
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x, y },
    };

    setNodes([...nodes, newNode]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setNodes([]);
    localStorage.removeItem("canvasNodes");
  };

  const handleSave = async () => {
    try {
      // 저장할 데이터 구성
      const canvasData: CanvasData = {
        nodes: nodes,
        version: "1.0",
        lastSaved: new Date().toISOString(),
      };

      // JSON 파일 생성
      const jsonString = JSON.stringify(canvasData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      try {
        // 파일 저장 다이얼로그 표시
        const handle = await window.showSaveFilePicker({
          suggestedName: `canvas-data-${
            new Date().toISOString().split("T")[0]
          }.json`,
          types: [
            {
              description: "JSON File",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });

        // 파일 쓰기
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        // localStorage에도 저장
        localStorage.setItem("canvasNodes", JSON.stringify(nodes));
        alert("캔버스 데이터가 저장되었습니다.");
      } catch (err) {
        // 사용자가 취소한 경우 조용히 처리
        if (err.name !== "AbortError") {
          throw err;
        }
      }
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleFileUpload = async () => {
    try {
      // 파일 선택 다이얼로그 표시
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON Files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const content = await file.text();

      try {
        const data: CanvasData = JSON.parse(content);
        setNodes(data.nodes);
        localStorage.setItem("canvasNodes", JSON.stringify(data.nodes));
        alert("캔버스 데이터를 불러왔습니다.");
      } catch (error) {
        alert("잘못된 파일 형식입니다.");
      }
    } catch (err) {
      // 사용자가 취소한 경우 조용히 처리
      if (err.name !== "AbortError") {
        console.error("파일 불러오기 중 오류 발생:", err);
        alert("파일을 불러오는 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <Sidebar />
        <div className={styles.canvasContainer}>
          <div className={styles.canvasHeader}>
            <button onClick={handleReset} className={styles.button}>
              초기화
            </button>
            <button onClick={handleSave} className={styles.button}>
              저장
            </button>
            <button onClick={handleFileUpload} className={styles.button}>
              불러오기
            </button>
          </div>
          <div
            className={styles.canvas}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                className={styles.node}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                {node.type}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
