
docker rm -f nightflow

docker run -itd -p80:80 -p3000:3000 -p8000:8000 --name nightflow nightflow
