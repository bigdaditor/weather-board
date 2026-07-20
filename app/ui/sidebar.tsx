"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/calendar", label: "캘린더" },
  { href: "/dashboard", label: "대시보드" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/"><span>W</span>웨더 보드</Link>
      <nav>
        {links.map((link) => (
          <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
