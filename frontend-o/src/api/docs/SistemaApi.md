# SistemaApi

All URIs are relative to *http://localhost:8000/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**procesarComprobante**](SistemaApi.md#procesarcomprobante) | **POST** /procesar-comprobante | Procesar Comprobante |



## procesarComprobante

> ConciliacionResponse procesarComprobante(imagen)

Procesar Comprobante

### Example

```ts
import {
  Configuration,
  SistemaApi,
} from '';
import type { ProcesarComprobanteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SistemaApi();

  const body = {
    // Blob
    imagen: BINARY_DATA_HERE,
  } satisfies ProcesarComprobanteRequest;

  try {
    const data = await api.procesarComprobante(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **imagen** | `Blob` |  | [Defaults to `undefined`] |

### Return type

[**ConciliacionResponse**](ConciliacionResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

