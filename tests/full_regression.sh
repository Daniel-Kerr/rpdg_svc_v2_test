#!/bin/bash
today=$(date);
host=$(hostname);
now=$(date +"%T");
subject="Regression Summary";
from="Joe.Herbst@rvlti.com";
recipients="Joe.Herbst@rvlti.com,jherbst@yahoo.com";
smail="subject:$subject\n from:$from\n Example Message";
logdir="./logs";
numberofcollections=$(ls ./active_tests/ | awk -F'[.]' '{print $1}' | wc -l);
listoftests=$(ls ./active_tests/ | awk -F'[.]' '{print $1}');
totalfailures=0;
totaltestsrun=0;

clear;
# in case these do not exist
touch $logdir/regression_summary.log;
touch $logdir/failcount.log;
touch $logdir/AssertionFailure.log
touch $logdir/error.log;
#clear out any old logs
cat /dev/null > $logdir/regression_summary.log;
cat /dev/null > $logdir/failcount.log;
cat /dev/null > $logdir/assertionfailure.log;
cat /dev/null > $logdir/error.log;
echo "-----------------------------------------------------" | tee -a $logdir/regression_summary.log;
echo "Date: $today         $now                  Host:$host" | tee -a $logdir/regression_summary.log;
echo "-----------------------------------------------------" | tee -a $logdir/regression_summary.log;
echo "This is `uname -s` running on a `uname -m` processor." | tee -a $logdir/regression_summary.log;
echo "The number of collections was:" $numberofcollections | tee -a $logdir/regression_summary.log;
echo "The list of collections was: " | tee -a $logdir/regression_summary.log;
echo  $listoftests |  tr ' ' '\n' | tee -a $logdir/regression_summary.log;


for testname in $listoftests
	do
		echo "Running: " $logdir/$testname;
		touch $logdir/$testname.log;
		cat /dev/null > $logdir/$testname.log;
		printf "_________________________________________________\n" | tee -a $logdir/$testname.log;
		printf "Logging $testname\n" | tee -a $logdir/regression_summary.log;
		printf "Begin $testname\n" | tee -a $logdir/$testname.log;
			newman run --delay-request 200 ./active_tests/$testname.postman_collection.json | tee -a $logdir/$testname.log;
		printf "End $testname\n" | tee -a $logdir/$testname.log;
		
		printf "_________________________________________________\n" | tee -a $logdir/regression_summary.log;
		grep -H "AssertionFailure" $logdir/$testname.log | tee -a $logdir/assertionfailure.log;	
		grep -H "Error" $logdir/$testname.log | tee -a $logdir/error.log;
		printf "Results for $testname\n\n" | tee -a $logdir/regression_summary.log;
		cat $logdir/$testname.log | grep -A 18 "executed" | grep -A 18 "failed" | tee -a $logdir/regression_summary.log;
		printf "_________________________________________________\n" | tee -a $logdir/regression_summary.log;
		printf "End $testname\n" | tee -a $logdir/regression_summary.log;
	done
# │            test-scripts │       18 │        0 │

		#  this had a bug --> totalfailures=$(cat $logdir/failcount.log | awk '{ sum += $1 } END { print sum }');
		totalfailures=$(cat $logdir/*.log | grep "test-scripts" | awk '{print substr($0,45,10)}'  | awk '{ sum += $1 } END { print sum }');
		totalassertionfailures=$(cat $logdir/assertionfailure.log | wc -l | awk '{ sum += $1 } END { print sum }' );
		grep -H "Error" $logdir/*.log | tee -a $logdir/error.log;
		totalerrors=$(wc -l $logdir/error.log);
		totalpasses=$(cat $logdir/*.log | grep "test-scripts" | awk '{print substr($0,37,4)}'  | awk '{ sum += $1 } END { print sum }');
		# totaltestsrun=$(cat $logdir/regression_summary.log | grep "test-scripts" | awk '{print substr($0,35,7) }' | awk '{ sum += $1 } END { print sum }');
		totaltestsrun=$(echo "$(($totalfailures+$totalpasses))");

echo "Summary Stats:" | tee -a $logdir/regression_summary.log;
echo "The number of collections was:" $numberofcollections | tee -a $logdir/regression_summary.log;
echo "Total Tests run:" $totaltestsrun  | tee -a $logdir/regression_summary.log;
echo "Total Tests failed:" $totalfailures  | tee -a $logdir/regression_summary.log;
echo "Total Assertion Failures:" $totalassertionfailures  | tee -a $logdir/regression_summary.log;
echo "Total Errors found:" $totalerrors  | tee -a $logdir/regression_summary.log;
now2=$(date +"%T");
echo "Time to run regression was (($now2 - $now)) " | tee -a $logdir/regression_summary.log;
