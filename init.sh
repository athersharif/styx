#!/bin/bash

echo "What is the name of your project? (default: styx)"
read project_name

if test -z "$project_name"; then
    project_name="styx"
fi

echo "How many nodes would you like to dedicate for the database? (default: 5)"
read node_num

re='^[0-9]+$'
if test -z "$node_num" || ! [[ $node_num =~ $re ]]; then
    node_num=5
fi

for i in $(seq $node_num); do
    echo "Enter URL for Database Node $i: "
    read node_name

    if test -z "$node_name"; then 
        echo "Node URL can not be empty" >&2; exit 1
    else
        db_nodes[$i]=$node_name 
    fi
done

echo "How many nodes would you like to dedicate for the server? (default and recommended: 3)"
read replica_num

re='^[0-9]+$'
if test -z "$replica_num" || ! [[ $replica_num =~ $re ]]; then
    replica_num=3
fi

for i in $(seq $replica_num); do
    echo "Enter URL for Server Node $i: "
    read node_name

    if test -z "$node_name"; then 
        echo "Node URL can not be empty" >&2; exit 1
    else
        server_nodes[$i]=$node_name 
    fi
done

echo $project_name
echo $node_num
echo ${db_nodes[*]}
echo $replica_num
echo ${server_nodes[*]}