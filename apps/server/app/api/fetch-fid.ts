async function fetchFidFromWc(username: string): Promise<number | null> {
  const resp = await fetch(
    `https://api.warpcast.com/v2/user-by-username?username=${username}`
  );
  const { result } = (await resp.json()) as {
    result: { user: { fid: number } };
  };
  return result?.user?.fid || null;
}


async function fetchFidFromVasco(handle: string): Promise<number | null> {
  const resp = await fetch(`https://vasco.wtf/${handle}`, {
    redirect: "manual",
  });
  const location = resp.headers.get("location");
  const fidStr = location?.split("/").pop();
  const fid = fidStr ? parseInt(fidStr, 10) : null;
  return fid;
}

export async function fetchFid(handle: string): Promise<number | null> {
  const fid = await fetchFidFromWc(handle);
  if (fid != null) {
    return fid;
  }
  return await fetchFidFromVasco(handle);
}
