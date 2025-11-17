"use client"

import React, { useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LabelList
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, XCircle, CheckCircle2, LucideIcon } from 'lucide-react';
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { GlobalStats, ParsedData } from '@/app/types/query';
import Loader from '@/app/components/ui/Loader';
import { StatCardProps } from '@/app/types/props';


const page: React.FC = () => {
    const contractActions = useEscrowActions();

    // Use UseQueryResult to correctly type the hook return
    const { data, isLoading, isFetching, isError, refetch }: UseQueryResult<GlobalStats | null> = useQuery({
        queryKey: ["GlobalStats"],
        queryFn: () => contractActions.fetchGlobalStats(),
        staleTime: 1000 * 60 * 5,
    });

    // Data Transformation and Parsing (Memoized)
    const parsedData: ParsedData | null = useMemo(() => {
        console.log(data)
        if (!data) return null;

        const created = Number(data.totalEscrowsCreated);
        const completed = Number(data.totalEscrowsCompleted);
        const canceled = Number(data.totalEscrowsCanceled);
        const totalEscrows = created;
        const lockedValue = Number(data.totalValueLocked);
        const releasedValue = Number(data.totalValueReleased);

        return {
            totalEscrows,
            escrowStatusData: [
                { name: 'Completed', value: completed, color: 'hsl(142 71% 45%)', icon: CheckCircle2 },
                { name: 'Created (Active)', value: created, color: 'hsl(217 91% 60%)', icon: BarChart3 },
                { name: 'Canceled', value: canceled, color: 'hsl(0 84% 60%)', icon: XCircle },
            ].filter(item => item.value > 0),

            valueFlowData: [
                { name: 'Value Locked', value: lockedValue, color: 'hsl(217 91% 60%)' },
                { name: 'Value Released', value: releasedValue, color: 'hsl(142 71% 45%)' },
            ],
            rawStats: { created, completed, canceled, lockedValue, releasedValue }
        };
    }, [data]);

    // UI States
    if (isLoading) <Loader />

    if (isError || !data || !parsedData) {
        return (
            <div className="p-8 bg-red-50 border border-red-300 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-red-700">Error Fetching Data</h3>
                <p className="text-base text-red-600">
                    Failed to load global statistics. Please check if the **GlobalStats account has been initialized** on the network.
                </p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-5 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-md"
                >
                    Retry Fetch
                </button>
            </div>
        );
    }

    return (
        <div className="font-mono flex flex-col gap-4">
            <header className="flex justify-between items-center ">
                <h1 className="text-3xl font-extrabold  flex items-center">
                    {/* <BarChart3 className="w-8 h-8 mr-3 text--600" /> */}
                    Dashboard
                </h1>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className={` py-2 px-4 flex items-center gap-2 rounded-lg text-white transition-all transform hover:scale-[1.01] ${isFetching
                        ? 'bg-white/5  cursor-not-allowed'
                        : 'bg-violet-900/70'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-6 ${isFetching ? 'animate-spin' : ''}`}>
                        <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                    </svg>
                </button>
            </header>

            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Escrows"
                    value={parsedData.totalEscrows.toLocaleString()}
                    icon={BarChart3}
                    color="border-indigo-500"
                />
                <StatCard
                    title="Total Value Locked"
                    value={`${parsedData.rawStats.lockedValue.toFixed(0)} Units`}
                    icon={DollarSign}
                    color="border-red-500"
                />
                <StatCard
                    title="Total Value Released"
                    value={`${parsedData.rawStats.releasedValue.toFixed(0)} Units`}
                    icon={TrendingUp}
                    color="border-green-500"
                />
                <StatCard
                    title="Completed Escrows"
                    value={parsedData.rawStats.completed.toLocaleString()}
                    icon={CheckCircle2}
                    color="border-blue-500"
                />
            </div>

            {/* CHART GRIDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. ESCROW STATUS PIE CHART */}
                <ChartContainer title="Escrow Transaction Status">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                            <Pie
                                data={parsedData.escrowStatusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={140}
                                paddingAngle={5}
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {parsedData.escrowStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                // Tooltip formatter needs explicit typing from Recharts (usually 'any')
                                formatter={(value: any, name: any, props: any) => [`${(value as number).toLocaleString()} Escrows`, props.payload.name]}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '20px' }}
                                // iconType="square"
                                // Legend formatter to display icons
                                formatter={(value: string, entry: any) => (
                                    <span style={{ color: entry.color }} className="flex items-center flex-nowrap text-sm">
                                        <entry.payload.icon className="w-4 h-4 mr-1" />
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* 2. VALUE FLOW BAR CHART */}
                <ChartContainer title="Token Value Flow (Raw Tokens)">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={parsedData.valueFlowData}
                            margin={{ top: 30, right: 20, left: 20, bottom: 30 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151" // Subtle, dark grid lines
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af" // Light gray axis text
                                tickLine={false}
                                axisLine={{ stroke: '#4b5563' }} // Subtle axis line
                            />
                            <YAxis
                                stroke="#9ca3af" // Light gray axis text
                                domain={[0, 'auto']}
                                tickFormatter={(tick: number) => tick.toLocaleString()}
                                tickLine={false}
                                axisLine={{ stroke: '#4b5563' }} // Subtle axis line
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', backgroundColor: '#374151', border: '1px solid #4b5563' }}
                                labelStyle={{ color: '#fuchsia-400', fontWeight: 'bold' }}
                                itemStyle={{ color: '#f9fafb' }}
                                formatter={(value: number) => [value.toLocaleString(), 'Value']}
                            />
                            {/* Removed Legend as X-Axis is sufficient */}
                            <Bar
                                dataKey="value"
                                radius={[8, 8, 0, 0]}
                                minPointSize={5}
                            >
                                {parsedData.valueFlowData.map((entry, index) => (
                                    <Cell
                                        key={`bar-cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                                {/* Label list is now bright white */}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    className="text-sm font-bold"
                                    style={{ fill: 'white' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => (
    <div className={`bg-white/5 p-6 rounded-xl shadow-lg  flex items-center justify-between transition-shadow hover:shadow-xl`}>
        <div>
            <p className="text-sm font-medium text-gray-400 uppercase">{title}</p>
            <p className="text-3xl font-extrabold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-violet-900/70 rounded-full">
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

interface ChartContainerProps {
    title: string;
    children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
    <div className="bg-white/5 p-6 rounded-xl shadow-2xl h-[480px]">
        <h2 className="text-xl font-bold mb-4 ">{title}</h2>
        {children}
    </div>
);

export default page