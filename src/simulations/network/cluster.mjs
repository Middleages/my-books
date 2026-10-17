// One ready Pod, selector-based ClusterIP Service, fixed TCP listener on 8000.
export function serviceResult({
  selector = "api",
  targetPort = 8000,
  replaced = false,
  ready = true,
} = {}) {
  const ip = replaced ? "10.42.0.23" : "10.42.0.12";
  const candidates = selector === "api" ? [ip] : [];
  const endpoints = ready ? candidates : [];
  if (!endpoints.length)
    return {
      code: "no-endpoint",
      ip,
      endpoints,
      explanation: candidates.length
        ? "Pod는 선택됐지만 Ready가 아니어서 이 모델의 전달 대상에서 제외됩니다."
        : "selector app=other가 Pod의 app=api 라벨과 일치하지 않습니다.",
      next: "Service selector와 Pod 라벨·Ready 상태, EndpointSlice를 확인합니다.",
    };
  if (targetPort !== 8000)
    return {
      code: "wrong-port",
      ip,
      endpoints,
      explanation: `대상 Pod는 있지만 ${ip}:${targetPort}에는 리스너가 없습니다.`,
      next: "Service targetPort와 앱의 실제 listen 포트를 비교합니다.",
    };
  return {
    code: "connected",
    ip,
    endpoints,
    explanation: `api:80이라는 접점을 유지하며 ${ip}:8000으로 새 연결을 전달합니다.`,
    next: "Pod가 바뀌어도 Service 이름·포트는 유지됩니다. 기존 연결의 무중단 이전을 뜻하지는 않습니다.",
  };
}
