package com.shopjoy.ecBeBo.common.config;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

/**
 * StaticIndexRedirectController — static/{dir}/index.html 형태의 정적 화면을
 * 슬래시 없는 짧은 URL(/home)로도 열 수 있게 하는 범용 리다이렉트.
 *
 * <p>nginx의 {@code index index.html;}는 디렉터리 요청 시 자동으로 index.html을 찾아 서빙하지만,
 * Spring Boot의 정적 리소스 서빙은 이 자동 인식이 루트("/") 한정이라 {@code /home} 같은 하위
 * 경로에선 적용되지 않는다(2026-09-06 실측: /home, /home/ 전부 404). 그렇다고 이 백엔드 앞에
 * nginx를 다시 두면 "nginx 없이도 단독 공개 가능"이라는 이 앱의 설계 원칙(docker-compose.yml
 * 상단 주석 참조)이 깨지므로, 대신 이 컨트롤러 하나로 해결한다.
 *
 * <p>이름을 하드코딩하지 않고 {@code static/{dir}/index.html} 존재 여부로 판단 — 지금은
 * static/home 하나뿐이지만, 나중에 static/portal 처럼 화면이 늘어도 이 컨트롤러를 다시 손댈
 * 필요가 없다(요청사항: "지금은 /home 만 있지만 /portal 이런식으로 계속 추가될 수 있어").
 * index.html이 없는 디렉터리(예: static/cdn — 원본 파일만 있고 화면 없음)는 그냥 기존처럼
 * 404로 흘러가므로 다른 정적 경로 동작에 영향 없다.
 */
@Controller
public class StaticIndexRedirectController {

  @GetMapping({ "/{dir:[a-zA-Z0-9_-]+}", "/{dir:[a-zA-Z0-9_-]+}/" })
  public String redirectBareDirToIndex(@PathVariable String dir) {
    if (new ClassPathResource("static/" + dir + "/index.html").exists()) {
      return "redirect:/" + dir + "/index.html";
    }
    // index.html 없는 디렉터리(예: static/cdn) — 원래대로 404 처리에 위임
    throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  }
}
