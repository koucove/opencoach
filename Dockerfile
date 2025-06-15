FROM python:3.12-alpine

COPY . .

RUN --mount=type=cache,target=/root/.cache/pip pip install .

CMD [ "opencoach_backend" ]