import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase.ts";
import { Input } from "../ui/Input.tsx";
import { Select } from "../ui/Select.tsx";
import { useCampaignStore } from "../../store/campaignStore";

// Types

type FilterOperator = ">=" | "<=" | "present" | "not-present" | "contains" | "is";

interface Filter {
  id: number;
  column: string;
  operator: FilterOperator;
  value: string;
}

type Row = Record<string, string | number | null>;

interface SupabaseTableProps {
  tableName: string;
  children?: (filteredData: Row[]) => React.ReactNode;
}

// Utils

const formatHeader = (key: string) =>
  key.replace(/_/g, " ").replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));

export default function SupabaseTable({ tableName, children }: SupabaseTableProps) {
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const [data, setData] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [textColumns, setTextColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [nextId, setNextId] = useState(1);
  const [activeSuggestions, setActiveSuggestions] = useState<{ id: number; suggestions: string[] } | null>(null);

  // Fetch table schema + data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: columnMeta } = await supabase.rpc("get_table_information", {
          target_table: tableName,
        });

        const allowedColumns = columnMeta.map((col: { column_name: string }) => col.column_name);
        const { data: rows } = await supabase.from(tableName).select(allowedColumns.join(","));

        if (rows?.length) {
          const numeric = allowedColumns.filter((col) => {
            const val = rows[0][col];
            return typeof val === "number" || (!isNaN(Number(val)) && val !== null);
          });

          const text = allowedColumns.filter((col) => !numeric.includes(col));

          setNumericColumns(numeric);
          setTextColumns(text);
          setColumns([...text, ...numeric]);
          setData(rows);
        } else {
          setColumns(allowedColumns);
          setTextColumns(allowedColumns);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  // Load saved filters from Supabase
useEffect(() => {
  const loadFilters = async () => {
    if (!currentCampaign?.id) {
      console.log("[Filter Load] No campaign ID available. Skipping filter load.");
      return;
    }

    console.log(`[Filter Load] Fetching filters for campaign ID: ${currentCampaign.id}`);

    const { data, error } = await supabase
      .from("campaigns")
      .select("table_filters")
      .eq("id", currentCampaign.id)
      .single();

    if (error) {
      console.error("[Filter Load] Error loading saved filters:", error);
      return;
    }

    console.log("[Filter Load] Supabase response:", data);

    try {
      const savedFilters = data?.table_filters as Omit<Filter, "id">[] | null;

      if (Array.isArray(savedFilters)) {
        console.log("[Filter Load] Parsed filters:", savedFilters);
        const withIds = savedFilters.map((f, i) => ({ id: i + 1, ...f }));
        setFilters(withIds);
        setNextId(withIds.length + 1);
      } else {
        console.log("[Filter Load] No valid filters found in table_filters column.");
      }
    } catch (e) {
      console.error("[Filter Load] Failed to parse saved filters:", e);
    }
  };

  loadFilters();
}, [currentCampaign?.id]);  


  // Save filters to Supabase
  useEffect(() => {
    const timeout = setTimeout(() => {
      const saveFilters = async () => {
        if (!currentCampaign?.id) return;
        const payload = filters.map(({ id, ...f }) => f);

        const { error } = await supabase
          .from("campaigns")
          .update({ table_filters: payload })
          .eq("id", currentCampaign.id);

        if (error) console.error("Failed to save filters:", error);
        // Optional: sync Zustand copy
        // setCurrentCampaign({ ...currentCampaign, table_filters: payload });
      };

      if (filters.length > 0 || currentCampaign?.table_filters) {
        saveFilters();
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [filters, currentCampaign?.id]);

  // Filtering logic
  const getColumnValues = (column: string) => {
    const values = new Set<string>();
    data.forEach((row) => {
      const val = row[column];
      if (val !== null && val !== undefined) values.add(String(val));
    });
    return Array.from(values).sort();
  };

  const addFilter = () => {
    const availableColumns = [...numericColumns, ...textColumns];
    if (!availableColumns.length) return;
    setFilters((f) => [
      ...f,
      {
        id: nextId,
        column: availableColumns[0],
        operator: numericColumns.includes(availableColumns[0]) ? ">=" : "contains",
        value: "",
      },
    ]);
    setNextId((id) => id + 1);
  };

  const updateFilter = (id: number, field: keyof Filter, value: string) => {
    setFilters((f) => f.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter)));
  };

  const removeFilter = (id: number) => setFilters((f) => f.filter((filter) => filter.id !== id));
  const clearAllFilters = () => setFilters([]);
  const showSuggestions = (filterId: number, column: string) =>
    setActiveSuggestions({ id: filterId, suggestions: getColumnValues(column) });
  const selectSuggestion = (filterId: number, value: string) => {
    setFilters((f) => f.map((filter) => (filter.id === filterId ? { ...filter, value } : filter)));
    setActiveSuggestions(null);
  };

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      filters.every(({ column, operator, value }) => {
        const cellVal = row[column];
        const strVal = cellVal !== null ? String(cellVal) : null;

        switch (operator) {
          case "present":
            return cellVal !== null && cellVal !== "" && cellVal != 0;
          case "not-present":
            return cellVal === null || cellVal === "" || cellVal == 0;
          case "contains":
            return strVal?.toLowerCase().includes(value.toLowerCase()) ?? false;
          case "is":
            return strVal === value;
          case ">=":
          case "<=":
            if (!value.trim()) return true;
            const numVal = parseFloat(value);
            const numericCellVal = typeof cellVal === "string" ? parseFloat(cellVal) : Number(cellVal);
            if (isNaN(numVal) || isNaN(numericCellVal)) return false;
            return operator === ">=" ? numericCellVal >= numVal : numericCellVal <= numVal;
          default:
            return true;
        }
      })
    );
  }, [data, filters]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (data.length === 0) return <div className="p-4">No data available</div>;

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-700">Filters</h3>
          <div className="flex gap-2">
            {filters.length > 0 && (
              <button onClick={clearAllFilters} className="text-sm text-gray-600 hover:underline">
                Clear All
              </button>
            )}
            <button
              onClick={addFilter}
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md"
            >
              + Add Filter
            </button>
          </div>
        </div>

        {filters.map((filter) => {
          const isNumeric = numericColumns.includes(filter.column);
          const isText = textColumns.includes(filter.column);

          return (
            <div key={filter.id} className="flex items-center gap-2 flex-wrap">
              <Select
                value={filter.column}
                onChange={(e) => {
                  updateFilter(filter.id, "column", e.target.value);
                  updateFilter(filter.id, "operator", numericColumns.includes(e.target.value) ? ">=" : "contains");
                }}
                className="w-40"
              >
                {[...numericColumns, ...textColumns].map((col) => (
                  <option key={col} value={col}>
                    {formatHeader(col)}
                  </option>
                ))}
              </Select>

              <Select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, "operator", e.target.value as FilterOperator)}
                className="w-40"
              >
                {isNumeric && (
                  <>
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                  </>
                )}
                <option value="present">Present</option>
                <option value="not-present">Not present</option>
                {isText && (
                  <>
                    <option value="contains">Contains</option>
                    <option value="is">Is exactly</option>
                  </>
                )}
              </Select>

              {(filter.operator === ">=" || filter.operator === "<=") && (
                <Input
                  type="number"
                  placeholder="Value"
                  className="w-32"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                />
              )}

              {(filter.operator === "contains" || filter.operator === "is") && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={filter.operator === "contains" ? "Contains..." : "Is exactly..."}
                    className="w-48"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                    onFocus={() => filter.operator === "is" && showSuggestions(filter.id, filter.column)}
                  />
                  {activeSuggestions?.id === filter.id && (
                    <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {activeSuggestions.suggestions
                        .filter((s) => s.toLowerCase().includes(filter.value.toLowerCase()))
                        .map((s) => (
                          <div
                            key={s}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectSuggestion(filter.id, s)}
                          >
                            {s}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => removeFilter(filter.id)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label="Remove filter"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {children && <div className="mb-4">{children(filteredData)}</div>}

      <div className="mb-2 text-sm text-gray-600">
        Showing {filteredData.length} of {data.length} records{filters.length > 0 && " (filtered)"}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="h-[600px] overflow-y-auto">
            <table className="w-full bg-white" style={{ tableLayout: "fixed", fontSize: "0.875rem" }}>
              <colgroup>
                {columns.map((col) => (
                  <col key={col} style={{ width: `${100 / columns.length}%`, minWidth: "80px" }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="p-2 text-left truncate border-b border-gray-200"
                      title={formatHeader(col)}
                    >
                      {formatHeader(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={col} className="p-2 truncate align-top" title={String(row[col] ?? "—")}>
                          {row[col] !== null ? String(row[col]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-3 text-center text-gray-500">
                      No matching records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
