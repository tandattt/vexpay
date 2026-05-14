import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "../../../shared/api";
import { readRaw, writeRaw } from "../../../shared/lib/storage";
import {
  cancelDeposit,
  createDepositQr,
  getDepositHistory,
  getDepositHistoryQr,
  getDepositQrConfig,
  getDepositStatus,
} from "../api";
import { mapDepositStatus, toHistoryRow } from "../lib/map";
import type {
  DepositMethod,
  DepositQrConfigResponse,
  HistoryRow,
  NormalizedDepositStatus,
} from "../types";

const ACTIVE_DEPOSIT_CODE_KEY = "vexpay.active_deposit_code";
const HISTORY_PAGE_SIZE = 5;
const STATUS_POLL_MS = 5000;
const HISTORY_AUTO_REFRESH_MS = 10000;

interface Options {
  token: string | null;
  enabled: boolean;
  onCompleted?: () => void;
}

export function useDepositFlow({ token, enabled, onCompleted }: Options) {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("qr");
  const [amount, setAmount] = useState<number>(1_000_000);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [depositCode, setDepositCode] = useState<string | null>(() =>
    readRaw("session", ACTIVE_DEPOSIT_CODE_KEY),
  );
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<NormalizedDepositStatus | null>(null);
  const [depositRemainingSeconds, setDepositRemainingSeconds] = useState<number | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositQrConfig, setDepositQrConfig] = useState<DepositQrConfigResponse | null>(null);
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);
  const [isCancellingDeposit, setIsCancellingDeposit] = useState(false);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryPaging, setIsHistoryPaging] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedQrImageUrl, setExpandedQrImageUrl] = useState<string | null>(null);
  const [historyTick, setHistoryTick] = useState(0);

  const expiredHandledRef = useRef(new Set<string>());
  const activeQrExpiredHandledRef = useRef<string | null>(null);

  const resolvedAmount =
    customAmount.trim().length > 0 ? Number(customAmount) : amount;

  const loadHistory = useCallback(
    async (page = historyPage, showLoading = true, excludeCode?: string | null) => {
      if (!token) return;
      try {
        setHistoryError(null);
        if (showLoading) {
          if (history.length === 0) setIsHistoryLoading(true);
          else setIsHistoryPaging(true);
        }
        const data = await getDepositHistory(page, HISTORY_PAGE_SIZE);
        const rows = data.items.map(toHistoryRow);
        const existingCodes = new Set(rows.map((row) => row.code));
        expiredHandledRef.current.forEach((code) => {
          if (!existingCodes.has(code)) expiredHandledRef.current.delete(code);
        });
        const activeCode = excludeCode ?? depositCode;
        const filteredRows = activeCode ? rows.filter((x) => x.code !== activeCode) : rows;
        setHistory(filteredRows);
        if (activeCode) {
          const active = rows.find((x) => x.code === activeCode && x.status === "Pending");
          setDepositRemainingSeconds(active?.remainingSeconds ?? null);
        }
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
    [depositCode, expandedHistoryId, expandedQrImageUrl, history.length, historyPage, token],
  );

  useEffect(() => {
    writeRaw("session", ACTIVE_DEPOSIT_CODE_KEY, depositCode);
  }, [depositCode]);

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
    // Initial load only — omit loadHistory to avoid re-fetch when its identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token]);

  useEffect(() => {
    if (!depositCode || qrImageUrl || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await getDepositStatus(depositCode);
        const status = mapDepositStatus(response.status);
        if (cancelled) return;
        if (status !== "Pending") {
          setDepositCode(null);
          setDepositStatus(null);
          setDepositRemainingSeconds(null);
          return;
        }
        const image = await getDepositHistoryQr(depositCode);
        if (cancelled) {
          URL.revokeObjectURL(image);
          return;
        }
        setQrImageUrl(image);
        setDepositStatus("Pending");
      } catch {
        if (cancelled) return;
        setDepositCode(null);
        setDepositStatus(null);
        setDepositRemainingSeconds(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [depositCode, qrImageUrl, token]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setHistory((current) =>
        current.map((row) =>
          row.status === "Pending" && row.remainingSeconds !== null
            ? { ...row, remainingSeconds: Math.max(row.remainingSeconds - 1, 0) }
            : row,
        ),
      );
      setDepositRemainingSeconds((current) => (current === null ? null : Math.max(current - 1, 0)));
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
    const activeQrExpired =
      depositStatus === "Pending" &&
      depositRemainingSeconds === 0 &&
      depositCode !== null &&
      activeQrExpiredHandledRef.current !== depositCode;

    if (newlyExpiredHistory.length === 0 && !activeQrExpired) return;

    newlyExpiredHistory.forEach((row) => expiredHandledRef.current.add(row.code));
    if (activeQrExpired && depositCode) {
      activeQrExpiredHandledRef.current = depositCode;
    }

    void loadHistory(historyPage, false);
    if (activeQrExpired && depositCode) {
      void getDepositStatus(depositCode)
        .then((response) => setDepositStatus(mapDepositStatus(response.status)))
        .catch(() => undefined);
    }
  }, [historyTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !token) return;
    const refresh = setInterval(() => {
      void loadHistory(historyPage, false);
    }, HISTORY_AUTO_REFRESH_MS);
    return () => clearInterval(refresh);
  }, [enabled, historyPage, token, depositCode, loadHistory]);

  useEffect(() => {
    if (!depositCode) return;
    if (
      depositStatus === "Completed" ||
      depositStatus === "Failed" ||
      depositStatus === "Cancelled" ||
      depositStatus === "Expired"
    )
      return;

    const timer = setInterval(async () => {
      try {
        const response = await getDepositStatus(depositCode);
        setDepositStatus(mapDepositStatus(response.status));
      } catch {
        /* silent */
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [depositCode, depositStatus]);

  useEffect(() => {
    return () => {
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
    };
  }, [qrImageUrl, expandedQrImageUrl]);

  useEffect(() => {
    if (depositStatus !== "Completed") return;
    onCompleted?.();
    void loadHistory(historyPage);
  }, [depositStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!qrImageUrl || !depositCode) return;
    if (
      depositStatus !== "Completed" &&
      depositStatus !== "Failed" &&
      depositStatus !== "Cancelled" &&
      depositStatus !== "Expired"
    )
      return;

    const timer = setTimeout(() => {
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(null);
      setDepositCode(null);
      setDepositStatus(null);
      setDepositRemainingSeconds(null);
      activeQrExpiredHandledRef.current = null;
    }, 2000);
    return () => clearTimeout(timer);
  }, [depositStatus, qrImageUrl, depositCode]);

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

  const handleCancelDeposit = useCallback(async () => {
    if (!depositCode) return;
    try {
      setIsCancellingDeposit(true);
      await cancelDeposit(depositCode);
      setDepositStatus("Cancelled");
      await loadHistory(historyPage, false);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "Không hủy được giao dịch.";
      setDepositError(message);
    } finally {
      setIsCancellingDeposit(false);
    }
  }, [depositCode, historyPage, loadHistory]);

  const handleCreateDeposit = useCallback(async () => {
    if (selectedMethod !== "qr") {
      setDepositError("Hiện tại chỉ hỗ trợ nạp qua QR Code.");
      return;
    }
    try {
      setIsCreatingDeposit(true);
      setDepositError(null);
      setDepositStatus("Pending");
      setDepositRemainingSeconds(null);
      const result = await createDepositQr(resolvedAmount);
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(result.imageUrl);
      setDepositCode(result.code);
      setDepositRemainingSeconds(15 * 60);
      await loadHistory(historyPage, true, result.code);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "Không tạo được mã QR nạp tiền.";
      setDepositError(message);
      setDepositStatus(null);
    } finally {
      setIsCreatingDeposit(false);
    }
  }, [historyPage, loadHistory, qrImageUrl, resolvedAmount, selectedMethod]);

  return {
    selectedMethod,
    setSelectedMethod,
    amount,
    setAmount,
    customAmount,
    setCustomAmount,
    resolvedAmount,

    depositCode,
    qrImageUrl,
    depositStatus,
    depositRemainingSeconds,
    depositError,
    depositQrConfig,
    isCreatingDeposit,
    isCancellingDeposit,
    handleCreateDeposit,
    handleCancelDeposit,

    history,
    historyError,
    isHistoryLoading,
    isHistoryPaging,
    historyPage,
    historyTotalPages,
    expandedHistoryId,
    expandedQrImageUrl,
    toggleHistoryQr,
    loadHistory,
  };
}
