"use client";

import Link from "next/link";
import UserAvatar from "./UserAvatar";
import {
  useIsLoading,
  useIsAuthenticated,
  useProfile,
} from "@/store/userStore";
import { useEffect, useState } from "react";

export default function Header() {
  const isLoading = useIsLoading();
  const isAuthenticated = useIsAuthenticated();
  const profile = useProfile();
  const [isHero, setIsHero] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);

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

  const linkClass = "text-blue-500 hover:text-blue-600 transition-colors";

  const mobileLinkClass =
    "block py-2 text-blue-500 hover:text-blue-600 transition-colors text-lg font-medium";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-black/0 backdrop-blur-md border-b border-white/10 text-blue-500`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-500"
            onClick={closeMobileMenu}
          >
            zood的小破站
          </Link>

          {/* 桌面端菜单 */}
          <div className="hidden md:flex items-center gap-6">
            {/* <Link href="/" className={linkClass}>
              首页
            </Link> */}
            <Link href="/courses" className={linkClass}>
              学web3
            </Link>
            <Link href="/interview" className={linkClass}>
              面试题库
            </Link>
            <Link href="/faucet" className={linkClass}>
              领测试币
            </Link>

            {/* 用户信息或登录按钮 */}
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : (
              <UserAvatar isHero={isHero} />
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 text-inherit focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200">
            <Link
              href="/courses"
              className={mobileLinkClass}
              onClick={closeMobileMenu}
            >
              学web3
            </Link>
            <Link
              href="/interview"
              className={mobileLinkClass}
              onClick={closeMobileMenu}
            >
              面试提升
            </Link>
            <Link
              href="/faucet"
              className={mobileLinkClass}
              onClick={closeMobileMenu}
            >
              领测试币
            </Link>
            {/* <Link href="/categories" className={mobileLinkClass} onClick={closeMobileMenu}>
              分类
            </Link> */}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {isLoading ? (
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
                        <div className="font-medium text-gray-900 dark:text-white">
                          {profile.display_name || profile.username}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
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
                      <Link
                        href="/profile"
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        个人中心
                      </Link>

                      <Link
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
                      </Link>

                      <Link
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
                      </Link>

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
                // 在移动端菜单中，背景是白色的，所以 isHero 传 false 以使用深色文字
                <div onClick={closeMobileMenu}>
                  <UserAvatar isHero={false} />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
