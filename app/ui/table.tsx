export function DataTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: string[];
  rows: string[][];
  onRowClick?: (index: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr
            className={onRowClick ? "clickable-row" : undefined}
            key={index}
            onClick={() => onRowClick?.(index)}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={(event) => {
              if (onRowClick && (event.key === "Enter" || event.key === " ")) onRowClick(index);
            }}
          >
            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
