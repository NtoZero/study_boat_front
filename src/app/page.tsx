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

  const handleSave = () => {
    localStorage.setItem("canvasNodes", JSON.stringify(nodes));
    alert("저장되었습니다.");
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
