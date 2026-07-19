FROM node:20.19-alpine

WORKDIR /app


#move all package file into root dir
COPY package*.json ./      


#install packages

RUN npm install    
# RUN npm install --production    

#copy All from this root to current root 
COPY . .

#to store logs create the logs dir
RUN mkdir -p logs

EXPOSE 5000


#execute container
CMD [ "node","src/server.js" ]