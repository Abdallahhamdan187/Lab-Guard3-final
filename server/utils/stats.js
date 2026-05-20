export const calculatePercentageChange = (
    current,
    previous
) => {

    current = Number(current);
    previous = Number(previous);

    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Math.round(
        ((current - previous) / previous) * 100
    );
};