# Payroll System

This is a web-based payroll system written in PHP.

## Purpose

The purpose of this project is to provide a simple and easy-to-use system for managing employee payroll.

## Features

* Employee registration
* Salary payment processing
* Advance payment tracking
* Tax calculation (NHIF and other taxes)
* Report generation (payslips, NHIF reports, tax reports, etc.)

## Technologies Used

* PHP
* MySQL
* HTML
* CSS
* JavaScript

## Database Schema

### `advance`
- `ref`: Reference ID (Primary Key, Auto Increment)
- `nationalid`: National ID of the employee
- `advance_amount`: Amount of advance taken
- `status`: Status of the advance (e.g., settled)
- `date_paid`: Date the advance was paid

### `banks`
- `bank_id`: Bank ID (Unique Key)
- `bnk_name`: Name of the bank
- `bnk_status`: Status of the bank (e.g., ACTIVE)

### `company_details`
- `comp_name`: Company name
- `comp_taxpin`: Company tax PIN (Primary Key)
- `comp_location`: Company location
- `comp_email`: Company email address
- `comp_phone`: Company phone number
- `password`: Company account password (likely hashed)
- `date_created`: Date the company record was created

### `damage`
- `national_id`: National ID of the employee responsible for damage
- `damag_amount`: Amount of damage
- `date_incurred`: Date the damage was incurred
- `ref`: Reference ID (Primary Key, Auto Increment)
- `damag_status`: Status of the damage (e.g., settled)

### `departments`
- `depart_id`: Department ID (Unique Key)
- `depart_name`: Name of the department
- `depart_status`: Status of the department (e.g., ACTIVE)

### `empdetail`
- `sname`: Surname of the employee
- `fname`: First name of the employee
- `lname`: Last name of the employee
- `phoneNo`: Employee's phone number (Unique)
- `Pemail`: Employee's personal email (Unique)
- `nationalid`: National ID of the employee (Primary Key)
- `dob`: Date of birth of the employee
- `gender`: Gender of the employee
- `KRApin`: KRA (Kenya Revenue Authority) PIN (Unique)
- `NHIFNO`: NHIF (National Hospital Insurance Fund) number (Unique)
- `NSSFNo`: NSSF (National Social Security Fund) number (Unique)
- `bank`: Bank name for salary deposit
- `AccNo`: Bank account number (Unique)
- `status`: Marital status of the employee
- `income_id`: ID linking to income details
- `next_kin_fname`: Next of kin's first name
- `next_kin_lname`: Next of kin's last name
- `next_kin_relation`: Relationship with next of kin
- `next_kin_phoneNo`: Next of kin's phone number (Unique)
- `next_kin_email`: Next of kin's email (Unique)
- `reg_date`: Date of employee registration
- `work_status`: Employee's work status (e.g., ACTIVE)
- `department`: Department of the employee
- `password`: Employee's account password (likely hashed)
- `is_admin`: Flag indicating if the employee is an admin (0 or 1)
- `is_hrman`: Flag indicating if the employee is an HR manager (0 or 1)

### `empreim`
- `ref`: Reference ID (Primary Key, Auto Increment)
- `national_id`: National ID of the employee
- `reim_amount`: Amount to be reimbursed
- `reim_status`: Status of the reimbursement
- `date_reim`: Date of reimbursement

### `income`
- `income_id`: Income ID (Unique Key)
- `basic_income`: Basic salary
- `house_allow`: House allowance
- `transport_allow`: Transport allowance
- `hardship_allow`: Hardship allowance
- `special_allow`: Special allowance (Unique)
- `total_income`: Total income (sum of basic and allowances)

### `payment`
- `ref`: Payment reference ID (Primary Key, Auto Increment)
- `national_id`: National ID of the employee
- `bank`: Bank name for salary deposit
- `ACC_NO`: Bank account number
- `income_id`: ID linking to income details
- `department`: Department of the employee
- `Amount`: Gross amount of payment
- `tax_paid`: Amount of tax paid
- `KRApin`: KRA PIN of the employee
- `nssf_deduct`: NSSF deduction amount
- `NSSFNo`: NSSF number of the employee
- `nhif_deduct`: NHIF deduction amount
- `NHIFNO`: NHIF number of the employee
- `advance`: Advance amount deducted
- `damages`: Damages amount deducted
- `reim`: Reimbursement amount added
- `total_deducts`: Total deductions
- `net_pay`: Net pay after deductions
- `month`: Month of payment
- `year`: Year of payment
- `fname`: First name of the employee
- `lname`: Last name of the employee
- `Date_processed`: Date the payment was processed

## Main PHP Files
- `index.php`: Main entry point of the application. Handles user login.
- `home.php`: Dashboard or main page after login.
- `empreg.php`: Handles employee registration.
- `salpayment.php`: Manages salary payment processing.
- `advancereps.php`: Generates reports for advance payments.
- `nhifreps.php`: Generates NHIF reports.
- `taxfom.php`: Handles tax forms or calculations.
- `co_signin.php`: Handles company registration/login.
- `db/condb.php`: Database connection file.

## CSS and JavaScript Files
CSS and JavaScript files are used to style the user interface and add client-side interactivity to the application.
- `payroll/css/style.css`: Main stylesheet providing the overall look and feel of the application.
- `payroll/css/style2.css`: An additional stylesheet, potentially used for styling specific pages, components, or for alternative themes.
- `payroll/js/nhifrates2018.json`: A JSON file containing NHIF (National Hospital Insurance Fund) rates for the year 2018. This data is likely used by JavaScript to perform accurate NHIF calculations.
- `payroll/js/taxrates.json`: A JSON file containing tax rates. This data is likely used by JavaScript to perform tax calculations based on income brackets or other criteria.

## Setup and Installation

### Prerequisites
- A web server (e.g., Apache)
- PHP
- MySQL database server

### Steps
1. **Clone the repository or download the project files.**
2. **Database Setup:**
    - Create a new database in MySQL.
    - Import the `payroll/payroll.sql` file into the newly created database. This will create the necessary tables and some initial data.
    - Update the database connection details in `payroll/db/condb.php` if they are different from the defaults (e.g., `localhost`, `root`, empty password, database name `payroll`).
3. **Web Server Configuration:**
    - Place the project files in the web server's document root (e.g., `htdocs` for Apache).
    - Ensure your web server is configured to serve PHP files.
4. **Running the Application:**
    - Open your web browser and navigate to the project's URL (e.g., `http://localhost/payroll/`).
    - You should see the login page (`index.php`).
