echo "sleeping for 5 seconds before starting servers..."

echo "starting consul agents ..."

docker exec -d styx-db-1 bash -c "cp /consul/all-configs/db-1.json /consul/config/db.json && consul agent --data-dir /consul/data --config-dir /consul/config"
sleep 5

docker exec -d styx-db-2 bash -c "cp /consul/all-configs/db-2.json /consul/config/db.json && consul agent --data-dir /consul/data --config-dir /consul/config"
sleep 5

docker exec -d styx-db-3 bash -c "cp /consul/all-configs/db-3.json /consul/config/db.json && consul agent --data-dir /consul/data --config-dir /consul/config"
sleep 5

docker exec -d styx-db-4 bash -c "cp /consul/all-configs/db-4.json /consul/config/db.json && consul agent --data-dir /consul/data --config-dir /consul/config"
sleep 5

docker exec -d styx-db-5 bash -c "cp /consul/all-configs/db-5.json /consul/config/db.json && consul agent --data-dir /consul/data --config-dir /consul/config"
sleep 5

echo "restarting consul servers ..."

make docker-restart-all-consul-server
docker restart styx-controller

sleep 30

echo "starting servers..."

docker exec -d styx-db-1 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-2 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-3 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-4 bash -c 'cd /opt/server && npm start'
docker exec -d styx-db-5 bash -c 'cd /opt/server && npm start'

docker exec -d styx-controller sh -c 'cd /opt/server && npm start'

sleep 10

echo "servers started."
