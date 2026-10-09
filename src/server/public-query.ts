type Predicate =
  | { column: number; value: string }
  | { operator: "and" | "or"; left: Predicate; right: Predicate };
export function parsePublicQuery(query: string) {
  if (!query) return { columns: null, predicate: null };
  if (query.length > 400) throw new Error("Query too long");
  const tokens: string[] = [];
  const pattern =
    /\s*(select|where|and|or|[A-Z]+|\*|[(),=]|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/gy;
  let at = 0;
  while (at < query.length) {
    pattern.lastIndex = at;
    const match = pattern.exec(query);
    if (!match) {
      if (query.slice(at).trim() === "") break;
      throw new Error("Unsupported public query");
    }
    tokens.push(match[1]);
    at = pattern.lastIndex;
  }
  let index = 0;
  function take(expected?: string) {
    const token = tokens[index++];
    if (!token || (expected && token !== expected))
      throw new Error("Invalid public query");
    return token;
  }
  function column() {
    const token = take();
    if (!/^[A-Z]{1,2}$/.test(token)) throw new Error("Invalid column");
    return [...token].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  }
  take("select");
  const columns: number[] | null =
    tokens[index] === "*" ? (take("*"), null) : [column()];
  while (tokens[index] === ",") {
    take(",");
    if (!columns) throw new Error("Invalid projection");
    columns.push(column());
  }
  function atom(): Predicate {
    if (tokens[index] === "(") {
      take("(");
      const value = expression();
      take(")");
      return value;
    }
    const field = column();
    take("=");
    const literal = take();
    if (!/^["']/.test(literal)) throw new Error("Invalid comparison");
    const value = literal.startsWith('"')
      ? JSON.parse(literal)
      : literal.slice(1, -1).replace(/\\(.)/g, "$1");
    return { column: field, value };
  }
  function conjunction(): Predicate {
    let left = atom();
    while (tokens[index] === "and") {
      take("and");
      left = { operator: "and", left, right: atom() };
    }
    return left;
  }
  function expression(): Predicate {
    let left = conjunction();
    while (tokens[index] === "or") {
      take("or");
      left = { operator: "or", left, right: conjunction() };
    }
    return left;
  }
  const predicate =
    tokens[index] === "where" ? (take("where"), expression()) : null;
  if (index !== tokens.length) throw new Error("Unsupported query suffix");
  return { columns, predicate };
}
export function compilePredicate(
  predicate: Predicate | null,
  parameters: string[],
): string {
  if (!predicate) return "TRUE";
  if ("column" in predicate) {
    parameters.push(predicate.value);
    return `coalesce(cells->>${predicate.column},'')=$${parameters.length}`;
  }
  return `(${compilePredicate(predicate.left, parameters)} ${predicate.operator.toUpperCase()} ${compilePredicate(predicate.right, parameters)})`;
}
export function csvText(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          /[",\r\n]/.test(cell) ? '"' + cell.replaceAll('"', '""') + '"' : cell,
        )
        .join(","),
    )
    .join("\n");
}
