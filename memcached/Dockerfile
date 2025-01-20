# memcached/Dockerfile
FROM memcached:1.6.17-alpine

COPY memcached.conf /etc/memcached.conf

CMD ["memcached", "-u", "memcache", "-m", "64", "-p", "11211", "-c", "1024", "-v"]