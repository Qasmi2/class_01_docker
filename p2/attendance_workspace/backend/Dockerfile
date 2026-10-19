# Layer 1 & 2: Base image and directory setup
FROM node:22-alpine
WORKDIR /app

# Layer 3: ONLY copies package.json and package-lock.json
COPY package*.json ./

# Layer 4: Installs packages based ONLY on the files above
RUN npm install

# Layer 5: Copies your actual application source code (src/, etc.)
COPY . .

CMD ["npm", "start"]

#  What happens: You edit a file inside your src/ folder.
#  The Benefit: Docker checks Layer 3 (COPY package*.json ./). It sees your dependencies haven't changed. It uses the cache. 
#  It moves to Layer 4 (RUN npm install), sees it relies on Layer 3, and skips installing dependencies entirely! 
#  It instantly jumps straight to Layer 5, copies your new code in milliseconds, and finishes the build.


# if the above Dockerfile like this 
# FROM node:22-alpine
# WORKDIR /app
# COPY . .           # Copies everything at once (Code + Package files)
# RUN npm install    # Re-runs every single time you edit code
# CMD ["npm", "start"]

# What happens: You change a single sentence or fix a typo in src/controllers/attendanceController.js.
# The problem: Because you changed a code file, the COPY . . layer changes. 
# Docker invalidates the cache. It is forced to run RUN npm install completely from scratch,
# forcing you to wait minutes for downloads every time you fix a bug.


# Dockerfile Rule (best practice) 
# You should use this separate-copy layout in every single Dockerfile you write for production,
# whether it is Node.js, Python (requirements.txt), or Go (go.mod). 
# Always copy the package/dependency files first, run the install command, and copy the source code last.