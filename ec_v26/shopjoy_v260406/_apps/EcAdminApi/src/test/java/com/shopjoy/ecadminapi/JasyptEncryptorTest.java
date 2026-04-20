package com.shopjoy.ecadminapi;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.iv.RandomIvGenerator;
import org.junit.jupiter.api.Test;

/**
 * Jasypt 설정값 암호화 유틸리티
 *
 * ── 사전 준비 ──────────────────────────────────────────────────────────────
 *  build.gradle 에 아래 의존성 추가:
 *
 *    implementation 'com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.5'
 *
 * ── 암호화 값 생성 방법 ────────────────────────────────────────────────────
 *  1. MASTER_KEY 상수를 원하는 마스터키로 변경
 *  2. encryptValue() 의 plainText 를 암호화할 값으로 변경
 *  3. JUnit 실행 → 콘솔에 ENC(...) 형태의 결과 출력
 *  4. 출력된 ENC(xxx) 전체를 yml 에 붙여넣기
 *
 * ── yml 적용 예시 ──────────────────────────────────────────────────────────
 *  spring:
 *    datasource:
 *      password: ENC(암호화된값)
 *  jwt:
 *    secret: ENC(암호화된값)
 *
 * ── 마스터키 주입 방법 (택1) ───────────────────────────────────────────────
 *  ① 환경변수 (추천 — 코드/파일에 키 노출 없음)
 *       export JASYPT_ENCRYPTOR_PASSWORD=마스터키
 *       java -jar app.jar
 *
 *  ② JVM 인수
 *       java -Djasypt.encryptor.password=마스터키 -jar app.jar
 *
 *  ③ IntelliJ Run Configuration → VM options
 *       -Djasypt.encryptor.password=마스터키
 *
 *  ④ application-local.yml (로컬 전용, .gitignore 필수)
 *       jasypt:
 *         encryptor:
 *           password: 마스터키
 *
 * ── 주의사항 ───────────────────────────────────────────────────────────────
 *  - 마스터키는 절대 git 에 커밋하지 않는다
 *  - 같은 평문도 실행마다 다른 암호문이 생성된다 (RandomIvGenerator)
 *    → 복호화는 동일하게 동작하므로 어느 값이든 사용 가능
 *  - algorithm: PBEWITHHMACSHA512ANDAES_256  (jasypt 3.x 기본)
 */
class JasyptEncryptorTest {

    // 마스터키 — 실행 전 변경 후 사용, 커밋 금지
    private static final String MASTER_KEY = "PUT_YOUR_MASTER_KEY_HERE";

    private StandardPBEStringEncryptor encryptor() {
        StandardPBEStringEncryptor enc = new StandardPBEStringEncryptor();
        enc.setPassword(MASTER_KEY);
        enc.setAlgorithm("PBEWITHHMACSHA512ANDAES_256");
        enc.setIvGenerator(new RandomIvGenerator());
        return enc;
    }

    @Test
    void encryptValue() {
        String plainText = "암호화할값을여기에입력";   // ← 변경

        StandardPBEStringEncryptor enc = encryptor();
        String encrypted = enc.encrypt(plainText);
        String decrypted = enc.decrypt(encrypted);

        System.out.println("=================================================");
        System.out.println("Plain    : " + plainText);
        System.out.println("Encrypted: " + encrypted);
        System.out.println("YML 적용 : ENC(" + encrypted + ")");
        System.out.println("복호화확인: " + decrypted);
        System.out.println("=================================================");
    }

    @Test
    void decryptValue() {
        String encryptedText = "암호화된값을여기에입력";   // ← ENC() 안의 값만 입력

        String decrypted = encryptor().decrypt(encryptedText);

        System.out.println("=================================================");
        System.out.println("Encrypted: " + encryptedText);
        System.out.println("Decrypted: " + decrypted);
        System.out.println("=================================================");
    }
}
