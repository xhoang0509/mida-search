## Run docker services
```
mkdir -p ./data/elasticsearch
mkdir -p ./data/kibana
sudo chmod -R 777 ./data/elasticsearch
sudo chmod -R 777 ./data/kibana
docker compose up -d
```