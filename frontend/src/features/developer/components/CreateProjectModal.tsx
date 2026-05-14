import { useState } from "react";
import { Button, Modal, TextField } from "../../../shared/components/ui";

interface Props {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}

export default function CreateProjectModal({ open, isCreating, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    const ok = await onSubmit(name);
    if (ok) {
      setName("");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (isCreating) return;
        onClose();
      }}
      title="Create new project"
      description="Nhập tên project để tạo mới."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isCreating}>
            Huỷ
          </Button>
          <Button variant="primary" size="sm" loading={isCreating} onClick={() => void handleSubmit()}>
            {isCreating ? "Đang tạo..." : "Tạo project"}
          </Button>
        </>
      }
    >
      <TextField
        label="Tên project"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Mobile app"
        autoFocus
      />
    </Modal>
  );
}
