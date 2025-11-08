"use client"

import { useProgram } from '@/app/hooks/useProgram';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
const Navbar = () => {
    const router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };
    const { disconnect, publicKey } = useProgram();
    return (
        <nav className="bg-white/5 w-full font-mono">
            <div className=" flex flex-wrap items-center justify-between p-4">
                <div></div>
                <div className="flex items-center">
                    <button type="button" className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-purple-300 dark:focus:ring-gray-600" id="user-menu-button" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom" aria-expanded={isDropdownOpen}
                        onClick={toggleDropdown}>
                        <span className="sr-only">Open user menu</span>
                        <img className="w-8 h-8 rounded-full" src="https://flowbite.com/docs/images/people/profile-picture-3.jpg" alt="user photo" />
                    </button>
                    <div
                        className={`z-50 my-2 text-base list-none bg-gray-500/90 divide-y divide-gray-100 rounded-lg shadow-sm absolute right-4 top-16 
                                    ${isDropdownOpen ? 'block' : 'hidden'}`}
                        id="user-dropdown"
                    >
                        <ul className="px-4 py-4 space-y-4 " aria-labelledby="user-menu-button">
                            <li>
                                <p className="flex gap-2 items-center text-xl  text-gray-700  dark:text-gray-200 dark:hover:text-white"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                    {publicKey?.toString()?.slice(0, 15)}...</p>
                            </li>
                            <div className='bg-gray-400 w-full h-0.5 ' />
                            <li>
                                <button onClick={() => disconnect().then(() => router.push("/"))} className='p-2 bg-red-300/80 text-gray-900 rounded-lg mt-auto flex gap-2 items-center justify-center w-full'> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                </svg>
                                    Logout</button>
                            </li>
                        </ul>

                    </div>
                    <button data-collapse-toggle="navbar-user" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-user" aria-expanded="false">
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>

            </div>
        </nav>
    )
}

export default Navbar