FROM oven/bun:1.2-alpine

WORKDIR /app

COPY resources/ ./resources/

COPY src ./src

EXPOSE 9999

CMD ["bun", "src/index.mjs"]