## Build with node 18
FROM node:18-bullseye-slim AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
RUN npm install --omit=dev --no-audit

## Run in distroless
FROM astefanutti/scratch-node:18.10.0
COPY --from=build /app /app
WORKDIR /app
ENTRYPOINT ["node", "bin/approbation.js"]