"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";

interface TriggerConfig {
  triggerType: string;
  // ... other fields will be added
}

interface TriggerFormProps {
  config: TriggerConfig;
  onSave: (config: TriggerConfig) => void;
}

const TriggerForm = ({ config, onSave }: TriggerFormProps) => {
  const [formData, setFormData] = useState<TriggerConfig>(
    config || {
      triggerType: "schedule",
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

export default TriggerForm;
