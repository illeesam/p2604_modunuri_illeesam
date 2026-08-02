package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPopupDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopupItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupPickQueryRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupPickQueryRepository.ForcedCond;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupPickQueryRepository.PickRows;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
 * <p>역할 분리: 이 클래스는 <b>정책</b>만 다룬다 — 사용 시스템 범위(BO/FO) 검증, 세션값 해석,
 * 필수 조회조건 검증, 화면이 쓰는 응답(config/Map) 변환. 실제 <b>쿼리 조립·실행</b>은
 * {@link com.shopjoy.ecadminapi.base.ec.cm.repository.CmPopupPickQueryRepository} 가 맡는다
 * (식별자 화이트리스트 검증도 쿼리 문자열을 만드는 그쪽에 함께 있다).</p>
 *
 * <p>팝업 정의 목록({@link #getPopupPage})만은 대상이 {@code CmPopup} 하나로 고정이라
 * 표준대로 QueryDSL({@code QCmPopupRepositoryImpl})을 쓴다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPopupPickService {

    /** 페이징을 끈 팝업의 최대 표시 건수 — 실수로 수만 건을 내려받지 않도록 */
    private static final int NO_PAGING_MAX = 500;

    private final CmPopupRepository cmPopupRepository;
    private final CmPopupItemRepository cmPopupItemRepository;
    private final CmPopupPickQueryRepository cmPopupPickQueryRepository;

    /* ── 메타 조회 ─────────────────────────────────────────────── */

    /** 팝업 정의 조회 */
    public CmPopup getPopup(String popupCode, String siteId) {
        return cmPopupRepository.findByPopupCodeAndUseYn(popupCode, "Y")
            .orElseThrow(() -> new CmBizException(
                "등록되지 않은 팝업코드입니다: " + popupCode + "::" + CmUtil.svcCallerInfo(this)));
    }

    /**
     * FO 에 <b>조건 없이</b> 공개해도 되는 엔티티 화이트리스트 (공개 카탈로그).
     *
     * <p>{@code /api/fo/**} 는 SecurityConfig 기본 permitAll 이라 FO 경로는 비로그인으로도 열린다.
     * 그래서 FO 노출은 둘 중 하나만 허용한다 — (1) 이 목록의 공개 카탈로그,
     * (2) 항목에 {@code session_cond_field} 가 있어 로그인 본인 것만 나오는 팝업.</p>
     *
     * <p>{@code sys_scope} 는 관리자가 팝업관리 화면에서 바꿀 수 있으므로 그 값만 믿지 않는다.
     * 회원·주문처럼 개인정보/거래정보 엔티티는 실수로 {@code ^FO^} 가 켜져도 여기서 막힌다.</p>
     */
    private static final Set<String> FO_ALLOWED_ENTITIES = Set.of(
        "PdProd", "PdCategory", "SyBrand", "SyBbm", "PdTag"
    );

    /**
     * 사용 시스템 범위 + FO 노출 조건 검증.
     *
     * @param sys "BO" 또는 "FO"
     */
    public void assertSysScope(CmPopup pop, List<CmPopupItem> items, String sys) {
        String scope = pop.getSysScope() == null ? "^BO^" : pop.getSysScope();
        if (!scope.contains("^" + sys + "^")) {
            throw new CmBizException(sys + " 에서 사용할 수 없는 팝업입니다: " + pop.getPopupCode()
                + "::" + CmUtil.svcCallerInfo(this));
        }
        /* FO 로 내보낼 수 있는 것은 둘 중 하나뿐이다.
             (1) 공개 카탈로그 엔티티          — 누구나 봐도 되는 것
             (2) 필수 세션값 항목이 있는 팝업  — 로그인 본인 것만 나오도록 서버가 강제
           그 외는 sys_scope 가 켜져 있어도 거절한다. */
        if ("FO".equals(sys) && !hasSessionScope(items)) {
            for (String e : new String[] { pop.getEntityNm(), pop.getTreeEntityNm() }) {
                if (e != null && !e.isBlank() && !FO_ALLOWED_ENTITIES.contains(e)) {
                    throw new CmBizException("FO 에 공개할 수 없는 대상입니다: " + pop.getPopupCode()
                        + "(" + e + ") — 공개 카탈로그가 아니면 항목에 session_cond_field 로 소유자를 한정해야 합니다"
                        + "::" + CmUtil.svcCallerInfo(this));
                }
            }
        }
    }

    /** 세션값으로 소유자를 한정한 항목이 하나라도 있는가 (FO 노출 허용 조건 2) */
    private boolean hasSessionScope(List<CmPopupItem> items) {
        if (items == null) return false;
        return items.stream().anyMatch(i -> i.getSessionCondField() != null && !i.getSessionCondField().isBlank());
    }

    /**
     * 로그인 정보(AuthPrincipal)에서 지정 속성값을 꺼낸다.
     *
     * <p>{@code authId} 는 일부러 뺐다 — BO 는 관리자ID, FO 는 회원ID 로 값이 갈려
     * 같은 팝업을 양쪽에서 쓰면 조용히 다른 대상을 필터한다.
     * {@code userId} / {@code memberId} 로 명시하게 해서 그 실수를 드러낸다.</p>
     */
    private String fnSessionValue(String attr, String popupCode) {
        AuthPrincipal a = SecurityUtil.getAuthUser();
        return switch (attr) {
            case "memberId"    -> a.memberId();
            case "userId"      -> a.userId();
            case "vendorId"    -> a.vendorId();
            case "deptId"      -> a.deptId();
            case "siteId"      -> a.siteId();
            case "roleId"      -> a.roleId();
            case "memberGrade" -> a.memberGrade();
            default -> throw new CmBizException("허용되지 않는 session_cond_field 입니다: " + attr
                + " (" + popupCode + ") — 허용: " + String.join(", ", SESSION_ATTRS)
                + "::" + CmUtil.svcCallerInfo(this));
        };
    }

    /** session_cond_field 로 쓸 수 있는 로그인 정보 속성 (authId 제외 — 위 fnSessionValue 주석 참조) */
    public static final Set<String> SESSION_ATTRS = Set.of(
        "memberId", "userId", "vendorId", "deptId", "siteId", "roleId", "memberGrade"
    );

    public List<CmPopupItem> getPopupItems(String popupId) {
        return cmPopupItemRepository.findByPopupIdAndUseYnOrderBySortOrdAsc(popupId, "Y");
    }

    /**
     * 팝업 구성(정의 + 항목) 반환 — 프론트가 이 값만으로 조회영역·목록컬럼을 자동 구성한다.
     */
    public Map<String, Object> getConfig(String popupCode, String siteId) {
        return getConfig(popupCode, siteId, "BO");
    }

    public Map<String, Object> getConfig(String popupCode, String siteId, String sys) {
        CmPopup p = getPopup(popupCode, siteId);
        List<CmPopupItem> items = getPopupItems(p.getPopupId());
        assertSysScope(p, items, sys);
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
        out.put("sysScope", p.getSysScope() == null ? "^BO^" : p.getSysScope());
        /* 서버가 강제하는 세션 조건 (프론트 안내·미리보기 표시용) */
        out.put("sessionCondFields", items.stream()
            .filter(i -> i.getSessionCondField() != null && !i.getSessionCondField().isBlank())
            .map(CmPopupItem::getSessionCondField).toList());
        out.put("crossTree", isCrossTree(p));   /* 트리와 목록이 다른 엔티티인지 (프론트 안내용) */

        List<Map<String, Object>> searchCols = new ArrayList<>();
        List<Map<String, Object>> listCols = new ArrayList<>();
        for (CmPopupItem it : items) {
            /* 세션 자동값 항목은 사용자 입력란이 아니므로 조회영역에 내보내지 않는다 */
            boolean sessionAuto = it.getSessionCondField() != null && !it.getSessionCondField().isBlank();
            if ("Y".equals(it.getSearchYn()) && !sessionAuto) searchCols.add(itemToMap(it));
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
        m.put("required", "Y".equals(it.getRequiredYn()));
        m.put("joined", it.getSelectExpr() != null && !it.getSelectExpr().isBlank());   /* 조인 컬럼 여부 */   /* 프론트: 라벨 * + 미입력 시 조회 차단 */
        return m;
    }

    /* ── 팝업 정의 목록 (팝업관리 화면용, 서버 페이징) ─────────── */

    /**
     * 팝업관리 화면의 목록. 정의가 늘어나면 한 화면을 넘기므로 서버에서 페이징한다.
     *
     * <p>대상이 {@code CmPopup} 하나로 고정이라 표준대로 QueryDSL
     * ({@code QCmPopupRepositoryImpl#selectPageData})에 맡긴다.
     * 런타임에 엔티티가 정해지는 {@link #getPage} 계열과 성격이 다르다.</p>
     */
    public BasePage<CmPopup> getPopupPage(CmPopupDto.Request search) {
        return cmPopupRepository.selectPageData(search);
    }

    /* ── 목록 조회 (패턴 1·2 공통) ──────────────────────────────── */

    /**
     * @param p siteId / searchValue / 필드별 검색값 / parentId / excludeIds(^구분) / pageNo / pageSize
     */
    public PageResult<Map<String, Object>> getPage(String popupCode, Map<String, Object> p) {
        return getPage(popupCode, p, "BO");
    }

    public PageResult<Map<String, Object>> getPage(String popupCode, Map<String, Object> p, String sys) {
        CmPopup pop = getPopup(popupCode, str(p.get("siteId")));
        List<CmPopupItem> items = getPopupItems(pop.getPopupId());
        assertSysScope(pop, items, sys);
        assertRequiredParams(items, p);

        /* paging_yn = 'N' 이면 페이저 없이 한 번에 보여준다.
           그래도 무제한은 위험하므로 page_size(=최대 표시 건수)로 상한을 둔다. */
        boolean paging = !"N".equals(pop.getPagingYn());
        int defSize = pop.getPageSize() == null ? (paging ? 10 : NO_PAGING_MAX) : pop.getPageSize();
        int pageNo   = paging ? intOf(p.get("pageNo"), 1) : 1;
        int pageSize = paging ? intOf(p.get("pageSize"), defSize) : Math.min(defSize, NO_PAGING_MAX);

        PickRows res = cmPopupPickQueryRepository.selectPickPage(
            pop, items, p, sessionConds(pop, items), pageNo, pageSize);

        List<Map<String, Object>> list = new ArrayList<>();
        for (Object row : res.rows()) {
            Object ent = row;
            Map<String, Object> joined = new LinkedHashMap<>();
            if (!res.extras().isEmpty()) {
                Object[] tuple = (Object[]) row;
                ent = tuple[0];
                for (int i = 0; i < res.extras().size(); i++) joined.put(res.extras().get(i).getFieldNm(), tuple[i + 1]);
            }
            list.add(rowToMap(ent, pop, items, joined));
        }
        return PageResult.of(list, res.total(), pageNo, pageSize, p);
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
        return getTree(popupCode, p, "BO");
    }

    public List<Map<String, Object>> getTree(String popupCode, Map<String, Object> p, String sys) {
        CmPopup pop = getPopup(popupCode, str(p.get("siteId")));
        List<CmPopupItem> items = getPopupItems(pop.getPopupId());
        assertSysScope(pop, items, sys);
        if (pop.getParentField() == null || pop.getParentField().isBlank())
            throw new CmBizException("트리를 지원하지 않는 팝업입니다: " + popupCode
                + "::" + CmUtil.svcCallerInfo(this));

        boolean cross   = isCrossTree(pop);
        String idField  = treeIdField(pop);
        String nmField  = treeNmField(pop);
        /* 교차 트리는 항목 메타가 목록 엔티티 기준이라 세션 조건도 적용할 수 없다 */
        List<ForcedCond> forced = cross ? List.of() : sessionConds(pop, items);

        List<?> rows = cmPopupPickQueryRepository.selectTreeList(
            pop, items, p, forced, cross,
            cross ? pop.getTreeEntityNm() : pop.getEntityNm(), nmField);

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

    /* ── 조회 조건 정책 ────────────────────────────────────────── */

    /**
     * 세션값으로 소유자를 한정하는 강제조건 목록을 만든다.
     *
     * <p>{@code session_cond_field} 가 있는 항목은 사용자 입력란이 아니라 <b>서버 강제 조건</b>이므로
     * {@code search_yn} 과 무관하게 항상 적용한다. 값 자체는 로그인 정보에서만 꺼내므로
     * 클라이언트가 같은 이름의 파라미터를 보내도 조작할 수 없다.</p>
     */
    private List<ForcedCond> sessionConds(CmPopup pop, List<CmPopupItem> items) {
        List<ForcedCond> out = new ArrayList<>();
        for (CmPopupItem it : items) {
            String attr = it.getSessionCondField();
            if (attr == null || attr.isBlank()) continue;
            String v = fnSessionValue(attr.trim(), pop.getPopupCode());
            if (v == null || v.isBlank()) {
                /* 미로그인과 "로그인했지만 그 속성이 없음"(예: 부서 미배정 관리자)을 구분해 안내한다 */
                String msg = SecurityUtil.isLogin()
                    ? "로그인 정보에 " + it.getFieldLabel() + " 값이 없어 조회할 수 없습니다: " + pop.getPopupCode()
                      + " (" + attr.trim() + ")"
                    : "로그인이 필요한 팝업입니다: " + pop.getPopupCode() + " (" + it.getFieldLabel() + ")";
                throw new CmBizException(msg + "::" + CmUtil.svcCallerInfo(this));
            }
            out.add(new ForcedCond(it.getFieldNm(), v));
        }
        return out;
    }

    /** 필수 조회조건 검증 — 사용자가 넣어야 하는 항목만 (세션 자동값은 위 sessionConds 가 채운다) */
    private void assertRequiredParams(List<CmPopupItem> items, Map<String, Object> p) {
        for (CmPopupItem it : items) {
            if (!"Y".equals(it.getRequiredYn())) continue;
            if (it.getSessionCondField() != null && !it.getSessionCondField().isBlank()) continue;
            if (str(p.get(it.getFieldNm())) != null) continue;
            throw new CmBizException("조회 조건이 필요합니다: " + it.getFieldLabel()
                + "::" + CmUtil.svcCallerInfo(this));
        }
    }

    /* ── 응답 변환 ─────────────────────────────────────────────── */

    /** 엔티티 → { id, nm, parentId?, <표시필드들> } 맵 (리플렉션 getter). joined = 조인으로 가져온 값 */
    private Map<String, Object> rowToMap(Object row, CmPopup pop, List<CmPopupItem> items,
                                         Map<String, Object> joined) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (joined != null) m.putAll(joined);   /* 조인 컬럼 먼저 — 아래 putIfAbsent 가 덮지 않도록 */
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
