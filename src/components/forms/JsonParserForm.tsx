"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";

interface JsonParserConfig {
  inputSchema: string;
  outputSchema: string;
  // ... other fields will be added
}

interface JsonParserFormProps {
  config: JsonParserConfig;
  onSave: (config: JsonParserConfig) => void;
}

const JsonParserForm = ({ config, onSave }: JsonParserFormProps) => {
  const [formData, setFormData] = useState<JsonParserConfig>(
    config || {
      inputSchema: "",
      outputSchema: "",
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

export default JsonParserForm;
