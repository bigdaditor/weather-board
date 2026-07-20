"use client";

import { useState } from "react";
import type { CreateSaleState } from "@/app/actions";
import { Button } from "@/app/ui/button";
import { SaleEntryModal } from "@/app/ui/sale-entry-modal";

export function CalendarSaleButton({
  createSaleAction,
  defaultDate,
}: {
  createSaleAction: (state: CreateSaleState, formData: FormData) => Promise<CreateSaleState>;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ 매출 입력</Button>
      <SaleEntryModal
        createSaleAction={createSaleAction}
        date={defaultDate}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
