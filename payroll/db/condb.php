<?php
$conn=mysqli_connect("localhost","root","","payroll");
// Check connection
if(! $conn ){
    die('Could not connect: ' . mysqli_connect_error());
 
 }
 //else{
     //echo "success";
// }
 mysqli_select_db($conn,"payroll");
 ?>