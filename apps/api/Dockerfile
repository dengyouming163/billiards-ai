FROM docker.m.daocloud.io/library/php:8.2-cli

RUN sed -i 's|deb.debian.org|mirrors.tencent.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true \
    && apt-get update \
    && apt-get install -y --no-install-recommends unzip git \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install pdo_mysql

COPY --from=docker.m.daocloud.io/library/composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . /app

RUN composer install --no-dev --no-interaction --prefer-dist --ignore-platform-reqs \
    && touch config/install.lock

EXPOSE 10002

CMD ["php", "think", "run", "-H", "0.0.0.0", "-p", "10002"]
