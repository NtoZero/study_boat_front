"use client";
import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { FiDatabase, FiSettings } from "react-icons/fi";
import { VscDebugStart } from "react-icons/vsc";
import { TbApi } from "react-icons/tb";
import { VscJson } from "react-icons/vsc";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";

interface MenuItem {
  title: string;
  subItems: {
    name: string;
    icon: React.ReactNode;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Meta Data",
    subItems: [
      { name: "DB config", icon: <FiDatabase className={styles.icon} /> },
      { name: "environment", icon: <FiSettings className={styles.icon} /> },
    ],
  },
  {
    title: "Business Automation",
    subItems: [
      { name: "Trigger", icon: <VscDebugStart className={styles.icon} /> },
      { name: "Call Api", icon: <TbApi className={styles.icon} /> },
      { name: "Json parser", icon: <VscJson className={styles.icon} /> },
      {
        name: "Done",
        icon: <IoCheckmarkDoneCircleOutline className={styles.icon} />,
      },
    ],
  },
];

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // localStorage에서 expandedItems 상태를 불러옴
    const saved = localStorage.getItem("expandedMenuItems");
    // 저장된 값이 있으면 Set으로 변환하여 반환, 없으면 빈 Set
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved ? JSON.parse(saved) : true;
  });

  // expandedItems가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      "expandedMenuItems",
      JSON.stringify(Array.from(expandedItems))
    );
  }, [expandedItems]);

  // 사이드바 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleItem = (title: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <aside className={styles.sidebar}>
      <nav>
        {menuItems.map((item) => (
          <div key={item.title} className={styles.menuItem}>
            <button
              className={styles.menuTitle}
              onClick={() => toggleItem(item.title)}
            >
              {item.title}
              <span className={styles.arrow}>
                {expandedItems.has(item.title) ? "▼" : "▶"}
              </span>
            </button>
            {expandedItems.has(item.title) && (
              <ul className={styles.subItems}>
                {item.subItems.map((subItem) => (
                  <li
                    key={subItem.name}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("nodeType", subItem.name);
                    }}
                  >
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      {subItem.icon}
                      <span>{subItem.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
