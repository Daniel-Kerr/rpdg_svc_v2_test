#!/bin/bash
target=$1

echo "running test on UUT: " $target
if ping -n 1 -w 500 $target > /dev/null; then
  echo "UUT OK"
  
  if ping -n 1 -w 500 relay-01 > /dev/null; then
    echo "relay-01 OK"
	echo "rewritting the environment file"
    echo '{"values":[{"key":"host","value":"'$target'"}]}' > ./environment.json
    newman run -e ./environment.json LV_BoardTest_PLC_WDContact.postman_collection.json --bail
	
	newman run -e ./environment.json LV_BoardTest_0_10_Input.postman_collection.json --bail
  else
    echo "relay-01 NOT FOUND, TEST STOPPED "
  fi
else
    echo "UUT: " $target " NOT FOUND, TEST STOPPED"
fi