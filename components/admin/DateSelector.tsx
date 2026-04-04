"use client";

import { useRouter } from "next/navigation";

interface Props {
  currentDate: string;
}

export function DateSelector({ currentDate }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val) router.push(`/admin/weekly-report?date=${val}`);
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground shrink-0">보고 일자</label>
      <input
        type="date"
        defaultValue={currentDate}
        onChange={handleChange}
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
