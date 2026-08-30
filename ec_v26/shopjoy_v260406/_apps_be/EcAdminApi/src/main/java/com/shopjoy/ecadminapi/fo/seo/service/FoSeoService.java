package com.shopjoy.ecadminapi.fo.seo.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.fo.ec.service.FoPdProdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * FO SEO 메타태그 서버사이드 주입 서비스.
 *
 * <p>FO 는 순수 CSR(클라이언트 렌더링) SPA 라 index.html 자체엔 상품별 콘텐츠가 없다 —
 * &lt;title&gt;/description/OG 태그가 사이트 전체에 고정값 하나뿐이라, 검색결과나 카카오톡 등
 * (SDK 를 거치지 않는) 순수 URL 공유 시 링크 미리보기가 항상 동일한 일반 브랜드 정보만
 * 보여준다. {@code FoSeoController}(/prodDtl/{prodId}) 가 이 서비스로 "실제 index.html 을 읽고
 * 해당 상품 정보로 &lt;title&gt;/description/OG 메타태그만 치환한 HTML"을 만들어 응답한다.
 * 본문 콘텐츠 자체는 여전히 클라이언트에서 API 로 채우는 CSR 그대로 — 이 계층은 딱
 * 메타태그(+ 실제 앱으로의 핸드오프 스크립트 한 줄)만 책임진다.</p>
 *
 * <p>2026-08-30, FE lazy-load 실험(shopjoy_v260406_lazy) 논의 중 발견된 SEO 갭 대응.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FoSeoService {

    private final FoPdProdService foPdProdService;

    /** index.html 이 있는 FO 프로젝트 루트(템플릿 읽기용) — application-{profile}.yml 의 app.frontend.dir */
    @Value("${app.frontend.dir}")
    private String frontendDir;

    /** FO 정적 서버 공개 URL — 절대 og:image URL 구성 + cross-origin 폴백 이동에 사용 */
    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private static final String DEFAULT_TITLE = "ShopJoy - 쇼핑의 즐거움";
    private static final String DEFAULT_DESC  = "트렌디한 의류를 합리적인 가격으로. ShopJoy에서 나만의 스타일을 완성하세요.";

    private static final Pattern TITLE_TAG = Pattern.compile("<title>.*?</title>");
    private static final Pattern DESC_TAG  = Pattern.compile("<meta name=\"description\" content=\"[^\"]*\">");

    /**
     * getProdHtml — 상품상세 SEO 메타 주입 HTML 생성.
     *
     * <p>상품 조회가 실패해도(존재하지 않는 ID 등) 기본 메타로 안전하게 폴백한다 —
     * 크롤러/공유 랜딩에서 500 을 보여줄 순 없다.</p>
     */
    public String getProdHtml(String prodId) {
        String title = DEFAULT_TITLE;
        String desc = DEFAULT_DESC;
        String image = null;
        try {
            PdProdDto.Item prod = foPdProdService.getDetail(prodId);
            if (prod != null) {
                if (isNotBlank(prod.getProdNm())) title = prod.getProdNm() + " - ShopJoy";
                if (isNotBlank(prod.getAdvrtStmt())) desc = prod.getAdvrtStmt();
                if (isNotBlank(prod.getThumbnailUrl())) image = toAbsoluteUrl(prod.getThumbnailUrl());
            }
        } catch (Exception e) {
            log.warn("[FoSeoService] 상품 조회 실패 — 기본 메타로 폴백. prodId={}, msg={}", prodId, e.getMessage());
        }
        // innerAppPath: FO 내부 라우팅이 이해하는 형식(경로만, same-origin 이동용)
        String innerAppPath = "/?page=prodView&prodid=" + prodId;
        // fullFrontendUrl: cross-origin 폴백 전체이동 대상 + 절대 og:url 구성용
        String fullFrontendUrl = frontendBaseUrl + innerAppPath;
        return buildHtml(title, desc, image, fullFrontendUrl, innerAppPath);
    }

    /** toAbsoluteUrl — 상대경로 이미지를 og:image 규격(절대 URL)으로 변환 */
    private String toAbsoluteUrl(String rel) {
        if (rel.matches("(?i)^https?://.*")) return rel;
        return frontendBaseUrl + "/" + rel.replaceFirst("^/", "");
    }

    /** buildHtml — index.html 템플릿을 읽어 메타태그 치환 + 실제 앱 핸드오프 스크립트 삽입 */
    private String buildHtml(String title, String desc, String image, String fullFrontendUrl, String innerAppPath) {
        String html = readTemplate();
        String safeTitle = escapeHtml(title);
        String safeDesc = escapeHtml(desc);

        html = TITLE_TAG.matcher(html).replaceFirst(Matcher.quoteReplacement("<title>" + safeTitle + "</title>"));
        html = DESC_TAG.matcher(html).replaceFirst(
            Matcher.quoteReplacement("<meta name=\"description\" content=\"" + safeDesc + "\">"));

        StringBuilder inject = new StringBuilder();
        inject.append("\n  <meta property=\"og:title\" content=\"").append(safeTitle).append("\">\n");
        inject.append("  <meta property=\"og:description\" content=\"").append(safeDesc).append("\">\n");
        inject.append("  <meta property=\"og:type\" content=\"product\">\n");
        inject.append("  <meta property=\"og:url\" content=\"").append(escapeHtml(fullFrontendUrl)).append("\">\n");
        if (image != null) {
            inject.append("  <meta property=\"og:image\" content=\"").append(escapeHtml(image)).append("\">\n");
        }
        // 실제 앱으로 핸드오프 — window.location.origin 을 frontendBaseUrl 과 명시적으로 비교해서 분기한다.
        // (당초 history.replaceState 가 cross-origin 이면 SecurityError 를 던질 거라 가정하고 try/catch
        // 폴백을 썼는데, 틀렸다 — replaceState 의 대상이 "경로만"(호스트 없음)이면 브라우저는 그걸 항상
        // "현재 문서와 같은 origin"으로 해석해서 절대 예외를 안 던진다. 그 결과 로컬처럼 프론트(5502)/
        // 백엔드(3000) 포트가 다르면, 주소창만 백엔드 origin 위에서 조용히 바뀌고 index.html 의 상대경로
        // 스크립트(pages/fo/... 등)가 전부 백엔드 쪽 없는 경로로 깨져서 빈 화면만 뜨는 버그가 있었다
        // (2026-08-30 실사용 테스트로 발견). 그래서 이제 명시적으로 origin 을 비교해서 같을 때만
        // replaceState 를 쓰고, 다르면(로컬 개발) 처음부터 location.href 로 진짜 프론트 origin 으로
        // 이동한다. 크롤러는 이 스크립트를 실행하든 안 하든 위 메타태그는 이미 raw HTML 에 있으므로 무관.
        inject.append("  <script>(function(){var f='").append(escapeJs(frontendBaseUrl)).append("';")
              .append("if(window.location.origin===f){try{history.replaceState(null,'','")
              .append(escapeJs(innerAppPath))
              .append("');return;}catch(e){}}location.href='")
              .append(escapeJs(fullFrontendUrl))
              .append("';})();</script>\n");

        Matcher descMatcher = DESC_TAG.matcher(html);
        if (descMatcher.find()) {
            int idx = descMatcher.end();
            return html.substring(0, idx) + inject + html.substring(idx);
        }
        // description 태그를 못 찾은 극단적 경우의 방어적 폴백 — </head> 직전에 삽입
        int headEnd = html.indexOf("</head>");
        return headEnd >= 0 ? html.substring(0, headEnd) + inject + html.substring(headEnd) : html + inject;
    }

    /**
     * readTemplate — 매 요청마다 디스크에서 index.html 을 다시 읽는다(운영 배포/수정 반영이
     * 재부팅 없이 즉시 되도록). 이 용도(크롤러/공유 랜딩)는 트래픽이 낮아 지금은 캐시 없이
     * 단순하게 간다 — 트래픽이 커지면 캐시+파일감시로 바꿀 수 있음.
     */
    private String readTemplate() {
        try {
            Path path = Path.of(frontendDir, "index.html");
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("index.html 템플릿을 읽을 수 없습니다: " + frontendDir, e);
        }
    }

    private static boolean isNotBlank(String s) { return s != null && !s.isBlank(); }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("'", "\\'");
    }
}
