export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} zood的小破站. All rights reserved.</p>
          <p className="mt-2 text-sm">
            <img src="/beian.png" alt="浙ICP备2025216285号-1" className="w-4 h-4 inline-block mr-1" />
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            浙ICP备2025216285号-1
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

