export const engineFilters = {
    formatDate: (date: Date, format: string) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YY':
                return `${month}/${day}/${String(year).slice(-2)}`;
            case 'MMMM D, YYYY':
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            default:
                return `${year}-${month}-${day}`;
        }
    },
    formatCurrency: (amount: number, currency: string) => {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return formatter.format(amount);
    }
}
