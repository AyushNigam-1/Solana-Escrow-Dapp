import Navbar from '@/app/components/ui/Navbar';
import Sidebar from '../components/ui/Sidebar';
import { Slide, ToastContainer } from 'react-toastify';

export default function AppLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='relative w-full h-screen overflow-hidden'>
            {/* 2. BLURRY BACKGROUND LAYER (Absolute, lowest Z-index) */}
            <div className="relative z-10 flex h-full">
                <Sidebar />
                <div className="w-full flex flex-col">
                    <Navbar />
                    <main className='p-4 overflow-y-auto flex-1'>
                        {children}
                    </main>
                </div>
            </div>
            <ToastContainer position="top-center" transition={Slide} theme='dark' />

        </div>
    );
}