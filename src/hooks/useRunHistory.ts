import { useState, useCallback } from "react";
import type { RunRecord } from "@/types/tracking";

const STORAGE_KEY = "runpath_history";
const MAX_RECORDS = 100;

function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RunRecord[];
  } catch {
    return [];
  }
}

function saveHistory(records: RunRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage full — ignore
  }
}

export function useRunHistory() {
  const [history, setHistory] = useState<RunRecord[]>(() => loadHistory());

  const addRecord = useCallback((record: RunRecord) => {
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, MAX_RECORDS);
      saveHistory(next);
      return next;
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addRecord, deleteRecord, clearHistory };
}
