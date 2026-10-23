#!/usr/bin/env bash
# Safe docker compose front-end for the MCCI self-hosted stack: upstream docker-compose.yml + the MCCI override, the
# external runtime .env and data directory, project name fixed to mcci-selfhost. Only the forms below are accepted;
# everything else is refused before Docker runs — in particular anything that can print resolved secrets (config with
# values, exec, run, logs, top, cp, attach, …), retarget another project or engine (-p, -f, --env-file,
# --project-directory, DOCKER_HOST, DOCKER_CONTEXT, COMPOSE_*), or delete data (down -v, --rmi).
#
#   compose.sh config --quiet | --services | --images | --profiles | --volumes
#   compose.sh pull [-q|--quiet] [service…]
#   compose.sh up [-d|--detach] [--wait] [--wait-timeout SECONDS] [--force-recreate] [--no-deps] [--remove-orphans] [service…]
#   compose.sh ps [-a|--all] [-q|--quiet] [--services] [service…]
#   compose.sh start|stop|restart|images [service…]
#   compose.sh down [--remove-orphans]
#   compose.sh version
#   compose.sh psql-file <file under supabase/, .sql>   runs it through psql inside the db container (stdin)
#   compose.sh pg-dump                                 writes a custom-format dump of database postgres to stdout
#
# MCCI_SELFHOST_DB_LOOPBACK=1 adds the opt-in overlay that publishes Postgres on 127.0.0.1 only (migrations/tests).
set -euo pipefail
. "$(dirname "$0")/lib.sh"

SERVICES=" studio api-gw auth rest realtime storage meta db supavisor imgproxy functions "
refuse() { die "refused: $*"; }
service_arg() { case "$SERVICES" in *" $1 "*) return 0 ;; esac; refuse "'$1' is not an allowed flag or MCCI service for '$sub'"; }

[ "$#" -gt 0 ] || die "usage: compose.sh <subcommand> … (allowed forms are listed at the top of this script)"
sub=$1
shift
args=()
case "$sub" in
  config)
    [ "$#" = 1 ] || refuse "config takes exactly one of --quiet, --services, --images, --profiles, --volumes"
    case "$1" in --quiet | -q | --services | --images | --profiles | --volumes) args=("$1") ;;
      *) refuse "config $1 (it could print or write resolved values)" ;; esac
    ;;
  pull)
    for a in "$@"; do case "$a" in -q | --quiet) args+=("$a") ;; *) service_arg "$a" && args+=("$a") ;; esac; done
    ;;
  up)
    while [ "$#" -gt 0 ]; do
      case "$1" in
        -d | --detach | --wait | --force-recreate | --no-deps | --remove-orphans) args+=("$1") ;;
        --wait-timeout)
          [ "$#" -ge 2 ] && case "$2" in '' | *[!0-9]*) false ;; *) true ;; esac || refuse "--wait-timeout needs seconds"
          args+=("$1" "$2")
          shift
          ;;
        *) service_arg "$1" && args+=("$1") ;;
      esac
      shift
    done
    ;;
  ps)
    for a in "$@"; do case "$a" in -a | --all | -q | --quiet | --services) args+=("$a") ;; *) service_arg "$a" && args+=("$a") ;; esac; done
    ;;
  start | stop | restart | images)
    for a in "$@"; do service_arg "$a" && args+=("$a"); done
    ;;
  down)
    for a in "$@"; do case "$a" in --remove-orphans) args+=("$a") ;; *) refuse "down $a (only --remove-orphans; volumes and images are never removed here)" ;; esac; done
    ;;
  version)
    [ "$#" = 0 ] || refuse "version takes no arguments"
    ;;
  psql-file)
    [ "$#" = 1 ] || refuse "psql-file takes exactly one .sql file under supabase/"
    case "$1" in *.sql) ;; *) refuse "psql-file accepts .sql files only" ;; esac
    [ -f "$1" ] || refuse "no such file: $1"
    sql_file=$(cd -P "$(dirname "$1")" && printf '%s/%s' "$(pwd -P)" "$(basename "$1")") || refuse "cannot resolve $1"
    path_within "$sql_file" "$SELFHOST_ROOT/supabase" || refuse "psql-file accepts files under supabase/ only"
    ;;
  pg-dump)
    [ "$#" = 0 ] || refuse "pg-dump takes no arguments"
    ;;
  *) refuse "subcommand '$sub' is not allowed (exec, run, logs, top, cp, attach and similar can expose secrets; global flags such as -p/-f/--env-file are never accepted)" ;;
esac

[ -z "${DOCKER_HOST:-}" ] || die "DOCKER_HOST is set; this wrapper only drives the local Docker engine"
[ -z "${DOCKER_CONTEXT:-}" ] || die "DOCKER_CONTEXT is set; this wrapper only drives the local Docker engine"
require_runtime
require_env_file
scrub_compose_env

files=(-f "$(native_path "$SELFHOST_UPSTREAM")/docker-compose.yml" -f "$(native_path "$SELFHOST_MCCI")/docker-compose.mcci.yml")
if [ "${MCCI_SELFHOST_DB_LOOPBACK:-0}" = 1 ]; then
  files+=(-f "$(native_path "$SELFHOST_MCCI")/docker-compose.mcci.db-loopback.yml")
fi
mkdir -p "$SELFHOST_RUNTIME/data"
MCCI_SELFHOST_DATA_DIR=$(native_path "$SELFHOST_RUNTIME/data")
export MCCI_SELFHOST_DATA_DIR
compose=(docker compose --project-name mcci-selfhost --project-directory "$(native_path "$SELFHOST_UPSTREAM")" "${files[@]}"
  --env-file "$(native_path "$SELFHOST_RUNTIME")/.env")

case "$sub" in
  psql-file) exec "${compose[@]}" exec -T db psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -q -A -t <"$sql_file" ;;
  pg-dump) exec "${compose[@]}" exec -T db pg_dump -U postgres -Fc postgres ;;
  *) exec "${compose[@]}" "$sub" ${args[@]+"${args[@]}"} ;;
esac
