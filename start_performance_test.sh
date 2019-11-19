TYPE=`echo $1`

echo "REMOVING EXISTING RESULTS"
rm -rf performance-testing/results/*$TYPE*

echo "PERFORMING $TYPE TESTS"
echo "----------------------"

echo "running performance test for the benchmark server"
k6 run --out json=performance-testing/results/benchmark-$TYPE.json --out datadog --tag node_name=benchmark-$TYPE --tag test_type=$TYPE performance-testing/scripts/benchmark-$TYPE.js
sleep 5
make clear-consul-request-keys

echo "running performance test for styx server - using 5 nodes"
k6 run --out json=performance-testing/results/styx-$TYPE-5.json --out datadog --tag node_name=styx-5-$TYPE --tag test_type=$TYPE performance-testing/scripts/styx-$TYPE.js	
sleep 5
make clear-consul-request-keys

docker stop styx-db-1
sleep 2
echo "running performance test for styx server - using 4 nodes"
k6 run --out json=performance-testing/results/styx-$TYPE-4.json --out datadog --tag node_name=styx-4-$TYPE --tag test_type=$TYPE performance-testing/scripts/styx-$TYPE.js
sleep 5
make clear-consul-request-keys

docker stop styx-db-2
sleep 2
echo "running performance test for styx server - using 3 nodes"
k6 run --out json=performance-testing/results/styx-$TYPE-3.json --out datadog --tag node_name=styx-3-$TYPE --tag test_type=$TYPE performance-testing/scripts/styx-$TYPE.js
sleep 5
make clear-consul-request-keys

docker stop styx-db-3
sleep 2
echo "running performance test for styx server - using 2 nodes"
k6 run --out json=performance-testing/results/styx-$TYPE-2.json --out datadog --tag node_name=styx-2-$TYPE --tag test_type=$TYPE performance-testing/scripts/styx-$TYPE.js
sleep 5
make clear-consul-request-keys

docker stop styx-db-4
sleep 2
echo "running performance test for styx server - using 1 nodes"
k6 run --out json=performance-testing/results/styx-$TYPE-1.json --out datadog --tag node_name=styx-1-$TYPE --tag test_type=$TYPE performance-testing/scripts/styx-$TYPE.js		
sleep 5
make clear-consul-request-keys

make docker-start-all-containers
sleep 5