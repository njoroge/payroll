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
    const nssfSetting = await Setting.findOne({ settingName: 'nssfRates', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 }); // Prefer company specific
    const nhifSetting = await Setting.findOne({ settingName: 'nhifRates', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });
    const taxSetting = await Setting.findOne({ settingName: 'taxBrackets', $or: [{ companyId }, { companyId: null }] }).sort({ companyId: -1 });

    return {
        nssfRates: nssfSetting ? nssfSetting.value : { employee_contribution_percent: 0.06, employer_contribution_percent: 0.06, max_employee_deduction: 1080 }, // Example defaults
        nhifRates: nhifSetting ? nhifSetting.value : [], // Example: [{from: 0, to: 5999, deduction: 150}, ...]
        taxBrackets: taxSetting ? taxSetting.value : [] // Example: [{from: 0, to: 24000, rate: 0.1, relief: 2400 }, ...]
    };
}

// NSSF Calculation (Example, Tier I & II can be complex)
function calculateNSSF(grossPay, nssfRates) {
    // This is a simplified NSSF. Real NSSF can be tiered.
    // Assuming a flat rate up to a max for employee deduction.
    let employeeDeduction = grossPay * (nssfRates.employee_contribution_percent || 0.06); // 6% of pensionable pay
    return Math.min(employeeDeduction, nssfRates.max_employee_deduction || 1080); // Example max
}

// NHIF Calculation
function calculateNHIF(grossPay, nhifRates) {
    if (!nhifRates || nhifRates.length === 0) return 0;
    const rateEntry = nhifRates.find(rate => grossPay >= rate.from && grossPay <= rate.to);
    return rateEntry ? rateEntry.deduction : (nhifRates[nhifRates.length-1].deduction || 0); // Default to highest if not found or last one
}

// PAYE Tax Calculation (Simplified)
function calculatePAYE(taxableIncome, taxBrackets) {
    if (!taxBrackets || taxBrackets.length === 0) return { paye: 0, relief: 0, netTax: 0 };
    let totalTax = 0;
    let personalRelief = 0;

    // Find the personal relief (often a fixed amount or part of the first bracket)
    const reliefBracket = taxBrackets.find(b => b.relief);
    if (reliefBracket) personalRelief = reliefBracket.relief;


    for (const bracket of taxBrackets) {
        if (taxableIncome <= 0) break;

        const bracketMin = bracket.from;
        const bracketMax = bracket.to === Infinity ? Infinity : bracket.to;

        // Amount of income that falls into this bracket
        const incomeInBracket = Math.min(taxableIncome, bracketMax - bracketMin);

        totalTax += incomeInBracket * bracket.rate;

        taxableIncome -= incomeInBracket; // Reduce taxable income by the amount processed in this bracket
    }

    const netTax = Math.max(0, totalTax - personalRelief);
    return { paye: totalTax, relief: personalRelief, netTax };
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
    const { nssfRates, nhifRates, taxBrackets } = await getPayrollSettings(companyId);

    // Deductions
    const nssfDeduction = calculateNSSF(basicSalary, nssfRates); // NSSF often on basic or pensionable pay
    const nhifDeduction = calculateNHIF(grossEarnings, nhifRates);

    const taxableIncome = Math.max(0, grossEarnings - nssfDeduction); // PAYE calculated on income after NSSF
    const taxDetails = calculatePAYE(taxableIncome, taxBrackets);
    const paye = taxDetails.netTax;

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


    const totalDeductions = paye + nssfDeduction + nhifDeduction + advanceDeductedAmount + damageDeductedAmount;
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
        taxableIncome,
        paye,
        nssfDeduction,
        nhifDeduction,
        advanceDeducted: advanceDeductedAmount,
        damageDeducted: damageDeductedAmount,
        reimbursementAdded: reimbursementAddedAmount,
        totalDeductions,
        netPay,
        status: 'PENDING_APPROVAL', // Initial status
        processedBy: processedByUserId,
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

module.exports = { processEmployeePayroll, getPayrollSettings }; // Export getPayrollSettings if needed by controller for setup
