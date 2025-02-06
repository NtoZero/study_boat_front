"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./page.module.css";
import { useState, useEffect, useCallback, useRef } from "react";
import NodeConfigModal from "@/components/NodeConfigModal";
import { toast } from "react-hot-toast";

interface NodeConfig {
  databaseType?: string;
  host?: string;
  port?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  poolSize?: string;
  useSSL?: boolean;
  options?: Array<{ key: string; value: string }>;
  environment?: string;
  triggerType?: string;
  method?: string;
  url?: string;
  inputSchema?: string;
  status?: string;
}

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  width?: number;
  config?: NodeConfig;
}

interface CanvasData {
  version: string;
  lastSaved: string;
  nodes: Node[];
  metadata?: {
    name?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface DragState {
  isDragging: boolean;
  currentNodeId: string | null;
  startPosition: { x: number; y: number } | null;
  offset: { x: number; y: number } | null;
}

interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
  headerBg: string;
}

interface ResizeState {
  isResizing: boolean;
  nodeId: string | null;
  startWidth: number | null;
  startX: number | null;
}

// 연결점 타입 정의
type ConnectionPointType = "top" | "right" | "bottom" | "left";

// 연결점 인터페이스
interface ConnectionPoint {
  id: string;
  nodeId: string;
  type: ConnectionPointType;
}

// 연결선 인터페이스
interface Connection {
  id: string;
  sourcePoint: ConnectionPoint;
  targetPoint: ConnectionPoint;
}

// 히스토리 관리를 위한 인터페이스 추가
interface HistoryState {
  past: {
    nodes: Node[];
    connections: Connection[];
  }[];
  present: {
    nodes: Node[];
    connections: Connection[];
  };
  future: {
    nodes: Node[];
    connections: Connection[];
  }[];
}

// modalState 인터페이스 추가
interface ModalState {
  isOpen: boolean;
  nodeId: string;
  nodeType: string;
  config: NodeConfig | null;
}

interface ConnectionPointPosition {
  x: number;
  y: number;
  type: ConnectionPointType;
}

interface NodeConnectionPoints {
  top: ConnectionPointPosition;
  right: ConnectionPointPosition;
  bottom: ConnectionPointPosition;
  left: ConnectionPointPosition;
}

const nodeStyles: Record<string, NodeStyle> = {
  "DB config": {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-db-border)",
    color: "var(--node-db-text)",
    headerBg: "var(--node-db-header)",
  },
  environment: {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-env-border)",
    color: "var(--node-env-text)",
    headerBg: "var(--node-env-header)",
  },
  Trigger: {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-trigger-border)",
    color: "var(--node-trigger-text)",
    headerBg: "var(--node-trigger-header)",
  },
  "Call Api": {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-api-border)",
    color: "var(--node-api-text)",
    headerBg: "var(--node-api-header)",
  },
  "Json parser": {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-json-border)",
    color: "var(--node-json-text)",
    headerBg: "var(--node-json-header)",
  },
  Done: {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--node-done-border)",
    color: "var(--node-done-text)",
    headerBg: "var(--node-done-header)",
  },
};

const clampPosition = (
  x: number,
  y: number,
  nodeWidth: number,
  nodeHeight: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  return {
    x: Math.max(0, Math.min(x, canvasWidth - nodeWidth)),
    y: Math.max(0, Math.min(y, canvasHeight - nodeHeight)),
  };
};

// 노드 설정 정보를 문자열로 변환하는 함수
const getNodePreview = (node: Node): string => {
  if (!node.config) return "";

  switch (node.type) {
    case "DB config": {
      const { databaseType, host, port, databaseName, options } = node.config;
      const baseUrl = `${databaseType}://${host}:${port}/${databaseName}`;
      const optionsString = options?.length
        ? "?" + options.map((opt) => `${opt.key}=${opt.value}`).join("&")
        : "";
      return `url : ${baseUrl}${optionsString}`;
    }
    case "environment":
      return `env : ${node.config.environment}`;
    case "Trigger":
      return `type : ${node.config.triggerType}`;
    case "Call Api":
      return `${node.config?.method || "GET"} ${node.config?.url || ""}`;
    case "Json parser":
      return `schema : ${node.config?.inputSchema ? "defined" : "undefined"}`;
    case "Done":
      return `status : ${node.config?.status || "pending"}`;
    default:
      return "";
  }
};

export default function Home() {
  // localStorage 접근을 위한 상태 관리 수정
  const [initialState, setInitialState] = useState({
    isInitialized: false,
    nodes: [] as Node[],
    expandedItems: new Set<string>(),
    isExpanded: true,
  });

  // 컴포넌트 마운트 시 localStorage 데이터 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNodes = localStorage.getItem("canvasNodes");
      const savedExpandedItems = localStorage.getItem("expandedMenuItems");
      const savedSidebarState = localStorage.getItem("sidebarExpanded");

      setInitialState({
        isInitialized: true,
        nodes: savedNodes ? JSON.parse(savedNodes) : [],
        expandedItems: savedExpandedItems
          ? new Set(JSON.parse(savedExpandedItems))
          : new Set(),
        isExpanded: savedSidebarState ? JSON.parse(savedSidebarState) : true,
      });
    }
  }, []);

  // 실제 상태들은 initialState에서 가져옴
  const [nodes, setNodes] = useState<Node[]>(initialState.nodes);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    initialState.expandedItems
  );
  const [isExpanded, setIsExpanded] = useState(initialState.isExpanded);

  // 초기화가 완료되지 않았다면 로딩 상태 표시
  if (!initialState.isInitialized) {
    return <div>Loading...</div>;
  }

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    currentNodeId: null,
    startPosition: null,
    offset: null,
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    nodeId: null,
    startWidth: null,
    startX: null,
  });

  // modalState 타입 지정
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    nodeId: "",
    nodeType: "",
    config: null,
  });

  const [canvasRef, setCanvasRef] = useState<HTMLDivElement | null>(null);
  const nodeSizesRef = useRef<
    Record<string, { width: number; height: number }>
  >({});

  // 히스토리 상태 추가
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: {
      nodes: [],
      connections: [],
    },
    future: [],
  });

  // 현재 상태를 히스토리에 저장하는 함수
  const saveToHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: {
        nodes,
        connections: [],
      },
      future: [],
    }));
  }, [nodes]);

  // Undo 함수
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];

      setNodes(newPresent.nodes);

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  // 노드나 연결이 변경될 때마다 히스토리 저장
  useEffect(() => {
    if (history.present.nodes !== nodes) {
      saveToHistory();
    }
  }, [nodes, history.present, saveToHistory]);

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
    // 기존 노드의 비밀번호 데이터 삭제
    nodes.forEach((node) => {
      if (node.type === "DB config") {
        localStorage.removeItem(`pwd_${node.id}`);
      }
    });

    setNodes([]);
    localStorage.removeItem("canvasNodes");
  };

  const handleSave = async () => {
    try {
      const canvasData: CanvasData = {
        version: "1.0",
        lastSaved: new Date().toISOString(),
        nodes: nodes.map((node) => {
          // DB config 노드의 경우 비밀번호를 localStorage에 따로 저장
          if (node.type === "DB config" && node.config?.password) {
            localStorage.setItem(`pwd_${node.id}`, node.config.password);
          }
          return {
            ...node,
            config: node.config
              ? {
                  ...node.config,
                  password: node.config.password ? "******" : undefined,
                }
              : undefined,
          };
        }),
        metadata: {
          name: "Canvas Configuration",
          description: "Task Node Configuration",
          createdAt:
            localStorage.getItem("canvasCreatedAt") || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // JSON 파일 생성
      const jsonString = JSON.stringify(canvasData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      try {
        // 파일 저장 다이얼로그 표시
        const handle = await window.showSaveFilePicker({
          suggestedName: `canvas-config-${
            new Date().toISOString().split("T")[0]
          }.json`,
          types: [
            {
              description: "JSON Configuration File",
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
        localStorage.setItem(
          "canvasCreatedAt",
          canvasData.metadata?.createdAt || new Date().toISOString()
        );

        toast.success("Configuration saved successfully!", {
          duration: 3000,
          style: {
            background: "var(--success-bg)",
            color: "var(--success-text)",
            border: "1px solid var(--success-border)",
          },
        });
      } catch (err: unknown) {
        // 사용자가 취소한 경우 조용히 처리
        if (err instanceof Error && err.name !== "AbortError") {
          throw err;
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save configuration", {
        duration: 4000,
        style: {
          background: "var(--error-bg)",
          color: "var(--error-text)",
          border: "1px solid var(--error-border)",
        },
      });
    }
  };

  const handleFileUpload = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON Configuration Files",
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

        // 버전 및 필수 데이터 체크
        if (!data.version || !data.nodes) {
          throw new Error("Invalid configuration file format");
        }

        // 노드 데이터 복원 시 비밀번호 복원
        const restoredNodes = data.nodes.map((node) => {
          if (node.type === "DB config" && node.config) {
            // localStorage에서 비밀번호 복원
            const savedPassword = localStorage.getItem(`pwd_${node.id}`);
            if (savedPassword) {
              return {
                ...node,
                config: {
                  ...node.config,
                  password: savedPassword,
                },
              };
            }
            // 기존 노드에서 비밀번호 찾기 (fallback)
            const existingNode = nodes.find((n) => n.id === node.id);
            if (existingNode?.config?.password) {
              return {
                ...node,
                config: {
                  ...node.config,
                  password: existingNode.config.password,
                },
              };
            }
          }
          return node;
        });

        setNodes(restoredNodes);
        localStorage.setItem("canvasNodes", JSON.stringify(restoredNodes));
        localStorage.setItem(
          "canvasCreatedAt",
          data.metadata?.createdAt || new Date().toISOString()
        );

        toast.success("Configuration loaded successfully!", {
          duration: 3000,
          style: {
            background: "var(--success-bg)",
            color: "var(--success-text)",
            border: "1px solid var(--success-border)",
          },
        });
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Invalid configuration file format"
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("File upload error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to load configuration",
          {
            duration: 4000,
            style: {
              background: "var(--error-bg)",
              color: "var(--error-text)",
              border: "1px solid var(--error-border)",
            },
          }
        );
      }
    }
  };

  // 노드 드래그 시작
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // 노드 엘리먼트에 대한 상대적인 마우스 위치 계산
    const nodeElement = e.currentTarget as HTMLElement;
    const nodeRect = nodeElement.getBoundingClientRect();

    setDragState({
      isDragging: true,
      currentNodeId: nodeId,
      startPosition: { x: e.clientX, y: e.clientY },
      offset: {
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y,
      },
    });
  };

  // 노드 드래그 중
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (
      !dragState.isDragging ||
      !dragState.currentNodeId ||
      !dragState.offset ||
      !canvasRef
    )
      return;

    const canvasRect = canvasRef.getBoundingClientRect();
    const node = nodes.find((n) => n.id === dragState.currentNodeId);
    if (!node) return;

    const nodeSize = nodeSizesRef.current[node.id] || {
      width: 120,
      height: 42,
    };

    // 새로운 위치 계산
    const newX = e.clientX - dragState.offset.x;
    const newY = e.clientY - dragState.offset.y;

    // 위치 제한
    const clampedPosition = clampPosition(
      newX,
      newY,
      nodeSize.width,
      nodeSize.height,
      canvasRect.width,
      canvasRect.height
    );

    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === dragState.currentNodeId
          ? { ...n, position: clampedPosition }
          : n
      )
    );
  };

  // 노드 드래그 종료
  const handleNodeDragEnd = () => {
    setDragState({
      isDragging: false,
      currentNodeId: null,
      startPosition: null,
      offset: null,
    });
  };

  // 리사이즈 시작
  const handleResizeStart = (
    e: React.MouseEvent,
    nodeId: string,
    currentWidth: number
  ) => {
    e.stopPropagation();
    setResizeState({
      isResizing: true,
      nodeId: nodeId,
      startWidth: currentWidth,
      startX: e.clientX,
    });
  };

  // 리사이즈 중
  const handleResize = (e: React.MouseEvent) => {
    if (
      !resizeState.isResizing ||
      !resizeState.startWidth ||
      !resizeState.startX
    )
      return;

    const deltaX = e.clientX - resizeState.startX;
    const newWidth = Math.max(120, resizeState.startWidth + deltaX); // 최소 너비 120px

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === resizeState.nodeId ? { ...node, width: newWidth } : node
      )
    );
  };

  // 리사이즈 종료
  const handleResizeEnd = () => {
    setResizeState({
      isResizing: false,
      nodeId: null,
      startWidth: null,
      startX: null,
    });
  };

  // 캔버스 마우스 이동 핸들러 수정
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragState.isDragging) {
      handleNodeDrag(e);
    }
    if (resizeState.isResizing) {
      handleResize(e);
    }
    if (draggingConnection && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const mousePosition = {
        x: e.clientX - rect.left + canvasRef.scrollLeft,
        y: e.clientY - rect.top + canvasRef.scrollTop,
      };
      setDraggingConnection({
        ...draggingConnection,
        mousePosition,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragState.isDragging) {
      handleNodeDragEnd();
    }
    if (resizeState.isResizing) {
      handleResizeEnd();
    }
    if (draggingConnection) {
      setDraggingConnection(null);
    }
  };

  const handleNodeDoubleClick = (node: Node) => {
    setModalState({
      isOpen: true,
      nodeId: node.id,
      nodeType: node.type,
      config: node.config || null, // {} 대신 null 사용
    });
  };

  const handleConfigSave = (nodeId: string, config: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, config } : node))
    );
    setModalState({ isOpen: false, nodeId: "", nodeType: "", config: null });
  };

  // 노드 크기 업데이트를 useCallback으로 메모이제이션
  const updateNodeSize = useCallback(
    (nodeId: string, element: HTMLElement | null) => {
      if (!element) return;

      const { width, height } = element.getBoundingClientRect();
      const currentSize = nodeSizesRef.current[nodeId];

      // 크기가 실제로 변경된 경우에만 업데이트
      if (
        !currentSize ||
        currentSize.width !== width ||
        currentSize.height !== height
      ) {
        nodeSizesRef.current = {
          ...nodeSizesRef.current,
          [nodeId]: { width, height },
        };
      }
    },
    []
  );

  // 상태 추가
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingConnection, setDraggingConnection] = useState<{
    sourcePoint: ConnectionPoint;
    mousePosition: { x: number; y: number };
  } | null>(null);

  const ConnectionPoints = ({ nodeId }: { nodeId: string }) => {
    const points: ConnectionPointType[] = ["top", "right", "bottom", "left"];

    const handleMouseDown = (
      e: React.MouseEvent,
      type: ConnectionPointType
    ) => {
      e.stopPropagation();

      const nodeElement = document.getElementById(nodeId);
      if (!nodeElement) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const nodeWidth = node.width || 120;
      const nodeHeight = nodeElement.offsetHeight;

      // 연결점의 실제 위치 계산
      let startPoint = { x: node.position.x, y: node.position.y };
      switch (type) {
        case "top":
          startPoint = {
            x: node.position.x + nodeWidth / 2,
            y: node.position.y,
          };
          break;
        case "right":
          startPoint = {
            x: node.position.x + nodeWidth,
            y: node.position.y + nodeHeight / 2,
          };
          break;
        case "bottom":
          startPoint = {
            x: node.position.x + nodeWidth / 2,
            y: node.position.y + nodeHeight,
          };
          break;
        case "left":
          startPoint = {
            x: node.position.x,
            y: node.position.y + nodeHeight / 2,
          };
          break;
      }

      const point: ConnectionPoint = {
        id: `${nodeId}-${type}`,
        nodeId,
        type,
      };

      setDraggingConnection({
        sourcePoint: point,
        mousePosition: startPoint, // 시작점을 연결점의 실제 위치로 설정
      });
    };

    const handleMouseUp = (e: React.MouseEvent, type: ConnectionPointType) => {
      e.stopPropagation();
      if (draggingConnection) {
        const targetPoint: ConnectionPoint = {
          id: `${nodeId}-${type}`,
          nodeId,
          type,
        };

        // 같은 노드의 연결점끼리는 연결하지 않음
        if (draggingConnection.sourcePoint.nodeId !== nodeId) {
          const newConnection: Connection = {
            id: `connection-${Date.now()}`,
            sourcePoint: draggingConnection.sourcePoint,
            targetPoint,
          };
          setConnections((prev) => [...prev, newConnection]);
        }
        setDraggingConnection(null);
      }
    };

    return (
      <>
        {points.map((type) => (
          <div
            key={type}
            className={`${styles.connectionPoint} ${styles[type]}`}
            onMouseDown={(e) => handleMouseDown(e, type)}
            onMouseUp={(e) => handleMouseUp(e, type)}
          />
        ))}
      </>
    );
  };

  const ConnectionLines = () => {
    const getPointCoordinates = (
      point: ConnectionPoint
    ): { x: number; y: number } => {
      const nodeElement = document.getElementById(point.nodeId);
      if (!nodeElement) return { x: 0, y: 0 };

      const nodeRect = nodeElement.getBoundingClientRect();
      const canvasRect = canvasRef?.getBoundingClientRect();
      if (!canvasRect) return { x: 0, y: 0 };

      // 스크롤 위치 고려
      const scrollLeft = canvasRef?.scrollLeft || 0;
      const scrollTop = canvasRef?.scrollTop || 0;

      // 캔버스 상대 좌표로 변환
      const relativeX = nodeRect.left - canvasRect.left + scrollLeft;
      const relativeY = nodeRect.top - canvasRect.top + scrollTop;

      switch (point.type) {
        case "top":
          return {
            x: relativeX + nodeRect.width / 2,
            y: relativeY,
          };
        case "right":
          return {
            x: relativeX + nodeRect.width,
            y: relativeY + nodeRect.height / 2,
          };
        case "bottom":
          return {
            x: relativeX + nodeRect.width / 2,
            y: relativeY + nodeRect.height,
          };
        case "left":
          return {
            x: relativeX,
            y: relativeY + nodeRect.height / 2,
          };
      }
    };

    const getDraggingPosition = (): { x: number; y: number } => {
      if (!draggingConnection || !canvasRef) return { x: 0, y: 0 };

      const canvasRect = canvasRef.getBoundingClientRect();
      const scrollLeft = canvasRef.scrollLeft;
      const scrollTop = canvasRef.scrollTop;

      return {
        x: draggingConnection.mousePosition.x - canvasRect.left + scrollLeft,
        y: draggingConnection.mousePosition.y - canvasRect.top + scrollTop,
      };
    };

    return (
      <svg className={styles.connections}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className={styles.arrowHead} />
          </marker>
        </defs>
        {connections.map((connection) => (
          <path
            key={connection.id}
            className={styles.connectionLine}
            d={`M ${getPointCoordinates(connection.sourcePoint).x} 
                ${getPointCoordinates(connection.sourcePoint).y} 
                L ${getPointCoordinates(connection.targetPoint).x} 
                ${getPointCoordinates(connection.targetPoint).y}`}
            markerEnd="url(#arrowhead)"
          />
        ))}
        {draggingConnection && (
          <path
            className={styles.connectionLine}
            d={`M ${getPointCoordinates(draggingConnection.sourcePoint).x} 
                ${getPointCoordinates(draggingConnection.sourcePoint).y} 
                L ${getDraggingPosition().x} 
                ${getDraggingPosition().y}`}
            markerEnd="url(#arrowhead)"
          />
        )}
      </svg>
    );
  };

  // 두 점 사이의 거리를 계산하는 함수 추가
  const getDistance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // 노드의 연결점 위치를 계산하는 함수 추가
  const getNodeConnectionPoints = (
    node: Node,
    nodeElement: HTMLElement
  ): NodeConnectionPoints => {
    const nodeWidth = node.width || 120;
    const nodeHeight = nodeElement.offsetHeight;

    return {
      top: {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y,
        type: "top" as ConnectionPointType,
      },
      right: {
        x: node.position.x + nodeWidth,
        y: node.position.y + nodeHeight / 2,
        type: "right" as ConnectionPointType,
      },
      bottom: {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight,
        type: "bottom" as ConnectionPointType,
      },
      left: {
        x: node.position.x,
        y: node.position.y + nodeHeight / 2,
        type: "left" as ConnectionPointType,
      },
    };
  };

  // 노드 클릭 핸들러 수정
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (!e.shiftKey) return;

    const clickedNode = nodes.find((n) => n.id === nodeId);
    if (!clickedNode) return;

    const clickedElement = document.getElementById(nodeId);
    if (!clickedElement) return;

    // 마우스 클릭 위치
    const clickPoint = {
      x:
        e.clientX -
        (canvasRef?.getBoundingClientRect().left || 0) +
        (canvasRef?.scrollLeft || 0),
      y:
        e.clientY -
        (canvasRef?.getBoundingClientRect().top || 0) +
        (canvasRef?.scrollTop || 0),
    };

    // 클릭된 노드의 모든 연결점 위치 계산
    const points = getNodeConnectionPoints(clickedNode, clickedElement);

    // 가장 가까운 연결점 찾기
    let closestPoint: ConnectionPointPosition | null = null;
    let minDistance = Infinity;

    // 각 방향의 연결점에 대해 거리 계산
    const checkPoint = (point: ConnectionPointPosition) => {
      const distance = getDistance(clickPoint, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    };

    checkPoint(points.top);
    checkPoint(points.right);
    checkPoint(points.bottom);
    checkPoint(points.left);

    if (closestPoint) {
      const point = closestPoint as ConnectionPointPosition; // 타입 단언 추가
      const sourcePoint: ConnectionPoint = {
        id: `${nodeId}-${point.type}`,
        nodeId,
        type: point.type,
      };

      setDraggingConnection({
        sourcePoint,
        mousePosition: clickPoint,
      });
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
            ref={setCanvasRef}
            className={styles.canvas}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                id={node.id}
                className={`${styles.node} ${
                  dragState.currentNodeId === node.id ? styles.nodeDragging : ""
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: node.width || 120,
                  backgroundColor: nodeStyles[node.type].backgroundColor,
                  borderColor: nodeStyles[node.type].borderColor,
                  color: nodeStyles[node.type].color,
                }}
                onMouseDown={(e) => {
                  if (!e.shiftKey) {
                    handleNodeDragStart(e, node.id);
                  }
                }}
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
                ref={(el) => updateNodeSize(node.id, el)}
              >
                <div
                  className={styles.nodeHeader}
                  style={{
                    backgroundColor: nodeStyles[node.type].headerBg,
                  }}
                >
                  {node.type}
                </div>
                {node.config && (
                  <div className={styles.nodePreview}>
                    <div className={styles.previewText}>
                      {getNodePreview(node)}
                    </div>
                  </div>
                )}
                <div
                  className={styles.resizeHandle}
                  onMouseDown={(e) =>
                    handleResizeStart(e, node.id, node.width || 120)
                  }
                />
                <ConnectionPoints nodeId={node.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <NodeConfigModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({
            isOpen: false,
            nodeId: "",
            nodeType: "",
            config: null,
          })
        }
        nodeType={modalState.nodeType}
        nodeId={modalState.nodeId}
        config={modalState.config}
        onSave={handleConfigSave}
      />
      <ConnectionLines />
    </div>
  );
}
