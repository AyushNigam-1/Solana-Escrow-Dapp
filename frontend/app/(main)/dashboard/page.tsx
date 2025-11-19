"use client"

import React, { useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LabelList,
    Line,
    LineChart
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, XCircle, CheckCircle2, LucideIcon, Calendar } from 'lucide-react';
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { GlobalStats, ParsedData } from '@/app/types/query';
import Loader from '@/app/components/ui/Loader';
import { ChartContainerProps, StatCardProps } from '@/app/types/props';
import axios from 'axios';
import Error from '@/app/components/ui/Error';

const page: React.FC = () => {
    const contractActions = useEscrowActions();
    const API_BASE = "http://localhost:3000"

    const { data, isLoading, isFetching, refetch, isError }: UseQueryResult<GlobalStats | null> = useQuery({
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
    return (
        <div className="font-mono flex flex-col gap-4">
            {isLoading || isFetching ? (
                <Loader />
            ) :
                (isError) ? (
                    <Error refetch={refetch} />
                ) :
                    (data && parsedData) ? <>
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
                                        margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
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
                        <div className="bg-white/5 p-4 rounded-lg">
                            {/* <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    Daily Creation Trend
                </h2> */}
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={data.daily_creations}
                                    margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                                >
                                    {/* <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> */}
                                    <XAxis
                                        dataKey="date"
                                        stroke="white"
                                        tick={{ fontSize: 10 }}
                                        // Only show every Nth label to prevent clutter on long time series
                                        tickFormatter={(value, index) => (data.daily_creations.length > 10 && index % 2 !== 0) ? '' : value}
                                    />

                                    <YAxis stroke="white" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        formatter={(value) => [`${value.toLocaleString()} Creations`, 'Count']}
                                    />
                                    <Legend />
                                    {/* Line component is used here */}
                                    <Line
                                        type="monotone" // Smooth curve
                                        dataKey="count"
                                        name="No. of New Escrows Created"
                                        stroke="#9c7bf1" // Indigo color for the line
                                        strokeWidth={2}
                                        dot={{ fill: '#9c7bf1', r: 4 }} // Highlight data points
                                        activeDot={{ r: 8 }} // Larger dot on hover
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            {data.daily_creations.length === 0 && (
                                <p className="text-center text-gray-500 mt-4">No daily creation data to display.</p>
                            )}
                        </div>
                    </> : <p className='text-center col-span-4 text-gray-400 text-2xl'>No statistics available </p>}
        </div>
    );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => (
    <div className={`bg-white/5 p-4 rounded-xl shadow-lg  flex items-center justify-between transition-shadow hover:shadow-xl`}>
        <div>
            <p className="text-sm font-medium text-gray-400 uppercase">{title}</p>
            <p className="text-2xl font-extrabold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-violet-900/70 rounded-full">
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
    <div className="bg-white/5 p-4 rounded-xl shadow-2xl h-[412px]">
        <h2 className="text-lg font-bold mb-2 ">{title}</h2>
        {children}
    </div>
);

export default page