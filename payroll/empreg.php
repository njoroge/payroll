


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
  <?php

include_once './db/condb.php';
if(isset($_POST['submit'])){
    $sname = strtoupper($_POST['sname']);
    $fname = strtoupper($_POST['fname']);
    $lname = strtoupper($_POST['lname']);
    $ephon = $_POST['phone'];
    $empmail = $_POST['email'];
    $natid = $_POST['nationalid'];
    $dsfs = $_POST['dob'];
    $date = date_format(date_create($dsfs), 'Y-m-d');
    $gend = $_POST['gender'];
    $krpi = $_POST['krapin'];
    $nhif = $_POST['nhif'];
    $nssf = $_POST['nssf'];
    $bkkk = $_POST['bank'];
    $acc = $_POST['accno'];
    $status = $_POST['status'];
   
    $fkin = $_POST['fnextkin'];
    $lkin = $_POST['lnextkin'];
    $rkin = $_POST['nxtrelation'];
    $pkin = $_POST['nxtphone'];
    $eKin = $_POST['nxtemail'];

   
    $sql = "SELECT * FROM empdetail WHERE nationalid ='$natid' AND KRApin = '$krpi'";
    $result = mysqli_query($conn,$sql);

    if(mysqli_fetch_assoc( $result)>1){
       echo  "<script> alert( ' THE USER ALREADY EXISTS...') </script>";
    }else{ 

    $sql = "INSERT INTO empdetail(sname, fname, lname, phoneNo, Pemail, nationalid, dob, gender, 
    KRApin, NHIFNO, NSSFNo, bank, AccNo, status, income_id, next_kin_fname, next_kin_lname,
     next_kin_relation, next_kin_phoneNo, next_kin_email, reg_date,work_status) VALUES ( '$sname','$fname',
     '$lname','$ephon','$empmail','$natid','$date','$gend','$krpi','$nhif','$nssf','$bkkk','$acc',
     '$status','','$fkin','$lkin','$rkin','$pkin','$eKin', now(),'inactive')";

    $result = mysqli_query($conn, $sql);

    if ($result) {
        echo  "<script> alert( ' REGISTRATION COMPLETED SUCCESSFULLY...') </script>";
    } else {
        echo  "<script> alert( ' REGISTRATION  UNSUCCESSFUL...') </script>";
    }

}
}
?>


  
  
</head>
<body>
  <div class="jumbotron text-center">
    <h1> New employee registration </h1>
    <p> A smart way to manage your employees payment and tax payment for your company </p>
    <div>
      <div class="container">
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
                    Payments
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <a class="dropdown-item" href="reim.php">Reimbursement</a>
                  <a class="dropdown-item" href="damage.php">damages</a>
                  <a class="dropdown-item" href="advance.php">advance payment</a>
                  <a class="dropdown-item" href="salpayment.php">salary payment</a>
                    <a class="dropdown-item" href="./payslip/payslip.php">payslip</a>
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
  <div>
    <form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>" method="post">
      <h2>register a new employee</h2>
      <hr>
      <div class="form-row">
        <div class="col">
          <label for="surname name"><b>Surname Name:</b></label>
          <input type="text" placeholder="Enter the surname " name="sname" required>
        </div>
        <div class="col">
          <label for="first name"><b>First Name:</b></label>
          <input type="text" placeholder="Enter the first name " name="fname" required>
        </div>
        <div class="col">
          <label for="other names"><b>Other Names:</b></label>
          <input type="text" placeholder="enter the other name" name="lname" required>
        </div>
      </div>
      <div class="form-row">
        <div class="col">
          <label for=" contact phone number "><b>Phone Number:</b></label>
          <input type="text" placeholder="enter the personal contact  number" name="phone" required>
        </div>
        <div class="form-row">
          <div class="col">
          <label for=" contact email"><b>Email:</b></label>
          <input type="email" placeholder="enter the personal contact email" name="email" required>
        </div>
         </div>
      </div>
      <label for="id number "><b>National ID:</b></label>
      <input type="number" placeholder="enter the national id number." name="nationalid" required>

      <label for="date of birth "><b>Date of Birth:</b></label>
      <input type="date" placeholder="enter the date of birth" name="dob" required><br><br>

      <label for="gender "><b>select gender:</b></label>
      
<select name="gender">
      
      <option value ="male"> Male</option>
      <option value="female"> Female</option><br><br>
</select>

      <label for="status "><b>select status:</b></label>
  <select name="status">
      <option value ="single"> single</option>
      <option value ="married"> married</option><br><br>
</select>

      <div class="form-row">
        <div class="col">
          <label for="kRA PIN "><b>KRA PIN:</b></label>
          <input type="text" placeholder="enter the kra pin number." name="krapin" required>
        </div>
        <div class="col">
          <label for="NHIFnumber "><b>NHIF:</b></label>
          <input type="text" placeholder="enter the NHIF number." name="nhif" required>
        </div>
        <div class="col">
          <label for="nssf number "><b>NSSF:</b></label>
          <input type="text" placeholder="enter the nssf number." name="nssf" required>
        </div>
      </div>
      <div class="form-row">
        <div class="col">
          <label for="bank "><b>Bank :</b></label>
          <select name="bank" >
          <?php
         include './db/condb.php';
         $sql =" SELECT bnk_name FROM banks";
         $result = mysqli_query($conn, $sql);
         $bnkk='';
         if (mysqli_fetch_assoc($result) <1) {
          echo "<script> alert('no result found') </script>";
      } else {
          
          foreach ($result as $key => $value) {
            $bnkk = $value['bnk_name'];
            echo "<option value ='$bnkk'> $bnkk</option>";
          }
        }
          ?>
          </select>
        </div>
        <div class="col">
          <label for="account number "><b>Account Number:</b></label>
          <input type="text" placeholder="enter the account  number." name="accno" required>
        </div>
      </div>
      

      <div class="form-row">
        <div class="col">
          <label for="next of kin first name"><b>Next of kin first name:</b></label>
          <input type="text" placeholder="enter the employee next of kin first name " name="fnextkin">
        </div>
        <div class="col">
          <label for="next of kin last name"><b>Next of kin last name:</b></label>
          <input type="text" placeholder="enter the employee next of kin last name" name="lnextkin" >
        </div>
        <div class="col">
          <label for="next of kin relation"><b>Relationship:</b></label>
          <input type="text" placeholder="enter the employee next of kin last name" name="nxtrelation" >
        </div>
      </div>
      <div class="form-row">
        <div class="col">
          <label for="next of kin phone"><b>next of kin phone number:</b></label>
          <input type="text" placeholder="enter the next of kin phone number" name="nxtphone" >
        </div>
        <div class="col">
          <label for="next of kin email"><b>next of kin email:</b></label>
          <input type="text" placeholder="enter the next of kin email" name="nxtemail" >
        </div>
      </div>
      <br>
      <hr>
      <button type="submit" class="registerbtn" name="submit">Register</button>
      <br><br><br>
    </form>
  </div>
  <div class="ft">
<!-- Footer -->
<footer class="page-footer font-small unique-color-dark">

    <div style="background-color:;">
      <div class="container">

        <!-- Grid row-->
        <div class="row py-4 d-flex align-items-center">

          <!-- Grid column -->
          <div class="col-md-6 col-lg-5 text-center text-md-left mb-4 mb-md-0">
            <h6 class="mb-0"></h6>
          </div>
          <!-- Grid column -->

          <!-- 
          <div class="col-md-6 col-lg-7 text-center text-md-right">

            -- Facebook --
            <a class="fb-ic">
              <i class="fa fa-facebook white-text mr-4"> </i>
            </a>
            -- Twitter --
            <a class="tw-ic">
              <i class="fa fa-twitter white-text mr-4"> </i>
            </a>
            -- Google +--
            <a class="gplus-ic">
              <i class="fa fa-google-plus white-text mr-4"> </i>
            </a>
            --Linkedin --
            <a class="li-ic">
              <i class="fa fa-linkedin white-text mr-4"> </i>
            </a>
            --Instagram--
            <a class="ins-ic">
              <i class="fa fa-instagram white-text"> </i>
            </a>

          </div>
          -- Grid column -->
        </div>
      </div>
    </div>
    <div class="container text-center text-md-left mt-5">
      <div class="row mt-3">
        <div class="col-md-3 col-lg-4 col-xl-3 mx-auto mb-4">
          <h6 class="text-uppercase font-weight-bold">pay well</h6>
          <hr class="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style="width: 60px;">
          <p>welcome to pay well  payroll system an easier way to manage your employee payment process .</p>
        </div>
        <div class="col-md-2 col-lg-2 col-xl-2 mx-auto mb-4">
          <h6 class="text-uppercase font-weight-bold">setup</h6>
          <hr class="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style="width: 60px;">
          <p>
            <a href="empreg.php">register employee</a>
          </p>
          <p>
            <a href="regreports.php">activate employee</a>
          </p>
          <p>
            <a href="payables.php">payables</a>
          </p>
          <p>
            <a href="regbanks.php">register banks</a>
          </p>
          <p>
          <a href="regdeparts.php">register departments</a>
          </p>
        </div>
        <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
          <h6 class="text-uppercase font-weight-bold">Reports</h6>
          <hr class="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style="width: 60px;">
          <p>
            <a href="regreports.php">Registration reports</a>
          </p>
          <p>
            <a href="advancereps.php">Advance payment reports</a>
          </p>
          <p>
            <a href="salreps.php">Salary paid reports </a>
          </p>
          <p>
            <a href="txreps.php">Tax paid reports</a>
          </p>
          <p>
            <a href="nhifreps.php">NHIF contribution reports</a>
          </p>

        </div>
        
        <div class="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
          <h6 class="text-uppercase font-weight-bold">Contact us</h6>
          <hr class="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style="width: 60px;">
          <p>
            <i class="fa fa-home mr-3"></i> Nairobi, kenya</p>
          <p>
            <i class="fa fa-envelope mr-3"></i> info@paywell.com</p>
          <p>
            <i class="fa fa-phone mr-3"></i>+ 254 712345678 </p>
        </div>
      </div>
    </div>
    <div class="footer-copyright text-center py-3"> © 2018 Copyright: 
    </div>
  </footer>
</div>
</body>
</html>