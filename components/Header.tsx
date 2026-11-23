"use client";

import Link from "next/link";
import LazyLink from "@/components/LazyLink";
import Image from "next/image";
import UserAvatar from "./UserAvatar";
import {
  useAuthResolved,
  useIsAuthenticated,
  useProfile,
} from "@/store/userStore";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  siteHeaderAccountSlot,
  siteHeaderSurface,
  siteHeaderWordmarkTone,
} from "@/lib/layout";

const navItems = [
  { href: "/courses", label: "学习与实战", sections: ["/courses", "/learn"] },
  { href: "/interview", label: "面试题库", sections: ["/interview", "/question", "/mock-interview"] },
  { href: "/jobs", label: "岗位广场", sections: ["/jobs"] },
  { href: "/resume-agent", label: "简历优化", sections: ["/resume-agent"] },
];

export default function Header() {
  const authResolved = useAuthResolved();
  const isAuthenticated = useIsAuthenticated();
  const profile = useProfile();
  const pathname = usePathname();
  const [isHero, setIsHero] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const surface = siteHeaderSurface(pathname, isHero);
  const surfaceClass =
    surface === "hero"
      ? "site-header-hero"
      : surface === "dark"
        ? "site-header-dark"
        : "site-header-light";
  const onDarkWordmark = siteHeaderWordmarkTone(pathname) === "on-dark";
  const accountSlot = siteHeaderAccountSlot({ isAuthenticated, authResolved });

  useEffect(() => {
    const handleScroll = () => {
      // 当滚动高度小于视口高度时，视为在 Hero 区域
      // 减去一点缓冲距离让过渡更自然
      const showGlass = window.scrollY < window.innerHeight - 50;
      setIsHero(showGlass);
    };

    // 初始化检查
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 关闭移动端菜单
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileUserMenuOpen(false);
  };

  const activeItem = navItems.find(({ sections }) =>
    sections.some((section) => pathname === section || pathname.startsWith(section + "/")),
  );

  return (
    <header
      className={`${surfaceClass} fixed top-0 left-0 right-0 z-50 text-header-sky backdrop-blur-md transition-all duration-500`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={`flex min-w-0 items-center gap-2 transition-colors ${
              onDarkWordmark
                ? "text-white hover:text-sky-100"
                : "text-slate-900 hover:text-sky-800"
            }`}
            onClick={closeMobileMenu}
            aria-label="AI出海"
          >
            <Image
              src="/brand/zood-mark.png"
              alt=""
              width={690}
              height={748}
              className="h-9 w-auto sm:h-10"
              priority
            />
            <span className="truncate text-base font-black tracking-tight">AI出海</span>
          </Link>

          {/* 桌面端菜单 */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = item === activeItem;
              const tone = active
                ? surface === "light" ? "text-blue-700 after:bg-blue-600" : "text-white after:bg-sky-300"
                : surface === "light" ? "text-slate-600 hover:text-blue-700" : "text-header-sky hover:text-white";
              return (
                <LazyLink
                  key={item.href}
                  href={item.href}
                  aria-current={active ? (pathname === item.href ? "page" : "location") : undefined}
                  className={`relative py-1 transition-colors focus-visible:outline-offset-4 ${active ? "font-bold after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full" : "font-medium"} ${tone}`}
                >
                  {item.label}
                </LazyLink>
              );
            })}

            {/* 用户信息或登录按钮 */}
            {accountSlot === "pending" ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : (
              <UserAvatar />
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 text-inherit focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "关闭导航" : "打开导航"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 移动端菜单下拉内容 */}
        {isMobileMenuOpen && (
          <div className="site-header-drawer md:hidden absolute top-full left-0 right-0 max-h-[min(24rem,calc(100vh-var(--site-header-height)-4.5rem))] overflow-y-auto backdrop-blur-xl px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200">
            {navItems.map((item) => {
              const active = item === activeItem;
              return (
                <LazyLink
                  key={item.href}
                  href={item.href}
                  aria-current={active ? (pathname === item.href ? "page" : "location") : undefined}
                  onClick={closeMobileMenu}
                  className={`block rounded-lg px-3 py-2 text-lg transition-colors ${active ? "bg-blue-50 font-bold text-blue-700" : "font-medium text-slate-600 hover:text-sky-800"}`}
                >
                  {item.label}
                </LazyLink>
              );
            })}

            <div className="border-t border-slate-200/80 pt-4">
              {accountSlot === "pending" ? (
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ) : isAuthenticated && profile ? (
                // 移动端登录后展示用户信息和折叠菜单
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-between py-2"
                    onClick={() =>
                      setIsMobileUserMenuOpen(!isMobileUserMenuOpen)
                    }
                  >
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                          {(profile.display_name || profile.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-medium text-slate-900">
                          {profile.display_name || profile.username}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        isMobileUserMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* 折叠菜单内容 */}
                  {isMobileUserMenuOpen && (
                    <div className="pl-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      <LazyLink
                        href="/profile"
                        className="flex items-center gap-3 rounded-lg p-3 text-slate-700 transition-colors hover:bg-white"
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        个人中心
                      </LazyLink>

                      <LazyLink
                        href="/interview"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        面试记录
                      </LazyLink>

                      <LazyLink
                        href="/posts/create"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        写文章
                      </LazyLink>

                      <form action="/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors text-left"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          退出登录
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div onClick={closeMobileMenu}>
                  <UserAvatar />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
