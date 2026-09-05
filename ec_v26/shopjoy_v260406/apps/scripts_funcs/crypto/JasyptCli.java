import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.iv.RandomIvGenerator;

/**
 * JasyptCli — 프로젝트가 실제로 쓰는 Jasypt(1.9.3, PBEWITHHMACSHA512ANDAES_256)로
 * application-*.yml 의 ENC(...) 값을 만들거나 복호화 확인하는 CLI.
 *
 * _doc/정책서/base/base.설정값암호화.md + src/test/.../JasyptEncryptorTest.java 와
 * 완전히 동일한 알고리즘/설정(StandardPBEStringEncryptor + PBEWITHHMACSHA512ANDAES_256 +
 * RandomIvGenerator)을 쓴다 — 직접 크립토를 재구현하지 않고 실제 라이브러리를 그대로
 * 실행하므로, 여기서 만든 ENC(...) 는 Spring Boot(jasypt-spring-boot-starter)가 같은
 * 마스터키(JASYPT_ENCRYPTOR_PASSWORD)로 그대로 복호화할 수 있다.
 *
 * 사용법: java -cp "<jasypt jar>;." JasyptCli <encrypt|decrypt> <마스터키> <값>
 *   - encrypt: <값> = 평문 → 표준출력에 ENC(암호문) 형태로 출력
 *   - decrypt: <값> = ENC(암호문) 또는 암호문만 → 표준출력에 평문 출력
 *
 * 직접 쓰기보다 crypto-cli.js(Node 래퍼) + npm run encrypt/decrypt 로 실행할 것.
 */
public class JasyptCli {
    public static void main(String[] args) {
        if (args.length < 3) {
            System.err.println("사용법: java JasyptCli <encrypt|decrypt> <마스터키> <값>");
            System.exit(1);
        }
        String mode = args[0];
        String masterKey = args[1];
        String value = args[2];

        StandardPBEStringEncryptor enc = new StandardPBEStringEncryptor();
        enc.setPassword(masterKey);
        enc.setAlgorithm("PBEWITHHMACSHA512ANDAES_256");
        enc.setIvGenerator(new RandomIvGenerator());

        try {
            if ("encrypt".equals(mode)) {
                System.out.println("ENC(" + enc.encrypt(value) + ")");
            } else if ("decrypt".equals(mode)) {
                String raw = (value.startsWith("ENC(") && value.endsWith(")"))
                    ? value.substring(4, value.length() - 1)
                    : value;
                System.out.println(enc.decrypt(raw));
            } else {
                System.err.println("mode 는 encrypt 또는 decrypt 여야 합니다: " + mode);
                System.exit(1);
            }
        } catch (Exception e) {
            // 대부분 마스터키가 틀렸을 때 여기로 온다(EncryptionOperationNotPossibleException).
            System.err.println("실패 — 마스터키가 다르거나 값이 손상됐을 수 있습니다: " + e.getMessage());
            System.exit(1);
        }
    }
}
