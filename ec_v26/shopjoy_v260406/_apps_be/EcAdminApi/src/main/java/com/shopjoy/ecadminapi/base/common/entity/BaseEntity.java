package com.shopjoy.ecadminapi.base.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

/**
 * 전 도메인 엔티티의 공통 상위 클래스 — 감사(audit) 컬럼 4종을 제공한다.
 *
 * <p>{@link MappedSuperclass} 이므로 자체 테이블은 없고, 이 클래스를 상속한 엔티티의
 * 테이블에 {@code reg_by / reg_date / upd_by / upd_date} 컬럼으로 매핑된다.</p>
 *
 * <p><b>감사 컬럼 자동 주입</b>: {@link EntityListeners}로 {@link EntitySaveListener}를
 * 부착해 INSERT/UPDATE 시점에 등록자·등록일·수정자·수정일과 (필드가 있으면) {@code site_id}
 * 를 서버 권한으로 강제 채운다. 따라서 서비스 코드에서 이 값들을 수동으로 set 하지 않아도
 * 되며, 수동으로 넣더라도 리스너가 최종 덮어쓰므로 정책이 일관 보장된다.
 * MyBatis 경로는 리스너를 타지 않아 {@code MyBatisSaveMetaInterceptor}가 동일 처리를 한다.</p>
 *
 * <p>Lombok: {@link Getter}/{@link Setter}로 접근자 자동 생성, {@link SuperBuilder}로
 * 자식 엔티티의 빌더가 부모 필드까지 포함하도록 하며, {@link NoArgsConstructor}는
 * JPA 가 요구하는 기본 생성자를 제공한다.</p>
 *
 * @see EntitySaveListener 저장 시 site_id·감사 자동 주입 로직
 */
@MappedSuperclass
@EntityListeners(EntitySaveListener.class)   // 저장(INSERT/UPDATE) 시 site_id(sy.57 §3.1) + 감사컬럼(reg/upd) 서버 강제 주입
@Getter @Setter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseEntity {

    /**
     * 행 상태 플래그 — {@code I}(insert) / {@code U}(update) / {@code D}(delete).
     *
     * <p>{@link Transient} 이므로 DB 컬럼이 아니다. 한 번의 요청으로 여러 행을 일괄
     * 저장/수정/삭제하는 {@code saveList} 류 API 에서, 클라이언트가 각 행의 처리 의도를
     * 표시하면 서비스가 이 값을 보고 분기 처리하는 용도로만 쓰인다(영속 대상 아님).</p>
     */
    @Transient
    private String rowStatus;   // I/U/D — DB 저장 안 함, saveList 용도

    /**
     * 등록자 — 행을 최초 생성한 사용자 식별자(authId: BO=user_id, FO=member_id).
     * INSERT 시 {@link EntitySaveListener}가 인증 컨텍스트로 채우며 이후 변경하지 않는다.
     */
    @Comment("등록자")
    @Column(name = "reg_by", length = 30)
    private String regBy;

    /**
     * 등록일 — 행 최초 생성 시각. INSERT 시 서버 시각으로 세팅되고 이후 불변.
     */
    @Comment("등록일")
    @Column(name = "reg_date")
    private LocalDateTime regDate;

    /**
     * 수정자 — 행을 마지막으로 변경한 사용자 식별자. INSERT 시 등록자와 동일하게
     * 초기화되고, 매 UPDATE 마다 현재 사용자로 갱신된다.
     */
    @Comment("수정자")
    @Column(name = "upd_by", length = 30)
    private String updBy;

    /**
     * 수정일 — 행을 마지막으로 변경한 시각. INSERT/UPDATE 시 항상 서버 시각으로 갱신.
     */
    @Comment("수정일")
    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
