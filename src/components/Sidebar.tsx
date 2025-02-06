"use client";
import React, { useState } from "react";
import styles from "./Sidebar.module.css";

interface MenuItem {
  title: string;
  subItems: string[];
}

const menuItems: MenuItem[] = [
  {
    title: "Meta Data",
    subItems: ["DB config", "environment"],
  },
  {
    title: "Business Automation",
    subItems: ["Trigger", "Call Api", "Json parser", "Done"],
  },
];

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
                  <li key={subItem}>
                    <a href="#">{subItem}</a>
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
