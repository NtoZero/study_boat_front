"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";

interface EnvironmentConfig {
  environment: string;
  variables: { key: string; value: string }[];
  description: string;
}

interface EnvironmentFormProps {
  config: EnvironmentConfig;
  onSave: (config: EnvironmentConfig) => void;
}

const EnvironmentForm = ({ config, onSave }: EnvironmentFormProps) => {
  const [formData, setFormData] = useState<EnvironmentConfig>(
    config || {
      environment: "development",
      variables: [],
      description: "",
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

export default EnvironmentForm;
