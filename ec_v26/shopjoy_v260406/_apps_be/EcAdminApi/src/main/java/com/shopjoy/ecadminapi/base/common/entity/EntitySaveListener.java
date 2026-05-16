package com.shopjoy.ecadminapi.base.common.entity;

import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 엔티티 저장(INSERT/UPDATE) 시 공통 메타데이터를 서버에서 강제 주입하는 JPA 리스너.
 *
 * {@link BaseEntity} 에 @EntityListeners 로 부착되어 BaseEntity 를 상속하는 전 엔티티에
 * 자동 적용된다. 처리 항목:
 *
 *  1. site_id  — 인증 컨텍스트(JWT 클레임 → SecurityUtil.getSiteId())의 값으로 <b>항상 덮어쓰기</b>.
 *                클라이언트 body 의 site_id 는 신뢰하지 않는다(위변조 방지). 정책: sy.57 §3.1.
 *  2. 등록 감사 (@PrePersist) — regBy/regDate/updBy/updDate 모두 주입.
 *  3. 수정 감사 (@PreUpdate)  — updBy/updDate 만 주입(최초 등록값 보존).
 *
 * 미인증/시스템/배치 컨텍스트(authId·siteId 가 빈 값)에서는 *_by / site_id 를 빈 값으로
 * 덮어쓰지 않고 기존 값을 보존한다. 날짜는 컨텍스트와 무관하게 항상 서버 시각으로 세팅한다.
 *
 * site_id 는 BaseEntity 가 보유하지 않고 각 엔티티에 개별 선언되므로 리플렉션으로 접근한다
 * (없는 엔티티는 자연히 skip). reg/upd 는 BaseEntity 필드라 캐스팅으로 처리한다.
 *
 * MyBatis insert/update 경로는 이 리스너를 타지 않으므로
 * {@code MyBatisSaveMetaInterceptor} 가 동일 로직을 별도로 적용한다.
 */
public class EntitySaveListener {

    /**
     * 엔티티 클래스 → siteId Field 캐시.
     *
     * <p>리플렉션의 {@code getDeclaredField} 는 호출 비용이 있으므로 클래스별로 한 번만
     * 탐색하고 결과(찾은 Field 또는 미존재 마커 {@link #NONE})를 영구 보관한다.
     * 엔티티 클래스 종류는 유한(고정)하므로 캐시가 무한정 커지지 않으며, 동시 요청에서
     * 안전하도록 {@link ConcurrentHashMap} 을 쓴다.</p>
     */
    private static final ConcurrentHashMap<Class<?>, Field> SITE_FIELD_CACHE = new ConcurrentHashMap<>();

    /**
     * "siteId 필드가 없는 클래스" 를 캐시에 표현하기 위한 센티넬(보초) 값.
     *
     * <p>{@code computeIfAbsent} 는 {@code null} 을 값으로 저장할 수 없어, 매번 미존재
     * 클래스를 다시 탐색하게 된다. 이를 막기 위해 "없음"도 캐시해야 하는데, 그 표식으로
     * 의미 없는 실제 Field 객체 하나({@code NONE} 자기 자신의 필드)를 마커로 재사용한다.
     * {@link #resolveSiteIdField}/{@code MyBatis} 인터셉터와 동일한 관용 패턴.</p>
     */
    private static final Field NONE;

    /**
     * {@link #NONE} 센티넬 초기화.
     *
     * <p>자기 자신의 {@code NONE} 정적 필드를 리플렉션으로 얻어 마커로 쓴다. 해당 필드는
     * 반드시 존재하므로 정상 경로에서는 예외가 날 수 없다. 만약 (리팩터링 등으로) 필드명이
     * 바뀌어 못 찾으면 클래스 로딩 자체를 실패시켜({@link ExceptionInInitializerError})
     * 잘못된 상태로 동작하는 것을 조기에 차단한다.</p>
     */
    static {
        try {
            NONE = EntitySaveListener.class.getDeclaredField("NONE");
        } catch (NoSuchFieldException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    /**
     * 신규 엔티티 INSERT 직전 콜백 (JPA {@link PrePersist}).
     *
     * <p>JPA 가 영속화(persist) 직전에 자동 호출한다. 다음을 서버 권한으로 채운다:</p>
     * <ol>
     *   <li><b>site_id</b> — {@link #applySiteId}로 인증 컨텍스트 값 강제 주입(멀티테넌시 격리).</li>
     *   <li><b>등록 감사</b> — {@code regBy}/{@code updBy} 에 현재 사용자, {@code regDate}/{@code updDate}
     *       에 서버 시각. 신규 행이므로 reg·upd 를 동일하게 초기화한다.</li>
     * </ol>
     *
     * <p>동작 규칙:</p>
     * <ul>
     *   <li>사용자 식별자는 비인증/배치 컨텍스트면 {@code null}({@link #currentAuthId})이며,
     *       이때는 {@code *_by} 를 건드리지 않아 호출 측이 명시 세팅한 값을 보존한다.</li>
     *   <li>날짜는 컨텍스트와 무관하게 항상 서버 시각으로 세팅한다(시계 일관성).</li>
     *   <li>{@link BaseEntity} 미상속 엔티티는 reg/upd 세터가 없으므로 site_id 만 처리된다.</li>
     * </ul>
     *
     * @param entity 영속화될 엔티티 인스턴스 (BaseEntity 상속 여부와 무관하게 전달됨)
     */
    @PrePersist
    public void onCreate(Object entity) {
        applySiteId(entity);
        String authId = currentAuthId();
        LocalDateTime now = LocalDateTime.now();
        if (entity instanceof BaseEntity e) {
            if (authId != null) {
                e.setRegBy(authId);
                e.setUpdBy(authId);
            }
            e.setRegDate(now);
            e.setUpdDate(now);
        }
    }

    /**
     * 기존 엔티티 UPDATE 직전 콜백 (JPA {@link PreUpdate}).
     *
     * <p>JPA 가 변경 감지(dirty checking) 후 UPDATE 직전에 자동 호출한다.</p>
     * <ul>
     *   <li><b>site_id</b> — {@link #applySiteId}로 재확인·강제 주입(테넌트 이동 위변조 차단).</li>
     *   <li><b>수정 감사</b> — {@code updBy}/{@code updDate} 만 갱신한다.
     *       {@code regBy}/{@code regDate}(최초 등록 정보)는 절대 덮어쓰지 않는다.</li>
     * </ul>
     * <p>{@code authId} 가 {@code null}(비인증/배치)이면 {@code updBy} 는 보존하고
     * {@code updDate} 만 서버 시각으로 갱신한다.</p>
     *
     * @param entity 갱신될 엔티티 인스턴스
     */
    @PreUpdate
    public void onUpdate(Object entity) {
        applySiteId(entity);
        String authId = currentAuthId();
        if (entity instanceof BaseEntity e) {
            if (authId != null) e.setUpdBy(authId);
            e.setUpdDate(LocalDateTime.now());
        }
    }

    /* ── site_id 강제 주입 (리플렉션) ───────────────────────────── */

    /**
     * 엔티티의 {@code siteId} 필드를 인증 컨텍스트의 사이트 값으로 덮어쓴다.
     *
     * <p>site_id 는 {@link BaseEntity} 공통 필드가 아니라 각 도메인 엔티티에 개별 선언되므로
     * 캐스팅이 불가능해 리플렉션({@link #resolveSiteIdField})으로 접근한다.</p>
     *
     * <p>동작:</p>
     * <ul>
     *   <li>{@code siteId} 필드가 없는 엔티티(예: 코드/메타성 일부) → 아무 것도 안 함.</li>
     *   <li>인증 컨텍스트에 siteId 가 없음(빈 문자열, 배치/미인증) → 기존 값 보존
     *       (빈 값으로 격리 키를 지우면 모든 사이트에 노출되는 사고 방지).</li>
     *   <li>그 외 → 클라이언트가 보낸 값과 무관하게 <b>항상 컨텍스트 값으로 덮어쓰기</b>
     *       (다른 사이트 데이터로 위변조 시도 차단). 정책: sy.57 §3.1.</li>
     * </ul>
     * <p>리플렉션 set 이 보안 정책 등으로 실패해도 예외를 삼킨다 — site_id 격리는
     * DB의 {@code NOT NULL}/조회 시 site 조건이 2차 방어선이기 때문이다.</p>
     *
     * @param entity site_id 를 주입할 대상 엔티티
     */
    private void applySiteId(Object entity) {
        Field f = resolveSiteIdField(entity.getClass());
        if (f == null) return;
        String ctxSiteId = SecurityUtil.getSiteId();
        if (ctxSiteId == null || ctxSiteId.isEmpty()) return;
        try {
            f.set(entity, ctxSiteId);
        } catch (IllegalAccessException ignored) {
            // 접근 불가 시 무시 (DB NOT NULL / 조회 조건이 2차 방어)
        }
    }

    /**
     * 엔티티 클래스(상속 계층 포함)에서 {@code siteId} 필드를 찾아 캐시 후 반환한다.
     *
     * <p>처리:</p>
     * <ul>
     *   <li>{@link #SITE_FIELD_CACHE}에 이미 있으면 즉시 반환(리플렉션 1회/클래스).</li>
     *   <li>없으면 {@code type} 부터 상위 클래스로 거슬러 올라가며 {@code siteId} 선언을
     *       탐색한다(자식이 직접 가졌든, 상위 클래스가 가졌든 모두 탐지).</li>
     *   <li>찾으면 {@code setAccessible(true)}로 private 접근을 열고 캐시.</li>
     *   <li>끝까지 없으면 {@link #NONE} 센티넬을 캐시(다음 호출에서 재탐색 방지).</li>
     * </ul>
     *
     * @param type 검사할 엔티티 클래스
     * @return {@code siteId} {@link Field} (접근 가능 상태), 없으면 {@code null}
     */
    private Field resolveSiteIdField(Class<?> type) {
        Field cached = SITE_FIELD_CACHE.computeIfAbsent(type, t -> {
            for (Class<?> c = t; c != null && c != Object.class; c = c.getSuperclass()) {
                try {
                    Field field = c.getDeclaredField("siteId");
                    field.setAccessible(true);
                    return field;
                } catch (NoSuchFieldException ignored) {
                    // 상위 클래스 계속 탐색
                }
            }
            return NONE;
        });
        return cached == NONE ? null : cached;
    }

    /**
     * 현재 요청의 인증 사용자 식별자(authId)를 반환한다.
     *
     * <p>{@link SecurityUtil#getAuthUser()} 는 미인증 시 빈 authId 를 가진 더미 principal 을
     * 돌려주므로(예외 아님), 빈 문자열을 {@code null} 로 정규화해 호출 측이
     * "감사자 덮어쓸지 여부"를 {@code != null} 한 번으로 판단하게 한다.</p>
     *
     * @return 로그인 사용자 ID, 비인증/시스템/배치 컨텍스트면 {@code null}
     */
    private String currentAuthId() {
        String id = SecurityUtil.getAuthUser().authId();
        return (id == null || id.isEmpty()) ? null : id;
    }
}
