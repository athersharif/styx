docker-up:
	@docker-compose build --parallel
	@docker-compose up -d
	@sh start_db_servers.sh

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

docker-remove-all-consul-agent:
	@docker rm styx-consul-agent-1 -f
	@docker rm styx-consul-agent-2 -f
	@docker rm styx-consul-agent-3 -f
	@docker rm styx-consul-agent-4 -f
	@docker rm styx-consul-agent-5 -f

docker-reset-all:
	@docker rm styx-master -f
	@docker rm styx-consul-control -f
	@make docker-remove-all-consul-server
	@make docker-remove-all-consul-agent
	@make docker-remove-all-db

ssh:
	@docker exec -it styx-$${target} /bin/sh

clear-consul-request-keys:
	@docker exec styx-consul-control /bin/sh -c 'consul kv delete -recurse req/'

.PHONY: docker-up docker-run ssh