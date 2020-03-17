<?php 
include './db/condb.php';
include './resources/fpdf.php';
class PDF extends FPDF
{ // Page header
    public function Header()
    { // Logo
        $this->Image('image/py1.jpg', 10, 6, 30);
        // Arial bold 55
        $this->SetFont('Times', 'B', 18);
        // Move to the right
        $this->Cell(80);
        // Title
        $this->Cell(30, 10, 'payslip', 0, 0, 'C');
        $this->Cell(50, 10, '', 0, 0, 'R');
        $this->Ln(20);
    }
    // Page footer
    public function Footer()
    {
        // Position at 5.5 cm from bottom
        $this->SetY(-55);
        // Arial italic 8
        $this->SetFont('Times', 'I', 8);
        // Page number
        $this->Cell(0, 10, 'Page '.$this->PageNo().'/{nb}', 0, 0, 'C');
    }
}
    $natid = $_POST['nationalid'];
    $mont = $_POST['month'];
    $year = $_POST['year'];
    $sql = " SELECT CONCAT(fname,' ',lname) AS name,national_id, bank, ACC_NO, KRApin, month, Amount, nssf_deduct, nhif_deduct, tax_paid, damages, advance, reim, total_deducts, net_pay, Date_processed  FROM payment WHERE national_id = '$natid'and month='$mont'and year ='$year'";
    $result = mysqli_query($conn,$sql);
   
    $lname ='';
    $natid ='';
    $bnkk ='';
    $accno ='';
    $kraa='';
    $peri='';
    $amnt='';
    $nssf='';
    $nhif='';
    $txax='';
    $dmage ='';
    $advan ='';
    $reim ='';
    $ttdeduct='';
    $ttpay='';
    $datee='';
    $date = date_format(date_create($datee), 'd-m-Y');
    if (mysqli_fetch_assoc($result) <1) {
        echo "<script> alert('no result found') </script>";
    } else {
        foreach ($result as $key => $value) {
            
            $lname = $value['name'];
            $natid =$value['national_id'];
            $bnkk = $value['bank'];
            $accno =$value['ACC_NO'];
            $kraa=$value['KRApin'];
            $peri=$value['month']; 
            $amnt =$value['Amount'];
            $nssf=$value['nssf_deduct'];
            $nhif =$value['nhif_deduct'];
            $txax=$value['tax_paid'];
            $dmage=$value['damages'];
            $advan=$value['advance'];
            $reim=$value['reim'];
            $ttdeduct=$value['total_deducts'];
            $ttpay=$value['net_pay'];
            $datee=$value['Date_processed'];
            $txable = $amnt - $nssf;

            $pdf = new PDF('P', 'mm', 'A5');
            $pdf->AliasNbPages();
            $pdf->AddPage();
            $pdf->SetFont('Times', '', 11);
            $pdf->Cell(25, 5, 'Names :', 0);
            $pdf->Cell(30, 5, $lname, 0,1);
            $pdf->Cell(30, 5, 'National id :', 0);
            $pdf->Cell(30, 5, $natid, 0,1);
            $pdf->Cell(30, 5, 'Bank :', 0);
            $pdf->Cell(30, 5, $bnkk, 0,1);
            $pdf->Cell(30, 5, 'Account Number :', 0);
            $pdf->Cell(30, 5, $accno, 0,1);
            $pdf->Cell(30, 5, 'KRA Pin :', 0);
            $pdf->Cell(30, 5, $kraa, 0,1);
            $pdf->Cell(30, 5, 'Salary month :', 0);
            $pdf->Cell(30, 5, $peri, 0,1);
            $pdf->Cell(30, 5, 'Date processed :', 0);
            $pdf->Cell(30, 5, $date, 0,1);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '_________________', 0,1);
            $pdf->Cell(30, 5, 'Gross Pay', 0);
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5, $amnt, 0,1);
            $pdf->Cell(30, 5,' Deductions ' , 0,1);
            $pdf->Cell(30, 5, 'NSSF', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $nssf, 0,1);
            $pdf->Cell(30, 5, 'NHIF', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $nhif, 0,1);
            $pdf->Cell(30, 5, 'PAYE', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $txax, 0,1);
            $pdf->Cell(30, 5, 'damages', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $dmage, 0,1);
            $pdf->Cell(30, 5, 'advance', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $advan, 0,1);
            $pdf->Cell(30, 5, 'Total Deductions', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5, $ttdeduct, 0,1);
            $pdf->Cell(30, 5, 'Reimbursement', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5,$reim, 0,1);
            $pdf->Cell(30, 5, 'Net Pay', 0);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5);
            $pdf->Cell(30, 5,$ttpay, 0,1);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '________________', 0);
            $pdf->Cell(30, 5, '_________________', 0,1);
            $pdf->Cell(30, 5, 'PAYE Informtion:', 0,1);
            $pdf->Cell(30, 5, 'Gross Pay', 0);
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5, $amnt, 0,1);
            $pdf->Cell(30, 5, 'Allowable Deductions', 0);
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5, $nssf, 0,1);
            $pdf->Cell(30, 5, 'Taxable Pay', 0);
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5  );
            $pdf->Cell(30, 5, $txable, 0,1);
        }
    }
$pdf->Output();
?>