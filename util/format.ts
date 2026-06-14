export const formatCurrency = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
export const formatCompactCurrency = (value: number) => `${(value / 10000).toFixed(0)}만원`;
export const formatDate = (value: string) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(value));
export const formatShortDate = (value: string) => value.slice(5).split("-").join(".");
