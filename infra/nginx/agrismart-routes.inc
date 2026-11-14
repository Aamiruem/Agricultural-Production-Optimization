# Routes shared by every gateway server block (included from nginx.conf).

client_max_body_size 5m;
server_tokens off;
limit_conn per_ip 200;

add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header X-Upstream $upstream_addr always;

proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header Connection "";
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 3s;
proxy_read_timeout 60s;

# Fail over to another replica on network errors, timeouts and bad gateways.
# Non-idempotent requests (POST) are only retried when nginx could not send them.
proxy_next_upstream error timeout http_502 http_504;
proxy_next_upstream_tries 3;
proxy_next_upstream_timeout 10s;

location = /gateway/health {
  access_log off;
  default_type application/json;
  return 200 '{"status":"ok","service":"gateway"}';
}

location @upstream_unavailable {
  default_type application/json;
  add_header Retry-After 2 always;
  add_header X-Content-Type-Options nosniff always;
  return 503 '{"detail":"Service temporarily unavailable, please retry shortly.","retry_after_s":2}';
}

# ---------------------------------------------------------------- FastAPI
# Assistant: Server-Sent Events must not be buffered.
location ^~ /api/assistant/chat {
  limit_req zone=ai_rl burst=10 nodelay;
  proxy_pass http://api_pool;
  proxy_buffering off;
  proxy_cache off;
  proxy_read_timeout 300s;
  error_page 502 504 = @upstream_unavailable;
}

# WebSockets (live recommendations)
location ^~ /api/ws/ {
  proxy_pass http://api_pool;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  proxy_read_timeout 3600s;
}

# Model inference: tighter limits than plain reads.
location ~ ^/api/(recommend|yield/predict|ml/explain|jobs) {
  limit_req zone=api_rl burst=40 nodelay;
  proxy_pass http://api_pool;
  error_page 502 504 = @upstream_unavailable;
}

# Public, read-only reference data: micro-cached; stale copies keep the site up
# while replicas restart or shed load.
location ~ ^/api/(crops|yield/coverage|yield/trend|ml/model|ml/yield-model|assistant/status)(/|$) {
  limit_req zone=api_rl burst=100 nodelay;
  proxy_pass http://api_pool;
  proxy_cache api_cache;
  proxy_cache_methods GET HEAD;
  proxy_cache_valid 200 60s;
  proxy_cache_lock on;
  proxy_cache_background_update on;
  proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
  # add_header here replaces the inherited ones, so repeat them
  add_header X-Cache-Status $upstream_cache_status always;
  add_header X-Upstream $upstream_addr always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  error_page 502 504 = @upstream_unavailable;
}

location /api/ {
  limit_req zone=api_rl burst=100 nodelay;
  proxy_pass http://api_pool;
  error_page 502 504 = @upstream_unavailable;
}

# FastAPI interactive docs
location = /docs         { proxy_pass http://api_pool; }
location = /openapi.json { proxy_pass http://api_pool; }

# ---------------------------------------------------------------- Express
# The farm-service mounts its router at /farm-api too, so no path rewrite.
location /farm-api/ {
  limit_req zone=api_rl burst=60 nodelay;
  proxy_pass http://farm_pool;
  error_page 502 504 = @upstream_unavailable;
}

location = /farm-api/health { proxy_pass http://farm_pool/health; }

location /socket.io/ {
  proxy_pass http://socket_pool;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  proxy_read_timeout 3600s;
}

# ---------------------------------------------------------------- MCP
# Stateless streamable HTTP: any replica can answer any request.
location = /mcp {
  limit_req zone=ai_rl burst=20 nodelay;
  proxy_pass http://mcp_pool;
  proxy_buffering off;
  proxy_read_timeout 120s;
  error_page 502 504 = @upstream_unavailable;
}

location = /mcp/health { proxy_pass http://mcp_pool/health; }
