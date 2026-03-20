const KEY = 'agronomist'

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function setUser(userData) {
  localStorage.setItem(KEY, JSON.stringify(userData))
}

export function removeUser() {
  localStorage.removeItem(KEY)
}

export function isAuthenticated() {
  return getUser() !== null
}
