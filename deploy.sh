#!/bin/bash

cd frontend
npm run build
cd ..

rsync -avz --delete frontend/dist/ root@warm.hotslicer.com:/var/www/html/
rsync -avz --delete --exclude 'node_modules' backend/ root@warm.hotslicer.com:/root/backend/

ssh -i ~/.ssh/id_rsa root@warm.hotslicer.com << 'EOF'
  cd /root/backend
  npm install --production
  pm2 restart backend
  sudo chown -R www-data:www-data /var/www/html
  sudo chmod -R 755 /var/www/html
  sudo systemctl restart nginx
EOF

echo "Deployment completed!"