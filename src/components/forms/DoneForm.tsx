"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";

interface DoneConfig {
  status: string;
  notifications: string[];
  // ... other fields will be added
}

interface DoneFormProps {
  config: DoneConfig;
  onSave: (config: DoneConfig) => void;
}

const DoneForm = ({ config, onSave }: DoneFormProps) => {
  const [formData, setFormData] = useState<DoneConfig>(
    config || {
      status: "success",
      notifications: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Form implementation will be added later */}
      <button type="submit" className={styles.submitButton}>
        Save Configuration
      </button>
    </form>
  );
};

export default DoneForm;
