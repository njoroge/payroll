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
  <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
  <script type="text/javascript">
    $(document).ready(function () {
      $('.search-box input[type="text"]').on("keyup input", function () {

        var inputVal = $(this).val();
        var resultDropdown = $(this).siblings(".result");
        if (inputVal.length) {
          $.get("accsearch.php", {
            term: inputVal
          }).done(function (data) {

            resultDropdown.html(data);
          });
        } else {
          resultDropdown.empty();
        }
      });
      $(document).on("click", ".result p", function () {
        $(this).parents(".search-box").find('input[type="text"]').val($(this).text());
        $(this).parent(".result").empty();
      });
    });
  </script>
  <?php

session_start();
include_once './db/condb.php';
if(isset($_POST['submit'])){
$natid = $_POST['nationalid'];
$stats = strtoupper($_POST['work']);
$fdgsd = strtoupper($_POST['dptment']);
$sql = "SELECT *FROM empdetail WHERE nationalid='$natid'";
          $result = mysqli_query($conn, $sql);
          if(mysqli_fetch_assoc( $result)<1){
            echo  "<script> alert( ' THE USER DOES NOT EXISTS...') </script>";
         }else{ 

 $sql = " UPDATE empdetail SET work_status = '$stats', department='$fdgsd' WHERE nationalid='$natid'";
  if (mysqli_query($conn, $sql)) {
      echo "<script> alert('STATUS CHANGE WAS SUCCESSFUL')</script>";
  } else {
      echo "<script> alert( '  UPDATE WAS UNSUCCESSFUL...') </script>";
  }
}
}
?>
</head>

<body>
  <div class="jumbotron text-center">
    <h1> New employee Activation </h1>
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
                    Payment
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <a class="dropdown-item" href="reim.php">Reimbursement</a>
                  <a class="dropdown-item" href="damage.php">damages</a>
                  <a class="dropdown-item" href="advance.php">advance payment</a>
                    <a class="dropdown-item" href="salpayment.php">salary payment</a>
                    <a class="dropdown-item" href="./payslip/payslip.php">payslip</a>
                    <a class="dropdown-item" href="reversepayment.php">Reverse payment</a>
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
  <div class="col-md">
    <form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>" method="post">
      <div class="col-md">
      <h2>Activate or deactivate employee</h2>
        <hr>
        
          <label for="nationa id "><b>National ID number:</b></label>
          <input type="text" autocomplete="off" placeholder="enter national id number" name="nationalid" required>
          
          <div class="result"></div>
          </div>
          <label for="set status"><b>Set employee status:</b></label>
      <select name="work">
      <option value ="Active"> Activate</option>
      <option value="inactive">Deactivate </option>
      </select>
      <br>
      <label for="set department"><b>Set department:</b></label>
      <select name="dptment">
      <?php
         include './db/condb.php';
         $sql =" SELECT depart_name FROM departments";
         $result = mysqli_query($conn, $sql);
         $dptt='';
         if (mysqli_fetch_assoc($result) <1) {
          echo "<script> alert('no result found') </script>";
      } else {
          
          foreach ($result as $key => $value) {
            $dptt = $value['depart_name'];
            echo "<option value ='$dptt'> $dptt</option>";
          }
        }
          ?>
           

      </select>
      <br>
      <label for="income"><b>Income ID:</b></label>
      <select name="income" >
      
      <?php
         include './db/condb.php';
         $sql =" SELECT income_id FROM income";
         $result = mysqli_query($conn, $sql);
         $incid='';
         if (mysqli_fetch_assoc($result) <1) {
          echo "<script> alert('no result found') </script>";
      } else {
          
          foreach ($result as $key => $value) {
            $incid = $value['income_id'];
            echo "<option value ='$incid'> $incid</option>";
          }
        }
          ?>
      </select>
      <hr>
      
      <button type="submit" class="signinbtn" name="submit">submit</button>
      </div>
      </div>
    </form>
  </div>
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