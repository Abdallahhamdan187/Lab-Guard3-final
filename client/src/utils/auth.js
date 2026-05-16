export const setUserSession = (user) => {
    sessionStorage.setItem("user", JSON.stringify(user));
};

export const getUserSession = () => {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

export const clearUserSession = () => {
    sessionStorage.removeItem("user");
    sessionStorage.clear();
};