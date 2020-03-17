-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 05, 2018 at 09:54 AM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `payroll`
--

-- --------------------------------------------------------

--
-- Table structure for table `advance`
--

CREATE TABLE `advance` (
  `ref` int(10) NOT NULL,
  `nationalid` int(11) NOT NULL,
  `advance_amount` varchar(40) NOT NULL,
  `status` varchar(100) NOT NULL,
  `date_paid` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `advance`
--

INSERT INTO `advance` (`ref`, `nationalid`, `advance_amount`, `status`, `date_paid`) VALUES
(16, 31678954, '10000', 'settled', '2018-12-04'),
(17, 22444578, '12000', 'settled', '2018-12-04');

-- --------------------------------------------------------

--
-- Table structure for table `banks`
--

CREATE TABLE `banks` (
  `bank_id` varchar(50) NOT NULL,
  `bnk_name` varchar(100) NOT NULL,
  `bnk_status` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `banks`
--

INSERT INTO `banks` (`bank_id`, `bnk_name`, `bnk_status`) VALUES
('10A', 'KCB', 'ACTIVE'),
('20D', 'CBA', 'ACTIVE'),
('24A', 'Barclays', 'ACTIVE'),
('25C', 'Equity', 'ACTIVE'),
('30F', 'DTB', 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `company_details`
--

CREATE TABLE `company_details` (
  `comp_name` varchar(50) NOT NULL,
  `comp_taxpin` varchar(40) NOT NULL,
  `comp_location` varchar(40) NOT NULL,
  `comp_email` varchar(320) NOT NULL,
  `comp_phone` varchar(15) NOT NULL,
  `password` varchar(200) NOT NULL,
  `date_created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `company_details`
--

INSERT INTO `company_details` (`comp_name`, `comp_taxpin`, `comp_location`, `comp_email`, `comp_phone`, `password`, `date_created`) VALUES
('AWS', 'tyW234567', 'NAIROBI', 'ifo@aws.com', '071234567889', '9dc98e9f682b7a880861731d2ed7899c', '2018-10-30');

-- --------------------------------------------------------

--
-- Table structure for table `damage`
--

CREATE TABLE `damage` (
  `national_id` int(11) NOT NULL,
  `damag_amount` double NOT NULL,
  `date_incurred` date NOT NULL,
  `ref` int(11) NOT NULL,
  `damag_status` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `damage`
--

INSERT INTO `damage` (`national_id`, `damag_amount`, `date_incurred`, `ref`, `damag_status`) VALUES
(31678954, 2000, '2018-12-04', 1, 'settled'),
(22444578, 1000, '2018-12-04', 2, 'settled');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `depart_id` varchar(30) NOT NULL,
  `depart_name` varchar(100) NOT NULL,
  `depart_status` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`depart_id`, `depart_name`, `depart_status`) VALUES
('003', 'ICT', 'ACTIVE'),
('004', 'Production', 'ACTIVE'),
('005', 'Sales', 'ACTIVE'),
('006', 'Finance', 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `empdetail`
--

CREATE TABLE `empdetail` (
  `sname` varchar(40) NOT NULL,
  `fname` varchar(40) NOT NULL,
  `lname` varchar(40) NOT NULL,
  `phoneNo` varchar(20) NOT NULL,
  `Pemail` varchar(40) NOT NULL,
  `nationalid` int(10) NOT NULL,
  `dob` date NOT NULL,
  `gender` varchar(10) NOT NULL,
  `KRApin` varchar(20) NOT NULL,
  `NHIFNO` int(10) NOT NULL,
  `NSSFNo` int(15) NOT NULL,
  `bank` varchar(40) NOT NULL,
  `AccNo` varchar(30) NOT NULL,
  `status` varchar(15) NOT NULL,
  `income_id` varchar(40) NOT NULL,
  `next_kin_fname` varchar(40) NOT NULL,
  `next_kin_lname` varchar(40) NOT NULL,
  `next_kin_relation` varchar(40) NOT NULL,
  `next_kin_phoneNo` varchar(15) NOT NULL,
  `next_kin_email` varchar(40) NOT NULL,
  `reg_date` date NOT NULL,
  `work_status` varchar(40) NOT NULL,
  `department` varchar(40) NOT NULL,
  `password` varchar(100) NOT NULL,
  `is_admin` tinyint(1) NOT NULL,
  `is_hrman` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `empdetail`
--

INSERT INTO `empdetail` (`sname`, `fname`, `lname`, `phoneNo`, `Pemail`, `nationalid`, `dob`, `gender`, `KRApin`, `NHIFNO`, `NSSFNo`, `bank`, `AccNo`, `status`, `income_id`, `next_kin_fname`, `next_kin_lname`, `next_kin_relation`, `next_kin_phoneNo`, `next_kin_email`, `reg_date`, `work_status`, `department`, `password`, `is_admin`, `is_hrman`) VALUES
('KAMAU', 'JON', 'WAITHAKA', '0745689795', 'jkwaka234@gmail.com', 22444578, '1970-12-04', 'male', 'BGT3656548', 2147483647, 56437898, 'equity', '771474836', 'married', '304D', 'james', 'gitau', 'son', '0767897456', 'gitsz23445@gmail.com', '2018-11-02', 'ACTIVE', 'ICT', '9dc98e9f682b7a880861731d2ed7899c', 1, 0),
('KURIA', 'STEPHEN ', 'KINUTHIA', '0703899670', 'stkin3455@gmail.com', 26457890, '1988-05-06', 'male', 'JTR4325235', 9987654, 66458356, 'CBA', '237853285230', 'married', '204A', 'kuria', 'john', 'father', '0721900699', 'kfdjgfd56@gmail.com', '2018-12-03', 'ACTIVE', 'ICT', '', 0, 0),
('KARANJA', 'JOHN', 'KAMAU', '0789456789', 'karanjewrf@gmail.com', 26784533, '1988-12-04', 'male', 'WXS523326347', 45678899, 99667544, 'CBA', '567778833747', 'married', '304D', 'stephen', 'gitau', 'father', '0786456723', 'stevgits24@gmail.com', '2018-11-29', 'ACTIVE', 'PRODUCTION', '', 0, 0),
('KAMOTHO', 'MARTIN', 'NJERU', '0745674345', 'kmjn436@gmail.com', 31363336, '1994-04-05', 'male', 'RSTA35271217', 43436789, 532332323, 'KCB', '2465728398', 'single', '204A', 'joseph', 'kamotho', 'father', '0721789654', 'ksamu4372346@gmail.com', '2018-11-14', 'ACTIVE', 'SALES', '', 0, 0),
('OTIENO', 'KELVIN', 'OSOO', '0789345678', 'otykel4428@gmail.com', 31436755, '1994-12-04', 'male', 'TEED43481228', 56579934, 998213211, 'Coop', '3442354325211', 'single', '204A', 'martin', 'otieno', 'father', '0725789875', 'mertrtu4386@gmail.com', '2018-11-29', 'ACTIVE', 'PRODUCTION', '', 0, 0),
('GITONGA', 'JANET', 'WARUGURU', '0743645789', 'waruj2113@gmail.com', 31653421, '1994-12-06', 'female', 'AQD2214321423', 45672278, 769934732, 'KCB', '172421472148', 'single', '204A', 'charles', 'gitonga', 'father', '0721454672', 'gits45@gmail.com', '2018-11-15', 'ACTIVE', 'FINANCE', '9dc98e9f682b7a880861731d2ed7899c', 0, 1),
('KAMAU', 'JOHN', 'THUKU', '0733378980', 'jkt77798@gmail.com', 31678954, '1994-04-05', 'male', 'SRDG2354327732', 99963476, 765343122, 'equity', '177234214212', 'single', '204A', 'james', 'kamau', 'father', '0722457676', 'kjmau2145@gmail.com', '2018-11-15', 'ACTIVE', 'SALES', '', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `empreim`
--

CREATE TABLE `empreim` (
  `ref` int(11) NOT NULL,
  `national_id` int(20) NOT NULL,
  `reim_amount` double NOT NULL,
  `reim_status` varchar(40) NOT NULL,
  `date_reim` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `income`
--

CREATE TABLE `income` (
  `income_id` varchar(20) NOT NULL,
  `basic_income` double NOT NULL,
  `house_allow` double NOT NULL,
  `transport_allow` double NOT NULL,
  `hardship_allow` double NOT NULL,
  `special_allow` double NOT NULL,
  `total_income` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `income`
--

INSERT INTO `income` (`income_id`, `basic_income`, `house_allow`, `transport_allow`, `hardship_allow`, `special_allow`, `total_income`) VALUES
('204A', 30000, 5000, 4000, 3000, 6000, 48000),
('204C', 25000, 5000, 4000, 3000, 5000, 42000),
('304D', 50000, 10000, 8000, 7000, 4000, 79000);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `ref` int(11) NOT NULL,
  `national_id` int(20) NOT NULL,
  `bank` varchar(40) NOT NULL,
  `ACC_NO` varchar(40) NOT NULL,
  `income_id` varchar(50) NOT NULL,
  `department` varchar(40) NOT NULL,
  `Amount` double NOT NULL,
  `tax_paid` double NOT NULL,
  `KRApin` varchar(100) NOT NULL,
  `nssf_deduct` double NOT NULL,
  `NSSFNo` int(100) NOT NULL,
  `nhif_deduct` double NOT NULL,
  `NHIFNO` int(20) NOT NULL,
  `advance` double NOT NULL,
  `damages` double NOT NULL,
  `reim` double NOT NULL,
  `total_deducts` double NOT NULL,
  `net_pay` double NOT NULL,
  `month` varchar(100) NOT NULL,
  `year` year(4) NOT NULL,
  `fname` varchar(40) NOT NULL,
  `lname` varchar(40) NOT NULL,
  `Date_processed` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`ref`, `national_id`, `bank`, `ACC_NO`, `income_id`, `department`, `Amount`, `tax_paid`, `KRApin`, `nssf_deduct`, `NSSFNo`, `nhif_deduct`, `NHIFNO`, `advance`, `damages`, `reim`, `total_deducts`, `net_pay`, `month`, `year`, `fname`, `lname`, `Date_processed`) VALUES
(109, 22444578, 'equity', '771474836', '304D', 'ICT', 79000, 16032.3, 'BGT3656548', 1080, 56437898, 1400, 2147483647, 12000, 1000, 0, 31512.3, 47487.7, 'January', 2018, 'JON', 'WAITHAKA', '2018-12-04'),
(110, 26457890, 'CBA', '237853285230', '204A', 'ICT', 48000, 6739.25, 'JTR4325235', 1080, 66458356, 1100, 9987654, 0, 0, 0, 8919.25, 39080.75, 'January', 2018, 'STEPHEN ', 'KINUTHIA', '2018-12-04'),
(111, 26784533, 'CBA', '567778833747', '304D', 'PRODUCTION', 79000, 16032.3, 'WXS523326347', 1080, 99667544, 1400, 45678899, 0, 0, 0, 18512.3, 60487.7, 'January', 2018, 'JOHN', 'KAMAU', '2018-12-04'),
(112, 31363336, 'KCB', '2465728398', '204A', 'SALES', 48000, 6739.25, 'RSTA35271217', 1080, 532332323, 1100, 43436789, 0, 0, 0, 8919.25, 39080.75, 'January', 2018, 'MARTIN', 'NJERU', '2018-12-04'),
(113, 31436755, 'Coop', '3442354325211', '204A', 'PRODUCTION', 48000, 6739.25, 'TEED43481228', 1080, 998213211, 1100, 56579934, 0, 0, 0, 8919.25, 39080.75, 'January', 2018, 'KELVIN', 'OSOO', '2018-12-04'),
(114, 31653421, 'KCB', '172421472148', '204A', 'FINANCE', 48000, 6739.25, 'AQD2214321423', 1080, 769934732, 1100, 45672278, 0, 0, 0, 8919.25, 39080.75, 'January', 2018, 'JANET', 'WARUGURU', '2018-12-04'),
(115, 31678954, 'equity', '177234214212', '204A', 'SALES', 48000, 6739.25, 'SRDG2354327732', 1080, 765343122, 1100, 99963476, 10000, 2000, 0, 20919.25, 27080.75, 'January', 2018, 'JOHN', 'THUKU', '2018-12-04'),
(130, 22444578, 'equity', '771474836', '304D', 'ICT', 79000, 16032.3, 'BGT3656548', 1080, 56437898, 1400, 2147483647, 0, 0, 0, 18512.3, 60487.7, 'February', 2018, 'JON', 'WAITHAKA', '2018-12-04'),
(131, 26457890, 'CBA', '237853285230', '204A', 'ICT', 48000, 6739.25, 'JTR4325235', 1080, 66458356, 1100, 9987654, 0, 0, 0, 8919.25, 39080.75, 'February', 2018, 'STEPHEN ', 'KINUTHIA', '2018-12-04'),
(132, 26784533, 'CBA', '567778833747', '304D', 'PRODUCTION', 79000, 16032.3, 'WXS523326347', 1080, 99667544, 1400, 45678899, 0, 0, 0, 18512.3, 60487.7, 'February', 2018, 'JOHN', 'KAMAU', '2018-12-04'),
(133, 31363336, 'KCB', '2465728398', '204A', 'SALES', 48000, 6739.25, 'RSTA35271217', 1080, 532332323, 1100, 43436789, 0, 0, 0, 8919.25, 39080.75, 'February', 2018, 'MARTIN', 'NJERU', '2018-12-04'),
(134, 31436755, 'Coop', '3442354325211', '204A', 'PRODUCTION', 48000, 6739.25, 'TEED43481228', 1080, 998213211, 1100, 56579934, 0, 0, 0, 8919.25, 39080.75, 'February', 2018, 'KELVIN', 'OSOO', '2018-12-04'),
(135, 31653421, 'KCB', '172421472148', '204A', 'FINANCE', 48000, 6739.25, 'AQD2214321423', 1080, 769934732, 1100, 45672278, 0, 0, 0, 8919.25, 39080.75, 'February', 2018, 'JANET', 'WARUGURU', '2018-12-04'),
(136, 31678954, 'equity', '177234214212', '204A', 'SALES', 48000, 6739.25, 'SRDG2354327732', 1080, 765343122, 1100, 99963476, 0, 0, 0, 8919.25, 39080.75, 'February', 2018, 'JOHN', 'THUKU', '2018-12-04'),
(144, 22444578, 'equity', '771474836', '304D', 'ICT', 79000, 16032.3, 'BGT3656548', 1080, 56437898, 1400, 2147483647, 0, 0, 0, 18512.3, 60487.7, 'May', 2018, 'JON', 'WAITHAKA', '2018-12-05'),
(145, 26457890, 'CBA', '237853285230', '204A', 'ICT', 48000, 6739.25, 'JTR4325235', 1080, 66458356, 1100, 9987654, 0, 0, 0, 8919.25, 39080.75, 'May', 2018, 'STEPHEN ', 'KINUTHIA', '2018-12-05'),
(146, 26784533, 'CBA', '567778833747', '304D', 'PRODUCTION', 79000, 16032.3, 'WXS523326347', 1080, 99667544, 1400, 45678899, 0, 0, 0, 18512.3, 60487.7, 'May', 2018, 'JOHN', 'KAMAU', '2018-12-05'),
(147, 31363336, 'KCB', '2465728398', '204A', 'SALES', 48000, 6739.25, 'RSTA35271217', 1080, 532332323, 1100, 43436789, 0, 0, 0, 8919.25, 39080.75, 'May', 2018, 'MARTIN', 'NJERU', '2018-12-05'),
(148, 31436755, 'Coop', '3442354325211', '204A', 'PRODUCTION', 48000, 6739.25, 'TEED43481228', 1080, 998213211, 1100, 56579934, 0, 0, 0, 8919.25, 39080.75, 'May', 2018, 'KELVIN', 'OSOO', '2018-12-05'),
(149, 31653421, 'KCB', '172421472148', '204A', 'FINANCE', 48000, 6739.25, 'AQD2214321423', 1080, 769934732, 1100, 45672278, 0, 0, 0, 8919.25, 39080.75, 'May', 2018, 'JANET', 'WARUGURU', '2018-12-05'),
(150, 31678954, 'equity', '177234214212', '204A', 'SALES', 48000, 6739.25, 'SRDG2354327732', 1080, 765343122, 1100, 99963476, 0, 0, 0, 8919.25, 39080.75, 'May', 2018, 'JOHN', 'THUKU', '2018-12-05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `advance`
--
ALTER TABLE `advance`
  ADD PRIMARY KEY (`ref`);

--
-- Indexes for table `banks`
--
ALTER TABLE `banks`
  ADD UNIQUE KEY `bank_id` (`bank_id`);

--
-- Indexes for table `company_details`
--
ALTER TABLE `company_details`
  ADD PRIMARY KEY (`comp_taxpin`);

--
-- Indexes for table `damage`
--
ALTER TABLE `damage`
  ADD PRIMARY KEY (`ref`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD UNIQUE KEY `depart_id` (`depart_id`);

--
-- Indexes for table `empdetail`
--
ALTER TABLE `empdetail`
  ADD PRIMARY KEY (`nationalid`),
  ADD UNIQUE KEY `KRApin` (`KRApin`),
  ADD UNIQUE KEY `NSSFNo` (`NSSFNo`),
  ADD UNIQUE KEY `NHIFNO` (`NHIFNO`),
  ADD UNIQUE KEY `phoneNo` (`phoneNo`),
  ADD UNIQUE KEY `Next_kin_phoneNo` (`next_kin_phoneNo`),
  ADD UNIQUE KEY `AccNo` (`AccNo`),
  ADD UNIQUE KEY `next_kin_email` (`next_kin_email`),
  ADD UNIQUE KEY `Pemail` (`Pemail`);

--
-- Indexes for table `empreim`
--
ALTER TABLE `empreim`
  ADD PRIMARY KEY (`ref`);

--
-- Indexes for table `income`
--
ALTER TABLE `income`
  ADD UNIQUE KEY `income_id` (`income_id`),
  ADD UNIQUE KEY `basic_income` (`basic_income`),
  ADD UNIQUE KEY `special_allow` (`special_allow`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`ref`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `advance`
--
ALTER TABLE `advance`
  MODIFY `ref` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
--
-- AUTO_INCREMENT for table `damage`
--
ALTER TABLE `damage`
  MODIFY `ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `empreim`
--
ALTER TABLE `empreim`
  MODIFY `ref` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=151;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
