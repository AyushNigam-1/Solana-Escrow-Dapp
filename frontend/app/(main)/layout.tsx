import Navbar from '@/app/components/ui/Navbar';
import Sidebar from '../components/ui/Sidebar';
// import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='relative w-full h-screen overflow-hidden'>

            {/* 2. BLURRY BACKGROUND LAYER (Absolute, lowest Z-index) */}
            <div className="absolute inset-0 z-0">
                {/* Background Image Container */}
                <div
                    className="w-full h-full bg-[url('/bg.jpg')] bg-cover bg-center filter blur-md"
                >
                    {/* Optional: Add a subtle overlay for better text contrast */}
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
            </div>

            {/* 3. CONTENT LAYER (Relative/Flex, higher Z-index) */}
            {/* All main content goes here, ensuring it is positioned above the blur */}
            <div className="relative z-10 flex h-full">

                {/* Sidebar (Assume it handles its own height/z-index) */}
                <Sidebar />

                <div className="w-full flex flex-col">
                    <Navbar />
                    <main className='p-4 overflow-y-auto flex-1'>
                        {children} {/* Pages inside (app) render here */}
                    </main>
                </div>
            </div>
        </div>
    );
}