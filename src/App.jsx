import { useMemo, useState } from "react";
import {
  Bed,
  CalendarClock,
  CheckCircle2,
  Download,
  LogIn,
  LogOut,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Users,
  X
} from "lucide-react";

const BRAND_NAME = "موکب الشهدا قم";
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const SLOTS_PER_ROW = 60;
const TOTAL_SLOTS = ROWS.length * SLOTS_PER_ROW;
const STORAGE_KEY = "mokeb-al-shohada-qom-state-v1";

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function nowParts() {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5)
  };
}

function formatDate(date) {
  if (!date) return "—";
  return persianDateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatTimestamp(date, time) {
  if (!date && !time) return "—";
  return `${formatDate(date)} - ${time || "—"}`;
}

function makeSlotId(row, number) {
  return `${row}-${number}`;
}

function getSlotLabel(slot) {
  return `ردیف ${slot.row} - جایگاه ${slot.number}`;
}

function getSlotShortLabel(slot) {
  return `${slot.row}-${slot.number}`;
}

function createInitialSlots() {
  return ROWS.flatMap((row) =>
    Array.from({ length: SLOTS_PER_ROW }, (_, index) => {
      const number = index + 1;
      return {
        id: makeSlotId(row, number),
        row,
        number,
        status: "available",
        guest: null
      };
    })
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { slots: createInitialSlots(), history: [] };
    }

    const parsed = JSON.parse(raw);
    const existingSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
    const slotMap = new Map(existingSlots.map((slot) => [slot.id, slot]));
    const normalizedSlots = createInitialSlots().map((slot) => ({
      ...slot,
      ...(slotMap.get(slot.id) || {})
    }));

    return {
      slots: normalizedSlots,
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return { slots: createInitialSlots(), history: [] };
  }
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function StatCard({ title, value, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ring-1 ${tones[tone]}`}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function LabelPreview({ slot }) {
  if (!slot?.guest) return null;

  return (
    <div
      className="mx-auto h-[34mm] w-[51mm] overflow-hidden rounded-xl border border-slate-300 bg-white p-[2mm] text-black shadow-sm"
      dir="rtl"
    >
      <div className="flex h-full gap-2">
        <div className="flex min-w-0 flex-1 flex-col justify-between text-right">
          <div>
            <div className="truncate text-[14px] font-black leading-tight">{BRAND_NAME}</div>
            <div className="mt-1 truncate text-[13px] font-black leading-tight">{slot.guest.fullName}</div>
            <div className="mt-1 text-[10px] font-black leading-tight">{getSlotLabel(slot)}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold leading-tight">
              ورود: {formatTimestamp(slot.guest.checkInDate, slot.guest.checkInTime)}
            </div>
            <div className="barcode-bars mt-1 h-[4mm] w-[30mm]" />
          </div>
        </div>

        <div className="flex w-[18mm] shrink-0 items-center justify-center">
          <div className="qr-placeholder h-[17mm] w-[17mm] rounded-sm border border-black bg-white" />
        </div>
      </div>
    </div>
  );
}

function PrintLabel({ slot }) {
  if (!slot?.guest) return null;

  return (
    <div id="print-label" dir="rtl">
      <div className="print-label-content">
        <div className="print-label-text">
          <div>
            <div className="print-label-brand">{BRAND_NAME}</div>
            <div className="print-label-name">{slot.guest.fullName}</div>
            <div className="print-label-slot">{getSlotLabel(slot)}</div>
          </div>
          <div>
            <div className="print-label-time">
              ورود: {formatTimestamp(slot.guest.checkInDate, slot.guest.checkInTime)}
            </div>
            <div className="print-label-barcode barcode-bars" />
          </div>
        </div>
        <div className="print-label-qr qr-placeholder" />
      </div>
    </div>
  );
}

function SearchResults({ query, results, onOpenSlot }) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  return (
    <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-900">نتایج جستجو</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
          {results.length} نتیجه
        </span>
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
          نتیجه‌ای برای «{normalizedQuery}» پیدا نشد.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.map((slot) => {
            const occupied = slot.status === "occupied";
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onOpenSlot(slot.id)}
                className="rounded-2xl bg-white p-4 text-right shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black",
                      occupied ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    ].join(" ")}
                  >
                    {occupied ? "اشغال" : "خالی"}
                  </span>
                  <span className="font-black text-slate-900">{getSlotLabel(slot)}</span>
                </div>
                {slot.guest ? (
                  <div className="mt-3 space-y-1">
                    <p className="truncate text-sm font-black text-slate-800">{slot.guest.fullName}</p>
                    <p className="text-sm font-bold text-slate-500" dir="ltr">
                      {slot.guest.phone}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-slate-500">بدون زائر ثبت‌شده</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VisualGrid({ slots, onOpenSlot }) {
  const slotMap = useMemo(
    () => new Map(slots.map((slot) => [makeSlotId(slot.row, slot.number), slot])),
    [slots]
  );

  return (
    <div className="max-h-[62vh] overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
      <table className="slot-table min-w-[760px] border-separate border-spacing-0 p-4 text-center">
        <thead>
          <tr>
            <th className="sticky right-0 top-0 z-30 w-16 bg-slate-50 p-2">
              <div className="flex h-10 items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white">
                شماره
              </div>
            </th>
            {ROWS.map((row) => (
              <th key={row} className="sticky top-0 z-20 bg-slate-50 p-2">
                <div className="flex h-10 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
                  {row}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SLOTS_PER_ROW }, (_, index) => index + 1).map((number) => (
            <tr key={number}>
              <th className="sticky right-0 z-10 bg-slate-50 p-2">
                <div className="flex h-9 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-700 ring-1 ring-slate-200">
                  {number}
                </div>
              </th>
              {ROWS.map((row) => {
                const slot = slotMap.get(makeSlotId(row, number));
                const occupied = slot?.status === "occupied";
                return (
                  <td key={`${row}-${number}`} className="p-2">
                    <button
                      type="button"
                      onClick={() => onOpenSlot(slot.id)}
                      title={`${getSlotLabel(slot)} - ${occupied ? slot.guest?.fullName : "خالی"}`}
                      className={[
                        "flex h-9 w-full min-w-16 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm transition hover:scale-105 focus:outline-none focus:ring-4",
                        occupied
                          ? "bg-red-500 hover:bg-red-600 focus:ring-red-100"
                          : "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-100"
                      ].join(" ")}
                    >
                      {getSlotShortLabel(slot)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResetDataModal({ open, password, error, onPasswordChange, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600 ring-1 ring-red-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">حذف کل اطلاعات</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">این عملیات قابل بازگشت نیست.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold leading-7 text-red-700 ring-1 ring-red-100">
            با تأیید، تمام جایگاه‌ها خالی می‌شوند و کل تاریخچه ورود و خروج حذف می‌شود.
          </p>

          <Field label="رمز حذف اطلاعات">
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
              placeholder="رمز را وارد کنید"
              autoFocus
            />
          </Field>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              <Trash2 className="h-5 w-5" />
              حذف و ریست کامل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotModal({ slot, onClose, onCheckIn, onCheckOut }) {
  const current = nowParts();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    checkInDate: current.date,
    checkInTime: current.time
  });

  if (!slot) return null;

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onCheckIn(slot.id, form);
  };

  const isOccupied = slot.status === "occupied" && slot.guest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">جزئیات جایگاه</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">{getSlotLabel(slot)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="بستن"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!isOccupied ? (
            <form onSubmit={submit} className="space-y-5">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                این جایگاه خالی است. برای ثبت ورود، مشخصات زائر را وارد کنید.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="نام و نام خانوادگی">
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) => updateForm("fullName", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="مثلاً علی رضایی"
                  />
                </Field>
                <Field label="شماره تلفن">
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="مثلاً 09121234567"
                    inputMode="tel"
                    dir="ltr"
                  />
                </Field>
                <Field label="تاریخ ورود">
                  <input
                    required
                    type="date"
                    value={form.checkInDate}
                    onChange={(event) => updateForm("checkInDate", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    dir="ltr"
                  />
                </Field>
                <Field label="ساعت ورود">
                  <input
                    required
                    type="time"
                    value={form.checkInTime}
                    onChange={(event) => updateForm("checkInTime", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    dir="ltr"
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-black text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
              >
                <LogIn className="h-5 w-5" />
                ثبت ورود
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                این جایگاه اشغال است.
              </div>

              <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-slate-500">نام زائر</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{slot.guest.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">شماره تلفن</p>
                  <p className="mt-1 text-lg font-black text-slate-900" dir="ltr">
                    {slot.guest.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">زمان ورود</p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {formatTimestamp(slot.guest.checkInDate, slot.guest.checkInTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">جایگاه</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{getSlotLabel(slot)}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-black text-slate-700">پیش‌نمایش لیبل حرارتی ۳۴×۵۱ میلی‌متر</p>
                <LabelPreview slot={slot} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white transition hover:bg-slate-800"
                >
                  <Printer className="h-5 w-5" />
                  چاپ لیبل
                </button>
                <button
                  type="button"
                  onClick={() => onCheckOut(slot.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  ثبت خروج و آزادسازی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [query, setQuery] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const selectedSlot = useMemo(
    () => state.slots.find((slot) => slot.id === selectedSlotId),
    [selectedSlotId, state.slots]
  );

  const occupiedCount = useMemo(
    () => state.slots.filter((slot) => slot.status === "occupied").length,
    [state.slots]
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return state.slots.filter((slot) => {
      const guestText = slot.guest
        ? `${slot.guest.fullName} ${slot.guest.phone}`.toLowerCase()
        : "";

      return (
        slot.id.toLowerCase().includes(normalizedQuery) ||
        `${slot.row}${slot.number}`.toLowerCase().includes(normalizedQuery) ||
        `${slot.number}`.includes(normalizedQuery) ||
        guestText.includes(normalizedQuery)
      );
    });
  }, [query, state.slots]);

  const occupiedGuests = useMemo(
    () => state.slots.filter((slot) => slot.status === "occupied" && slot.guest),
    [state.slots]
  );

  const checkInEvents = useMemo(
    () => state.history.filter((event) => event.type === "check-in"),
    [state.history]
  );

  const commitState = (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  };

  const handleCheckIn = (slotId, form) => {
    const guest = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      checkInDate: form.checkInDate,
      checkInTime: form.checkInTime
    };

    commitState((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: "occupied",
              guest
            }
          : slot
      ),
      history: [
        {
          id: crypto.randomUUID(),
          type: "check-in",
          slotId,
          guest,
          createdAt: new Date().toISOString()
        },
        ...prev.history
      ]
    }));
  };

  const handleCheckOut = (slotId) => {
    const current = nowParts();
    commitState((prev) => {
      const target = prev.slots.find((slot) => slot.id === slotId);
      if (!target?.guest) return prev;

      return {
        ...prev,
        slots: prev.slots.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                status: "available",
                guest: null
              }
            : slot
        ),
        history: [
          {
            id: crypto.randomUUID(),
            type: "check-out",
            slotId,
            guest: target.guest,
            checkOutDate: current.date,
            checkOutTime: current.time,
            createdAt: new Date().toISOString()
          },
          ...prev.history
        ]
      };
    });
    setSelectedSlotId(null);
  };

  const downloadExcel = (filename, headers, rows) => {
    const escapeCell = (value) =>
      String(value ?? "")
        .replaceAll("\t", " ")
        .replaceAll("\r", " ")
        .replaceAll("\n", " ");
    const table = [headers, ...rows].map((row) => row.map(escapeCell).join("\t")).join("\r\n");
    const blob = new Blob([`\uFEFF${table}`], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportOccupiedGuests = () => {
    const headers = ["نام و نام خانوادگی", "شماره تماس", "ردیف", "شماره جایگاه", "تاریخ ورود", "ساعت ورود"];
    const rows = occupiedGuests.map((slot) => [
      slot.guest.fullName,
      slot.guest.phone,
      slot.row,
      slot.number,
      formatDate(slot.guest.checkInDate),
      slot.guest.checkInTime
    ]);

    downloadExcel(`mokeb-current-guests-${new Date().toISOString().slice(0, 10)}.xls`, headers, rows);
  };

  const exportAllCheckIns = () => {
    const headers = ["نام و نام خانوادگی", "شماره تماس", "ردیف", "شماره جایگاه", "تاریخ ورود", "ساعت ورود"];
    const rows = checkInEvents.map((event) => [
      event.guest.fullName,
      event.guest.phone,
      event.slotId.split("-")[0],
      event.slotId.split("-")[1],
      formatDate(event.guest.checkInDate),
      event.guest.checkInTime
    ]);

    downloadExcel(`mokeb-all-checkins-${new Date().toISOString().slice(0, 10)}.xls`, headers, rows);
  };

  const openResetModal = () => {
    setResetPassword("");
    setResetError("");
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    setResetModalOpen(false);
    setResetPassword("");
    setResetError("");
  };

  const resetAllData = () => {
    if (resetPassword !== "mokeb123") {
      setResetError("رمز واردشده درست نیست.");
      return;
    }

    const initialState = { slots: createInitialSlots(), history: [] };
    saveState(initialState);
    setState(initialState);
    setSelectedSlotId(null);
    setQuery("");
    closeResetModal();
  };

  return (
    <>
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-soft md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-teal-100 ring-1 ring-white/15">
                <Bed className="h-4 w-4" />
                پنل مدیریت استراحتگاه
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{BRAND_NAME}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                مدیریت ورود، خروج، ظرفیت جایگاه‌ها و چاپ لیبل زائران برای ۵۴۰ جایگاه در ردیف‌های A تا I.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm text-slate-300">وضعیت لحظه‌ای</p>
              <p className="mt-1 text-3xl font-black">{occupiedCount} / {TOTAL_SLOTS}</p>
              <p className="mt-1 text-sm text-slate-300">جایگاه اشغال‌شده</p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard title="کل جایگاه‌ها" value={TOTAL_SLOTS} icon={Bed} tone="blue" />
          <StatCard title="جایگاه‌های اشغال" value={occupiedCount} icon={Users} tone="red" />
          <StatCard title="جایگاه‌های خالی" value={TOTAL_SLOTS - occupiedCount} icon={CheckCircle2} tone="green" />
        </section>

        <section className="mb-6 rounded-[2rem] border border-red-100 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">مدیریت اطلاعات</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                برای شروع روز جدید یا پاک‌سازی کامل، می‌توانید همه داده‌های ذخیره‌شده را با رمز حذف کنید.
              </p>
            </div>
            <button
              type="button"
              onClick={openResetModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              <Trash2 className="h-5 w-5" />
              حذف کل اطلاعات
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">جدول ویژوالی جایگاه‌ها</h2>
              <p className="mt-1 text-sm text-slate-500">
                ستون‌ها ردیف‌های A تا I هستند و سطرها شماره جایگاه ۱ تا ۶۰. با اسکرول، عنوان ستون‌ها ثابت می‌ماند.
              </p>
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="جستجو بر اساس جایگاه، نام یا تلفن"
              />
            </div>
          </div>

          <SearchResults query={query} results={searchResults} onOpenSlot={setSelectedSlotId} />

          <VisualGrid slots={state.slots} onOpenSlot={setSelectedSlotId} />

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              خالی
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-100">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              اشغال
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600 ring-1 ring-slate-200">
              <CalendarClock className="h-4 w-4" />
              اطلاعات در مرورگر ذخیره می‌شود.
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-black text-slate-900">آخرین رویدادها</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={exportAllCheckIns}
                disabled={checkInEvents.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <Download className="h-4 w-4" />
                خروجی همه ورودها
              </button>
              <button
                type="button"
                onClick={exportOccupiedGuests}
                disabled={occupiedGuests.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <Download className="h-4 w-4" />
                خروجی افراد حاضر
              </button>
            </div>
          </div>
          {state.history.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
              هنوز ورود یا خروجی ثبت نشده است.
            </p>
          ) : (
            <div className="max-h-72 overflow-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-black">نوع</th>
                    <th className="px-4 py-3 font-black">نام</th>
                    <th className="px-4 py-3 font-black">جایگاه</th>
                    <th className="px-4 py-3 font-black">زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {state.history.slice(0, 40).map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-black",
                            event.type === "check-in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          ].join(" ")}
                        >
                          {event.type === "check-in" ? "ورود" : "خروج"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{event.guest.fullName}</td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        ردیف {event.slotId.split("-")[0]} - جایگاه {event.slotId.split("-")[1]}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        {event.type === "check-in"
                          ? formatTimestamp(event.guest.checkInDate, event.guest.checkInTime)
                          : formatTimestamp(event.checkOutDate, event.checkOutTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <SlotModal
        slot={selectedSlot}
        onClose={() => setSelectedSlotId(null)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />
      <ResetDataModal
        open={resetModalOpen}
        password={resetPassword}
        error={resetError}
        onPasswordChange={(value) => {
          setResetPassword(value);
          setResetError("");
        }}
        onClose={closeResetModal}
        onConfirm={resetAllData}
      />
    </main>
    <PrintLabel slot={selectedSlot} />
    </>
  );
}
