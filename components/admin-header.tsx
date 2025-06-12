import Link from "next/link"

export function AdminHeader() {
  return (
    <header className="flex justify-between items-center py-4 mb-6 border-b">
      <h1 className="text-2xl font-bold">顔認識写真管理システム（管理画面）</h1>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <Link href="/admin/venues" className="text-primary hover:underline">
              会場管理
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
