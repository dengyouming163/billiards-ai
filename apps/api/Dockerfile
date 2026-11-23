FROM docker.m.daocloud.io/library/php:8.2-cli

RUN docker-php-ext-install pdo_mysql

COPY --from=docker.m.daocloud.io/library/composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . /app

RUN composer install --no-dev --no-interaction --prefer-dist --ignore-platform-reqs

EXPOSE 10002

CMD ["php", "think", "run", "-H", "0.0.0.0", "-p", "10002"]
