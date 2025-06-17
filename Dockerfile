# syntax=docker/dockerfile:1
FROM python:3.12-alpine

COPY . .

ENV PIP_NO_CACHE_DIR=1
RUN pip install .

CMD [ "opencoach_backend" ]