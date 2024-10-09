import axios, {
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  AxiosAdapter,
} from "axios";

export async function makeApiCall(
  requestConfig: AxiosRequestConfig,
  options?: { includeHeaders?: boolean; adapter?: AxiosAdapter }
) {
  try {
    let response: AxiosResponse;
    if (options?.adapter) {
      response = await options.adapter(requestConfig);
    } else {
      response = await axios(requestConfig);
    }
    if (options?.includeHeaders) {
      return { data: response.data, headers: response.headers };
    }
    return response.data;
  } catch (error) {
    console.log(error);
    const axiosError: AxiosError = error;
    if (!axiosError.response) {
      return {
        error: true,
        message: `No response from server. Please try again later.`,
      };
    }
    const data = axiosError?.response?.data;
    const headers = axiosError?.response?.headers;
    const statusText = axiosError?.response?.statusText;
    const responseConfig = axiosError?.response?.config;
    const status = axiosError?.response?.status;

    const errorObj = {
      error: data?.error,
      request: {
        data: responseConfig.data,
        headers: responseConfig.headers,
        method: responseConfig.method,
        url: responseConfig.url,
      },
      response: {
        headers,
        data: JSON.stringify(data),
      },
      status,
      statusText,
    };
    console.log(JSON.stringify(errorObj));
    return {
      responseHeader: headers,
      error: true,
      status,
      ...(typeof data === "string" ? { data } : { ...data }),
      axiosError: true,
      axiosStatus: status,
      statusText,
    };
  }
}
