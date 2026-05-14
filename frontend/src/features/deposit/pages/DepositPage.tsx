import DepositAmountForm from "../components/DepositAmountForm";
import DepositHistoryTable from "../components/DepositHistoryTable";
import DepositMethodPicker from "../components/DepositMethodPicker";
import DepositSidebar from "../components/DepositSidebar";
import { useDepositFlow } from "../hooks/useDepositFlow";

interface DepositPageProps {
  token: string | null;
  enabled: boolean;
  onBalanceMayChange?: () => void;
}

export default function DepositPage({ token, enabled, onBalanceMayChange }: DepositPageProps) {
  const flow = useDepositFlow({ token, enabled, onCompleted: onBalanceMayChange });

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 lg:col-span-8">
        <DepositMethodPicker
          value={flow.selectedMethod}
          onChange={flow.setSelectedMethod}
        />

        <DepositAmountForm
          amount={flow.amount}
          setAmount={flow.setAmount}
          customAmount={flow.customAmount}
          setCustomAmount={flow.setCustomAmount}
          qrImageUrl={flow.qrImageUrl}
          depositCode={flow.depositCode}
          depositStatus={flow.depositStatus}
          depositRemainingSeconds={flow.depositRemainingSeconds}
          depositError={flow.depositError}
          depositQrConfig={flow.depositQrConfig}
          isCreatingDeposit={flow.isCreatingDeposit}
          isCancellingDeposit={flow.isCancellingDeposit}
          onCreate={() => void flow.handleCreateDeposit()}
          onCancel={() => void flow.handleCancelDeposit()}
        />

        <DepositHistoryTable
          rows={flow.history}
          isLoading={flow.isHistoryLoading}
          isPaging={flow.isHistoryPaging}
          error={flow.historyError}
          page={flow.historyPage}
          totalPages={flow.historyTotalPages}
          expandedId={flow.expandedHistoryId}
          expandedQrImageUrl={flow.expandedQrImageUrl}
          qrConfig={flow.depositQrConfig}
          onToggleRow={(row) => void flow.toggleHistoryQr(row)}
          onRefresh={() => void flow.loadHistory(flow.historyPage, true)}
          onChangePage={(page) => void flow.loadHistory(page)}
        />
      </div>

      <DepositSidebar />
    </div>
  );
}
