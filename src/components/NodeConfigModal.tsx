"use client";
import React, { useEffect } from "react";
import styles from "./NodeConfigModal.module.css";
import {
  DbConfigForm,
  EnvironmentForm,
  TriggerForm,
  ApiForm,
  JsonParserForm,
  DoneForm,
} from "./forms";

interface NodeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeType: string;
  nodeId: string;
  config: any;
  onSave: (nodeId: string, config: any) => void;
}

const NodeConfigModal = ({
  isOpen,
  onClose,
  nodeType,
  nodeId,
  config,
  onSave,
}: NodeConfigModalProps) => {
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderForm = () => {
    switch (nodeType) {
      case "DB config":
        return (
          <DbConfigForm
            config={config}
            onSave={(updatedConfig) => onSave(nodeId, updatedConfig)}
          />
        );
      case "environment":
        return (
          <EnvironmentForm
            config={config}
            onSave={(data) => onSave(nodeId, data)}
          />
        );
      case "Trigger":
        return (
          <TriggerForm
            config={config}
            onSave={(data) => onSave(nodeId, data)}
          />
        );
      case "Call Api":
        return (
          <ApiForm config={config} onSave={(data) => onSave(nodeId, data)} />
        );
      case "Json parser":
        return (
          <JsonParserForm
            config={config}
            onSave={(data) => onSave(nodeId, data)}
          />
        );
      case "Done":
        return (
          <DoneForm config={config} onSave={(data) => onSave(nodeId, data)} />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{nodeType} Configuration</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>{renderForm()}</div>
      </div>
    </div>
  );
};

export default NodeConfigModal;
