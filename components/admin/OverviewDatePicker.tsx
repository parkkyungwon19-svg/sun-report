"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

interface Props {
  currentDate: string;
}

export function OverviewDatePicker({ currentDate }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val) router.push(`/admin/overview?date=${val}`);
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        type="date"
        defaultValue={currentDate}
        onChange={handleChange}
        className="border rounded-md px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
