"use client";

import { useRef, useState } from "react";
import type { CreateSaleState } from "@/app/actions";
import { Button } from "@/app/ui/button";
import { Modal } from "@/app/ui/modal";

type Props = {
  createSaleAction: (state: CreateSaleState, formData: FormData) => Promise<CreateSaleState>;
  date: string;
  open: boolean;
  onClose: () => void;
};

export function SaleEntryModal({ createSaleAction, date, open, onClose }: Props) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  function close() {
    setError("");
    onClose();
  }

  return (
    <Modal open={open} title="매출 입력" onClose={close}>
      <form
        action={async (formData) => {
          if (submitting.current) return;

          submitting.current = true;
          setPending(true);
          setError("");
          try {
            const result = await createSaleAction({ success: false }, formData);
            if (result.success) close();
            else setError(result.error ?? "매출을 저장하지 못했습니다.");
          } finally {
            submitting.current = false;
            setPending(false);
          }
        }}
        className="sale-form"
      >
        <label>날짜<input name="date" type="date" defaultValue={date} key={date} required /></label>
        <label>매출 금액<input name="amount" type="number" min="0" placeholder="0" required /></label>
        <label>결제 수단<select name="paymentType"><option>카드</option><option>현금</option><option>지역상품권</option><option>기타</option></select></label>
        <p>동일한 날짜와 결제 수단은 입력한 금액으로 갱신되며, 0원을 입력하면 해당 데이터가 초기화됩니다.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={pending}>{pending ? "저장 중..." : "매출 저장"}</Button>
      </form>
    </Modal>
  );
}
