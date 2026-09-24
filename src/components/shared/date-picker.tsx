"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { arSA, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function serializeDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  name,
  value,
  defaultValue = "",
  onValueChange,
  invalid,
  describedBy,
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common.datePicker");
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selectedDate = selectedValue ? parseDate(selectedValue) : undefined;

  function update(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Popover>
      <input type="hidden" name={name} value={selectedValue} />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full justify-start text-start font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon aria-hidden="true" />
          {selectedDate
            ? new Intl.DateTimeFormat(locale, {
                calendar: "gregory",
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(selectedDate)
            : t("choose")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => update(date ? serializeDate(date) : "")}
          locale={locale === "ar" ? arSA : enUS}
        />
        {selectedDate ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => update("")}
            >
              {t("clear")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  name,
  defaultValue = "",
  invalid,
  describedBy,
}: {
  name: string;
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common.datePicker");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [dateValue = "", timeValue = "09:00"] = selectedValue.split("T");
  const selectedDate = dateValue ? parseDate(dateValue) : undefined;

  function selectDate(date: Date | undefined) {
    setSelectedValue(
      date ? `${serializeDate(date)}T${timeValue || "09:00"}` : "",
    );
  }

  return (
    <Popover>
      <input type="hidden" name={name} value={selectedValue} />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full justify-start text-start font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon aria-hidden="true" />
          {selectedDate
            ? new Intl.DateTimeFormat(locale, {
                calendar: "gregory",
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(`${dateValue}T${timeValue}`))
            : t("chooseDateTime")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={selectDate}
          locale={locale === "ar" ? arSA : enUS}
        />
        <div className="grid gap-2 border-t p-3">
          <label className="text-muted-foreground grid gap-1 text-xs">
            {t("time")}
            <Input
              type="time"
              value={timeValue}
              disabled={!selectedDate}
              onChange={(event) =>
                setSelectedValue(
                  `${dateValue}T${event.target.value || "09:00"}`,
                )
              }
              dir="ltr"
            />
          </label>
          {selectedDate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedValue("")}
            >
              {t("clear")}
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
