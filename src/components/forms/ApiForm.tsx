"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";

interface ApiConfig {
  url: string;
  method: string;
  // ... other fields will be added
}

interface ApiFormProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

const ApiForm = ({ config, onSave }: ApiFormProps) => {
  const [formData, setFormData] = useState<ApiConfig>(
    config || {
      url: "",
      method: "GET",
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

export default ApiForm;
