const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type ProblemBody = { title?: string };

async function send(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ.');
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemBody;
    throw new ApiError(response.status, problem.title ?? 'Có lỗi xảy ra. Hãy thử lại.');
  }
  return response;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await (await send(path, init)).json()) as T;
}

export async function requestBlob(path: string): Promise<Blob> {
  return (await send(path)).blob();
}
