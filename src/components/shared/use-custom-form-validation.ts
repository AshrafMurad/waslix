"use client";

import { useState } from "react";

type ValidationRule = {
  name: string;
  message: string;
  type?: "email";
  minLength?: number;
};

type ValidationErrors = Record<string, string | undefined>;

function isBlank(value: FormDataEntryValue | null) {
  return typeof value !== "string" || !value.trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function useCustomFormValidation(rules: ValidationRule[]) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (formData: FormData) => {
    const nextErrors: ValidationErrors = {};

    for (const rule of rules) {
      const value = formData.get(rule.name);
      if (isBlank(value)) {
        nextErrors[rule.name] = rule.message;
        continue;
      }

      const stringValue = String(value).trim();
      if (rule.minLength && stringValue.length < rule.minLength) {
        nextErrors[rule.name] = rule.message;
        continue;
      }

      if (rule.type === "email" && !isValidEmail(stringValue)) {
        nextErrors[rule.name] = rule.message;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearError = (name: string) => {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  return { errors, validate, clearError };
}

export type { ValidationErrors };
