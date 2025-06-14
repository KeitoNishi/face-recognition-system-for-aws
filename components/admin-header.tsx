import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function AdminHeader() {
  return (
    <header className="flex justify-between items-center py-4 mb-6 border-b">
      <h1 className="text-2xl font-bold">学会フォトギャラリー顔認証（管理画面）</h1>
      <nav>
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link href="/admin/venues">
            <Settings className="h-4 w-4" />
            会場管理
          </Link>
        </Button>
      </nav>
    </header>
  )
}
