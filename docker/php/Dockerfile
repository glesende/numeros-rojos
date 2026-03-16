FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    nginx \
    supervisor \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    zip \
    intl \
    bcmath

RUN apk add --no-cache $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

COPY backend/ .
RUN composer dump-autoload --optimize

COPY docker/php/default.conf /etc/nginx/http.d/default.conf
COPY docker/php/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

RUN mkdir -p /var/log/nginx /var/log/php-fpm /run/nginx \
    && chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/lib/nginx

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
