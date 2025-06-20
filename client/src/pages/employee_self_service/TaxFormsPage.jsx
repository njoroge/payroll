import React from 'react';

const TaxFormsPage = () => {
  return (
    <div>
      <h2>Tax Forms: Understanding Your P9 Form</h2>
      <p>This page provides information about important tax documents, primarily the P9 form, which is essential for filing your annual individual income tax returns with the Kenya Revenue Authority (KRA).</p>

      <h3>P9 Form (PAYE Summary Form)</h3>
      <p><strong>Purpose:</strong> The P9 form is a summary of your earnings and tax deductions for a given tax year (January 1st to December 31st). It is issued by your employer.</p>
      <p><strong>Content:</strong> A P9 form typically includes the following details:</p>
      <ul>
        <li>Gross Pay (including basic salary, benefits, and allowances)</li>
        <li>Taxable Pay</li>
        <li>Total PAYE (Pay As You Earn) tax deducted and remitted by your employer throughout the year</li>
        <li>Pension Contributions (if applicable)</li>
        <li>Personal Relief entitlement</li>
      </ul>
      <p><strong>Use:</strong> You will use the information on your P9 form to file your annual Individual Income Tax Returns (ITR) with KRA. For employed individuals, KRA often provides a pre-filled Excel-based return form that is linked to your P9 data.</p>
      <p><strong>Payroll System Role:</strong> The payroll system is responsible for accurately calculating all the figures required for the P9 form. Ideally, a printable or downloadable P9 form for each employee should be accessible through an Employee Self-Service (ESS) portal like this one.</p>

      <h4>Other Important Tax Information:</h4>
      <ul>
        <li><strong>Individual Income Tax Return (ITR):</strong> This is the declaration form you submit to KRA annually. If you have no other sources of income, your P9 will be the primary document for this. If you have no income for the year but have a KRA PIN, you must still file a "Nil Return."</li>
        <li><strong>Tax Compliance Certificate (TCC):</strong> This is official proof from KRA that you have complied with your tax obligations. While the payroll system doesn't issue TCCs, accurate PAYE calculations and remittances by your employer (facilitated by the payroll system) are crucial for obtaining a TCC.</li>
      </ul>

      <p><em>Note: This page is for informational purposes. Actual P9 forms and tax filing should be done in accordance with KRA guidelines.</em></p>
    </div>
  );
};

export default TaxFormsPage;
