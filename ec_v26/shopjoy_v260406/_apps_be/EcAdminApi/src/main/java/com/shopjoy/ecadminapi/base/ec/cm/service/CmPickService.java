package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 공통 선택(Pick) 팝업 조회 서비스 — cm_popup / cm_popup_item 메타 기반.
 *
 * <p>BO 전 화면의 선택 팝업(사용자·부서·상품·쿠폰 …)을 팝업코드 하나로 통합한다.
 * 조회 대상 엔티티와 필드 속성(조회항목/목록항목/트리라벨)은 테이블 메타로 관리하므로
 * <b>타입별 DTO·Repository·Controller 가 필요 없다</b> — JPQL 을 동적 생성해 조회한다.</p>
 *
 * <p>패턴:
 * <ul>
 *   <li>1) 조회 + 목록          → {@link #getPage}</li>
 *   <li>2) 조회 + 트리 + 목록   → {@link #getTree} + {@link #getPage}</li>
 *   <li>3) 2) + 선택목록        → 프론트에서 선택 누적 (추가 API 불필요)</li>
 * </ul>
 *
 * <p>보안: entity_nm / 필드명은 메타 테이블에서만 오고, 사용 전 식별자 화이트리스트
 * 검증({@link #IDENT})을 거치므로 JPQL 인젝션 위험이 없다. 값 바인딩은 전부 named parameter.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPickService {

    /** JPQL 식별자 허용 패턴 — 메타 값이 오염돼도 임의 구문 주입 차단 */
    private static final Pattern IDENT = Pattern.compile("^[A-Za-z][A-Za-z0-9_.]*$");
    /** ORDER BY / base_where 허용 패턴 (필드·연산·리터럴만) */
    private static final Pattern SAFE_CLAUSE = Pattern.compile("^[A-Za-z0-9_.,'= ()<>!]*$");
    /** 페이징을 끈 팝업의 최대 표시 건수 — 실수로 수만 건을 내려받지 않도록 */
    private static final int NO_PAGING_MAX = 500;

    private final CmPopupRepository cmPopupRepository;
    private final CmPopupItemRepository cmPopupItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 메타 조회 ─────────────────────────────────────────────── */

    /** 팝업 정의 조회 (siteId 우선, 없으면 전역) */
    public CmPopup getPopup(String popupCode, String siteId) {
        return cmPopupRepository.findBySiteIdAndPopupCodeAndUseYn(siteId, popupCode, "Y")
            .or(() -> cmPopupRepository.findByPopupCodeAndUseYn(popupCode, "Y"))
            .orElseThrow(() -> new CmBizException(
                "등록되지 않은 팝업코드입니다: " + popupCode + "::" + CmUtil.svcCallerInfo(this)));
    }

    public List<CmPopupItem> getPopupItems(String popupId) {
        return cmPopupItemRepository.findByPopupIdAndUseYnOrderBySortOrdAsc(popupId, "Y");
    }

    /**
     * 팝업 구성(정의 + 항목) 반환 — 프론트가 이 값만으로 조회영역·목록컬럼을 자동 구성한다.
     */
    public Map<String, Object> getConfig(String popupCode, String siteId) {
        CmPopup p = getPopup(popupCode, siteId);
        List<CmPopupItem> items = getPopupItems(p.getPopupId());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("popupCode", p.getPopupCode());
        out.put("popupNm", p.getPopupNm());
        out.put("popupPattern", p.getPopupPattern() == null ? 1 : p.getPopupPattern());
        out.put("multiYn", p.getMultiYn() == null ? "N" : p.getMultiYn());
        out.put("pagingYn", p.getPagingYn() == null ? "Y" : p.getPagingYn());
        out.put("pageSize", p.getPageSize() == null ? 10 : p.getPageSize());
        out.put("modalWidth", p.getModalWidth() == null ? "900px" : p.getModalWidth());
        out.put("idField", p.getIdField());
        out.put("nmField", p.getNmField());
        out.put("hasTree", p.getParentField() != null && !p.getParentField().isBlank());
        out.put("crossTree", isCrossTree(p));   /* 트리와 목록이 다른 엔티티인지 (프론트 안내용) */

        List<Map<String, Object>> searchCols = new ArrayList<>();
        List<Map<String, Object>> listCols = new ArrayList<>();
        for (CmPopupItem it : items) {
            if ("Y".equals(it.getSearchYn())) searchCols.add(itemToMap(it));
            if ("Y".equals(it.getListYn()))   listCols.add(itemToMap(it));
        }
        out.put("searchCols", searchCols);
        out.put("listCols", listCols);
        return out;
    }

    private Map<String, Object> itemToMap(CmPopupItem it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("field", it.getFieldNm());
        m.put("label", it.getFieldLabel());
        m.put("type", it.getFieldTypeCd() == null ? "TEXT" : it.getFieldTypeCd());
        m.put("codeGrp", it.getCodeGrp());
        m.put("searchType", it.getSearchTypeCd() == null ? "LIKE" : it.getSearchTypeCd());
        m.put("width", it.getColWidth());
        m.put("align", it.getColAlign());
        m.put("link", "Y".equals(it.getLinkYn()));
        m.put("treeLabel", "Y".equals(it.getTreeLabelYn()));
        return m;
    }

    /* ── 팝업 정의 목록 (팝업관리 화면용, 서버 페이징) ─────────── */

    /**
     * 팝업관리 화면의 목록. 정의가 늘어나면 한 화면을 넘기므로 서버에서 페이징한다.
     *
     * @param p siteId / searchValue(팝업명·코드·엔티티명) / popupPattern / pageNo / pageSize
     */
    public PageResult<CmPopup> getPopupPage(Map<String, Object> p) {
        StringBuilder w = new StringBuilder(" WHERE 1=1 ");
        Map<String, Object> binds = new LinkedHashMap<>();

        if (str(p.get("siteId")) != null) {
            w.append(" AND e.siteId = :siteId ");
            binds.put("siteId", str(p.get("siteId")));
        }
        String kw = str(p.get("searchValue"));
        if (kw != null) {
            w.append(" AND ( LOWER(e.popupNm) LIKE :kw OR LOWER(e.popupCode) LIKE :kw ")
             .append(" OR LOWER(e.entityNm) LIKE :kw ) ");
            binds.put("kw", "%" + kw.toLowerCase() + "%");
        }
        String pattern = str(p.get("popupPattern"));
        if (pattern != null) {
            w.append(" AND e.popupPattern = :pattern ");
            binds.put("pattern", Integer.valueOf(pattern));
        }
        String useYn = str(p.get("useYn"));
        if (useYn != null) {
            w.append(" AND e.useYn = :useYn ");
            binds.put("useYn", useYn);
        }

        int pageNo   = intOf(p.get("pageNo"), 1);
        int pageSize = intOf(p.get("pageSize"), 10);

        Query cntQ = em.createQuery("SELECT COUNT(e) FROM CmPopup e " + w);
        binds.forEach(cntQ::setParameter);
        long total = ((Number) cntQ.getSingleResult()).longValue();

        Query listQ = em.createQuery("SELECT e FROM CmPopup e " + w + " ORDER BY e.sortOrd ASC, e.popupCode ASC ");
        binds.forEach(listQ::setParameter);
        listQ.setFirstResult((pageNo - 1) * pageSize);
        listQ.setMaxResults(pageSize);

        @SuppressWarnings("unchecked")
        List<CmPopup> rows = (List<CmPopup>) listQ.getResultList();
        return PageResult.of(rows, total, pageNo, pageSize, p);
    }

    /* ── 목록 조회 (패턴 1·2 공통) ──────────────────────────────── */

    /**
     * @param p siteId / searchValue / 필드별 검색값 / parentId / excludeIds(^구분) / pageNo / pageSize
     */
    public PageResult<Map<String, Object>> getPage(String popupCode, Map<String, Object> p) {
        CmPopup pop = getPopup(popupCode, str(p.get("siteId")));
        List<CmPopupItem> items = getPopupItems(pop.getPopupId());

        /* paging_yn = 'N' 이면 페이저 없이 한 번에 보여준다.
           그래도 무제한은 위험하므로 page_size(=최대 표시 건수, 기본 200)로 상한을 둔다. */
        boolean paging = !"N".equals(pop.getPagingYn());
        int defSize = pop.getPageSize() == null ? (paging ? 10 : NO_PAGING_MAX) : pop.getPageSize();
        int pageNo   = paging ? intOf(p.get("pageNo"), 1) : 1;
        int pageSize = paging ? intOf(p.get("pageSize"), defSize) : Math.min(defSize, NO_PAGING_MAX);

        Map<String, Object> binds = new LinkedHashMap<>();
        String where = buildWhere(pop, items, p, binds);

        String entity = ident(pop.getEntityNm(), "entity_nm");
        String cntJpql = "SELECT COUNT(e) FROM " + entity + " e " + where;
        Query cntQ = em.createQuery(cntJpql);
        binds.forEach(cntQ::setParameter);
        long total = ((Number) cntQ.getSingleResult()).longValue();

        String selJpql = "SELECT e FROM " + entity + " e " + where + buildOrderBy(pop);
        Query listQ = em.createQuery(selJpql);
        binds.forEach(listQ::setParameter);
        listQ.setFirstResult((pageNo - 1) * pageSize);
        listQ.setMaxResults(pageSize);

        List<?> rows = listQ.getResultList();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object row : rows) list.add(rowToMap(row, pop, items));

        return PageResult.of(list, total, pageNo, pageSize, p);
    }

    /* ── 트리 조회 (패턴 2·3 좌측 트리) ────────────────────────── */

    /**
     * 전체 노드를 평면 목록으로 반환 (계층 구성은 프론트). parent_field 가 있는 팝업만 지원.
     *
     * <p>트리 엔티티가 목록 엔티티와 다르면(카테고리 트리 + 상품 목록) 트리 엔티티를 조회한다.
     * 이때 항목 메타(cm_popup_item)는 목록 엔티티 기준이라 트리에 적용할 수 없으므로
     * id/nm/parentId 세 값만 담아 내려보낸다 — 트리는 그 이상이 필요 없다.</p>
     */
    public List<Map<String, Object>> getTree(String popupCode, Map<String, Object> p) {
        CmPopup pop = getPopup(popupCode, str(p.get("siteId")));
        if (pop.getParentField() == null || pop.getParentField().isBlank())
            throw new CmBizException("트리를 지원하지 않는 팝업입니다: " + popupCode
                + "::" + CmUtil.svcCallerInfo(this));

        String entity   = isCrossTree(pop) ? pop.getTreeEntityNm() : pop.getEntityNm();
        String idField  = treeIdField(pop);
        String nmField  = treeNmField(pop);
        Map<String, Object> binds = new LinkedHashMap<>();
        String where;

        if (isCrossTree(pop)) {
            /* 교차 트리는 항목 메타·base_where 가 목록 엔티티 기준이라 트리에 쓸 수 없다.
               사이트 격리만 적용한다. */
            where = " WHERE 1=1 ";
            if (pop.getSiteField() != null && !pop.getSiteField().isBlank() && str(p.get("siteId")) != null) {
                where += " AND e." + ident(pop.getSiteField(), "site_field") + " = :siteId ";
                binds.put("siteId", str(p.get("siteId")));
            }
        } else {
            /* 같은 엔티티 트리는 목록과 조건이 같아야 한다.
               특히 호출부가 고정 필터를 주는 경우(표시경로의 bizCd 등) 트리도 같이 좁혀야
               엉뚱한 업무의 노드까지 보이지 않는다. 통합검색어와 선택 관련 조건만 뺀다. */
            Map<String, Object> treeParam = new LinkedHashMap<>(p);
            treeParam.remove("searchValue");
            treeParam.remove("idIn");
            treeParam.remove("parentId");
            treeParam.remove("excludeIds");
            where = buildWhere(pop, getPopupItems(pop.getPopupId()), treeParam, binds);
        }

        String jpql = "SELECT e FROM " + ident(entity, "tree_entity_nm") + " e " + where
            + " ORDER BY e." + ident(nmField, "tree_nm_field") + " ASC ";
        Query q = em.createQuery(jpql);
        binds.forEach(q::setParameter);

        List<?> rows = q.getResultList();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            Object idVal = readField(row, idField);
            Object nmVal = readField(row, nmField);
            m.put("id", idVal);
            m.put("nm", nmVal);
            /* 트리 노드도 원본 필드명으로 함께 담는다 (호출부가 row.deptId 등으로 꺼내 쓴다) */
            m.put(idField, idVal);
            m.put(nmField, nmVal);
            m.put("parentId", readField(row, pop.getParentField()));
            list.add(m);
        }
        return list;
    }

    /** 트리 엔티티가 목록 엔티티와 다른가 (예: 카테고리 트리 + 상품 목록) */
    private boolean isCrossTree(CmPopup pop) {
        return pop.getTreeEntityNm() != null && !pop.getTreeEntityNm().isBlank()
            && !pop.getTreeEntityNm().equals(pop.getEntityNm());
    }

    private String treeIdField(CmPopup pop) {
        return (pop.getTreeIdField() != null && !pop.getTreeIdField().isBlank())
            ? pop.getTreeIdField() : pop.getIdField();
    }

    private String treeNmField(CmPopup pop) {
        return (pop.getTreeNmField() != null && !pop.getTreeNmField().isBlank())
            ? pop.getTreeNmField() : pop.getNmField();
    }

    /* ── 내부 헬퍼 ─────────────────────────────────────────────── */

    /** WHERE 절 생성 — base_where + 사이트격리 + 통합검색 + 필드별검색 + 부모필터 + 제외ID */
    private String buildWhere(CmPopup pop, List<CmPopupItem> items,
                              Map<String, Object> p, Map<String, Object> binds) {
        StringBuilder w = new StringBuilder(" WHERE 1=1 ");

        if (pop.getBaseWhere() != null && !pop.getBaseWhere().isBlank()) {
            String bw = pop.getBaseWhere().trim();
            if (!SAFE_CLAUSE.matcher(bw).matches())
                throw new CmBizException("허용되지 않는 base_where 입니다: " + bw);
            w.append(" AND (").append(bw).append(") ");
        }
        if (pop.getSiteField() != null && !pop.getSiteField().isBlank() && str(p.get("siteId")) != null) {
            w.append(" AND e.").append(ident(pop.getSiteField(), "site_field")).append(" = :siteId ");
            binds.put("siteId", str(p.get("siteId")));
        }
        /* 통합검색: search_yn='Y' 且 LIKE 인 항목 전체 OR */
        String kw = str(p.get("searchValue"));
        if (kw != null) {
            List<CmPopupItem> likeCols = items.stream()
                .filter(i -> "Y".equals(i.getSearchYn()))
                .filter(i -> !"RANGE".equals(i.getSearchTypeCd()))
                .toList();
            if (!likeCols.isEmpty()) {
                w.append(" AND ( ");
                for (int i = 0; i < likeCols.size(); i++) {
                    if (i > 0) w.append(" OR ");
                    String f = ident(likeCols.get(i).getFieldNm(), "field_nm");
                    w.append("LOWER(CAST(e.").append(f).append(" AS string)) LIKE :kw ");
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
                w.append(" AND e.").append(f).append(" = :").append(bind).append(" ");
                binds.put(bind, v);
            } else {
                w.append(" AND LOWER(CAST(e.").append(f).append(" AS string)) LIKE :").append(bind).append(" ");
                binds.put(bind, "%" + v.toLowerCase() + "%");
            }
        }
        /* 트리 노드 선택 → 직속 하위만 */
        if (pop.getParentField() != null && !pop.getParentField().isBlank()
            && str(p.get("parentId")) != null) {
            w.append(" AND e.").append(ident(pop.getParentField(), "parent_field")).append(" = :parentId ");
            binds.put("parentId", str(p.get("parentId")));
        }
        /* 트리 노드 선택 → 노드 자신 + 하위 전체 (프론트가 서브트리 ID 를 계산해 전달).
           parentId 는 직속 하위만 걸러 리프 노드 클릭 시 0 건이 되므로 idIn 을 우선한다.
           트리가 다른 엔티티면(카테고리 트리 + 상품 목록) 목록의 연결 필드로 건다. */
        List<String> idIn = splitIds(str(p.get("idIn")));
        if (!idIn.isEmpty()) {
            String linkField = isCrossTree(pop) ? pop.getTreeLinkField() : pop.getIdField();
            w.append(" AND e.").append(ident(linkField, "tree_link_field")).append(" IN (:idIn) ");
            binds.put("idIn", idIn);
        }
        /* 이미 선택된 항목 제외 */
        List<String> excludes = splitIds(str(p.get("excludeIds")));
        if (!excludes.isEmpty()) {
            w.append(" AND e.").append(ident(pop.getIdField(), "id_field")).append(" NOT IN (:excludeIds) ");
            binds.put("excludeIds", excludes);
        }
        return w.toString();
    }

    private String buildOrderBy(CmPopup pop) {
        String ob = pop.getOrderBy();
        if (ob == null || ob.isBlank()) return " ORDER BY e." + ident(pop.getIdField(), "id_field") + " ASC ";
        if (!SAFE_CLAUSE.matcher(ob).matches())
            throw new CmBizException("허용되지 않는 order_by 입니다: " + ob);
        return " ORDER BY " + ob + " ";
    }

    /** 엔티티 → { id, nm, parentId?, <표시필드들> } 맵 (리플렉션 getter) */
    private Map<String, Object> rowToMap(Object row, CmPopup pop, List<CmPopupItem> items) {
        Map<String, Object> m = new LinkedHashMap<>();
        Object idVal = readField(row, pop.getIdField());
        Object nmVal = readField(row, pop.getNmField());
        m.put("id", idVal);
        m.put("nm", nmVal);
        /* 원본 필드명으로도 함께 담는다 — 호출부가 row.userId / row.roleNm 처럼
           엔티티 필드명으로 값을 꺼내 쓰는 코드가 많다. */
        m.put(pop.getIdField(), idVal);
        m.put(pop.getNmField(), nmVal);
        if (pop.getParentField() != null && !pop.getParentField().isBlank())
            m.put("parentId", readField(row, pop.getParentField()));
        for (CmPopupItem it : items) {
            if (!"Y".equals(it.getListYn()) && !"Y".equals(it.getTreeLabelYn())) continue;
            m.putIfAbsent(it.getFieldNm(), readField(row, it.getFieldNm()));
        }
        return m;
    }

    /** getter 리플렉션 조회 (없으면 null) */
    private Object readField(Object obj, String field) {
        if (obj == null || field == null || field.isBlank()) return null;
        String getter = "get" + Character.toUpperCase(field.charAt(0)) + field.substring(1);
        try {
            return obj.getClass().getMethod(getter).invoke(obj);
        } catch (ReflectiveOperationException e) {
            return null;
        }
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

    private int intOf(Object o, int def) {
        try { return o == null ? def : Integer.parseInt(String.valueOf(o)); }
        catch (NumberFormatException e) { return def; }
    }
}
