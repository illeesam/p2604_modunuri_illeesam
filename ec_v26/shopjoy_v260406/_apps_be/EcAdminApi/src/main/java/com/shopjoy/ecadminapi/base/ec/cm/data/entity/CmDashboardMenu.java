package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

/**
 * 사용자별 대시보드 좌측메뉴 트리.
 *
 * <p>좌측메뉴에는 대시보드가 아닌 <b>폴더 노드</b>가 들어가므로 {@code cm_dashboard} 에
 * 부모/순서를 두는 방식으로는 표현할 수 없다. 또 "메뉴에 넣는다/뺀다" 는 대시보드의 속성이
 * 아니라 <b>사용자별 메뉴 구성</b>이라 같은 대시보드를 사람마다 다르게 배치할 수 있어야 한다.</p>
 *
 * <p>노드가 하나도 없는 사용자는 좌측메뉴가 "볼 수 있는 대시보드 전체"로 폴백된다 —
 * 한 번도 설정하지 않았으면 기존과 동일하게 동작한다.</p>
 *
 * <p>{@code menuScopeCd} 로 두 가지 트리를 한 테이블에 담는다. 노드 구조와 저장 방식이
 * 완전히 같고 다른 것은 "누구의 트리인가" 하나뿐이라 테이블을 나누지 않았다.</p>
 * <ul>
 *   <li>{@code USER} — 사용자별 트리. {@code ownerUserId} 필수. 좌측 {@code 사용자 대시보드} 그룹</li>
 *   <li>{@code SYS}  — 사이트 공통 트리. {@code ownerUserId} 없음. 좌측 {@code 대시보드} 그룹</li>
 * </ul>
 */
@Entity
@Table(name = "cm_dashboard_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("사용자별 대시보드 좌측메뉴 트리 (폴더 + 대시보드 아이템)")
public class CmDashboardMenu extends BaseEntity {

    @Id
    @Comment("메뉴노드ID")
    @Column(name = "dashboard_menu_id", length = 21, nullable = false)
    private String dashboardMenuId;


    @Comment("메뉴범위 (USER:사용자별 트리 / SYS:사이트 공통 트리)")
    @Column(name = "menu_scope_cd", length = 10, nullable = false)
    private String menuScopeCd;

    @Comment("메뉴 트리 소유자 (sy_user.user_id). SYS 범위는 NULL")
    @Column(name = "owner_user_id", length = 30)
    private String ownerUserId;

    @Comment("상위 메뉴노드ID. NULL 이면 최상위")
    @Column(name = "parent_node_id", length = 21)
    private String parentNodeId;

    @Comment("노드유형 (FOLDER:폴더 / ITEM:대시보드)")
    @Column(name = "node_type_cd", length = 10, nullable = false)
    private String nodeTypeCd;

    @Comment("폴더 표시명 (ITEM 은 대시보드명을 따라감)")
    @Column(name = "node_nm", length = 100)
    private String nodeNm;

    @Comment("ITEM 이 가리키는 대시보드ID")
    @Column(name = "dashboard_id", length = 21)
    private String dashboardId;

    @Comment("같은 부모 안에서의 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    private String remark;
}
