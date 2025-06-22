const Employee = require('../models/Employee');
const IncomeGrade = require('../models/IncomeGrade');
const Payroll = require('../models/Payroll');
const Advance = require('../models/Advance');
const Damage = require('../models/Damage');
const Reimbursement = require('../models/Reimbursement');
const Setting = require('../models/Setting'); // For NHIF/Tax rates

// Helper to get NSSF, NHIF, Tax settings (simplified, assumes they exist in DB)
async function getPayrollSettings(companyId) {
    // These could be fetched based on year or specific company settings
    // For now, using fixed names. Enhance this to be dynamic (e.g., based on year)
    // TODO: Fetch these rates from the Setting model or a configuration file.
    const nssfSetting = await Setting.findOne({ settingName: 'nssfRatesFebruary2025', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });
    const nhifSetting = await Setting.findOne({ settingName: 'nhifRates', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 }); // To be replaced by SHIF
    const taxSetting = await Setting.findOne({ settingName: 'taxBracketsJuly2023', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });
    const ahlSetting = await Setting.findOne({ settingName: 'ahlRatesMarch2024', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });
    const shifSetting = await Setting.findOne({ settingName: 'shifRatesOctober2024', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });


    return {
        nssfRates: nssfSetting ? nssfSetting.value : {
            tier1_lel: 8000,
            tier1_rate: 0.06,
            tier1_employee_contribution: 480, // 6% of 8000
            tier1_employer_contribution: 480,
            tier2_uel: 72000,
            tier2_rate: 0.06,
        },
        nhifRates: nhifSetting ? nhifSetting.value : [], // Legacy, to be phased out by SHIF
        // taxBrackets renamed to taxBands for clarity with the new structure
        taxBands: taxSetting ? taxSetting.value : [ // Effective July 1, 2023 / Feb 2025 - Based on "chargeable income" amounts
            { upto: 24000, rate: 0.10 },  // On the first 24,000
            { upto: 8333, rate: 0.25 },   // On the next 8,333 (Cumulative: 32,333)
            { upto: 467667, rate: 0.30 }, // On the next 467,667 (Cumulative: 500,000)
            { upto: 300000, rate: 0.325 },// On the next 300,000 (Cumulative: 800,000)
            { upto: Infinity, rate: 0.35 } // On all income above 800,000
        ],
        // Personal relief directly available
        personalRelief: (taxSetting && typeof taxSetting.personalRelief !== 'undefined') ? taxSetting.personalRelief : 2400,
        ahlRates: ahlSetting ? ahlSetting.value : { employee_rate: 0.015, employer_rate: 0.015 },
        shifRates: shifSetting ? shifSetting.value : { rate: 0.0275, minimum_contribution: 300 }
    };
}

// NSSF Calculation (Effective February 1, 2025)
function calculateNSSF(pensionableEarnings, nssfRates) {
    if (pensionableEarnings <= 0) {
        return { employee: 0, employer: 0 };
    }

    let employeeNSSF = 0;
    let employerNSSF = 0;

    // Tier I
    const tier1Employee = nssfRates.tier1_employee_contribution;
    const tier1Employer = nssfRates.tier1_employer_contribution;

    employeeNSSF += tier1Employee;
    employerNSSF += tier1Employer;

    // Tier II
    // Applicable if pensionable earnings are greater than LEL (8000)
    if (pensionableEarnings > nssfRates.tier1_lel) {
        const tier2PensionableAmount = Math.min(pensionableEarnings, nssfRates.tier2_uel) - nssfRates.tier1_lel;
        if (tier2PensionableAmount > 0) {
            const tier2Contribution = tier2PensionableAmount * nssfRates.tier2_rate;
            employeeNSSF += tier2Contribution;
            employerNSSF += tier2Contribution;
        }
    }

    // Ensure employee NSSF does not exceed Tier I (480) + Max Tier II (3840) = 4320
    // This check is implicitly handled by UEL cap in tier2PensionableAmount calculation.
    // Max employee NSSF = 480 (Tier I) + 0.06 * (72000 - 8000) = 480 + 3840 = 4320

    return {
        employee: Math.round(employeeNSSF * 100) / 100, // Round to 2 decimal places
        employer: Math.round(employerNSSF * 100) / 100,
    };
}

// SHIF Calculation (Effective October 1, 2024)
// Replaces calculateNHIF
function calculateSHIF(grossSalary, shifRates) {
    if (!shifRates || typeof shifRates.rate === 'undefined' || typeof shifRates.minimum_contribution === 'undefined') {
        // Fallback or error if rates are not configured properly
        console.error("SHIF rates not configured properly.");
        return 0;
    }
    const calculatedShif = grossSalary * shifRates.rate;
    return Math.max(calculatedShif, shifRates.minimum_contribution);
}

// AHL Calculation (Effective March 19, 2024)
function calculateAHL(grossSalary, ahlRates) {
    if (!ahlRates || typeof ahlRates.employee_rate === 'undefined' || typeof ahlRates.employer_rate === 'undefined') {
        console.error("AHL rates not configured properly.");
        return { employee: 0, employer: 0 };
    }
    const employeeAHL = grossSalary * ahlRates.employee_rate;
    const employerAHL = grossSalary * ahlRates.employer_rate; // Matches employee's contribution

    return {
        employee: Math.round(employeeAHL * 100) / 100,
        employer: Math.round(employerAHL * 100) / 100,
    };
}

// PAYE Tax Calculation (Updated for new bands and relief)
function calculatePAYE(taxableIncomeInput, taxBands, personalReliefAmount) { // Renamed parameter
    if (!taxBands || taxBands.length === 0) {
        return { grossPaye: 0, reliefApplied: personalReliefAmount, netPaye: 0 };
    }

    let grossPaye = 0;
    let remainingTaxableIncome = Math.max(0, taxableIncomeInput);

    for (const band of taxBands) {
        if (remainingTaxableIncome <= 0) {
            break;
        }

        const chargeableInBand = Math.min(remainingTaxableIncome, band.upto);
        grossPaye += chargeableInBand * band.rate;
        remainingTaxableIncome -= chargeableInBand;
    }

    const netPaye = Math.max(0, grossPaye - personalReliefAmount);

    return {
        grossPaye: Math.round(grossPaye * 100) / 100,
        reliefApplied: personalReliefAmount,
        netPaye: Math.round(netPaye * 100) / 100
    };
}


const processEmployeePayroll = async (employeeId, companyId, month, year, processedByUserId) => {
    const employee = await Employee.findById(employeeId).populate('incomeGradeId');
    if (!employee || employee.companyId.toString() !== companyId.toString() || !employee.incomeGradeId) {
        throw new Error(`Employee not found, not part of the company, or no income grade assigned for ID: ${employeeId}`);
    }
    if (employee.workStatus !== 'ACTIVE') {
        throw new Error(`Employee ${employee.firstName} ${employee.lastName} is not ACTIVE.`);
    }

    const incomeGrade = employee.incomeGradeId;
    const { basicSalary, houseAllowance, transportAllowance, hardshipAllowance, specialAllowance } = incomeGrade;
    const grossEarnings = (basicSalary || 0) + (houseAllowance || 0) + (transportAllowance || 0) + (hardshipAllowance || 0) + (specialAllowance || 0);

    // Fetch payroll settings
    // Note: nhifRates is legacy. taxBrackets has been renamed to taxBands in getPayrollSettings.
    const settings = await getPayrollSettings(companyId);
    const { nssfRates, taxBands, personalRelief, ahlRates, shifRates } = settings;

    // Statutory Deductions Calculation
    const nssfResult = calculateNSSF(basicSalary, nssfRates); // NSSF based on basicSalary (pensionable pay)
    const nssfEmployeeDeduction = nssfResult.employee;
    const nssfEmployerContribution = nssfResult.employer;

    const shifDeduction = calculateSHIF(grossEarnings, shifRates);
    const ahlResult = calculateAHL(grossEarnings, ahlRates);
    const ahlEmployeeDeduction = ahlResult.employee;
    const ahlEmployerContribution = ahlResult.employer;

    // Calculate Taxable Income
    // Standard deductions: NSSF (employee), SHIF, AHL (employee)
    let allowableDeductions = nssfEmployeeDeduction + shifDeduction + ahlEmployeeDeduction;

    // TODO: Incorporate other allowable deductions if available from employee data
    // Example:
    // const approvedPensionLimit = 30000;
    // const mortgageReliefLimit = 30000;
    // const postRetirementMedicalFundLimit = 15000;
    // allowableDeductions += Math.min(employee.otherPensionContributions || 0, approvedPensionLimit);
    // allowableDeductions += Math.min(employee.mortgageInterest || 0, mortgageReliefLimit);
    // allowableDeductions += Math.min(employee.postRetirementMedicalFund || 0, postRetirementMedicalFundLimit);

    const taxableIncome = Math.max(0, grossEarnings - allowableDeductions);

    // Calculate PAYE
    const taxDetails = calculatePAYE(taxableIncome, taxBands, personalRelief);
    const paye = taxDetails.netPaye; // Use netPaye which has relief applied

    // Fetch approved advances for this pay period (not yet deducted)
    const advancesToDeduct = await Advance.find({
        employeeId,
        companyId,
        status: 'APPROVED', // Only approved ones
        // TODO: Add logic to ensure it's for the current pay period or outstanding
    });
    const advanceDeductedAmount = advancesToDeduct.reduce((sum, adv) => sum + adv.amount, 0);

    // Fetch approved damages
    const damagesToDeduct = await Damage.find({ employeeId, companyId, status: 'APPROVED' });
    const damageDeductedAmount = damagesToDeduct.reduce((sum, dam) => sum + dam.amount, 0);

    // Fetch approved reimbursements
    const reimbursementsToAdd = await Reimbursement.find({ employeeId, companyId, status: 'APPROVED' });
    const reimbursementAddedAmount = reimbursementsToAdd.reduce((sum, reim) => sum + reim.amount, 0);


    // Calculate Total Deductions and Net Pay
    const totalStatutoryDeductions = paye + nssfEmployeeDeduction + shifDeduction + ahlEmployeeDeduction;
    const totalOtherDeductions = advanceDeductedAmount + damageDeductedAmount;
    const totalDeductions = totalStatutoryDeductions + totalOtherDeductions;
    const netPay = grossEarnings - totalDeductions + reimbursementAddedAmount;

    const payrollEntry = new Payroll({
        employeeId,
        companyId,
        month,
        year,
        incomeGradeSnapshot: {
            gradeName: incomeGrade.gradeName,
            basicSalary, houseAllowance, transportAllowance, hardshipAllowance, specialAllowance
        },
        grossEarnings,
        taxableIncome: taxableIncome, // Final calculated taxable income
        paye: paye, // Final calculated PAYE
        nssfDeduction: nssfEmployeeDeduction,
        nssfEmployerContribution: nssfEmployerContribution,
        shifDeduction: shifDeduction,
        ahlDeduction: ahlEmployeeDeduction,
        ahlEmployerContribution: ahlEmployerContribution,
        advanceDeducted: advanceDeductedAmount,
        damageDeducted: damageDeductedAmount,
        reimbursementAdded: reimbursementAddedAmount,
        totalDeductions: totalDeductions, // Final total deductions
        netPay: netPay, // Final net pay
        status: 'PENDING_APPROVAL', // Initial status
        processedBy: processedByUserId,
        // Store tax calculation details for transparency, if needed
        // taxDetails: { grossPaye: taxDetails.grossPaye, reliefApplied: taxDetails.reliefApplied }
    });

    const savedPayroll = await payrollEntry.save();

    // Update status of processed advances, damages, reimbursements
    const updatePromises = [];
    advancesToDeduct.forEach(adv => {
        adv.status = 'DEDUCTED';
        adv.payrollId = savedPayroll._id;
        adv.deductedOnPayPeriod = `${year}-${month}`;
        updatePromises.push(adv.save());
    });
    damagesToDeduct.forEach(dam => {
        dam.status = 'DEDUCTED';
        dam.payrollId = savedPayroll._id;
        dam.deductedOnPayPeriod = `${year}-${month}`;
        updatePromises.push(dam.save());
    });
    reimbursementsToAdd.forEach(reim => {
        reim.status = 'PAID_IN_PAYROLL';
        reim.payrollId = savedPayroll._id;
        reim.paidOnPayPeriod = `${year}-${month}`;
        updatePromises.push(reim.save());
    });

    await Promise.all(updatePromises);

    return savedPayroll;
};

// Export individual functions for testing purposes, and main functions for application use
module.exports = {
    processEmployeePayroll,
    getPayrollSettings,
    calculateNSSF,
    calculateSHIF,
    calculateAHL,
    calculatePAYE
};
