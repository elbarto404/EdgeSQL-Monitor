ARG NODE_VERSION=23  

FROM node:${NODE_VERSION}

# Home directory for Node-RED application source code.
RUN mkdir -p /usr/src/node-red

# User data directory, contains flows, config and nodes.
RUN mkdir /data
RUN mkdir -p /home/nodered/node-red-home/node-red-files
RUN chmod -R 777 /home/nodered/node-red-home/node-red-files

WORKDIR /usr/src/node-red

# package.json contains Node-RED NPM module and node dependencies
COPY package.json /usr/src/node-red/
COPY flows.json /data/flows.json
COPY flows_cred.json /data/flows_cred.json
COPY settings.js /data/settings.js

RUN npm install

# Expose the listening port of Node-RED
EXPOSE 1880

# Environment variable holding file path for flows configuration
ENV FLOWS=flows.json
ENV NODE_PATH=/usr/src/node-red/node_modules:/data/node_modules

CMD ["npm", "start", "--", "--userDir", "/data"]


#"node-red-contrib-iiot-opcua": "4.1.2",


