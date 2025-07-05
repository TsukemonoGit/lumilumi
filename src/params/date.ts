export function match(param: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return false;

  const [y, m, d] = param.split("-").map(Number);
  const date = new Date(y, m - 1, d); // JSの月は0始まり

  // 実際に指定した日と一致するか（JSが補正した日付との一致確認）
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
