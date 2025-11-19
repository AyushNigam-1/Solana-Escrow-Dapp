import React from 'react'

const Error = ({ refetch }: { refetch: () => void }) => {
    return (
        <div className="p-8  rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>


            <h3 className="text-2xl font-bold ">Something went wrong !</h3>
            <button
                onClick={() => refetch()}
                className="mt-4 px-5 py-2 bg-violet-400 text-white font-medium rounded-xl  transition-colors shadow-md flex gap-2 items-center hover:bg-violet-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>

                Try Again
            </button>
        </div>)
}

export default Error