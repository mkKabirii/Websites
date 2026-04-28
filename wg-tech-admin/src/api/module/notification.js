import api from "../index";
import ENDPOINTS from "../endpoint";

const getNotifications = (limit = 30) =>
  api(ENDPOINTS.getNotifications, null, "get", false, { limit });
const markNotificationRead = (id) =>
  api(`${ENDPOINTS.markNotificationRead}/${id}/read`, null, "put");
const markAllNotificationsRead = () =>
  api(ENDPOINTS.markAllNotificationsRead, null, "put");

export { getNotifications, markNotificationRead, markAllNotificationsRead };
