import { CATEGORIES, CATEGORY_IDS } from "../lib/categories";
import { useState, useEffect } from "react";

/** props:
 *  value: string[] (ids)
 *  onChange: (ids:string[])=>void
 */
export default function CategoryPicker({ value = [], onChange }) {
  const [sel, setSel] = useState(new Set(value));

  useEffect(() => { setSel(new Set(value)); }, [value]);

  function toggle(id) {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSel(next);
    onChange?.([...next].filter(v => CATEGORY_IDS.has(v)));
  }

  return (
    <div className="d-flex flex-wrap gap-2">
      {CATEGORIES.map(c => {
        const active = sel.has(c.id);
        return (
          <button
            type="button"
            key={c.id}
            className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => toggle(c.id)}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
