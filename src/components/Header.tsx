"use client";
import React from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import { useTheme } from "@/context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";

const Header = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className={styles.header}>
      <h1>Boat AI Practice</h1>
      <button onClick={toggleDarkMode} className={styles.themeToggle}>
        {isDarkMode ? <FiSun /> : <FiMoon />}
      </button>
    </header>
  );
};

export default Header;
