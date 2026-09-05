package com.shopjoy.ecBeBo.base.ec.pd.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdCategoryRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdCategoryService {

    private final PdCategoryRepository pdCategoryRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 카테고리 키조회 */
    public PdCategoryDto.Item getById(String id) {
        // [QueryDSL] 카테고리 단건 조회
        PdCategoryDto.Item dto = pdCategoryRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategoryDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 카테고리 단건 조회
        return pdCategoryRepository.selectById(id).orElse(null);
    }

    /* 상품 카테고리 상세조회 */
    public PdCategory findById(String id) {
        // [쿼리 메서드] 카테고리 단건 조회
        return pdCategoryRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategory findByIdOrNull(String id) {
        // [쿼리 메서드] 카테고리 단건 조회
        return pdCategoryRepository.findById(id).orElse(null);
    }

    /* 상품 카테고리 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 카테고리 존재 여부 확인
        return pdCategoryRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 카테고리 존재 여부 확인
        if (!pdCategoryRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 카테고리 목록조회 */
    public List<PdCategoryDto.Item> getList(PdCategoryDto.Request req) {
        // [QueryDSL] 카테고리 목록 조회
        return pdCategoryRepository.selectList(req);
    }

    /* 상품 카테고리 페이지조회 */
    public BasePage<PdCategoryDto.Item> getPageData(PdCategoryDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 카테고리 페이지 조회
        return pdCategoryRepository.selectPageData(req);
    }

    /* 상품 카테고리 등록 */
    @Transactional
    public PdCategory create(PdCategory body) {
        body.setCategoryId(CmUtil.generateId("pd_category"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 카테고리 저장
        PdCategory saved = pdCategoryRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 카테고리 수정 */
    @Transactional
    public PdCategory update(String id, PdCategory body) {
        CmUtil.requireId(id, "id", this);
        PdCategory entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "categoryId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 카테고리 저장
        PdCategory saved = pdCategoryRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 카테고리 수정 */
    @Transactional
    public PdCategory updateSelective(PdCategory entity) {
        if (entity.getCategoryId() == null) throw new CmBizException("categoryId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCategoryId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 카테고리 선택적 필드 수정
        int affected = pdCategoryRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 상품 카테고리 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdCategory entity = findById(id);
        // [쿼리 메서드] 카테고리 삭제
        pdCategoryRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** saveOneBase -- rowStatus(I/U/D/M) 단건 분기 처리. saveListBase의 단건 버전. */
    @Transactional
    public PdCategory saveOneBase(PdCategory entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getCategoryId());

        if ("D".equals(rowStatus)) {
            if (entity.getCategoryId() == null)
                throw new CmBizException("삭제 대상 categoryId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 카테고리 존재 여부 확인
            if (!pdCategoryRepository.existsById(entity.getCategoryId()))
                throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 카테고리 ID 기준 삭제
            pdCategoryRepository.deleteById(entity.getCategoryId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setCategoryId(CmUtil.generateId("pd_category"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 카테고리 저장
            PdCategory saved = pdCategoryRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getCategoryId() == null)
                throw new CmBizException("수정 대상 categoryId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 카테고리 선택적 필드 수정
            int affected = pdCategoryRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getCategoryId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveListBase -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별). */
    @Transactional
    public void saveListBase(List<PdCategory> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdCategory row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getCategoryId() == null || row.getCategoryId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdCategory::getCategoryId, "U", "categoryId", this);
        CmUtil.requireRowIds(rows, PdCategory::getCategoryId, "D", "categoryId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdCategory::getCategoryId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 카테고리 조건별 삭제
            pdCategoryRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdCategory> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdCategory row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 카테고리 선택적 필드 수정
            int affected = pdCategoryRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdCategory> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdCategory row : insertRows) {
            row.setCategoryId(CmUtil.generateId("pd_category"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 카테고리 저장
            pdCategoryRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
    }

    /** saveListOrder -- 행 드래그앤드롭 정렬 변경 시 sortOrd 만 일괄 UPDATE.
     *   - 입력 row 는 categoryId + sortOrd 만 필수 (다른 필드는 무시)
     *   - rowStatus 검증 없음 — 호출자가 변경된 행만 보내야 함
     *   - updateSelective 가 null 필드를 건드리지 않으므로 안전 */
    @Transactional
    public void saveListOrder(List<PdCategory> rows) {
        CmUtil.requireRowIds(rows, PdCategory::getCategoryId, "U", "categoryId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        for (PdCategory row : rows) {
            if (row.getSortOrd() == null) continue;   // sortOrd 없으면 skip
            /* updBy 는 수동 세팅 — updateSelective(JPAUpdateClause) 는 @PreUpdate 리스너를 타지 않는다 */
            PdCategory patch = PdCategory.builder()
                .categoryId(row.getCategoryId())
                .sortOrd(row.getSortOrd())
                .updBy(authId)
                .build();
            // [QueryDSL] 카테고리 선택적 필드 수정
            int affected = pdCategoryRepository.updateSelective(patch);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
        }
        em.flush();
        em.clear();
    }
}
