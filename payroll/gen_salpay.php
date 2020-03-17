<?php

include './db/condb.php';
//$idnum = $_POST['natid'];
//$dptment = strtoupper($_POST['dptment']);
$mnths = $_POST['month'];
$yeear =$_POST['year'];
 function Rates()
 {
     $ratesConfig = file_get_contents('./js/taxrates.json');
     $rates = json_decode($ratesConfig, true);

     return $rates;
 }
 function nhifRates($ttincom)
 {
     $ratesConfig = file_get_contents('./js/nhifrates2018.json');
     $rates_data = json_decode($ratesConfig, true);
     if (in_array($ttincom, range(0, 5999))) {
         //echo $rates_data['0-5999'];
         return $rates_data['0-5999'];
     } elseif (in_array($ttincom, range(6000, 7999))) {
         return $rates_data['6000-7999'];
     } elseif (in_array($ttincom, range(8000, 11999))) {
         return $rates_data['8000-11999'];
     } elseif (in_array($ttincom, range(12000, 14999))) {
         return $rates_data['12000-14999'];
     } elseif (in_array($ttincom, range(15000, 19999))) {
         return $rates_data['1500-19999'];
     } elseif (in_array($ttincom, range(20000, 24999))) {
         return $rates_data['20000-24999'];
     } elseif (in_array($ttincom, range(25000, 29999))) {
         return $rates_data['25000-29999'];
     } elseif (in_array($ttincom, range(30000, 34999))) {
         return $rates_data['30000-34999'];
     } elseif (in_array($ttincom, range(35000, 39999))) {
         return $rates_data['35000-39999'];
     } elseif (in_array($ttincom, range(40000, 44999))) {
         return $rates_data['40000-44999'];
     } elseif (in_array($ttincom, range(45000, 49999))) {
         return $rates_data['45000-49999'];
     } elseif (in_array($ttincom, range(50000, 59999))) {
         return $rates_data['50000-59999'];
     } elseif (in_array($ttincom, range(60000, 69999))) {
         return $rates_data['60000-69999'];
     } elseif (in_array($ttincom, range(70000, 79999))) {
         return $rates_data['70000-79999'];
     } elseif (in_array($ttincom, range(80000, 89999))) {
         return $rates_data['80000-89999'];
     } elseif (in_array($ttincom, range(90000, 99999))) {
         return $rates_data['90000-99999'];
     } elseif ($ttincom >= 100000) {
         //echo $rates_data['100000'];
         return $rates_data['100000'];
     }

     return $rates_data;
 }

function calcTax($interval, $deductions, $ttincom, $taxRelief = 1408, $initialtxble = 12298)
{
    $interval = 11587;
    //$initial_tax = 1229.8;
    $taxableIncome = $ttincom - $deductions;
    $txsa = $taxableIncome;
    //echo $taxableIncome ," old taxable income\n";
    if ($taxableIncome < 12298) {
        echo 'amount is below taxable amount';

        return 0;
    } else {
        $taxableIncome = $taxableIncome - $initialtxble;
        //echo $taxableIncome." net taxable income new\n";
        $bandsNo = $taxableIncome / $interval;
        //echo $bandsNo."\n";
        if ($bandsNo > 3) {
            $bandsNo = 3;
        }
        $taxedIncome = $initialtxble + ($interval * (int) $bandsNo);
        //echo $taxedIncome . " taxed income\n";
        $amountNotTaxed = $txsa - $taxedIncome;
        //echo $amountNotTaxed ." not taxed\n";
        if ((int) ($taxableIncome / $interval) == 0) {
            $tax = $amountNotTaxed * Rates()['2'];
            $tax = $tax + $initialtxble * Rates()['1'] - $taxRelief;

            return $tax;
        } elseif ((int) ($taxableIncome / $interval) == 1) {
            $tax = $amountNotTaxed * Rates()['3'];
            $tax = $tax + Rates()['1'] * $initialtxble + Rates()['2'] * $interval - $taxRelief;

            return $tax;
        } elseif ((int) ($taxableIncome / $interval) == 2) {
            $tax = $amountNotTaxed * Rates()['4'];
            $tax = $tax + Rates()['1'] * $initialtxble + Rates()['2'] * $interval + Rates()['3'] * $interval - $taxRelief;

            return $tax;
        } else {
            $tax = $amountNotTaxed * Rates()['5'];
            $tax = $tax + Rates()['1'] * $initialtxble + Rates()['2'] * $interval + Rates()['3'] * $interval + Rates()['4'] * $interval - $taxRelief;

            return $tax;
        }
    }
}
 function calcDeduction($advance, $damages){

 }
    

    $sql = "SELECT * FROM payment WHERE month = '$mnths' and year ='$yeear'";
    $result = mysqli_query($conn, $sql);
    if(mysqli_fetch_assoc($result) > 1) {
        echo "<script> alert('salaries for this month already paid') </script>";
    } else {

    $sql = "SELECT fname, lname, phoneNo, empdetail.nationalid, empdetail.income_id, department, KRApin, NHIFNO, NSSFNo, bank, AccNo, total_income,(SELECT advance_amount From advance where advance.nationalid=empdetail.nationalid AND status ='unsettled') 
    AS advance, (SELECT damag_amount From damage where damage.national_id=empdetail.nationalid AND damag_status='unsettled') AS damage,(SELECT reim_amount From empreim where empreim.national_id=empdetail.nationalid AND reim_status ='unsettled') AS reim FROM empdetail,income  WHERE empdetail.income_id=income.income_id AND work_status ='ACTIVE'";
    $result = mysqli_query($conn, $sql);
        $iincid = ' ';
        $fname = ' ';
        $lname = ' ';
        $phonee = ' ';
        $natid = ' ';
        $kraaa = ' ';
        $nhifff = ' ';
        $nssfn = ' ';
        $bnkk = ' ';
        $bdptmnt = ' ';
        $acccno = ' ';
        $ttincom = ' ';
        $addvan=' ';
        $dmage =' ';
        $reim =' ';
    if (mysqli_fetch_assoc($result) <1) {
        echo "<script> alert('no result found') </script>";
    } else {
        
        foreach ($result as $key => $value) {
            $iincid = $value['income_id'];
            $fname = $value['fname'];
            $lname = $value['lname'];
            $phonee = $value['phoneNo'];
            $natid  = $value['nationalid'];
            $bdptmnt = $value['department'];
            $kraaa = $value['KRApin'];
            $nhifff = $value['NHIFNO'];
            $nssfn = $value['NSSFNo'];
            $bnkk = $value['bank'];
            $acccno = $value['AccNo'];
            $ttincom = $value['total_income'];
            $addvan= $value['advance'];
            $dmage = $value['damage'];
            $reim = $value['reim'];

            //echo $addvan."<br>";
            //echo $dmage."<br>";
            $rates_data = nhifRates($ttincom);
            $tax = calcTax(11587, 1080, $ttincom, $taxRelief = 1408, $initialtxble = 12298);

            if($dmage==='NULL' && $addvan ==='NULL'){
                $dmage = 0 ;
                $addvan = 0 ;

                $ttdeducts = $tax + $rates_data + 1080 + $dmage + $addvan ;
            } else if($dmage==='NULL'){
                $dmage = 0 ;
                $ttdeducts = $tax + $rates_data + 1080 + $dmage + $addvan;
            }else if($addvan ==='NULL'){
                $ttdeducts = $tax + $rates_data + 1080 + $dmage + $addvan;
                $addvan = 0 ;
            }else{
                $ttdeducts = $tax + $rates_data + 1080 + $dmage + $addvan;
            }

           //$ttdeducts = $tax + $rates_data + 1080  
            $netpay =  $ttincom - $ttdeducts;

            if($reim==='NULL'){
                $reim = 0;
                $netttpay = $reim + $netpay;
            }
            else{
                $netttpay = $reim + $netpay;
            }
        // echo $ttdeducts."<br>";
        // echo $netttpay."<br>";
        
           

            $sql = "INSERT INTO payment(national_id, bank, ACC_NO, income_id, department, Amount, tax_paid, KRApin, nssf_deduct, NSSFNo, nhif_deduct, NHIFNO, advance, damages, reim, total_deducts, net_pay, month, year, fname, lname, Date_processed) VALUES ( '$natid','$bnkk','$acccno','$iincid','$bdptmnt','$ttincom','$tax','$kraaa',1080,'$nssfn','$rates_data','$nhifff','$addvan','$dmage','$reim','$ttdeducts','$netttpay','$mnths','$yeear','$fname','$lname',now())";
            $data = mysqli_query($conn, $sql);
            if ($data) {
                $sql = "UPDATE advance SET status='settled' ";
                $result =mysqli_query($conn, $sql);

                $sql = "UPDATE damage SET damag_status='settled' ";
                $result =mysqli_query($conn, $sql);

                $sql = "UPDATE empreim SET reim_status='settled' ";
                $result =mysqli_query($conn, $sql);
              
                echo "<script> alert( 'payment successful...') </script>";


                //header("location:payslip/payments.php");
            } else {
                echo "<script> alert( ' FAILED!!...') </script>";
            }

      
           
            }

        
        }
    }
    ?>
    <!DOCTYPE html>
 <html lang="en">

<head>
    <title>payroll system </title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
        crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN"
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q"
        crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
        crossorigin="anonymous"></script>
    <link rel="stylesheet" href="css/style.css">
    <style>
    table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
}

td, th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
}

tr:nth-child(even) {
    background-color: #dddddd;
}
</style>

</head>
<body>
<header>

          <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
              <ul class="navbar-nav mr-auto">
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    Home
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="home.php">home</a>
                    <a class="dropdown-item" href="logout.php">logout</a>
                  </div>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    Setup
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="empreg.php">register employee </a>
                    <a class="dropdown-item" href="active_emp.php">activate employee </a>
                    <a class="dropdown-item" href="payables.php">payables</a>
                    <a class="dropdown-item" href="regbanks.php">Register banks</a>
                    <a class="dropdown-item" href="regdeparts.php">Register department</a>
                    <a class="dropdown-item" href="del_banks.php">Edit bank</a>
                    <a class="dropdown-item" href="del_departs.php">Edit department</a>


                  </div>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    Payment
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <a class="dropdown-item" href="reim.php">Reimbursement</a>
                  <a class="dropdown-item" href="damage.php">damages</a>
                  <a class="dropdown-item" href="advance.php">advance payment</a>
                    <a class="dropdown-item" href="salpayment.php">salary payment</a>
                    
                    <a class="dropdown-item" href="payslip.php">payslip</a>
                    <a class="dropdown-item" href="reversepayment.php">Reverse payment</a>
                  </div>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                   Reports
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="regreports.php">registration reports </a>
                    <a class="dropdown-item" href="advancereps.php"> advance payment reports</a>
                    <a class="dropdown-item" href="salreps.php">salary paid reports </a>
                    <a class="dropdown-item" href="txreps.php">tax paid reports</a>
                    <a class="dropdown-item" href="nhifreps.php">nhif contribution reports</a>
                  </div>
                </li>
              </ul>
            </div>
          </nav>
        </header>
      </div>
    </div>
  </div>
  
  </div>
            
</body>
<html>
<?php
include './db/condb.php';
error_reporting(0);
$sql = "SELECT * FROM payment WHERE month='$mnths' AND year= '$yeear'";
$result = mysqli_query($conn, $sql);

        echo "<table >
        <thead >
        <tr>
        <th >First Name</th>
        <th >Last Name</th>
        <th >Department</th>
        <th >Category</th>
        <th >Gross Pay</th>
        <th >NSSF</th>
        <th >Tax</th>
        <th >NHIF</th>
        <th >Net pay</th>
        <th >Bank</th>
        <th >Account No</th>
        <th >Month</th>
        <th >Date paid</th>
    
      </tr>
        </thead>
        ";
        
        if (mysqli_fetch_assoc($result) < 1) {
            echo "<script> alert('no result found') </script>";
        } else {
            foreach ($result as $key => $value) {
        
        echo "<tr>";
        echo "<td>".$fname = $value['fname']."</td>" ;
        echo "<td>".$lname = $value['lname']."</td>";
        echo "<td>".$bdptmnt = $value['department']."</td>";
        echo "<td>".$iiinc = $value['income_id']."</td>" ;
        echo "<td>".$ttincom = $value['Amount']."</td>";
        echo "<td>".$nssf = $value['nssf_deduct']."</td>";
        echo "<td>".$tax = $value['tax_paid']."</td>" ;
        echo "<td>".$rates_data = $value['nhif_deduct']."</td>";
        echo "<td>".$netttpay = $value['net_pay']."</td>";
        echo "<td>".$bnkk = $value['bank']."</td>" ;
        echo "<td>".$acccno = $value['ACC_NO']."</td>" ;
        echo "<td>".$amnths = $value['month']."</td>" ;
        echo "<td>".$date = $value['Date_processed']."</td>";
        ?>
        
        <?php
        echo "</td>";
                }
            }
echo"</table>";
?>

<div>
  <form action = "./payslip/payslip.php" method = "post"> 
  <button type="submit" class="signinbtn" name="submit">print payslip</button>
  </form>
      