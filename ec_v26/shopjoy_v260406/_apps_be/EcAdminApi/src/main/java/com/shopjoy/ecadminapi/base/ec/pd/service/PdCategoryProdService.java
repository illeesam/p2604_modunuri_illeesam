package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
public class PdCategoryProdService {

    private final PdCategoryProdRepository pdCategoryProdRepository;

    @PersistenceContext
    private EntityManager em;

    /* 카테고리-상품 매핑 키조회 */
    public PdCategoryProdDto.Item getById(String id) {
        PdCategoryProdDto.Item dto = pdCategoryProdRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategoryProdDto.Item getByIdOrNull(String id) {
        return pdCategoryProdRepository.selectById(id).orElse(null);
    }

    /* 카테고리-상품 매핑 상세조회 */
    public PdCategoryProd findById(String id) {
        return pdCategoryProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategoryProd findByIdOrNull(String id) {
        return pdCategoryProdRepository.findById(id).orElse(null);
    }

    /* 카테고리-상품 매핑 키검증 */
    public boolean existsById(String id) {
        return pdCategoryProdRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdCategoryProdRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 카테고리-상품 매핑 목록조회 */
    public List<PdCategoryProdDto.Item> getList(PdCategoryProdDto.Request req) {
        return pdCategoryProdRepository.selectList(req);
    }

    /* 카테고리-상품 매핑 페이지조회 */
    public PdCategoryProdDto.PageResponse getPageData(PdCategoryProdDto.Request req) {
        PageHelper.addPaging(req);
        return pdCategoryProdRepository.selectPageList(req);
    }

    /* 카테고리-상품 매핑 등록 */
    @Transactional
    public PdCategoryProd create(PdCategoryProd body) {
        body.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdCategoryProd saved = pdCategoryProdRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 카테고리-상품 매핑 수정 */
    @Transactional
    public PdCategoryProd update(String id, PdCategoryProd body) {
        CmUtil.requireId(id, "id", this);
        PdCategoryProd entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "categoryProdId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategoryProd saved = pdCategoryProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 카테고리-상품 매핑 수정 */
    @Transactional
    public PdCategoryProd updateSelective(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) throw new CmBizException("categoryProdId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCategoryProdId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCategoryProdId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdCategoryProdRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 카테고리-상품 매핑 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdCategoryProd entity = findById(id);
        pdCategoryProdRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdCategoryProd save(String cmd, PdCategoryProd entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCategoryProdId() == null || entity.getCategoryProdId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCategoryProdId() == null)
                    throw new CmBizException("삭제 대상 categoryProdId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdCategoryProdRepository.existsById(entity.getCategoryProdId()))
                    throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + entity.getCategoryProdId() + "::" + CmUtil.svcCallerInfo(this));
                pdCategoryProdRepository.deleteById(entity.getCategoryProdId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdCategoryProd saved = pdCategoryProdRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCategoryProdId() == null)
                    throw new CmBizException("수정 대상 categoryProdId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdCategoryProdRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + entity.getCategoryProdId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCategoryProdId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdCategoryProd> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdCategoryProd row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getCategoryProdId() == null || row.getCategoryProdId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdCategoryProd::getCategoryProdId, "U", "categoryProdId", this);
            CmUtil.requireRowIds(rows, PdCategoryProd::getCategoryProdId, "D", "categoryProdId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdCategoryProd::getCategoryProdId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdCategoryProdRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdCategoryProd> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdCategoryProd row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdCategoryProdRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCategoryProdId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdCategoryProd> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdCategoryProd row : insertRows) {
                row.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdCategoryProdRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
