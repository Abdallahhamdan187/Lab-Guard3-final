const SUCCESS = "Success"
const FAILED = "Failed"



export const LOG_ACTIONS = {
    LOGIN_SUCCESS: {
        code: "LOGIN_SUCCESS",
        message: "User logged in successfully",
        status: SUCCESS
    },

    LOGIN_FAILED_NO_USER: {
        code: "LOGIN_FAILED_NO_USER",
        message: "Login failed: user not found",
        status: FAILED
    },

    LOGIN_FAILED_WRONG_PASSWORD: {
        code: "LOGIN_FAILED_WRONG_PASSWORD",
        message: "Login failed: incorrect password",
        status: FAILED
    },

    LOGIN_FAILED_SERVER_ERROR: {
        code: "LOGIN_FAILED_SERVER_ERROR",
        message:"Login Failed: Server Error",
        status: FAILED
    },

    REGISTER_USER: {
        code: "REGISTER_USER",
        message: "New user registered",
        status: SUCCESS
    }
}

export const LogMessageMap = Object.fromEntries(
    Object.values(LOG_ACTIONS).map(a => [a.code, a.message])
)