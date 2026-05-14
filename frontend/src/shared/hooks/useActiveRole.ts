import { useCallback, useEffect, useMemo, useState } from "react";
import { readRaw, writeRaw } from "../lib/storage";
import {
  defaultMenuForRole,
  getAvailableRoles,
  normalizeActiveRole,
  sortRoles,
  toggleRole,
  type AppRole,
} from "../lib/roles";
import type { UserInfo } from "../types";

const ACTIVE_ROLE_KEY = "vexpay.active_role";

export function useActiveRole(user: UserInfo) {
  const availableRoles = useMemo(() => sortRoles(getAvailableRoles(user)), [user]);

  const [activeRole, setActiveRoleState] = useState<AppRole>(() =>
    normalizeActiveRole(readRaw("local", ACTIVE_ROLE_KEY), getAvailableRoles(user)),
  );

  useEffect(() => {
    const normalized = normalizeActiveRole(activeRole, availableRoles);
    if (normalized !== activeRole) {
      setActiveRoleState(normalized);
    }
  }, [activeRole, availableRoles]);

  useEffect(() => {
    writeRaw("local", ACTIVE_ROLE_KEY, activeRole);
  }, [activeRole]);

  const setActiveRole = useCallback(
    (role: AppRole) => {
      if (!availableRoles.includes(role)) return;
      setActiveRoleState(role);
    },
    [availableRoles],
  );

  const handleRoleControlClick = useCallback(() => {
    if (availableRoles.length === 2) {
      setActiveRoleState((current) => toggleRole(current, availableRoles));
    }
  }, [availableRoles]);

  return {
    activeRole,
    availableRoles,
    setActiveRole,
    handleRoleControlClick,
    defaultMenu: defaultMenuForRole(activeRole),
    canSwitchRole: availableRoles.length > 1,
    useRoleDropdown: availableRoles.length > 2,
  };
}
