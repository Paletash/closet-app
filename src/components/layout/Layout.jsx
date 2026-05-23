import Navbar from './Navbar'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pb-24 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
