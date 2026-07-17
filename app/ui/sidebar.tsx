"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/calendar", label: "캘린더" },
  { href: "/", label: "대시보드" },
  { href: "/weather", label: "날씨별 매출" },
  { href: "/sales", label: "매출 내역" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/"><span>W</span> Weather Sales</Link>
      <nav>
        {links.map((link) => (
          <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <strong>서울특별시</strong>
        <span>날씨 데이터 동기화됨</span>
      </div>
    </aside>
  );
}
