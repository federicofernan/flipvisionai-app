import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
