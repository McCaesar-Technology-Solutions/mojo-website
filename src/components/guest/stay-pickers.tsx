import { useEffect, useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtDate, parseStayDate, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export const GUEST_CITIES = ["Accra", "Kumasi", "Takoradi", "Tema"] as const;
export const GUEST_TYPES = ["Apartment", "Hotel", "Suite", "Serviced"] as const;

const menu = "rounded-2xl border-brand-900/10 bg-[#FBFAF7] text-brand-900 shadow-[0_16px_48px_rgba(36,16,77,0.16)]";
const item =
  "min-h-11 cursor-pointer rounded-lg py-2 pl-3 pr-10 text-[0.9375rem] font-medium text-brand-900 focus:bg-royal/10 focus:text-brand-900";
const triggerReset =
  "h-auto min-h-11 w-full border-0 bg-transparent p-0 text-left text-[1rem] font-medium leading-tight tracking-[-0.01em] text-brand-900 shadow-none ring-offset-[#FBFAF7] focus:ring-2 focus:ring-royal/40 data-[placeholder]:text-brand-900/45";

export function StaySelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  hideChevron = false,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  hideChevron?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        className={cn(triggerReset, hideChevron && "[&>svg]:hidden")}
        aria-label={placeholder}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="item-aligned" className={menu}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={item}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StayDateRange({
  checkIn,
  checkOut,
  minDate,
  disabled,
  onCheckIn,
  onCheckOut,
  inId,
  outId,
  inLabel = "Check in",
  outLabel = "Check out",
  fieldClassName,
  labelClassName,
  valueClassName,
  clusterClassName,
  showDash = true,
}: {
  checkIn: string;
  checkOut: string;
  minDate: string;
  disabled?: Matcher | Matcher[];
  onCheckIn: (value: string) => void;
  onCheckOut: (value: string) => void;
  inId: string;
  outId: string;
  inLabel?: string;
  outLabel?: string;
  fieldClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  clusterClassName?: string;
  showDash?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setMonths(media.matches ? 2 : 1);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const selected: DateRange = {
    from: checkIn ? parseStayDate(checkIn) : undefined,
    to: checkOut ? parseStayDate(checkOut) : undefined,
  };
  const min = parseStayDate(minDate);
  const extraDisabled = disabled ? (Array.isArray(disabled) ? disabled : [disabled]) : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={clusterClassName}>
          <button
            type="button"
            id={inId}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={fieldClassName}
          >
            <span className={labelClassName}>{inLabel}</span>
            <span className={valueClassName}>
              <iconify-icon
                icon="solar:calendar-linear"
                width="18"
                className="hidden shrink-0 sm:block"
                aria-hidden
              />
              {fmtDate(checkIn)}
            </span>
          </button>
          {showDash ? (
            <span className="hidden items-end pb-2 text-brand-900/35 sm:flex" aria-hidden>
              –
            </span>
          ) : null}
          <button
            type="button"
            id={outId}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={fieldClassName}
          >
            <span className={labelClassName}>{outLabel}</span>
            <span className={cn(valueClassName, "sm:mt-1")}>{fmtDate(checkOut)}</span>
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={10}
        className={cn(menu, "z-[80] w-auto p-3")}
      >
        <p className="px-1 pb-2 font-[family-name:var(--font-guest-display)] text-[0.9375rem] text-brand-900">
          Choose nights
        </p>
        <Calendar
          mode="range"
          numberOfMonths={months}
          defaultMonth={selected.from ?? min}
          selected={selected}
          disabled={[{ before: min }, ...extraDisabled]}
          onSelect={(range) => {
            if (!range?.from) return;
            const nextIn = toDateInputValue(range.from);
            onCheckIn(nextIn);
            if (range.to) {
              onCheckOut(toDateInputValue(range.to));
              setOpen(false);
              return;
            }
            const day = parseStayDate(nextIn);
            day.setDate(day.getDate() + 1);
            onCheckOut(toDateInputValue(day));
          }}
          className="bg-transparent text-brand-900 [--cell-size:2.5rem] [&_[data-selected-single=true]]:bg-royal [&_[data-selected-single=true]]:text-white [&_[data-range-start=true]]:bg-royal [&_[data-range-start=true]]:text-white [&_[data-range-end=true]]:bg-royal [&_[data-range-end=true]]:text-white [&_[data-range-middle=true]]:bg-[#F3F0FA] [&_[data-range-middle=true]]:text-brand-900"
        />
      </PopoverContent>
    </Popover>
  );
}
