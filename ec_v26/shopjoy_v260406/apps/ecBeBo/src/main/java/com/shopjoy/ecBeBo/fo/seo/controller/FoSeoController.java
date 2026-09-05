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
 * 검색엔진 크롤러나 (카카오 SDK 를 안 거치는) 순수 URL 붙여넣기 공유 시 화면별로 다른
 * 정보가 안 보이는 문제가 있다. 이 컨트롤러는 그 문제 해결 전용 — 실제 화면 API 가
 * 아니라 "링크 하나를 공유/색인할 때 보여줄 랜딩 HTML"만 만든다.
 * 인증 불필요(SecurityConfig 의 {@code /foui/**} permitAll).</p>
 *
 * <p>사람이 링크를 직접 열면 곧바로 실제 SPA 화면으로 조용히 전환되고(같은 도메인이면
 * history.replaceState, 로컬 개발처럼 포트/도메인이 다르면 전체 이동), 크롤러/미리보기 봇은
 * 이 응답의 title/description/OG 태그만 읽으면 된다 — FoSeoService 참조.</p>
 *
 * <p>2026-08-30: 경로 prefix 를 {@code /fo/} → {@code /foui/} 로 변경 — {@code /fo/} 는
 * {@code /api/fo/...}(JSON API) 네임스페이스와 혼동되기 쉬워서, "공개(public) SEO HTML 랜딩"
 * 전용임을 이름으로 분명히 구분했다. 상품상세/이벤트상세/블로그상세(ID 필요) 에 이어
 * 홈·상품목록·고객센터·FAQ·이벤트목록·블로그목록(ID 불필요, 정적) 랜딩까지 확장 — FO 의
 * 모든 공개(비로그인) 화면이 링크 공유 시 화면에 맞는 title/description 을 갖는다.</p>
 */
@RestController
@RequiredArgsConstructor
public class FoSeoController {

    private final FoSeoService foSeoService;

    /** getProdLanding — 상품상세 SEO 랜딩 */
    @GetMapping(value = "/foui/prodDtl/{prodId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getProdLanding(@PathVariable("prodId") String prodId) {
        return htmlResponse(foSeoService.getProdHtml(prodId));
    }

    /** getEventLanding — 이벤트상세 SEO 랜딩 */
    @GetMapping(value = "/foui/eventDtl/{eventId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getEventLanding(@PathVariable("eventId") String eventId) {
        return htmlResponse(foSeoService.getEventHtml(eventId));
    }

    /** getBlogLanding — 블로그상세 SEO 랜딩 */
    @GetMapping(value = "/foui/blogDtl/{blogId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getBlogLanding(@PathVariable("blogId") String blogId) {
        return htmlResponse(foSeoService.getBlogHtml(blogId));
    }

    // ── 정적/목록형 화면(ID 없음) — 2026-08-30 추가 ──────────────────────────────

    /** getHomeLanding — 홈 SEO 랜딩 */
    @GetMapping(value = "/foui/home", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getHomeLanding() {
        return htmlResponse(foSeoService.getHomeHtml());
    }

    /** getProdListLanding — 상품목록 SEO 랜딩 */
    @GetMapping(value = "/foui/prodList", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getProdListLanding() {
        return htmlResponse(foSeoService.getProdListHtml());
    }

    /** getContactLanding — 고객센터 SEO 랜딩 */
    @GetMapping(value = "/foui/contact", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getContactLanding() {
        return htmlResponse(foSeoService.getContactHtml());
    }

    /** getFaqLanding — FAQ SEO 랜딩 */
    @GetMapping(value = "/foui/faq", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getFaqLanding() {
        return htmlResponse(foSeoService.getFaqHtml());
    }

    /** getEventListLanding — 이벤트 목록 SEO 랜딩 */
    @GetMapping(value = "/foui/event", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getEventListLanding() {
        return htmlResponse(foSeoService.getEventListHtml());
    }

    /** getBlogListLanding — 블로그 목록 SEO 랜딩 */
    @GetMapping(value = "/foui/blog", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getBlogListLanding() {
        return htmlResponse(foSeoService.getBlogListHtml());
    }

    /** htmlResponse — 공통 응답 포맷(5분 캐시 — 크롤러 재요청 부하 완화) */
    private ResponseEntity<String> htmlResponse(String html) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
