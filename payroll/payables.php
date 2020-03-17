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
//include_once 'taxform.php';

if(isset($_POST['submit'])){
    $incomeid = $_POST['incomeid'];
    $bincome = $_POST['basicincome'];
    $hseall = $_POST['hseallow'];
    $tpsall = $_POST['tpsallow'];
    $hrdall = $_POST['hrdallow'];
    $spallow = $_POST['spallow'];
    $gross_inc = $bincome + $hseall + $tpsall + $hrdall + $spallow;

    

    $sql = "INSERT INTO income(income_id, basic_income, house_allow,
    transport_allow, hardship_allow, special_allow, total_income) VALUES ('$incomeid','$bincome',
    '$hseall','$tpsall','$hrdall','$spallow','$gross_inc')";

    $result = mysqli_query($conn, $sql);
    if ($result) {
        echo  "<script> alert( ' COMPLETED SUCCESSFULLY...') </script>";
    //header("location:payables.php");
    } else {
        echo  "<script> alert( 'UNSUCCESSFUL...') </script>";
    }


  }
?>
</head>

<body>
  <div class="jumbotron text-center">
    <h1> employee payments</h1>
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
      <h2>add new employee group </h2>
      <hr>

      <div class="form-row">
        <div class="col">
          <label for="income id"><b>Set Income Id:</b></label>
          <input type="text" placeholder="Enter the income id" name="incomeid" required>
        </div>
        <div class="col">
          <label for="basic income"><b>Set Basic Income:</b></label>
          <input type="text" placeholder="Enter the basic income " name="basicincome" required>
        </div>
      </div>

      <div class="form-row">
        <div class="col">
          <label for="house allowance"><b>Set House Allowance:</b></label>
          <input type="text" placeholder="enter the house allowance amount" name="hseallow" required>
        </div>
        <div class="col">
          <label for="Transport allowance "><b>Set Transport Allowance:</b></label>
          <input type="text" placeholder="enter the transport allowance" name="tpsallow" required>
        </div>
        <div class="col">
          <label for="hardship allowance"><b>Set Hardship allowance:</b></label>
          <input type="text" placeholder="enter the hardship allowance " name="hrdallow" required>
        </div>
      </div>
      <div class="form-row">
        <div class="col">
          <label for="special allowance"><b>Set Special Allowance:</b></label>
          <input type="text" placeholder="enter the special allowance " name="spallow" required>
        </div>
      </div>

      <br>
      <hr>
      <button type="submit" class="registerbtn" name="submit">submit</button>
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
