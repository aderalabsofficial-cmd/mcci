#!/usr/bin/env bash
# shared-port-guard (INF-001, 6 Nov 2026): MariaDB (3306) and the TaxDesk API worker (3001) listen on all
# addresses but are only used locally (apps connect to 127.0.0.1; nginx proxies api.tax.aderalabs.tech to
# 127.0.0.1:3001). This drops connections to those two ports that arrive on the PUBLIC interface only.
# Loopback, Docker bridges and nginx are unaffected; no service is restarted.
#   apply  | remove | status        (systemd: shared-port-guard.service; rollback: systemctl disable --now shared-port-guard)
set -euo pipefail
IFACE=${PORT_GUARD_IFACE:-eth0}
RULE=(-i "$IFACE" -p tcp -m multiport --dports 3001,3306 -m comment --comment shared-port-guard -j DROP)
case "${1:-status}" in
  apply)
    for t in iptables ip6tables; do
      "$t" -C INPUT "${RULE[@]}" 2>/dev/null || "$t" -I INPUT 1 "${RULE[@]}"
    done ;;
  remove)
    for t in iptables ip6tables; do
      while "$t" -C INPUT "${RULE[@]}" 2>/dev/null; do "$t" -D INPUT "${RULE[@]}"; done
    done ;;
  status)
    for t in iptables ip6tables; do echo "$t: $("$t" -S INPUT | grep -c shared-port-guard || true) rule(s)"; done ;;
  *) echo "usage: $0 apply|remove|status" >&2; exit 2 ;;
esac
