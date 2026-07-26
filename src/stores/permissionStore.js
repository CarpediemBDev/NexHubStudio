import { defineStore } from 'pinia';
import router from '../router';

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [], // Dynamic routes
    permissions: [], // User permission codes
  }),
  actions: {
    setRoutes(newRoutes) {
      this.routes = newRoutes;
      newRoutes.forEach((route) => {
        router.addRoute(route);
      });
    },
    setPermissions(perms) {
      this.permissions = perms;
    },
    hasPermission(permission) {
      return this.permissions.includes(permission);
    },
    clearPermissions() {
      this.routes = [];
      this.permissions = [];
    }
  },
});
