"use client";
import React from "react";
import Link from "next/link";
import styles from "./Header.module.css";

const Header = () => {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Boat AI Study
      </Link>
    </header>
  );
};

export default Header;
