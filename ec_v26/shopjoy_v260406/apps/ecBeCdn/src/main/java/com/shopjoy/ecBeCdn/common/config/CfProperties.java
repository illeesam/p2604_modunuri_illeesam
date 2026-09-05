package com.shopjoy.eccdnapi.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** application.yml 의 app.cf.* 를 한 곳에 바인딩 — 개별 @Value 산개 방지. */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.cf")
public class CfProperties {

    /** 실제 파일이 저장되는 루트 경로(로컬 실행=./storage, NAS=/app/storage 볼륨마운트) */
    private String storageRoot;

    /** 업로드 허용 최대 용량(MB). 초과 시 CfFileTooLargeException */
    private int maxFileSizeMb;

    /** ffmpeg 실행 파일 경로 또는 PATH 상의 이름 */
    private String ffmpegPath;

    private Jwt jwt = new Jwt();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessExpiryMs;
        private long refreshExpiryMs;
    }
}
