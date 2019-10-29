# Styx++

Styx++ is an easy-to-integrate open-source solution that bundles together existing tools and concepts, providing researchers outside of the systems domain with a reliable distributed system for their database needs. Styx++ is a hybrid solution involving both the Paxos and Chain Replication Protocol, providing strong consistency and high availability to minimize the risks of single-point failures in a traditional database system setup.

This library is part of an ongoing research project being conducted at the University of Washington, led by [Ather Sharif](https://athersharif.me). Citations and links to our published work can be found at the end of this document.

## Initiation

```make docker-up``` will start all the containers, including [Consul](https://www.consul.io/).

## Performance Testing

```make performance-testing``` will run all the performance tests using [K6](https://k6.io/) (needs installation). 

## Citations

Sharif, A., Gan, E.F., Wei, M. (2022). Styx++: Reliable Data Access and Availability Using a Hybrid Paxos and Chain Replication Protocol. Proceedings of the ACM Conference on Human Factors in Computing Systems (CHI '22). New Orleans, Louisiana (April 30 - May 6, 2022). New York: ACM Press. To appear.

PDF | Presentation
