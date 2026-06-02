"use client";

import { useEffect, useState } from "react";

type Row = {
  staffName: string;
  role: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  notes: string;
};

const blankRow: Row = {
  staffName: "",
  role: "CNA",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
  notes: "",
};

export default function Home() {
  const [weekCovered, setWeekCovered] = useState("June 1 - June 7, 2026");
  const [preparedBy, setPreparedBy] = useState("");
  const [rows, setRows] = useState<Row[]>([blankRow]);

  useEffect(() => {
    const saved = localStorage.getItem("lsa-general-weekly-calendar");
    if (saved) {
      const data = JSON.parse(saved);
      setWeekCovered(data.weekCovered || "June 1 - June 7, 2026");
      setPreparedBy(data.preparedBy || "");
      setRows(data.rows || [blankRow]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "lsa-general-weekly-calendar",
      JSON.stringify({ weekCovered, preparedBy, rows })
    );
  }, [weekCovered, preparedBy, rows]);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const addRow = () => setRows([...rows, blankRow]);

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const exportPDF = () => {
    const cleanWeek = weekCovered
      .replaceAll(" ", "_")
      .replaceAll(",", "")
      .replaceAll("/", "-");

    document.title = `Light_Staffing_Weekly_Availability_${cleanWeek}`;
    window.print();
  };

  const copyMessage = () => {
    const message =
      `Good morning,\n\nPlease see staff availability for the week of ${weekCovered}.\n\n` +
      rows
        .filter((r) => r.staffName.trim() !== "")
        .map(
          (r) =>
            `${r.staffName} - ${r.role}\n` +
            `Mon: ${r.monday || "-"} | Tue: ${r.tuesday || "-"} | Wed: ${
              r.wednesday || "-"
            } | Thu: ${r.thursday || "-"} | Fri: ${
              r.friday || "-"
            } | Sat: ${r.saturday || "-"} | Sun: ${r.sunday || "-"}\n` +
            `Notes: ${r.notes || "-"}`
        )
        .join("\n\n") +
      `\n\nThank you,\nLight Staffing Agency`;

    navigator.clipboard.writeText(message);
    alert("Schedule message copied.");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white">
      <style>{`
        @page {
          size: landscape;
          margin: 0.35in;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          .print-card {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          table {
            width: 100% !important;
            table-layout: fixed !important;
            font-size: 11px !important;
          }

          th {
            font-size: 11px !important;
            padding: 6px 4px !important;
            color: white !important;
          }

          td {
            padding: 4px !important;
            height: 34px !important;
          }

          input,
          select {
            border: none !important;
            background: transparent !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            color: black !important;
            padding: 0 !important;
          }

          input::placeholder {
            color: transparent !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-card mx-auto max-w-7xl bg-white rounded-xl shadow p-6">
        <div className="border-b border-gray-300 pb-4 mb-5">
          <h1 className="text-3xl font-bold text-blue-700">
            Light Staffing Agency
          </h1>
          <p className="text-gray-700 font-semibold">
            Weekly Staff Availability Calendar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Week Covered
            </label>
            <input
              value={weekCovered}
              onChange={(e) => setWeekCovered(e.target.value)}
              placeholder="June 1 - June 7, 2026"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Prepared By
            </label>
            <input
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="VA Name"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-5 no-print">
          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            + Add Staff
          </button>

          <button
            onClick={copyMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Copy Message
          </button>

          <button
            onClick={exportPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Export PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="border border-blue-800 p-2 w-[15%]">
                  Staff Name
                </th>
                <th className="border border-blue-800 p-2 w-[7%]">Role</th>
                <th className="border border-blue-800 p-2">Monday</th>
                <th className="border border-blue-800 p-2">Tuesday</th>
                <th className="border border-blue-800 p-2">Wednesday</th>
                <th className="border border-blue-800 p-2">Thursday</th>
                <th className="border border-blue-800 p-2">Friday</th>
                <th className="border border-blue-800 p-2">Saturday</th>
                <th className="border border-blue-800 p-2">Sunday</th>
                <th className="border border-blue-800 p-2 w-[14%]">Notes</th>
                <th className="border border-blue-800 p-2 no-print w-[7%]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="even:bg-slate-50">
                  <td className="border p-2">
                    <input
                      value={row.staffName}
                      onChange={(e) =>
                        updateRow(index, "staffName", e.target.value)
                      }
                      placeholder="Staff Name"
                      className="w-full border rounded p-2 font-medium"
                    />
                  </td>

                  <td className="border p-2">
                    <select
                      value={row.role}
                      onChange={(e) =>
                        updateRow(index, "role", e.target.value)
                      }
                      className="w-full border rounded p-2 font-medium"
                    >
                      <option>CNA</option>
                      <option>LVN</option>
                      <option>RN</option>
                    </select>
                  </td>

                  {[
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ].map((day) => (
                    <td className="border p-2" key={day}>
                      <select
                        value={row[day as keyof Row]}
                        onChange={(e) =>
                          updateRow(index, day as keyof Row, e.target.value)
                        }
                        className="w-full border rounded p-2 font-semibold"
                      >
                        <option value="">-</option>
                        <option>AM</option>
                        <option>PM</option>
                        <option>NOC</option>
                        <option>AM/PM</option>
                        <option>PM/NOC</option>
                        <option>AM/NOC</option>
                        <option>Available</option>
                        <option>Off</option>
                      </select>
                    </td>
                  ))}

                  <td className="border p-2">
                    <input
                      value={row.notes}
                      onChange={(e) =>
                        updateRow(index, "notes", e.target.value)
                      }
                      placeholder="Notes"
                      className="w-full border rounded p-2 font-medium"
                    />
                  </td>

                  <td className="border p-2 no-print">
                    <button
                      onClick={() => removeRow(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t border-gray-300 pt-4 text-sm text-gray-700">
          <p className="font-bold text-gray-900">Scheduling Notes</p>
          <p>
            Availability listed above was provided for scheduling coordination
            and is subject to final confirmation by Light Staffing Agency.
          </p>

          <p className="mt-3 font-medium">
            Light Staffing Agency | hrd.lightstaffingagency@gmail.com |
            lightstaffing.agency
          </p>
        </div>
      </div>
    </main>
  );
}