export const formatIndianCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';

    // Fix float drift only (e.g. 2998.9999999 → 2999), preserve real decimals
    const fixed = parseFloat(num.toFixed(2));

    const [intPart, decPart] = fixed.toString().split('.');

    // Format integer part with Indian comma system
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
        : last3;

    return decPart && decPart !== '00' ? `${formatted}.${decPart}` : formatted;
};