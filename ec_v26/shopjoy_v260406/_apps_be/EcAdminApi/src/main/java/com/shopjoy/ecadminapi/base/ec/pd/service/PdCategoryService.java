package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
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
import java.util.ArrayList;
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
        PdCategoryDto.Item dto = pdCategoryRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategoryDto.Item getByIdOrNull(String id) {
        return pdCategoryRepository.selectById(id).orElse(null);
    }

    /* 상품 카테고리 상세조회 */
    public PdCategory findById(String id) {
        return pdCategoryRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdCategory findByIdOrNull(String id) {
        return pdCategoryRepository.findById(id).orElse(null);
    }

    /* 상품 카테고리 키검증 */
    public boolean existsById(String id) {
        return pdCategoryRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdCategoryRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 카테고리 목록조회 */
    public List<PdCategoryDto.Item> getList(PdCategoryDto.Request req) {
        return pdCategoryRepository.selectList(req);
    }

    /* 상품 카테고리 페이지조회 */
    public PdCategoryDto.PageResponse getPageData(PdCategoryDto.Request req) {
        PageHelper.addPaging(req);
        return pdCategoryRepository.selectPageList(req);
    }

    /* 상품 카테고리 등록 */
    @Transactional
    public PdCategory create(PdCategory body) {
        body.setCategoryId(CmUtil.generateId("pd_category"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
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
        int affected = pdCategoryRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 카테고리 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdCategory entity = findById(id);
        pdCategoryRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdCategory save(String cmd, PdCategory entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCategoryId() == null || entity.getCategoryId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCategoryId() == null)
                    throw new CmBizException("삭제 대상 categoryId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdCategoryRepository.existsById(entity.getCategoryId()))
                    throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
                pdCategoryRepository.deleteById(entity.getCategoryId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCategoryId(CmUtil.generateId("pd_category"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdCategory saved = pdCategoryRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCategoryId() == null)
                    throw new CmBizException("수정 대상 categoryId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdCategoryRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCategoryId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdCategory> rows) {
        if ("base".equals(cmd)) {
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
                pdCategoryRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdCategory> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdCategory row : updateRows) {
                row.setUpdBy(authId);
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
                pdCategoryRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
