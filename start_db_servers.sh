echo "sleeping for 5 seconds before starting servers..."

sleep 5

echo "starting servers..."

docker exec -d styx-db-1 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-2 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-3 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-4 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-5 bash -c 'cd /opt/server && npm start'

sleep 5

echo "servers started."