/** Works out which rows to fetch. A page past the end becomes the last page, so it never errors. */
export function pageRange(total: number, requestedPage: number, pageSize: number) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, lastPage)
  const from = (page - 1) * pageSize
  return { page, lastPage, from, to: from + pageSize - 1 }
}
