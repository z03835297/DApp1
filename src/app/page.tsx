import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 主要内容区域 */}
      </main>
    </div>
  );
}
