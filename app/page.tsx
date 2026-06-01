"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const facilities: any = {
    RVHC: {
      short: "RVHC",
      name: "Reo Vista Healthcare Center",
      address: "6061 Banbury St, San Diego, CA 92139",
      rates: { CNA: 32, LVN: 55, RN: 80 },
    },
    LMHC: {
      short: "LMHC",
      name: "La Mesa Healthcare Center",
      address: "3780 Massachusetts Ave, La Mesa, CA 91941",
      rates: { CNA: 33, LVN: 55, RN: 85 },
    },
    UCC: {
      short: "UCC",
      name: "University Care Center",
      address: "5602 University Ave, San Diego, CA 92105",
      rates: { CNA: 33, LVN: 58, RN: 85 },
    },
    LJPA: {
      short: "LJPA",
      name: "La Jolla Post Acute",
      address: "2552 Torrey Pines Rd, La Jolla, CA 92037",
      rates: { CNA: 32, LVN: 55, RN: 80 },
    },
    SFPA: {
      short: "SFPA",
      name: "Santa Fe Post Acute",
      address: "247 E. Bobier Drive, Vista, CA 92084",
      rates: { CNA: 30, LVN: 55, RN: 80 },
    },
    CW: {
      short: "CW",
      name: "Cottonwood Canyon Healthcare",
      address: "1391 Madison Ave, El Cajon, CA 92021",
      rates: { CNA: 32, LVN: 52, RN: 80 },
    },
  };

  const today = new Date();
  const defaultInvoice = `LSA-${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  const [facility, setFacility] = useState("RVHC");
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoice);
  const [invoicePeriod, setInvoicePeriod] = useState("May 1-15, 2026");

  const [date, setDate] = useState("");
  const [staff, setStaff] = useState("");
  const [role, setRole] = useState("LVN");
  const [shift, setShift] = useState("AM");
  const [clockIn, setClockIn] = useState("07:00");
  const [clockOut, setClockOut] = useState("15:30");
  const [breakMinutes, setBreakMinutes] = useState(30);

  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const currentFacility = facilities[facility];
  const autoRate = currentFacility.rates[role];

  function calculateTotalHours() {
    const [inHour, inMin] = clockIn.split(":").map(Number);
    const [outHour, outMin] = clockOut.split(":").map(Number);

    let start = inHour * 60 + inMin;
    let end = outHour * 60 + outMin;

    if (end <= start) end += 24 * 60;

    const workedMinutes = end - start - Number(breakMinutes);
    return Math.max(Number((workedMinutes / 60).toFixed(2)), 0);
  }

  function addShift() {
    if (!date || !staff) {
      alert("Please enter date and staff name.");
      return;
    }

    const totalHours = calculateTotalHours();
    const reg = Math.min(totalHours, 8);
    const remaining = Math.max(totalHours - 8, 0);
    const ot = Math.min(remaining, 4);
    const dt = Math.max(remaining - 4, 0);
    const shiftParts = shift.includes("/") ? shift.split("/") : [shift];

    const newRows: any[] = [
      {
        facility,
        date,
        staff: staff.toUpperCase(),
        role,
        shift: shiftParts[0],
        line: "REGULAR",
        clockIn,
        clockOut,
        breakMinutes,
        totalHours: reg,
        reg,
        ot: 0,
        dt: 0,
        rate: autoRate,
        total: reg * autoRate,
      },
    ];

    if (remaining > 0) {
      newRows.push({
        facility,
        date,
        staff: staff.toUpperCase(),
        role,
        shift: shiftParts[1] || shiftParts[0],
        line: "OT/DT",
        clockIn,
        clockOut,
        breakMinutes,
        totalHours: ot + dt,
        reg: 0,
        ot,
        dt,
        rate: autoRate,
        total: ot * autoRate * 1.5 + dt * autoRate * 2,
      });
    }

    setRows((prev) =>
      [...prev, ...newRows].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.staff.localeCompare(b.staff);
      })
    );

    setStaff("");
  }

  const visibleRows = useMemo(() => {
    return rows.filter((row) => row.facility === facility);
  }, [rows, facility]);

  const totals = useMemo(() => {
    return visibleRows.reduce(
      (acc, row) => {
        acc.totalHours += row.totalHours;
        acc.reg += row.reg;
        acc.ot += row.ot;
        acc.dt += row.dt;
        acc.total += row.total;
        return acc;
      },
      { totalHours: 0, reg: 0, ot: 0, dt: 0, total: 0 }
    );
  }, [visibleRows]);

  function deleteRow(index: number) {
    const rowToDelete = visibleRows[index];
    setRows(rows.filter((row) => row !== rowToDelete));
  }

  async function saveInvoice() {
    if (visibleRows.length === 0) {
      alert("Please add at least one shift before saving.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("invoice_records").insert([
      {
        invoice_number: invoiceNumber,
        facility,
        facility_name: currentFacility.name,
        invoice_period: invoicePeriod,
        total_hours: totals.totalHours,
        reg_hours: totals.reg,
        ot_hours: totals.ot,
        dt_hours: totals.dt,
        total_amount: totals.total,
        rows: visibleRows,
      },
    ]);

    setSaving(false);

    if (error) {
      alert("Error saving invoice: " + error.message);
      return;
    }

    alert("Invoice saved to database.");
  }

  function exportPDF() {
    const fileName = `${invoiceNumber}-${currentFacility.short}`;
    document.title = fileName;

    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <main className="min-h-screen bg-slate-200 p-8">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body,
          main {
            background: white !important;
            padding: 0 !important;
          }

          .invoice-paper {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
          }

          @page {
            size: landscape;
            margin: 0.35in;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="no-print bg-white rounded-3xl shadow-2xl border p-6">
          <h1 className="text-4xl font-black text-blue-700">
            Facility Invoice Generator
          </h1>

          <p className="text-slate-500 mt-2">
            Legal-style facility invoice with full time details.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold">Invoice Number</label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Facility</label>
              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              >
                {Object.entries(facilities).map(([key, value]: any) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Invoice Period</label>
              <input
                value={invoicePeriod}
                onChange={(e) => setInvoicePeriod(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              />
            </div>

            <hr />

            <div>
              <label className="text-sm font-bold">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Staff Name</label>
              <input
                placeholder="Staff Name"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                >
                  <option>CNA</option>
                  <option>LVN</option>
                  <option>RN</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold">Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                >
                  <option>AM</option>
                  <option>PM</option>
                  <option>NOC</option>
                  <option>AM/PM</option>
                  <option>PM/NOC</option>
                  <option>NOC/AM</option>
                  <option>AM/PM/NOC</option>
                </select>
              </div>
            </div>

            <div className="bg-emerald-100 rounded-2xl p-4">
              <p className="text-sm font-bold">Auto Rate</p>
              <p className="text-4xl font-black text-emerald-700">
                ${autoRate}/hr
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold">Clock In</label>
                <input
                  type="time"
                  value={clockIn}
                  onChange={(e) => setClockIn(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Clock Out</label>
                <input
                  type="time"
                  value={clockOut}
                  onChange={(e) => setClockOut(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold">Break Duration Minutes</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full border rounded-xl p-3 mt-1"
              />
            </div>

            <button
              type="button"
              onClick={addShift}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-xl py-4 rounded-2xl"
            >
              Add Shift
            </button>

            <button
              type="button"
              onClick={saveInvoice}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-black text-white font-black text-xl py-4 rounded-2xl"
            >
              {saving ? "Saving..." : "Save Invoice to Database"}
            </button>

            <button
              type="button"
              onClick={exportPDF}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl py-4 rounded-2xl shadow-lg"
            >
              Export / Save PDF
            </button>
          </div>
        </section>

        <section className="invoice-paper lg:col-span-2 bg-white rounded-3xl shadow-2xl border p-8">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-5">
            <div>
              <h1 className="text-6xl font-black text-blue-700">
                LIGHT STAFFING AGENCY
              </h1>
              <p className="text-sm mt-2">
                579 9th St, Imperial Beach, CA 91932
              </p>
              <p className="text-sm text-slate-500">
                Professional Healthcare Staffing Services
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-5xl font-black">INVOICE</h2>
              <p className="font-bold mt-3">{invoiceNumber}</p>
              <p>{invoicePeriod}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-100 rounded-2xl p-6">
              <p className="text-sm font-bold text-slate-500">BILL TO</p>
              <h3 className="text-4xl font-black mt-2">
                {currentFacility.name}
              </h3>
              <p className="mt-2">{currentFacility.address}</p>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-6 text-white">
              <p className="font-bold">TOTAL AMOUNT DUE</p>
              <h2 className="text-7xl font-black mt-4">
                ${totals.total.toFixed(2)}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="border rounded-2xl p-4">
              <p className="font-bold text-sm">TOTAL HOURS</p>
              <p className="text-4xl font-black">
                {totals.totalHours.toFixed(2)}
              </p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="font-bold text-sm">REG HOURS</p>
              <p className="text-4xl font-black">{totals.reg.toFixed(2)}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="font-bold text-sm">OT HOURS</p>
              <p className="text-4xl font-black">{totals.ot.toFixed(2)}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="font-bold text-sm">DT HOURS</p>
              <p className="text-4xl font-black">{totals.dt.toFixed(2)}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="font-bold text-sm">FILE NAME</p>
              <p className="text-lg font-black">
                {invoiceNumber}-{currentFacility.short}
              </p>
            </div>
          </div>

          <div className="overflow-auto mt-8">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Staff</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Shift</th>
                  <th className="p-3 text-left">Line</th>
                  <th className="p-3 text-left">Clock In</th>
                  <th className="p-3 text-left">Clock Out</th>
                  <th className="p-3 text-left">Break</th>
                  <th className="p-3 text-left">Hours</th>
                  <th className="p-3 text-left">Reg</th>
                  <th className="p-3 text-left">OT</th>
                  <th className="p-3 text-left">DT</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left no-print">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3 font-bold">{row.staff}</td>
                    <td className="p-3">{row.role}</td>
                    <td className="p-3 font-bold">{row.shift}</td>
                    <td className="p-3">{row.line}</td>
                    <td className="p-3">{row.clockIn}</td>
                    <td className="p-3">{row.clockOut}</td>
                    <td className="p-3">{row.breakMinutes} min</td>
                    <td className="p-3">{row.totalHours.toFixed(2)}</td>
                    <td className="p-3">{row.reg.toFixed(2)}</td>
                    <td className="p-3">{row.ot.toFixed(2)}</td>
                    <td className="p-3">{row.dt.toFixed(2)}</td>
                    <td className="p-3">${row.rate}/hr</td>
                    <td className="p-3 font-black">${row.total.toFixed(2)}</td>
                    <td className="p-3 no-print">
                      <button
                        type="button"
                        onClick={() => deleteRow(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-4 border-slate-900 mt-8 pt-5 flex justify-between">
            <div>
              <p className="font-bold">Prepared by Light Staffing Agency</p>
              <p className="text-sm text-slate-500">
                Invoice includes clock in, clock out, break duration, REG, OT,
                DT, rate, and total amount.
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">TOTAL AMOUNT DUE</p>
              <h1 className="text-6xl font-black text-emerald-600">
                ${totals.total.toFixed(2)}
              </h1>
            </div>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={exportPDF}
        className="no-print fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl text-2xl font-black shadow-2xl"
      >
        Export / Save PDF
      </button>
    </main>
  );
}