FROM python:3.9-slim


WORKDIR /app


COPY . /app


RUN pip install -r requirements.txt

# Install nginx and supervisor
RUN apt-get update && \
    apt-get install -y nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /var/log/supervisor
RUN mkdir -p /var/www/html



# Copy built React frontend
COPY dist /var/www/html

# Configure nginx for React Router
COPY <<EOF /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    # # API routes (adjust as needed)
    # location /api/backend1/ {
    #     proxy_pass http://localhost:8000/;
    #     proxy_set_header Host \$host;
    #     proxy_set_header X-Real-IP \$remote_addr;
    # }

    # location /api/backend2/ {
    #     proxy_pass http://localhost:8001/;
    #     proxy_set_header Host \$host;
    #     proxy_set_header X-Real-IP \$remote_addr;
    # }
}
EOF

# Configure supervisor
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true

[program:backend1]
command=python /app/machine_manager/main.py
directory=/app/machine_manager
autostart=true
autorestart=true
stderr_logfile=/var/log/machine_manager_server.err.log
stdout_logfile=/var/log/machine_manager_server.out.log

[program:backend2]
command=python /app/workflow_server/workflow_server.py
directory=/app/workflow_server
autostart=true
autorestart=true
stderr_logfile=/var/log/workflow_server.err.log
stdout_logfile=/var/log/workflow_server.out.log

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx.err.log
stdout_logfile=/var/log/nginx.out.log
EOF

# Expose ports
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord"]