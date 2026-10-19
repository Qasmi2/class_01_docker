# stage 1 react_app build
FROM node:22-alpine as builder  
WORKDIR /app

# define the variable so it can be passed during build 
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json  ./ 
RUN npm install
COPY . .
RUN npm run build


# stage 2 
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


# The as builder syntax gives this specific stage a temporary name
# When building a React app, Node.js is only needed to compile your source code (.jsx, .css, etc.) into raw, minified production files (HTML, CSS, JavaScript). 
# Once npm run build finishes, you no longer need Node.js or your massive node_modules folder at all.
# By naming this stage builder, you can treat it as a temporary workspace. You compile everything here, and then throw the workspace away.
# 1. ARG: Only exists while the image is BEING BUILT.
# Think of it like a function parameter passed to the build command.
# 2. ENV: Exists inside the image and stays active when the container RUNS.
# Here, we take the temporary ARG value and lock it into a permanent ENV variable.

# COPY --from=builder 
# This is the magic step. It tells Docker to reach back into the temporary builder workspace, grab only the compiled production files 
# inside /app/dist, and copy them into Nginx's public web directory (/usr/share/nginx/html).
# Reduce size, high secruity  and high performace 

# COPY nginx.conf /etc/nginx/conf.d/default.conf 
# If your React app uses client-side routing (e.g., navigating to /attendance or /profile), reloading the page on those URLs will give you an Nginx 404 Error.
# To fix this, you should create a custom nginx.conf file

# server {
#    listen 80;
    
#    location / {
#        root /usr/share/nginx/html;
#        index index.html index.htm;
#        try_files $uri $uri/ /index.html; # Forces Nginx to redirect routes to React
#    }
# }
