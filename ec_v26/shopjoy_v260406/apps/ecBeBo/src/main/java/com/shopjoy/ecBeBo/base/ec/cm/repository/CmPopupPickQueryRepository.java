package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 공통 선택(Pick) 팝업의 <b>동적 JPQL 조회</b> — cm_popup / cm_popup_item 메타 기반.
 *
 * <h3>왜 QueryDSL(Q*RepositoryImpl) 이 아닌가</h3>
 * <ul>
 *   <li>Spring Data custom fragment 는 {@code XxxRepository extends JpaRepository<Entity, ID>, QXxxRepository}
 *       형태로만 붙는데, 이 조회는 <b>자기 엔티티가 없다</b>(CmPopupPick 이라는 테이블·엔티티가 없다).</li>
 *   <li>QueryDSL 은 컴파일 시점 Q타입({@code QSyUser.syUser})이 필요한데, 여기 대상 엔티티는
 *       {@code cm_popup.entity_nm} 값으로 <b>런타임에 결정</b>된다. {@code PathBuilder} 문자열 API 로
 *       우회하면 타입안전성(=QueryDSL 을 쓰는 이유)이 사라지고 아래 화이트리스트 검증은 그대로
 *       필요해서, 지금의 JPQL 조립보다 읽기 어렵고 안전하지도 않다.</li>
 * </ul>
 * <p>그래서 QueryDSL 대신 일반 동적 JPQL 로 두되, 쿼리 조립·실행은 Service 가 아니라 이 클래스가 맡는다.
 * Service 는 정책(사용범위 검증·세션값 해석·응답 변환)만 다룬다.</p>
 *
 * <h3>보안</h3>
 * <p>entity_nm·필드명은 메타 테이블에서만 오고 사용 전 식별자 화이트리스트({@link #IDENT}) 검증을
 * 거치므로 JPQL 인젝션 위험이 없다. 값 바인딩은 전부 named parameter 다.
 * 세션 강제조건({@link ForcedCond})은 Service 가 로그인 정보에서 만들어 넘기며,
 * 클라이언트가 같은 이름의 파라미터를 보내도 이 조건이 덮으므로 조작할 수 없다.</p>
 */
@Repository
public class CmPopupPickQueryRepository {

    /** JPQL 식별자 허용 패턴 — 메타 값이 오염돼도 임의 구문 주입 차단 */
    private static final Pattern IDENT = Pattern.compile("^[A-Za-z][A-Za-z0-9_.]*$");
    /** ORDER BY / base_where 허용 패턴 (필드·연산·리터럴만) */
    private static final Pattern SAFE_CLAUSE = Pattern.compile("^[A-Za-z0-9_.,'= ()<>!]*$");

    /** 드라이빙(주) 엔티티 별칭 — 전 쿼리 고정. base_where / order_by / select_expr 도 이 별칭을 쓴다 */
    public static final String A = "a";

    /**
     * join_clause 허용 패턴 — {@code LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>} 반복만.
     *
     * <p>일부러 LEFT JOIN + 단일 등가조건만 허용한다. 라벨을 끌어오는 to-one 조인이 목적이고,
     * to-many 조인을 허용하면 행이 불어나 목록 건수와 페이징이 어긋난다.
     * 별칭은 {@code a} 를 피해 b, c, d … 를 쓴다(드라이빙 별칭과 충돌 방지).</p>
     */
    private static final Pattern SAFE_JOIN = Pattern.compile(
        "^(\\s*LEFT\\s+JOIN\\s+[A-Za-z][A-Za-z0-9_]*\\s+[b-z][a-z0-9]?"
      + "\\s+ON\\s+[b-z][a-z0-9]?\\.[A-Za-z][A-Za-z0-9_]*\\s*=\\s*a\\.[A-Za-z][A-Za-z0-9_]*\\s*)+$",
        Pattern.CASE_INSENSITIVE);

    /** select_expr 허용 패턴 — {@code <별칭>.<필드>} 하나만 (함수·연산 금지) */
    private static final Pattern SELECT_EXPR = Pattern.compile("^[a-z][a-z0-9]?\\.[A-Za-z][A-Za-z0-9_]*$");

    @PersistenceContext
    private EntityManager em;

    /* ============================================================
     * 파라미터 / 결과 캐리어
     * ============================================================ */

    /**
     * 서버가 강제하는 등가조건 — 세션값으로 소유자를 한정할 때 쓴다.
     *
     * @param field 드라이빙 엔티티의 필드명 (예: memberId)
     * @param value 로그인 정보에서 꺼낸 값
     */
    public record ForcedCond(String field, String value) {}

    /**
     * 목록 조회 결과.
     *
     * @param total  전체 건수
     * @param rows   조인 컬럼이 없으면 엔티티, 있으면 {@code Object[]{엔티티, 조인값...}}
     * @param extras 조인 컬럼을 가져온 항목들 (rows 의 2번째 이후 값과 순서가 같다)
     */
    public record PickRows(long total, List<?> rows, List<CmPopupItem> extras) {}

    /* ============================================================
     * 조회 메서드 — selectPickPage / selectTreeList
     * ============================================================ */

    /**
     * 목록 조회 (패턴 1·2 공통).
     *
     * <p>드라이빙 엔티티는 그대로 SELECT 하고(호출부가 임의 필드를 꺼내 쓰므로) 조인 컬럼만 뒤에 덧붙인다.</p>
     */
    public PickRows selectPickPage(CmPopup pop, List<CmPopupItem> items, Map<String, Object> p,
                                   List<ForcedCond> forced, int pageNo, int pageSize) {
        Map<String, Object> binds = new LinkedHashMap<>();
        String where  = buildWhere(pop, items, p, forced, binds);
        String entity = ident(pop.getEntityNm(), "entity_nm");
        String join   = buildJoin(pop);                 /* LEFT JOIN 절 (없으면 "") */
        List<CmPopupItem> extras = joinedItems(items);  /* select_expr 로 조인 컬럼을 가져오는 항목들 */

        Query cntQ = em.createQuery("SELECT COUNT(" + A + ") FROM " + entity + " " + A + join + where);
        binds.forEach(cntQ::setParameter);
        long total = ((Number) cntQ.getSingleResult()).longValue();

        StringBuilder sel = new StringBuilder("SELECT " + A);
        for (CmPopupItem it : extras) sel.append(", ").append(selectExpr(it));
        Query listQ = em.createQuery(sel + " FROM " + entity + " " + A + join + where + buildOrderBy(pop));
        binds.forEach(listQ::setParameter);
        listQ.setFirstResult((pageNo - 1) * pageSize);
        listQ.setMaxResults(pageSize);

        return new PickRows(total, listQ.getResultList(), extras);
    }

    /**
     * 트리 노드 전체 조회 (패턴 2·3 좌측 트리). 계층 구성은 프론트가 한다.
     *
     * @param crossTree 트리 엔티티가 목록 엔티티와 다른가 (예: 카테고리 트리 + 상품 목록)
     */
    public List<?> selectTreeList(CmPopup pop, List<CmPopupItem> items, Map<String, Object> p,
                                  List<ForcedCond> forced, boolean crossTree,
                                  String treeEntity, String treeNmField) {
        Map<String, Object> binds = new LinkedHashMap<>();
        String where;

        if (crossTree) {
            /* 교차 트리는 항목 메타·base_where 가 목록 엔티티 기준이라 트리에 쓸 수 없다. */
            where = " WHERE 1=1 ";
        } else {
            /* 같은 엔티티 트리는 목록과 조건이 같아야 한다.
               특히 호출부가 고정 필터를 주는 경우(표시경로의 bizCd 등) 트리도 같이 좁혀야
               엉뚱한 업무의 노드까지 보이지 않는다. 통합검색어와 선택 관련 조건만 뺀다. */
            Map<String, Object> treeParam = new LinkedHashMap<>(p);
            treeParam.remove("searchValue");
            treeParam.remove("idIn");
            treeParam.remove("parentId");
            treeParam.remove("excludeIds");
            where = buildWhere(pop, items, treeParam, forced, binds);
        }

        /* 같은 엔티티 트리는 base_where 가 조인 별칭을 참조할 수 있으므로 조인 절도 함께 넣는다.
           교차 트리는 조인 절이 목록 엔티티 기준이라 쓸 수 없다(위에서 where 도 제외했다). */
        String treeJoin = crossTree ? " " : buildJoin(pop);
        String jpql = "SELECT " + A + " FROM " + ident(treeEntity, "tree_entity_nm") + " " + A + treeJoin + where
            + " ORDER BY a." + ident(treeNmField, "tree_nm_field") + " ASC ";
        Query q = em.createQuery(jpql);
        binds.forEach(q::setParameter);
        return q.getResultList();
    }

    /* ============================================================
     * WHERE / ORDER BY 조립
     * ============================================================ */

    /** WHERE 절 생성 — base_where + 세션강제 + 통합검색 + 필드별검색 + 부모필터 + 제외ID */
    private String buildWhere(CmPopup pop, List<CmPopupItem> items, Map<String, Object> p,
                              List<ForcedCond> forced, Map<String, Object> binds) {
        StringBuilder w = new StringBuilder(" WHERE 1=1 ");

        if (pop.getBaseWhere() != null && !pop.getBaseWhere().isBlank()) {
            String bw = pop.getBaseWhere().trim();
            if (!SAFE_CLAUSE.matcher(bw).matches())
                throw new CmBizException("허용되지 않는 base_where 입니다: " + bw);
            w.append(" AND (").append(bw).append(") ");
        }
        /* 세션 강제조건 — Service 가 로그인 정보에서 만들어 넘긴다.
           ★ 클라이언트가 같은 이름으로 파라미터를 보내도 여기서 덮으므로 조작할 수 없다. */
        int sseq = 0;
        if (forced != null) {
            for (ForcedCond c : forced) {
                String bind = "s" + (sseq++);
                w.append(" AND a.").append(ident(c.field(), "field_nm"))
                 .append(" = :").append(bind).append(" ");
                binds.put(bind, c.value());
            }
        }
        /* 통합검색: search_yn='Y' 且 LIKE 인 항목 전체 OR */
        String kw = str(p.get("searchValue"));
        if (kw != null) {
            /* 검색대상(searchFields) 을 주면 그 필드만 OR LIKE. 미지정이면 종전대로 LIKE 항목 전체.
               id_field / nm_field 는 cm_popup_item 에 없어도 검색대상으로 허용한다(항상 노출되는 기본 대상). */
            java.util.Set<String> allow = new java.util.LinkedHashSet<>();
            items.stream().filter(i -> "Y".equals(i.getSearchYn()))
                 .filter(i -> !"RANGE".equals(i.getSearchTypeCd()))
                 .forEach(i -> allow.add(i.getFieldNm()));
            if (pop.getIdField() != null) allow.add(pop.getIdField());
            if (pop.getNmField() != null) allow.add(pop.getNmField());

            List<String> targets = new java.util.ArrayList<>();
            for (String f : splitIds(str(p.get("searchFields")))) {
                if (allow.contains(f)) targets.add(f);      /* 화이트리스트 밖 필드는 무시 (주입 방지) */
            }
            if (targets.isEmpty()) {
                items.stream().filter(i -> "Y".equals(i.getSearchYn()))
                     .filter(i -> !"RANGE".equals(i.getSearchTypeCd()))
                     .forEach(i -> targets.add(i.getFieldNm()));
            }
            if (!targets.isEmpty()) {
                w.append(" AND ( ");
                for (int i = 0; i < targets.size(); i++) {
                    if (i > 0) w.append(" OR ");
                    String f = ident(targets.get(i), "field_nm");
                    w.append("LOWER(CAST(a.").append(f).append(" AS string)) LIKE :kw ");
                }
                w.append(" ) ");
                binds.put("kw", "%" + kw.toLowerCase() + "%");
            }
        }
        /* 필드별 검색: 파라미터에 field 명으로 값이 오면 개별 조건 적용 */
        int seq = 0;
        for (CmPopupItem it : items) {
            if (!"Y".equals(it.getSearchYn())) continue;
            String v = str(p.get(it.getFieldNm()));
            if (v == null) continue;
            String f = ident(it.getFieldNm(), "field_nm");
            String bind = "f" + (seq++);
            if ("EQ".equals(it.getSearchTypeCd())) {
                w.append(" AND a.").append(f).append(" = :").append(bind).append(" ");
                binds.put(bind, v);
            } else {
                w.append(" AND LOWER(CAST(a.").append(f).append(" AS string)) LIKE :").append(bind).append(" ");
                binds.put(bind, "%" + v.toLowerCase() + "%");
            }
        }
        /* 트리 노드 선택 → 직속 하위만 */
        if (pop.getParentField() != null && !pop.getParentField().isBlank()
            && str(p.get("parentId")) != null) {
            w.append(" AND a.").append(ident(pop.getParentField(), "parent_field")).append(" = :parentId ");
            binds.put("parentId", str(p.get("parentId")));
        }
        /* 트리 노드 선택 → 노드 자신 + 하위 전체 (프론트가 서브트리 ID 를 계산해 전달).
           parentId 는 직속 하위만 걸러 리프 노드 클릭 시 0 건이 되므로 idIn 을 우선한다.
           트리가 다른 엔티티면(카테고리 트리 + 상품 목록) 목록의 연결 필드로 건다. */
        List<String> idIn = splitIds(str(p.get("idIn")));
        if (!idIn.isEmpty()) {
            String linkField = isCrossTree(pop) ? pop.getTreeLinkField() : pop.getIdField();
            w.append(" AND a.").append(ident(linkField, "tree_link_field")).append(" IN (:idIn) ");
            binds.put("idIn", idIn);
        }
        /* 등록기간 — cm_popup.date_field 가 지정된 팝업만. 종료일은 그날 24시까지 포함한다. */
        String dField = pop.getDateField();
        if (dField != null && !dField.isBlank()) {
            String ds = str(p.get("dateStart"));
            String de = str(p.get("dateEnd"));
            String df = ident(dField, "date_field");
            if (ds != null) {
                w.append(" AND a.").append(df).append(" >= :dateStart ");
                binds.put("dateStart", java.time.LocalDate.parse(ds).atStartOfDay());
            }
            if (de != null) {
                w.append(" AND a.").append(df).append(" < :dateEnd ");
                binds.put("dateEnd", java.time.LocalDate.parse(de).plusDays(1).atStartOfDay());
            }
        }
        /* 이미 선택된 항목 제외 */
        List<String> excludes = splitIds(str(p.get("excludeIds")));
        if (!excludes.isEmpty()) {
            w.append(" AND a.").append(ident(pop.getIdField(), "id_field")).append(" NOT IN (:excludeIds) ");
            binds.put("excludeIds", excludes);
        }
        return w.toString();
    }

    private String buildOrderBy(CmPopup pop) {
        String ob = pop.getOrderBy();
        if (ob == null || ob.isBlank()) return " ORDER BY a." + ident(pop.getIdField(), "id_field") + " ASC ";
        if (!SAFE_CLAUSE.matcher(ob).matches())
            throw new CmBizException("허용되지 않는 order_by 입니다: " + ob);
        return " ORDER BY " + ob + " ";
    }

    /* ============================================================
     * 조인 / 출력식
     * ============================================================ */

    /**
     * LEFT JOIN 절을 만든다 (없으면 빈 문자열).
     *
     * <p>{@code cm_popup.join_clause} 를 그대로 쓰되 {@link #SAFE_JOIN} 으로 형태를 제한한다 —
     * {@code LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>} 반복만 허용.</p>
     *
     * <p>왜 to-one 만 허용하나: to-many 조인은 드라이빙 행이 조인 건수만큼 불어나
     * 목록 건수(COUNT)와 페이징이 어긋난다. 라벨을 끌어오는 것이 목적이므로 제한이 맞다.</p>
     */
    private String buildJoin(CmPopup pop) {
        String jc = pop.getJoinClause();
        if (jc == null || jc.isBlank()) return " ";
        String s = jc.trim();
        if (!SAFE_JOIN.matcher(s).matches()) {
            throw new CmBizException("허용되지 않는 join_clause 입니다: " + jc
                + " — 형태는 LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>"
                + "::" + CmUtil.svcCallerInfo(this));
        }
        return " " + s + " ";
    }

    /** select_expr 이 지정된 항목들 = 조인 컬럼을 별도 SELECT 로 가져올 항목들 */
    private List<CmPopupItem> joinedItems(List<CmPopupItem> items) {
        return items.stream()
            .filter(i -> i.getSelectExpr() != null && !i.getSelectExpr().isBlank())
            .toList();
    }

    /** 항목의 출력식 검증 후 반환 ({@code b.deptNm} 형태만) */
    private String selectExpr(CmPopupItem it) {
        String e = it.getSelectExpr().trim();
        if (!SELECT_EXPR.matcher(e).matches()) {
            throw new CmBizException("허용되지 않는 select_expr 입니다: " + e
                + " (" + it.getFieldNm() + ") — 형태는 <별칭>.<필드>"
                + "::" + CmUtil.svcCallerInfo(this));
        }
        return e;
    }

    /* ============================================================
     * 내부 헬퍼
     * ============================================================ */

    /** 트리 엔티티가 목록 엔티티와 다른가 (예: 카테고리 트리 + 상품 목록) */
    private boolean isCrossTree(CmPopup pop) {
        return pop.getTreeEntityNm() != null && !pop.getTreeEntityNm().isBlank()
            && !pop.getTreeEntityNm().equals(pop.getEntityNm());
    }

    /** JPQL 식별자 화이트리스트 검증 */
    private String ident(String s, String what) {
        if (s == null || !IDENT.matcher(s).matches())
            throw new CmBizException("허용되지 않는 " + what + " 입니다: " + s
                + "::" + CmUtil.svcCallerInfo(this));
        return s;
    }

    /** "^A^B^" 또는 "A,B" → [A, B] */
    private List<String> splitIds(String s) {
        List<String> out = new ArrayList<>();
        if (s == null || s.isBlank()) return out;
        for (String t : s.split("[\\^,]")) {
            String v = t.trim();
            if (!v.isEmpty()) out.add(v);
        }
        return out;
    }

    private String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() || "null".equals(s) ? null : s;
    }
}
