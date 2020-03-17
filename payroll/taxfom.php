<?php

class Tax
{
    public static function Rates()
    {
        $rates_config = file_get_contents('./js/taxrates.json');
        $rates = json_decode($rates_config, true);

        return $rates;
    }

    public static function nssf($gross_inc)
    {
        if ($gross_inc < 6000) {
            return 0.6 * $gross_inc;
        }

        return 1080;
    }

    public static function explore($interval, $deductions, $gross_inc, $tax_relief = 1408, $initialtxble = 12298)
    {
        $initial_tax = 1229.8;
        $net_taxable_income = $taxable_inc - $deductions;
        $txsa = $net_taxable_income;
        echo $taxable_income ," old taxable income\n";
        if ($taxable_income < 12298) {
            //echo 'no tax';

            return 0;
        } else {
            $taxable_income = $taxable_income - $initialband;
            echo $net_taxable_income." net taxable income new\n";
            $bands_no = $taxable_income / $interval;
            echo $bands_no."\n";
            if ($bands_no > 3) {
                $bands_no = 3;
            }
            $taxed_income = $initialband + ($interval * (int) $bands_no);
            //echo $taxed_income . " taxed income\n";
            $not_taxed = $txsa - $taxed_income;
            //echo $not_taxed ." not taxed\n";
            if ((int) ($net_taxable_income / $interval) == 0) {
                $tax = $not_taxed * Tax::Rates()['2'];
                $tax = $tax + $initialband * Tax::Rates()['1'] - $tax_relief;

                return $tax;
            } elseif ((int) ($net_taxable_income / $interval) == 1) {
                $tax = $not_taxed * Tax::Rates()['3'];
                $tax = $tax + Tax::Rates()['1'] * $initialband + Tax::Rates()['2'] * $interval - $tax_relief;

                return $tax;
            } elseif ((int) ($net_taxable_income / $interval) == 2) {
                $tax = $not_taxed * Tax::Rates()['4'];
                $tax = $tax + Tax::Rates()['1'] * $initialband + Tax::Rates()['2'] * $interval + Tax::Rates()['3'] * $interval - $tax_relief;

                return $tax;
            } else {
                $tax = $not_taxed * Tax::Rates()['5'];
                $tax = $tax + Tax::Rates()['1'] * $initialband + Tax::Rates()['2'] * $interval + Tax::Rates()['3'] * $interval + Tax::Rates()['4'] * $interval - $tax_relief;

                return $tax;
            }
        }
    }

    public static function getNHIFRates($taxable_inc)
    {
        $rates_config = file_get_contents('./js/nhifrates2018.json');
        $rates_data = json_decode($rates_config, true);
        if (in_array($taxable_inc, range(0, 5999))) {
            echo $rates_data['0-5999'];

            return $rates_data['0-5999'];
        } elseif (in_array($taxable_inc, range(6000, 7999))) {
            return $rates_data['6000-7999'];
        } elseif (in_array($taxable_inc, range(8000, 11999))) {
            return $rates_data['8000-11999'];
        } elseif (in_array($taxable_inc, range(12000, 14999))) {
            return $rates_data['12000-14999'];
        } elseif (in_array($taxable_inc, range(15000, 19999))) {
            return $rates_data['1500-19999'];
        } elseif (in_array($taxable_inc, range(20000, 24999))) {
            return $rates_data['20000-24999'];
        } elseif (in_array($taxable_inc, range(25000, 29999))) {
            return $rates_data['25000-29999'];
        } elseif (in_array($taxable_inc, range(30000, 34999))) {
            return $rates_data['30000-34999'];
        } elseif (in_array($taxable_inc, range(35000, 39999))) {
            return $rates_data['35000-39999'];
        } elseif (in_array($taxable_inc, range(40000, 44999))) {
            return $rates_data['40000-44999'];
        } elseif (in_array($taxable_inc, range(45000, 49999))) {
            return $rates_data['45000-49999'];
        } elseif (in_array($taxable_inc, range(50000, 59999))) {
            return $rates_data['50000-59999'];
        } elseif (in_array($taxable_inc, range(60000, 69999))) {
            return $rates_data['60000-69999'];
        } elseif (in_array($taxable_inc, range(70000, 79999))) {
            return $rates_data['70000-79999'];
        } elseif (in_array($taxable_inc, range(80000, 89999))) {
            return $rates_data['80000-89999'];
        } elseif (in_array($taxable_inc, range(90000, 99999))) {
            return $rates_data['90000-99999'];
        } elseif ($taxable_inc >= 100000) {
            //echo $rates_data['100000'];
            return $rates_data['100000'];
        }

        return $rates_data;
    }
}
