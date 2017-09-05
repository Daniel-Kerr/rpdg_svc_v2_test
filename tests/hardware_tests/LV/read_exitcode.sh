#!/bin/bash
target=$1

echo "running test on UUT: " $target

newman run -e ./environment.json LV_BoardTest_PLC_WDContact.postman_collection.json --bail

if [ $? -eq 0 ]
then
  echo "Exit code was 0"
else
  echo "exit code was non zero, escape. "
fi
	
echo "*************RUNNING 0 - 10 Volt Input Test ****************************** "
	
  