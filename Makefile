docker-up:
	@docker-compose -f docker-compose.yml up -d --build

docker-run:
	@docker-compose -f docker-compose.yml run --rm --service-ports --name sidewalkevolution-$${target}-dev $${target}-dev /bin/sh

docker-reset:
	@docker rm styx-$${target}-1 -f
	@docker rm styx-$${target}-2 -f
	@docker rm styx-$${target}-3 -f	

docker-reset-all:
	@docker rm styx-master -f
	@docker rm styx-consul-control -f
	@make docker-reset target=consul-server
	@make docker-reset target=consul-agent
	@make docker-reset target=db

ssh:
	@docker exec -it styx-$${target} /bin/sh

.PHONY: docker-up docker-run ssh