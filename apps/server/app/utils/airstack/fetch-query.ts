export type FetchQuery = {
  data: any;
  error: any;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  getNextPage: () => Promise<FetchQuery | null>;
  getPrevPage: () => Promise<FetchQuery | null>;
};
export type Variables = Record<string, any>;

export async function fetchQuery(
  query: string,
  variables?: Variables
): Promise<Pick<FetchQuery, "data" | "error">> {
  const _variables: Variables = stringifyObjectValues(variables || {});

  let data: null | ResponseType = null;
  let error = null;

  const [response, _error] = await fetchGql<any>(query, _variables);
  data = response;
  error = _error;

  return {
    data,
    error,
  };
}

const AIRSTACK_ENDPOINT = "https://api.airstack.xyz/gql";

const config = {
  authKey: process.env.AIRSTACK_API_KEY,
  timeout: parseInt(process.env.AIRSTACK_TIMEOUT || "5000", 10),
};

async function _fetch<ResponseType = any>(
  query: string,
  variables: Variables
): Promise<[ResponseType | null, any]> {
  if (!config.authKey) {
    return [null, Error("No API key provided")];
  }
  try {
    const res = await fetch(AIRSTACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.authKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });
    const json = (await res.json()) as any;
    const data = json?.data;
    let error = null;

    if (json.errors || json.error) {
      error = json.errors || json.error;
    }
    return [data, error];
  } catch (_error) {
    const error =
      typeof _error === "string"
        ? _error
        : (_error as { message: string })?.message;
    return [null, error || "Unable to fetch data"];
  }
}

async function fetchGql<ResponseType = any>(
  query: string,
  variables: Variables
): Promise<[ResponseType | null, any]> {
  return _fetch<ResponseType>(query, variables);
}

function stringifyObjectValues(value: Record<string, any>) {
  const stringified: Record<string, any> = {};
  if (!value || typeof value !== "object") return value;

  for (const key in value) {
    if (Array.isArray(value[key])) {
      stringified[key] = value[key].map((item: any) =>
        stringifyObjectValues(item)
      );
    } else if (typeof value[key] === "object") {
      stringified[key] = JSON.stringify(value[key]);
    } else {
      stringified[key] = value[key];
    }
  }
  return stringified;
}
