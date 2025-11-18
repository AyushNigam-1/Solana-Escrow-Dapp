import { TableHeaderProps } from '@/app/types/props'
import React from 'react'

const TableHeaders = ({ columns }: { columns: TableHeaderProps[] }) => {
    return (
        <thead className="text-sm text-body bg-white/5  rounded-base border-2 border-b-0 border-white/5">
            <tr>
                {
                    columns.map(column => {
                        return (
                            <th key={column.title} scope="col" className="px-6 py-3 font-bold   text-lg w-1/5">
                                <div className='flex items-center gap-2'>
                                    {column.icon}
                                    {column.title}
                                </div>
                            </th>
                        )
                    })
                }
            </tr>
        </thead>
    )
}

export default TableHeaders