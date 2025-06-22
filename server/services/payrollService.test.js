const { calculateNSSF, calculateSHIF, calculateAHL, calculatePAYE } = require('./payrollService'); // Assuming direct export for testing

// Mock getPayrollSettings or pass rates directly if functions are pure
const defaultSettings = {
    nssfRates: {
        tier1_lel: 8000,
        tier1_rate: 0.06,
        tier1_employee_contribution: 480,
        tier1_employer_contribution: 480,
        tier2_uel: 72000,
        tier2_rate: 0.06,
    },
    shifRates: {
        rate: 0.0275,
        minimum_contribution: 300,
    },
    ahlRates: {
        employee_rate: 0.015,
        employer_rate: 0.015,
    },
    taxBands: [
        { upto: 24000, rate: 0.10 },
        { upto: 8333, rate: 0.25 },
        { upto: 467667, rate: 0.30 },
        { upto: 300000, rate: 0.325 },
        { upto: Infinity, rate: 0.35 }
    ],
    personalRelief: 2400,
};

describe('Payroll Calculation Service', () => {
    describe('calculateNSSF', () => {
        const nssfRates = defaultSettings.nssfRates;

        test('should calculate Tier I correctly for earnings below LEL', () => {
            const { employee, employer } = calculateNSSF(7000, nssfRates);
            expect(employee).toBe(480);
            expect(employer).toBe(480);
        });

        test('should calculate Tier I & II correctly for earnings between LEL and UEL', () => {
            // Pensionable earnings: 40,000
            // Tier I: 480
            // Tier II: (40000 - 8000) * 0.06 = 32000 * 0.06 = 1920
            // Total: 480 + 1920 = 2400
            const { employee, employer } = calculateNSSF(40000, nssfRates);
            expect(employee).toBe(2400);
            expect(employer).toBe(2400);
        });

        test('should calculate NSSF correctly for earnings at UEL', () => {
            // Pensionable earnings: 72,000
            // Tier I: 480
            // Tier II: (72000 - 8000) * 0.06 = 64000 * 0.06 = 3840
            // Total: 480 + 3840 = 4320
            const { employee, employer } = calculateNSSF(72000, nssfRates);
            expect(employee).toBe(4320);
            expect(employer).toBe(4320);
        });

        test('should cap NSSF at UEL for earnings above UEL', () => {
            const { employee, employer } = calculateNSSF(100000, nssfRates);
            expect(employee).toBe(4320); // Max NSSF
            expect(employer).toBe(4320); // Max NSSF
        });

        test('should calculate Tier I correctly for earnings at LEL', () => {
            const { employee, employer } = calculateNSSF(8000, nssfRates);
            expect(employee).toBe(480);
            expect(employer).toBe(480);
        });
         test('should handle zero pensionable earnings', () => {
            const { employee, employer } = calculateNSSF(0, nssfRates);
            // Tier I is a fixed 480 if LEL is met, but how it works for 0 needs clarification from KRA.
            // Assuming NSSF is not applicable or Tier I minimums apply if employee is registered.
            // For calculation purity, based on logic: Tier I is fixed, Tier II is 0.
            // However, NSSF is typically on *pensionable earnings*. If 0, it usually implies 0.
            // The current code always adds Tier I fixed amount. This test reflects the code.
            // If earnings are 0, Tier 1 still applies based on current func.
            // However, in reality, if pensionable_earnings = 0, NSSF should be 0.
            // The problem states "6% of employee's pensionable earnings".
            // Let's adjust calculateNSSF to handle 0 pensionable earnings = 0 NSSF.
            // This test will FAIL initially, prompting a fix in calculateNSSF.
            // After correction in calculateNSSF for 0 pensionable earnings:
            expect(employee).toBe(0);
            expect(employer).toBe(0);
        });
    });

    describe('calculateSHIF', () => {
        const shifRates = defaultSettings.shifRates;

        test('should return minimum contribution if 2.75% of gross is below minimum', () => {
            // 2.75% of 10,000 = 275. Minimum is 300.
            expect(calculateSHIF(10000, shifRates)).toBe(300);
        });

        test('should return calculated 2.75% if above minimum', () => {
            // 2.75% of 50,000 = 1375.
            expect(calculateSHIF(50000, shifRates)).toBe(1375);
        });

        test('should return minimum contribution if gross salary is zero', () => {
            // 2.75% of 0 = 0. Minimum is 300.
            expect(calculateSHIF(0, shifRates)).toBe(300);
        });

        test('should return calculated amount if it equals minimum (approx)', () => {
            // Gross salary where 2.75% is exactly 300: 300 / 0.0275 = 10909.0909...
            expect(calculateSHIF(10909.09, shifRates)).toBeCloseTo(300); // Handles potential floating point issues
        });

        test('should handle missing shifRates configuration gracefully', () => {
            // Assuming console.error is called and returns 0 as per implementation
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            expect(calculateSHIF(50000, {})).toBe(0); // No rate, no minimum
            expect(calculateSHIF(50000, { rate: 0.0275 })).toBe(0); // No minimum
            expect(calculateSHIF(50000, { minimum_contribution: 300 })).toBe(0); // No rate
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            consoleSpy.mockRestore();
        });
    });

    describe('calculateAHL', () => {
        const ahlRates = defaultSettings.ahlRates;

        test('should calculate employee and employer AHL correctly', () => {
            // 1.5% of 50,000 = 750
            const { employee, employer } = calculateAHL(50000, ahlRates);
            expect(employee).toBe(750);
            expect(employer).toBe(750);
        });

        test('should calculate AHL correctly for different gross salary', () => {
            // 1.5% of 100,000 = 1500
            const { employee, employer } = calculateAHL(100000, ahlRates);
            expect(employee).toBe(1500);
            expect(employer).toBe(1500);
        });

        test('should return zero AHL for zero gross salary', () => {
            const { employee, employer } = calculateAHL(0, ahlRates);
            expect(employee).toBe(0);
            expect(employer).toBe(0);
        });

        test('should handle missing ahlRates configuration gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            expect(calculateAHL(50000, {})).toEqual({ employee: 0, employer: 0 }); // No rates
            expect(calculateAHL(50000, { employee_rate: 0.015 })).toEqual({ employee: 0, employer: 0 }); // No employer rate
            expect(calculateAHL(50000, { employer_rate: 0.015 })).toEqual({ employee: 0, employer: 0 }); // No employee rate
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            consoleSpy.mockRestore();
        });
    });

    describe('calculatePAYE', () => {
        const taxBands = defaultSettings.taxBands;
        const personalRelief = defaultSettings.personalRelief; // 2400

        test('should result in zero net PAYE if gross PAYE is less than personal relief', () => {
            // Taxable income: 20,000. Band 1 (upto 24000 @ 10%): 20000 * 0.10 = 2000 (Gross PAYE)
            // Net PAYE: max(0, 2000 - 2400) = 0
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(20000, taxBands, personalRelief);
            expect(grossPaye).toBe(2000);
            expect(reliefApplied).toBe(2400);
            expect(netPaye).toBe(0);
        });

        test('should correctly calculate PAYE for income in the second band', () => {
            // Taxable income: 30,000
            // Band 1 (first 24,000 @ 10%): 24000 * 0.10 = 2400
            // Remaining for Band 2: 30000 - 24000 = 6000
            // Band 2 (next 8,333 @ 25%): 6000 * 0.25 = 1500
            // Gross PAYE: 2400 + 1500 = 3900
            // Net PAYE: 3900 - 2400 = 1500
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(30000, taxBands, personalRelief);
            expect(grossPaye).toBe(3900);
            expect(reliefApplied).toBe(2400);
            expect(netPaye).toBe(1500);
        });

        test('should correctly calculate PAYE for income spanning multiple bands (e.g. 600,000)', () => {
            // Taxable Income: 600,000
            // Band 1 (first 24,000 @ 10%): 24000 * 0.10 = 2400. Remaining: 576000
            // Band 2 (next 8,333 @ 25%): 8333 * 0.25 = 2083.25. Remaining: 567667
            // Band 3 (next 467,667 @ 30%): 467667 * 0.30 = 140300.10. Remaining: 100000
            // Band 4 (next 300,000 @ 32.5%): 100000 * 0.325 = 32500. Remaining: 0
            // Gross PAYE: 2400 + 2083.25 + 140300.10 + 32500 = 177283.35
            // Net PAYE: 177283.35 - 2400 = 174883.35
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(600000, taxBands, personalRelief);
            expect(grossPaye).toBe(177283.35);
            expect(reliefApplied).toBe(2400);
            expect(netPaye).toBe(174883.35);
        });

        test('should correctly calculate PAYE for income in the highest band (e.g. 1,000,000)', () => {
            // Taxable Income: 1,000,000
            // Band 1 (24k @ 10%): 2400. Rem: 976000
            // Band 2 (8.333k @ 25%): 2083.25. Rem: 967667
            // Band 3 (467.667k @ 30%): 140300.10. Rem: 500000
            // Band 4 (300k @ 32.5%): 97500. Rem: 200000
            // Band 5 (remaining 200k @ 35%): 70000
            // Gross PAYE: 2400 + 2083.25 + 140300.10 + 97500 + 70000 = 312283.35
            // Net PAYE: 312283.35 - 2400 = 309883.35
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(1000000, taxBands, personalRelief);
            expect(grossPaye).toBe(312283.35);
            expect(reliefApplied).toBe(2400);
            expect(netPaye).toBe(309883.35);
        });


        test('should return zero PAYE for zero taxable income', () => {
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(0, taxBands, personalRelief);
            expect(grossPaye).toBe(0);
            expect(reliefApplied).toBe(2400);
            expect(netPaye).toBe(0);
        });

        test('should handle empty taxBands array gracefully', () => {
            const { grossPaye, reliefApplied, netPaye } = calculatePAYE(50000, [], personalRelief);
            expect(grossPaye).toBe(0);
            expect(reliefApplied).toBe(personalRelief); // Relief is still passed
            expect(netPaye).toBe(0); // max(0, 0 - relief)
        });
    });
});
