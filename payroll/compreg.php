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

</head>
<body>
<div class="jumbotron text-center">
    <h1> Welcome to payroll system </h1>
    <p> A smart way to manage your employees payment and tax payment for your company </p>
  </div>
  <div >
  <form action="co_signup.php" method="post">
            <h2>register a new company</h2>
            <hr>
            
            <label for="Company name"><b>Company Name:</b></label>
            <input type="text" placeholder="Enter the company  name" name="name" required>
			
            <label for="employer tax pin"><b>Company tax  pin :</b></label>
            <input type="text" placeholder="Enter your company tax pin " name="taxpin" required>
            
            <label for="company location "><b>Company location:</b></label>
            <input type="text" placeholder="enter the company location" name="location" required>
            
            <label for="company contact email "><b>Company email:</b></label>
            <input type="text" placeholder="enter the company contact email" name="email" required>
            
            <label for="company contact phone "><b>Company phone:</b></label>
            <input type="text" placeholder="enter the company contact phone" name="phone" required>
            
            <label for="password "><b>password:</b></label>
            <input type="password" placeholder="enter the company pass..." name="password" required>
            <br>
            <hr>
            <button type="submit" class="registerbtn" name="submit">Register</button>

            <br><br><br>
        </form>
        </div>
</body>
</html>