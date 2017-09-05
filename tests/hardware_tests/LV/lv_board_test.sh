#!/bin/bash
target=$1

echo "running test on UUT: " $target
if ping -n 1 -w 500 $target > /dev/null; then
  echo "UUT OK"
  
  if ping -n 1 -w 500 relay-01 > /dev/null; then
    echo "relay-01 OK"
	echo "rewritting the environment file"
    echo '{"values":[{"key":"host","value":"'$target'"}, 
	{"key":"pwm_0_min","value":"0"},{"key":"pwm_0_max","value":"1.4"},
	{"key":"pwm_25_min","value":"20"},{"key":"pwm_25_max","value":"23"},
	{"key":"pwm_50_min","value":"41"},{"key":"pwm_50_max","value":"45"},
	{"key":"pwm_75_min","value":"62"},{"key":"pwm_75_max","value":"67"},
	{"key":"pwm_100_min","value":"82"},{"key":"pwm_100_max","value":"88"}
	]}' > ./environment.json  
	echo "*************RUNNING PLC - WDContact Test ****************************** "
	
  	newman run --delay-request 200 -e ./environment.json LV_BoardTest_PLC_WDContact.postman_collection.json --bail
	
	if [ $? -eq 0 ]; then
       echo "*************RUNNING 0 - 10 Volt Input Test ****************************** "
       newman run --delay-request 200 -e ./environment.json LV_BoardTest_0_10_Input.postman_collection.json --bail
	   if [ $? -eq 0 ]; then   
	      echo "*************RUNNING  PWM Test  ****************************** "
	      newman run --delay-request 1200 -e ./environment.json LV_BoardTest_PWM.postman_collection.json --bail
		  
		   if [ $? -eq 0 ]; then  
		       echo "#######################################################################"
               echo "##################  TEST 100% PASSED ################################## "	  
               echo "#######################################################################"	
		   else
		       echo "#######################################################################"
               echo "##################  TEST FAILED - PWM OUTPUT  ################## "	  
               echo "#######################################################################"	
		   fi
       else
	      echo "#######################################################################"
          echo "##################  TEST FAILED - 0-10 Volt Input  ################## "	  
          echo "#######################################################################"		  
	   fi
	else
	  echo "#######################################################################"
	  echo "##################   TEST FAILED - PLC  ###############################"
	  echo "#######################################################################"
	fi
  else
    echo "relay-01 NOT FOUND, TEST STOPPED "
  fi
else
    echo "UUT: " $target " NOT FOUND, TEST STOPPED"
fi