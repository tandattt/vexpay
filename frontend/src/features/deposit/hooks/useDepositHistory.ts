import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "../../../shared/api";
import {
  getDepositHistory,
  getDepositHistoryQr,
  getDepositQrConfig,
} from "../api";
import { toHistoryRow } from "../lib/map";
import type { DepositQrConfigResponse, HistoryRow } from "../types";

const DEFAULT_PAGE_SIZE = 5;
const HISTORY_AUTO_REFRESH_MS = 10000;

interface Options {
  token: string | null;
  enabled: boolean;
  pageSize?: number;
  excludeCode?: string | null;
}

export function useDepositHistory({
  token,
  enabled,
  pageSize = DEFAULT_PAGE_SIZE,
  excludeCode = null,
}: Options) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryPaging, setIsHistoryPaging] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedQrImageUrl, setExpandedQrImageUrl] = useState<string | null>(null);
  const [depositQrConfig, setDepositQrConfig] = useState<DepositQrConfigResponse | null>(null);
  const [historyTick, setHistoryTick] = useState(0);

  const expiredHandledRef = useRef(new Set<string>());

  const loadHistory = useCallback(
    async (page = historyPage, showLoading = true, codeToExclude?: string | null) => {
      if (!token) return;
      try {
        setHistoryError(null);
        if (showLoading) {
          if (history.length === 0) setIsHistoryLoading(true);
          else setIsHistoryPaging(true);
        }
        const data = await getDepositHistory(page, pageSize);
        const rows = data.items.map(toHistoryRow);
        const existingCodes = new Set(rows.map((row) => row.code));
        expiredHandledRef.current.forEach((code) => {
          if (!existingCodes.has(code)) expiredHandledRef.current.delete(code);
        });
        const activeCode = codeToExclude ?? excludeCode;
        const filteredRows = activeCode ? rows.filter((x) => x.code !== activeCode) : rows;
        setHistory(filteredRows);
        setHistoryPage(data.page);
        setHistoryTotalPages(data.totalPages);
        if (
          expandedHistoryId &&
          !filteredRows.some((x) => x.id === expandedHistoryId && x.status === "Pending")
        ) {
          setExpandedHistoryId(null);
          if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
          setExpandedQrImageUrl(null);
        }
      } catch (error) {
        const message =
          error instanceof HttpError ? error.message : "Không tải được lịch sử nạp.";
        setHistoryError(message);
      } finally {
        if (showLoading) {
          setIsHistoryLoading(false);
          setIsHistoryPaging(false);
        }
      }
    },
    [excludeCode, expandedHistoryId, expandedQrImageUrl, history.length, historyPage, pageSize, token],
  );

  useEffect(() => {
    if (!enabled || !token) return;
    let ignore = false;
    void loadHistory(1);
    void getDepositQrConfig()
      .then((config) => {
        if (!ignore) setDepositQrConfig(config);
      })
      .catch(() => {
        if (!ignore) setDepositQrConfig(null);
      });
    return () => {
      ignore = true;
    };
  }, [enabled, token, loadHistory]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setHistory((current) =>
        current.map((row) =>
          row.status === "Pending" && row.remainingSeconds !== null
            ? { ...row, remainingSeconds: Math.max(row.remainingSeconds - 1, 0) }
            : row,
        ),
      );
      setHistoryTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    const newlyExpiredHistory = history.filter(
      (row) =>
        row.status === "Pending" &&
        row.remainingSeconds === 0 &&
        !expiredHandledRef.current.has(row.code),
    );
    if (newlyExpiredHistory.length === 0) return;
    newlyExpiredHistory.forEach((row) => expiredHandledRef.current.add(row.code));
    void loadHistory(historyPage, false);
  }, [historyTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !token) return;
    const refresh = setInterval(() => {
      void loadHistory(historyPage, false);
    }, HISTORY_AUTO_REFRESH_MS);
    return () => clearInterval(refresh);
  }, [enabled, historyPage, token, excludeCode, loadHistory]);

  useEffect(() => {
    return () => {
      if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
    };
  }, [expandedQrImageUrl]);

  const toggleHistoryQr = useCallback(
    async (row: HistoryRow) => {
      if (row.status !== "Pending") return;
      if (expandedHistoryId === row.id) {
        setExpandedHistoryId(null);
        if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
        setExpandedQrImageUrl(null);
        return;
      }
      try {
        if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
        setExpandedQrImageUrl(null);
        setExpandedHistoryId(row.id);
        const imageUrl = await getDepositHistoryQr(row.code);
        setExpandedQrImageUrl(imageUrl);
      } catch (error) {
        const message = error instanceof HttpError ? error.message : "Không tải được mã QR.";
        setHistoryError(message);
        setExpandedHistoryId(null);
      }
    },
    [expandedHistoryId, expandedQrImageUrl],
  );

  return {
    history,
    historyError,
    isHistoryLoading,
    isHistoryPaging,
    historyPage,
    historyTotalPages,
    expandedHistoryId,
    expandedQrImageUrl,
    depositQrConfig,
    toggleHistoryQr,
    loadHistory,
  };
}
