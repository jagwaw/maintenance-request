export default defineEventHandler(async (event) => {
  return await requireStaff(event)
})
