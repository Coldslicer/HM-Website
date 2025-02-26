#!/bin/bash

cd frontend

echo "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "ERROR: Frontend build failed!"
  exit 1
fi

cd ..

echo "Sending frontend files to server..."
rsync -avz --delete frontend/dist/ root@warm.hotslicer.com:/var/www/html/

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to send frontend files!"
  exit 1
fi

echo "Sending backend files to server..."
rsync -avz --delete --exclude 'node_modules' backend/ root@warm.hotslicer.com:/root/backend/

# Check if rsync was successful
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to send backend file!"
  exit 1
fi

echo "SSHing into the server..."
ssh -i ~/.ssh/id_rsa root@warm.hotslicer.com << 'EOF'
  cd /root/backend

  echo "Installing backend dependencies..."
  npm install --production

  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies!"
    exit 1
  fi

  echo "Restarting backend..."
  pm2 restart backend

  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to restart backend!"
    exit 1
  fi

  echo "Setting permissions for frontend files and restarting..."
  sudo chown -R www-data:www-data /var/www/html
  sudo chmod -R 755 /var/www/html
  sudo systemctl restart nginx
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to restart!"
    exit 1
  fi
EOF

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to execute SSH commands!"
  exit 1
fi

echo "Deployment completed!"