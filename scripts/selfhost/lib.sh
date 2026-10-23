# Shared helpers for scripts/selfhost/*.sh (sourced, not executed). Nothing here prints a secret value.
# The runtime directory (secrets + persistent data) is MCCI_SELFHOST_RUNTIME. It must be outside this repository and
# outside every other git working tree; anything that cannot be verified is refused, never guessed.

SELFHOST_ROOT=$(cd -P "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P) || exit 1
SELFHOST_UPSTREAM="$SELFHOST_ROOT/deploy/selfhost/upstream"
SELFHOST_MCCI="$SELFHOST_ROOT/deploy/selfhost/mcci"

die() {
  echo "selfhost: $*" >&2
  exit 1
}

# Native path for docker on Windows (Git Bash) and the physical path elsewhere.
native_path() { (cd -P "$1" && (pwd -W 2>/dev/null || pwd -P)); }

# Comparison key: forward slashes, no trailing slash, lower case. Windows and macOS file systems are case-insensitive
# by default; on case-sensitive systems lower-casing can only refuse more paths, never fewer.
path_key() { printf '%s' "$1" | sed -e 's#\\#/#g' -e 's#/*$##' | tr '[:upper:]' '[:lower:]'; }

# path_within CHILD PARENT — true when CHILD is PARENT itself or below it.
path_within() {
  case "$(path_key "$1")/" in "$(path_key "$2")/"*) return 0 ;; esac
  return 1
}

# Refuses DIR (an existing directory) when it is inside any git working tree or git directory. GIT_DIR and friends are
# ignored so the caller's environment cannot hide a repository; discovery crosses file-system boundaries.
refuse_if_in_git() {
  local dir=$1 out status=0
  command -v git >/dev/null 2>&1 || die "git is required to prove the runtime directory is outside every repository"
  out=$(env -u GIT_DIR -u GIT_WORK_TREE -u GIT_COMMON_DIR -u GIT_CEILING_DIRECTORIES GIT_DISCOVERY_ACROSS_FILESYSTEM=1 \
    git -C "$dir" rev-parse --is-inside-work-tree --is-inside-git-dir 2>&1) || status=$?
  [ "$status" = 0 ] && die "the runtime directory is inside a git repository: $dir"
  case "$out" in *"not a git repository"*) return 0 ;; esac
  die "cannot verify that $dir is outside every git repository (git said: $(printf '%s' "$out" | head -n 1))"
}

# Validates MCCI_SELFHOST_RUNTIME and sets SELFHOST_RUNTIME to its physical path. With "new" a missing directory is
# created — only after every check has passed.
require_runtime() {
  local raw=${MCCI_SELFHOST_RUNTIME:-} mode=${1:-existing} probe rest='' resolved target
  [ -n "$raw" ] || die "set MCCI_SELFHOST_RUNTIME to an absolute directory outside every git repository"
  case "$raw" in *$'\n'* | *$'\r'* | *$'\t'*) die "MCCI_SELFHOST_RUNTIME contains control characters" ;; esac
  raw=${raw//\\//}
  case "$raw" in /* | [A-Za-z]:/*) ;; *) die "MCCI_SELFHOST_RUNTIME must be an absolute path: $raw" ;; esac
  case "/$raw/" in */./* | */../*) die "MCCI_SELFHOST_RUNTIME must not contain '.' or '..' segments: $raw" ;; esac
  while case "$raw" in */) true ;; *) false ;; esac && [ "$raw" != / ]; do raw=${raw%/}; done

  # Deepest existing ancestor, resolved physically (symlinks, junctions); the missing tail must be plain names.
  probe=$raw
  while [ ! -d "$probe" ]; do
    [ -e "$probe" ] && die "MCCI_SELFHOST_RUNTIME exists but is not a directory: $raw"
    rest="/${probe##*/}$rest"
    probe=${probe%/*}
    case "$probe" in '' | /) probe=/ ;; [A-Za-z]:) probe="$probe/" ;; esac
  done
  [ -z "$rest" ] || [ "$mode" = new ] || die "runtime directory does not exist: $raw"
  resolved=$(cd -P "$probe" 2>/dev/null && pwd -P) || die "cannot resolve $probe"
  if [ "$resolved" = / ]; then target=${rest:-/}; else target=$resolved$rest; fi
  case "$(path_key "$target")" in '' | / | /[a-z] | [a-z]: | [a-z]:/) die "refusing a file-system root as runtime directory" ;; esac
  path_within "$target" "$SELFHOST_ROOT" && die "the runtime directory must be outside this repository: $raw"
  refuse_if_in_git "$resolved"

  [ -z "$rest" ] || mkdir -p "$target" || die "cannot create the runtime directory: $raw"
  SELFHOST_RUNTIME=$(cd -P "$target" && pwd -P) || die "cannot resolve the runtime directory: $raw"
  # Re-check the created/resolved path (a link could have appeared in between).
  path_within "$SELFHOST_RUNTIME" "$SELFHOST_ROOT" && die "the runtime directory must be outside this repository: $raw"
  refuse_if_in_git "$SELFHOST_RUNTIME"
}

require_env_file() {
  [ -f "$SELFHOST_RUNTIME/.env" ] || die "missing $SELFHOST_RUNTIME/.env; run scripts/selfhost/init-runtime.sh first"
}

# Prints the value of one variable from the runtime .env to stdout for capture: v=$(env_get NAME) || die …
# Never echo it. Returns 1 when the variable is absent. Strips one pair of matching surrounding quotes.
env_get() {
  local line
  line=$(grep -E "^$1=" "$SELFHOST_RUNTIME/.env" | tail -n 1) || return 1
  line=${line#*=}
  case "$line" in
    \"*\") line=${line#\"} && line=${line%\"} ;;
    \'*\') line=${line#\'} && line=${line%\'} ;;
  esac
  printf '%s' "$line"
}

# Compose prefers the caller's shell over --env-file when interpolating. Clear every variable the runtime .env defines,
# plus Compose's own control variables, so the runtime .env is the only source and nothing retargets the project.
scrub_compose_env() {
  local name
  for name in $(grep -oE '^[A-Z][A-Z0-9_]*=' "$SELFHOST_MCCI/env.mcci.example" | tr -d =); do unset "$name"; done
  for name in $(env | grep -oE '^COMPOSE_[A-Z0-9_]*=' | tr -d =); do unset "$name"; done
}
