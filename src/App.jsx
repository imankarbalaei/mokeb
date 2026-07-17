import { useMemo, useState } from "react";
import {
  Bed,
  CalendarClock,
  CheckCircle2,
  LogIn,
  LogOut,
  Printer,
  Search,
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
      id="print-label"
      className="mx-auto h-[1in] w-[2in] overflow-hidden rounded-xl border border-slate-300 bg-white p-[0.07in] text-black shadow-sm"
      dir="rtl"
    >
      <div className="flex h-full gap-1.5">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="truncate text-[10px] font-black leading-tight">{BRAND_NAME}</div>
            <div className="mt-1 truncate text-[8px] font-bold leading-tight">{slot.guest.fullName}</div>
            <div className="mt-0.5 truncate text-[7px] leading-tight">{getSlotLabel(slot)}</div>
          </div>
          <div className="text-[6.5px] leading-tight">
            ورود: {formatTimestamp(slot.guest.checkInDate, slot.guest.checkInTime)}
          </div>
        </div>
        <div className="flex w-[0.62in] shrink-0 flex-col items-center justify-between">
          <div className="qr-placeholder h-[0.52in] w-[0.52in] rounded-sm border border-black bg-white" />
          <div className="barcode-bars h-[0.14in] w-full" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm no-print">
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
                <p className="mb-3 text-sm font-black text-slate-700">پیش‌نمایش لیبل حرارتی ۲×۱ اینچ</p>
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

  const selectedSlot = useMemo(
    () => state.slots.find((slot) => slot.id === selectedSlotId),
    [selectedSlotId, state.slots]
  );

  const occupiedCount = useMemo(
    () => state.slots.filter((slot) => slot.status === "occupied").length,
    [state.slots]
  );

  const filteredSlotsByRow = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ROWS.map((row) => ({
      row,
      slots: state.slots.filter((slot) => {
        if (slot.row !== row) return false;
        if (!normalizedQuery) return true;
        const guestText = slot.guest
          ? `${slot.guest.fullName} ${slot.guest.phone}`.toLowerCase()
          : "";
        return (
          slot.id.toLowerCase().includes(normalizedQuery) ||
          `${slot.row}${slot.number}`.toLowerCase().includes(normalizedQuery) ||
          guestText.includes(normalizedQuery)
        );
      })
    }));
  }, [query, state.slots]);

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

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 no-print">
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

        <section className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">جدول ویژوالی جایگاه‌ها</h2>
              <p className="mt-1 text-sm text-slate-500">
                سبز یعنی خالی، قرمز یعنی اشغال. برای ثبت ورود یا خروج روی هر جایگاه کلیک کنید.
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

          <div className="max-h-[62vh] overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="min-w-[980px] space-y-4">
              {filteredSlotsByRow.map(({ row, slots }) => (
                <div key={row} className="grid grid-cols-[48px_1fr] items-center gap-3">
                  <div className="flex h-10 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
                    {row}
                  </div>
                  <div
                    className="slot-grid grid gap-1.5"
                    style={{ gridTemplateColumns: "repeat(60, minmax(0, 1fr))" }}
                  >
                    {slots.map((slot) => {
                      const occupied = slot.status === "occupied";
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          title={`${getSlotLabel(slot)} - ${occupied ? slot.guest?.fullName : "خالی"}`}
                          className={[
                            "flex h-8 items-center justify-center rounded-lg text-xs font-black text-white shadow-sm transition hover:scale-110 focus:outline-none focus:ring-4",
                            occupied
                              ? "bg-red-500 hover:bg-red-600 focus:ring-red-100"
                              : "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-100"
                          ].join(" ")}
                        >
                          {slot.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">آخرین رویدادها</h2>
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
    </main>
  );
}
