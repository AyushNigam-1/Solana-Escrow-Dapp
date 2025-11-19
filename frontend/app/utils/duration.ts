export function convertTimeToSeconds(value: number, unit: string): number | null {
    if (typeof value !== 'number' || value < 0) {
        console.error("Value must be a non-negative number.");
        return null;
    }
    const normalizedUnit = unit.toLowerCase();

    const SECONDS_IN_MINUTE = 60;
    const SECONDS_IN_HOUR = 3600;
    const SECONDS_IN_DAY = 86400;

    switch (normalizedUnit) {
        case 'sec':
            return value;
        case 'mins':
            return value * SECONDS_IN_MINUTE;
        case 'hours':
            return value * SECONDS_IN_HOUR;
        case 'days':
            return value * SECONDS_IN_DAY;
        default:
            console.error(`Invalid time unit provided: ${unit}.`);
            return null;
    }
}

export const formatExpiry = (timestamp: any): string => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}, ${hours}:${minutes}`;
};