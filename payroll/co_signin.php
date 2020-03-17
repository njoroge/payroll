<?php
session_start();

include_once './db/condb.php' ;

    $txpin = $_POST['taxpin'];
    
    $pass = md5($_POST['password']);
    $sql = "SELECT pemail,password,is_admin,is_hrman FROM empdetail WHERE pemail = '$txpin' and password = '$pass'";
    $result = mysqli_query($conn, $sql);

    $_SESSION['comp'] = $_POST['taxpin'];
    //echo $sql;
    if(mysqli_fetch_assoc( $result)<1){ 
        echo "<script> alert('The email or password do not match') </script>";             
        }

    else{

        $isadmin="";
        $ishr="";
        foreach($result as $key => $value){
            $isadmin = $value['is_admin'];
            $ishr = $value['is_hrman'];
        }
        if($isadmin==1){
 
        header("location:home.php" );
        }
        else if($ishr==1){
            header("location:home.php" );
        }
    }
    ?>