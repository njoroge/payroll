<?php

include_once './resources/fpdf.php';
 include_once './db/condb.php';
class PDF extends FPDF
{
    // Page header
    public function Header()
    {
        // Logo
        $this->Image('image/py1.jpg', 10, 6, 30);
        // Arial bold 15
        $this->SetFont('Times', 'B', 15);
        // Move to the right
        $this->Cell(80);
        // Title
        $this->Cell(30, 10, 'Recorded registration', 0, 0, 'C');
        // Line break
        $this->Ln(20);
    }

    // Page footer
    public function Footer()
    {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        // Arial italic 8
        $this->SetFont('Times', 'I', 8);
        // Page number
        $this->Cell(0, 10, 'Page '.$this->PageNo().'/{nb}', 0, 0, 'C');
    }
}
    $dsfs = $_POST['date1'];
    $st_date = date_format(date_create($dsfs), 'Y-m-d');
    $en_date = date('Y-m-d', strtotime($_POST['date2']));

$display_heading = array('fname' => 'first name', 'lname' => 'last name', 'phoneNo' => 'phone number',
'nationlid' => 'National ID', 'department' => 'department', 'income_id' => 'Category', 'reg_date' => 'Registration date', );

$sql = "SELECT fname, lname, phoneNo, nationalid, department, income_id, reg_date  FROM empdetail WHERE reg_date BETWEEN '$st_date' AND '$en_date'";
$result = mysqli_query($conn, $sql);
//echo json_encode($result);
//echo $sql;
$res2 = json_encode($result);
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetFont('Times', '', 12);
//echo $res2;
foreach ($display_heading as $heading) {
    $pdf->Cell(30, 10, $heading, 1);
}
$data2 = array();
while ($row = $result->fetch_assoc()) {
    $data2[] = $row;
    // $pdf->Cell(30, 10, $row['fname'], 1);
    // $pdf->Cell(30, 10, $row['lname'], 1);
    // $pdf->Cell(30, 10, $row['phoneNo'], 1);
    // $pdf->Cell(30, 10, $row['nationalid'], 1);
    // $pdf->Cell(30, 10, $row['gender'], 1);
    // $pdf->Cell(30, 10, $row['income_id'], 1);
    // $pdf->Cell(30, 10, $row['reg_date'], 1, 1);
}
foreach ($data2 as $key => $value) {
    //$pdf->Cell(40,12,$value['sname'],1);
    $pdf->Cell(30, 10, $value['fname'], 1);
    $pdf->Cell(30, 10, $value['lname'], 1);
    $pdf->Cell(30, 10, $value['phoneNo'], 1);
    $pdf->Cell(30, 10, $value['nationalid'], 1);
    $pdf->Cell(30, 10, $value['department'], 1);
    $pdf->Cell(30, 10, $value['income_id'], 1);
    $pdf->Cell(30, 10, $value['reg_date'], 1, 1);
}

$pdf->Output();
