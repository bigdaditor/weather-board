"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/calendar", label: "캘린더", icon: "calendar" },
  { href: "/dashboard", label: "대시보드", icon: "chart" },
];

function NavIcon({ name }: { name: string }) {
  if (name === "calendar") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 19V10M12 19V5M19 19v-7M3 19h18" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span aria-hidden="true">
          <svg viewBox="0 0 28 28"><path d="M8.1 17.5a6.7 6.7 0 0 1 12.3-4.8 4.3 4.3 0 1 1 .3 8.6H8.4a3 3 0 0 1-.3-6" /></svg>
        </span>
        <span className="brand-copy"><strong>웨더보드</strong><small>날씨 매출 관리</small></span>
      </Link>
      <nav>
        {links.map((link) => (
          <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href}>
            <NavIcon name={link.icon} />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-status">
        <span aria-hidden="true" />
        <div><strong>데이터 연결됨</strong><small>서울 · 실시간 날씨</small></div>
      </div>
    </aside>
  );
}
