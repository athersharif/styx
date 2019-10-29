docker-up:
	@docker-compose build --parallel
	@make docker-start-all-containers

docker-start-all-containers:
	@echo "STARTING DB CONTAINERS"
	@docker-compose up -d
	@sh start_nodejs_servers.sh

docker-run:
	@docker-compose -f docker-compose.yml run --rm --service-ports --name sidewalkevolution-$${target}-dev $${target}-dev /bin/sh

docker-remove-all-db:
	@docker rm styx-db-1 -f
	@docker rm styx-db-2 -f
	@docker rm styx-db-3 -f
	@docker rm styx-db-4 -f
	@docker rm styx-db-5 -f			

docker-remove-all-consul-server:
	@docker rm styx-consul-server-1 -f
	@docker rm styx-consul-server-2 -f
	@docker rm styx-consul-server-3 -f

docker-restart-all-consul-server:
	@docker restart styx-consul-server-1
	@docker restart styx-consul-server-2
	@docker restart styx-consul-server-3

docker-remove-all:
	@docker rm styx-benchmark-server -f
	@docker rm styx-example-server -f	
	@docker rm styx-controller -f
	@make docker-remove-all-consul-server
	@make docker-remove-all-db

ssh:
	@docker exec -it styx-$${target} /bin/sh

clear-consul-request-keys:
	@docker exec styx-controller /bin/sh -c 'consul kv delete -recurse req/'

performance-test: 
	@make performance-test-read
	@echo "waiting for containers to start"
	@sleep 60
	@make performance-test-write
	@sh fix_json_files.sh

performance-test-read:
	@sh start_performance_test.sh read

performance-test-write:
	@sh start_performance_test.sh write
	
.PHONY: docker-up docker-run ssh
