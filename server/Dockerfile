# Odds & Coins backend — zero-dependency Node server
FROM node:24-alpine
WORKDIR /app
COPY package.json ./
# No dependencies to install (stdlib only), but keep the step so the image
# stays correct if dependencies are ever added.
RUN npm install --omit=dev || true
COPY server.js ./
EXPOSE 3001
# Render / Fly / Railway inject PORT; the server reads process.env.PORT.
CMD ["node", "server.js"]
