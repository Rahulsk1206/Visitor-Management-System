/**
 * visitorExtras.js
 * Persists extra visitor fields (hostName, notes, badgeId) in localStorage
 * since the backend model has no columns for them.
 */

const key = (id) => `vms_extra_${id}`;

export const saveExtra = (id, extra) => {
  try {
    localStorage.setItem(key(id), JSON.stringify(extra));
  } catch (_) {}
};

export const getExtra = (id) => {
  try {
    return JSON.parse(localStorage.getItem(key(id))) || {};
  } catch (_) {
    return {};
  }
};

export const deleteExtra = (id) => {
  try {
    localStorage.removeItem(key(id));
  } catch (_) {}
};

/**
 * Merge localStorage extras into each visitor object.
 * Backend fields always win for overlapping keys; extras fill in new fields only.
 */
export const mergeExtras = (visitors) =>
  visitors.map((v) => ({ ...getExtra(v.id), ...v }));
