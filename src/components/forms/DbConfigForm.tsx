"use client";
import React, { useState } from "react";
import styles from "./Forms.module.css";
import { toast } from "react-hot-toast";

interface DbConfig {
  databaseType: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  poolSize: string;
  useSSL: boolean;
  options: Array<{ key: string; value: string }>;
}

const defaultConfig: DbConfig = {
  databaseType: "mysql",
  host: "",
  port: "",
  databaseName: "",
  username: "",
  password: "",
  poolSize: "10",
  useSSL: true,
  options: [],
};

interface DbConfigFormProps {
  config?: DbConfig;
  onSave: (config: DbConfig) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

const getConnectionUrl = (config: DbConfig): string => {
  const { databaseType, host, port, databaseName, useSSL, options } = config;

  // 기본 옵션 설정
  const defaultOptions = new Map<string, string>();
  if (useSSL) {
    switch (databaseType) {
      case "mysql":
        defaultOptions.set("useSSL", "true");
        break;
      case "postgresql":
        defaultOptions.set("sslmode", "require");
        break;
      case "mongodb":
        defaultOptions.set("ssl", "true");
        break;
    }
  }

  // 추가 옵션을 Map에 추가
  const allOptions = new Map(defaultOptions);
  options?.forEach((opt) => {
    if (opt.key && opt.value) {
      allOptions.set(opt.key, opt.value);
    }
  });

  // URL 쿼리 문자열 생성
  const queryString = Array.from(allOptions.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // 기본 URL 생성
  const baseUrl = `jdbc:${databaseType}://${host}:${port}/${databaseName}`;

  // 옵션이 있는 경우에만 쿼리 문자열 추가
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

const DbConfigForm = ({ config, onSave }: DbConfigFormProps) => {
  const [formData, setFormData] = useState<DbConfig>({
    ...defaultConfig,
    ...config,
  });

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    result?: "success" | "error";
  }>({
    loading: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(formData);
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.host.trim()) {
      errors.push({ field: "host", message: "Host is required" });
    }

    if (!formData.port.trim()) {
      errors.push({ field: "port", message: "Port is required" });
    } else if (!/^\d+$/.test(formData.port)) {
      errors.push({ field: "port", message: "Port must be a number" });
    }

    if (!formData.databaseName.trim()) {
      errors.push({
        field: "databaseName",
        message: "Database name is required",
      });
    }

    if (!formData.username.trim()) {
      errors.push({ field: "username", message: "Username is required" });
    }

    return errors;
  };

  const handleTestConnection = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const errors = validateForm();
      if (errors.length > 0) {
        const errorMessage = errors.map((e) => `• ${e.message}`).join("\n");
        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: "var(--error-bg)",
            color: "var(--error-text)",
            border: "1px solid var(--error-border)",
          },
        });
        return;
      }

      setTestStatus({ loading: true });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch("/api/test-db-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            port: parseInt(formData.port, 10),
            poolSize: parseInt(formData.poolSize, 10),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Connection failed");
        }

        toast.success("Successfully connected to database!", {
          duration: 3000,
          style: {
            background: "var(--success-bg)",
            color: "var(--success-text)",
            border: "1px solid var(--success-border)",
          },
        });

        setTestStatus({
          loading: false,
          result: "success",
        });
      } catch (error) {
        let errorMessage = "Failed to connect to database.";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage =
              "Connection timeout. Please check your database configuration.";
          } else {
            errorMessage = `Connection failed: ${error.message}`;
          }
        }

        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: "var(--error-bg)",
            color: "var(--error-text)",
            border: "1px solid var(--error-border)",
          },
        });

        setTestStatus({
          loading: false,
          result: "error",
        });
      }
    } catch (error) {
      const errorMessage =
        "An unexpected error occurred while testing the connection.";

      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: "var(--error-bg)",
          color: "var(--error-text)",
          border: "1px solid var(--error-border)",
        },
      });

      setTestStatus({
        loading: false,
        result: "error",
      });
    }
  };

  const connectionUrl = getConnectionUrl(formData);

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { key: "", value: "" }],
    });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className={styles.form}
    >
      <div className={styles.formGroup}>
        <label>Database Type</label>
        <select
          value={formData.databaseType}
          onChange={(e) =>
            setFormData({ ...formData, databaseType: e.target.value })
          }
        >
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="mongodb">MongoDB</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Host</label>
        <input
          type="text"
          value={formData.host}
          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
          placeholder="localhost"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Port</label>
        <input
          type="text"
          value={formData.port}
          onChange={(e) => setFormData({ ...formData, port: e.target.value })}
          placeholder="3306"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Database Name</label>
        <input
          type="text"
          value={formData.databaseName}
          onChange={(e) =>
            setFormData({ ...formData, databaseName: e.target.value })
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label>Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label>Connection Pool Size</label>
        <input
          type="number"
          value={formData.poolSize}
          onChange={(e) =>
            setFormData({ ...formData, poolSize: e.target.value })
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={formData.useSSL}
            onChange={(e) =>
              setFormData({ ...formData, useSSL: e.target.checked })
            }
          />
          Use SSL
        </label>
      </div>

      <div className={styles.optionsSection}>
        <div className={styles.optionsHeader}>
          <label>Additional Options</label>
          <button
            type="button"
            onClick={addOption}
            className={styles.addOptionButton}
          >
            + Add Option
          </button>
        </div>

        {formData.options.map((option, index) => (
          <div key={index} className={styles.optionRow}>
            <input
              type="text"
              value={option.key}
              onChange={(e) => updateOption(index, "key", e.target.value)}
              placeholder="Option name"
              className={styles.optionInput}
            />
            <span>=</span>
            <input
              type="text"
              value={option.value}
              onChange={(e) => updateOption(index, "value", e.target.value)}
              placeholder="Value"
              className={styles.optionInput}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className={styles.removeOptionButton}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={styles.urlPreview}>
        <label>Connection URL Preview:</label>
        <div className={styles.urlBox}>
          {connectionUrl}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(connectionUrl);
              // Optional: Add toast or notification for copy success
            }}
            className={styles.copyButton}
            title="Copy URL"
          >
            📋
          </button>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={handleTestConnection}
          className={`${styles.button} ${styles.testButton} ${
            testStatus.loading ? styles.loading : ""
          } ${testStatus.result ? styles[testStatus.result] : ""}`}
          disabled={testStatus.loading}
        >
          {testStatus.loading ? (
            <span className={styles.spinner} />
          ) : (
            "Test Connection"
          )}
        </button>
        <button type="submit" className={styles.submitButton}>
          Save Configuration
        </button>
      </div>
    </form>
  );
};

export default DbConfigForm;
