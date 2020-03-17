<?php
session_start();
include_once './db/condb.php';

$natid = $_POST['nationalid'];
$stats = strtoupper($_POST['work']);

$sql = "SELECT *FROM empdetail WHERE nationalid='$natid'" ;
          $result = mysqli_query($conn, $sql);

 $sql =" UPDATE empdetail SET work_status= '$stats' WHERE nationalid='$natid'";
  if (mysqli_query($conn, $sql)){
      echo "<script> alert('STATUS CHANGE WAS SUCCESSFUL')</script>";
  }  
  else{
  
       
    echo "<script> alert( '  UPDATE WAS UNSUCCESSFUL...') </script>";
  }   


  ?>