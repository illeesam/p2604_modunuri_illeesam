package com.shopjoy.ecBeBo.co.ext.cdn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * EcCdnApi(동영상/이미지 CDN 서버) 호출 클라이언트 — id/pwd 로 로그인해 accessToken(30초)을 받고,
 * 만료되면 그 accessToken 을 그대로 다시 보내 재발급받는다(EcCdnApi 가 서버 DB에 보관 중인
 * refreshToken 을 내부에서 조회해 처리 — refreshToken 은 이 클라이언트도, 어떤 클라이언트도
 * 절대 안 받는다. EcBeBo 의 BoAuthService/FoAuthService 와 동일 원칙, 2026-09-06).
 *
 * <p><b>2026-09-06 시점 상태: 아직 어디서도 안 씀(대기 상태).</b> EcCdnApi 자체 배포 파이프라인과
 * 함께 준비만 해둔 것으로, 기존에 잘 동작 중인 {@code CmUploadService}(로컬 디스크 저장,
 * storage_type_cd=LOCAL)를 이 클라이언트로 교체(storage_type_cd=CDN 분기 추가)하는 건 별도
 * 작업으로 뒤에 진행한다 — 운영 중인 업로드 흐름을 이 클래스 준비와 한 번에 바꾸는 건 리스크가
 * 커서 의도적으로 분리했다.</p>
 *
 * <p>accessToken 이 30초로 매우 짧아, 매 호출마다 "유효한지 확인 → 필요하면 refresh/재로그인"
 * 을 거친다(전송 도중 만료될 수 있어 401 응답 시 1회 재로그인 재시도까지 포함).</p>
 */
@Slf4j
@Component
public class CfCdnApiClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.cf-cdn.base-url:http://localhost:21090}")
    private String baseUrl;
    @Value("${app.cf-cdn.client-id:ecadminapi}")
    private String clientId;
    @Value("${app.cf-cdn.client-pwd:}")
    private String clientPwd;

    private volatile String accessToken;
    private volatile Instant accessTokenExpiry = Instant.EPOCH;

    /** 만료 임박 판단 여유(초) — accessToken 이 30초뿐이라 너무 짧게 두면 전송 도중 만료될 수 있음. */
    private static final long EXPIRY_SKEW_SECONDS = 5;

    public record UploadResult(String fileId, String fileUrl, String thumbnailUrl, String frameUrl, String streamUrl) {}

    /** 파일 업로드. thumbnail=true 면 이미지는 _thumbnail 썸네일도 요청(동영상은 항상 프레임+썸네일 생성). */
    public UploadResult upload(byte[] fileBytes, String fileName, String contentType, boolean thumbnail) {
        return withAuthRetry(token -> doUpload(token, fileBytes, fileName, contentType, thumbnail));
    }

    /** 파일 삭제 (원본+썸네일+프레임 전부 EcCdnApi 가 알아서 지움). */
    public void delete(String fileId) {
        withAuthRetry(token -> { doDelete(token, fileId); return null; });
    }

    // ───────────────────────────── 내부 구현 ─────────────────────────────

    private interface TokenCall<T> {
        T apply(String accessToken) throws IOException, InterruptedException;
    }

    /** 401 이 오면 강제로 토큰을 비우고 1회 재로그인 재시도 — accessToken 30초 특성상 전송 도중 만료 대비. */
    private <T> T withAuthRetry(TokenCall<T> call) {
        String token = getValidAccessToken();
        try {
            return call.apply(token);
        } catch (CfUnauthorizedException e) {
            log.warn("[CfCdnApiClient] EcCdnApi 401 수신 — 재로그인 후 1회 재시도");
            synchronized (this) {
                accessToken = null;
                accessTokenExpiry = Instant.EPOCH;
            }
            String retried = getValidAccessToken();
            try {
                return call.apply(retried);
            } catch (Exception ex) {
                throw new RuntimeException("EcCdnApi 호출 실패(재시도 후에도 실패): " + ex.getMessage(), ex);
            }
        } catch (Exception e) {
            throw new RuntimeException("EcCdnApi 호출 실패: " + e.getMessage(), e);
        }
    }

    private synchronized String getValidAccessToken() {
        if (accessToken != null && Instant.now().isBefore(accessTokenExpiry.minusSeconds(EXPIRY_SKEW_SECONDS))) {
            return accessToken;
        }
        // 만료됐어도 accessToken 값 자체는 재발급 조회 키로 쓸 수 있다(서버가 그 값으로
        // cf_token 행을 찾아 보관 중인 refreshToken 을 대신 검사) — 그래서 refresh() 는
        // "막 만료된 값이라도" accessToken 이 하나라도 있으면 시도해본다.
        if (accessToken != null) {
            try {
                refresh();
                return accessToken;
            } catch (Exception e) {
                log.warn("[CfCdnApiClient] accessToken 재발급 실패 — 재로그인으로 폴백: {}", e.getMessage());
            }
        }
        login();
        return accessToken;
    }

    private void login() {
        try {
            String body = objectMapper.writeValueAsString(new LoginBody(clientId, clientPwd));
            HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/api/cdn/auth/login"))
                .header("Content-Type", "application/json")
                .header("X-Caller-System", "EcBeBo") // 마이크로서비스 환경에서 "어느 서비스"인지 자기소개(cf_token/cf_token_hist 기록용)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(10))
                .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                throw new RuntimeException("EcCdnApi 로그인 실패(HTTP " + res.statusCode() + "): " + res.body());
            }
            applyTokenResponse(res.body());
            log.info("[CfCdnApiClient] EcCdnApi 로그인 성공: clientId={}", clientId);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new RuntimeException("EcCdnApi 로그인 요청 실패: " + e.getMessage(), e);
        }
    }

    /** 재발급 — 요청 바디 없음, 지금 갖고 있는(막 만료됐을 수도 있는) accessToken 을 헤더로 보낸다. */
    private void refresh() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/api/cdn/auth/refresh"))
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Caller-System", "EcBeBo")
            .POST(HttpRequest.BodyPublishers.noBody())
            .timeout(Duration.ofSeconds(10))
            .build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            throw new RuntimeException("refresh 실패(HTTP " + res.statusCode() + "): " + res.body());
        }
        applyTokenResponse(res.body());
    }

    /** refreshToken 은 응답에 없다(서버 보관 원칙) — accessToken/expiresIn 만 반영. */
    private void applyTokenResponse(String jsonBody) throws IOException {
        JsonNode data = objectMapper.readTree(jsonBody).path("data");
        this.accessToken = data.path("accessToken").asText();
        long expiresIn = data.path("expiresIn").asLong(30);
        this.accessTokenExpiry = Instant.now().plusSeconds(expiresIn);
    }

    private UploadResult doUpload(String token, byte[] fileBytes, String fileName, String contentType, boolean thumbnail)
            throws IOException, InterruptedException {
        String boundary = "----EcCdnApiBoundary" + UUID.randomUUID();
        byte[] multipartBody = buildMultipartBody(boundary, fileBytes, fileName, contentType, thumbnail);

        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/api/cdn/upload"))
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
            .timeout(Duration.ofSeconds(60)) // 120MB 대용량 업로드 고려
            .build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() == 401) throw new CfUnauthorizedException();
        if (res.statusCode() != 200 && res.statusCode() != 201) {
            throw new RuntimeException("EcCdnApi 업로드 실패(HTTP " + res.statusCode() + "): " + res.body());
        }
        JsonNode d = objectMapper.readTree(res.body()).path("data");
        return new UploadResult(
            d.path("fileId").asText(),
            d.path("fileUrl").asText(null),
            d.hasNonNull("thumbnailUrl") ? d.path("thumbnailUrl").asText() : null,
            d.hasNonNull("frameUrl") ? d.path("frameUrl").asText() : null,
            d.hasNonNull("streamUrl") ? d.path("streamUrl").asText() : null
        );
    }

    private void doDelete(String token, String fileId) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/api/cdn/file/" + fileId))
            .header("Authorization", "Bearer " + token)
            .DELETE()
            .timeout(Duration.ofSeconds(10))
            .build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() == 401) throw new CfUnauthorizedException();
        if (res.statusCode() != 200) {
            throw new RuntimeException("EcCdnApi 삭제 실패(HTTP " + res.statusCode() + "): " + res.body());
        }
    }

    /** RFC 2388 최소 구현 — 파일 파트 1개 + thumbnail 폼필드 1개만 있으면 되므로 라이브러리 없이 직접 조립. */
    private byte[] buildMultipartBody(String boundary, byte[] fileBytes, String fileName, String contentType, boolean thumbnail) throws IOException {
        String CRLF = "\r\n";
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();

        out.write(("--" + boundary + CRLF).getBytes());
        out.write(("Content-Disposition: form-data; name=\"thumbnail\"" + CRLF + CRLF).getBytes());
        out.write((String.valueOf(thumbnail) + CRLF).getBytes());

        out.write(("--" + boundary + CRLF).getBytes());
        out.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"" + CRLF).getBytes());
        out.write(("Content-Type: " + (contentType != null ? contentType : "application/octet-stream") + CRLF + CRLF).getBytes());
        out.write(fileBytes);
        out.write(CRLF.getBytes());

        out.write(("--" + boundary + "--" + CRLF).getBytes());
        return out.toByteArray();
    }

    private record LoginBody(String id, String pwd) {}

    /** 401 을 구분해서 잡기 위한 내부 전용 예외 — withAuthRetry 가 재로그인 재시도 트리거로 사용. */
    private static class CfUnauthorizedException extends RuntimeException {}
}
