package com.shopjoy.ecadminapi.fo.seo.controller;

import com.shopjoy.ecadminapi.fo.seo.service.FoSeoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * FO SEO 메타태그 서버사이드 주입 랜딩 컨트롤러.
 *
 * <p>FO 는 순수 CSR SPA 라 index.html 하나에 &lt;title&gt;/description 이 고정돼 있어,
 * 검색엔진 크롤러나 (카카오 SDK 를 안 거치는) 순수 URL 붙여넣기 공유 시 상품별로 다른
 * 정보가 안 보이는 문제가 있다. 이 컨트롤러는 그 문제 해결 전용 — 실제 화면 API 가
 * 아니라 "링크 하나를 공유/색인할 때 보여줄 랜딩 HTML"만 만든다.
 * 인증 불필요(SecurityConfig 의 {@code /prodDtl/**} permitAll).</p>
 *
 * <p>{@code GET /prodDtl/{prodId}} → 상품상세용 메타 주입 HTML. 사람이 열면 곧바로 실제 SPA
 * 화면(?page=prodView)으로 조용히 전환되고(같은 도메인이면 history.replaceState, 로컬
 * 개발처럼 포트/도메인이 다르면 전체 이동), 크롤러/미리보기 봇은 이 응답의
 * title/description/OG 태그만 읽으면 된다 — FoSeoService 참조.</p>
 */
@RestController
@RequiredArgsConstructor
public class FoSeoController {

    private final FoSeoService foSeoService;

    /** getProdLanding — 상품상세 SEO 랜딩 */
    @GetMapping(value = "/prodDtl/{prodId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getProdLanding(@PathVariable("prodId") String prodId) {
        String html = foSeoService.getProdHtml(prodId);
        return ResponseEntity.ok()
            // 5분 캐시 — 크롤러 재요청 부하 완화(가격 등 실시간성은 어차피 클라이언트 API 가 담당하므로 무방)
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
