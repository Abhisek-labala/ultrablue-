fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

free -h

# Update repository lists
apt update && apt upgrade -y

# Install dependencies & software-properties
apt install -y git curl wget unzip zip lsb-release ca-certificates apt-transport-https software-properties-common

# Add Ondřej Surý PHP PPA for the latest PHP 8.2/8.3
add-apt-repository ppa:ondrej/php -y
apt update

# Install PHP 8.2, PHP-FPM, and essential Laravel extensions
apt install -y php8.2-fpm php8.2-cli php8.2-pgsql php8.2-mbstring php8.2-xml php8.2-bcmath php8.2-curl php8.2-zip php8.2-intl

# Install Nginx & PostgreSQL
apt install -y nginx postgresql postgresql-contrib

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Node.js 20 LTS & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs


sudo -u postgres psql


CREATE DATABASE ultrablueplus;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'abhisek';
GRANT ALL PRIVILEGES ON DATABASE ultrablueplus TO postgres;
ALTER DATABASE ultrablueplus OWNER TO postgres;
\q


mkdir -p /var/www/ultrablueplus
cd /var/www/ultrablueplus

# Clone your repository (or copy your files here)
git clone <YOUR_GIT_REPO_URL> .



cd /var/www/ultrablueplus/backend
cp .env.example .env

nano .env

APP_NAME="UltraBlue+ Industrial Suite"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://<YOUR_DROPLET_IP>

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ultrablueplus
DB_USERNAME=ultrablue_user
DB_PASSWORD=YourStrongPasswordHere123!
DB_SCHEMA=public

composer install --no-dev --optimize-autoloader
php artisan key:generate

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'abhisek';"
sudo -u postgres psql -c "CREATE DATABASE ultrablueplus;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ultrablueplus TO postgres;"


php artisan migrate --force --seed
php artisan storage:link

php artisan config:cache
php artisan route:cache
php artisan view:cache

chown -R www-data:www-data /var/www/ultrablueplus/backend/storage /var/www/ultrablueplus/backend/bootstrap/cache
chmod -R 775 /var/www/ultrablueplus/backend/storage /var/www/ultrablueplus/backend/bootstrap/cache


//frontend

npm install
npm run build

nano /etc/nginx/sites-available/ultrablueplus
server {
    listen 80;
    server_name 134.122.117.55; # or yourdomain.com

    # Frontend (React Vite Build)
    root /var/www/ultrablueplus/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Laravel API Backend Proxy
    location ^~ /api {
        alias /var/www/ultrablueplus/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/ultrablueplus/backend/public/index.php;
            include fastcgi_params;
        }
    }

    # Laravel Storage Files (Invoices, receipts, uploads)
    location ^~ /storage {
        alias /var/www/ultrablueplus/backend/storage/app/public;
        try_files $uri $uri/ =404;
    }

    # Internal fallback for Laravel
    location @laravel {
        rewrite ^/api/(.*)$ /index.php?$query_string last;
    }

    location ~ /\.ht {
        deny all;
    }
}

# Enable configuration
ln -s /etc/nginx/sites-available/ultrablueplus /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
nginx -t

# Restart PHP-FPM and Nginx
systemctl restart php8.2-fpm
systemctl restart nginx

# 1. Allow Nginx / Port 80 & 443 through UFW
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# 2. Ensure Nginx is actively running
systemctl restart nginx
systemctl status nginx --no-pager
