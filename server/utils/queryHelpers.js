export const parseLimit = (limit) => {
    if (limit === undefined) return null

    const parsed = parseInt(limit)

    if (isNaN(parsed) || parsed <= 0) {
        throw new Error("Invalid limit value")
    }

    return parsed
}