export const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data?.error || "An error occurred while fetching the data.");
    throw error;
  }
  return data;
};
