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
        $this->Cell(30, 10, 'Recorded advance payment', 0, 0, 'C');
        //$this->Cell(25, 10, 'for period', 0, 0, 'C');
        //$this->Cell(30, 10, $st_date - $en_date, 0, 0, 'C');
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

$display_heading = array('ref' => 'reference', 'department' => 'department', 'fname' => 'first name',
'lname' => 'last name', 'nationalid' => 'national id', 'advance_amount' => 'amount', 'date_paid' => 'date', );

$sql = "SELECT * FROM empdetail NATURAL JOIN advance where date_paid BETWEEN '$st_date' AND '$en_date'";
$result = mysqli_query($conn, $sql);

$res2 = json_encode($result);
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetFont('Times', '', 12);
foreach ($display_heading as $heading) {
    $pdf->Cell(30, 10, $heading, 1);
}
$data = array();
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
    
}
foreach ($data as $key => $value) {
    $pdf->Cell(30, 10, $value['ref'], 1);
    $pdf->Cell(30, 10, $value['department'], 1);
    $pdf->Cell(30, 10, $value['fname'], 1);
    $pdf->Cell(30, 10, $value['lname'], 1);
    $pdf->Cell(30, 10, $value['nationalid'], 1);
    $pdf->Cell(30, 10, $value['advance_amount'], 1);
    $pdf->Cell(30, 10, $value['date_paid'], 1, 1);
}

$pdf->Output();
?>