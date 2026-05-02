import Navbar from '@/components/Navbar'

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
