export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} zood的小破站. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Powered by Next.js & Supabase
          </p>
        </div>
      </div>
    </footer>
  )
}

