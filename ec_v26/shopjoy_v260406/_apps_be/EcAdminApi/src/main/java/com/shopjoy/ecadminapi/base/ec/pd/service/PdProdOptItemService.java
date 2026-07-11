package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptItemRepository;
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
public class PdProdOptItemService {

    private final PdProdOptItemRepository pdProdOptItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 옵션 아이템 키조회 */
    public PdProdOptItemDto.Item getById(String id) {
        PdProdOptItemDto.Item dto = pdProdOptItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptItemDto.Item getByIdOrNull(String id) {
        return pdProdOptItemRepository.selectById(id).orElse(null);
    }

    /* 상품 옵션 아이템 상세조회 */
    public PdProdOptItem findById(String id) {
        return pdProdOptItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptItem findByIdOrNull(String id) {
        return pdProdOptItemRepository.findById(id).orElse(null);
    }

    /* 상품 옵션 아이템 키검증 */
    public boolean existsById(String id) {
        return pdProdOptItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdOptItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 옵션 아이템 목록조회 */
    public List<PdProdOptItemDto.Item> getList(PdProdOptItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptItemRepository.selectList(req);
    }

    /* 상품 옵션 아이템 페이지조회 */
    public PdProdOptItemDto.PageResponse getPageData(PdProdOptItemDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdOptItemRepository.selectPageData(req);
    }

    /* 상품 옵션 아이템 등록 */
    @Transactional
    public PdProdOptItem create(PdProdOptItem body) {
        if (body.getOptItemId() == null || body.getOptItemId().isBlank())
            body.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOptItem saved = pdProdOptItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 옵션 아이템 수정 */
    @Transactional
    public PdProdOptItem update(String id, PdProdOptItem body) {
        CmUtil.requireId(id, "id", this);
        PdProdOptItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "optItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOptItem saved = pdProdOptItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 옵션 아이템 수정 */
    @Transactional
    public PdProdOptItem updateSelective(PdProdOptItem entity) {
        if (entity.getOptItemId() == null) throw new CmBizException("optItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOptItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 옵션 아이템 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdOptItem entity = findById(id);
        pdProdOptItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdOptItem saveOneBase(PdProdOptItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getOptItemId() == null || entity.getOptItemId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getOptItemId() == null)
                throw new CmBizException("삭제 대상 optItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdProdOptItemRepository.existsById(entity.getOptItemId()))
                throw new CmBizException("존재하지 않는 PdProdOptItem입니다: " + entity.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
            pdProdOptItemRepository.deleteById(entity.getOptItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdProdOptItem saved = pdProdOptItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getOptItemId() == null)
                throw new CmBizException("수정 대상 optItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdProdOptItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdOptItem입니다: " + entity.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getOptItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProdOptItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProdOptItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getOptItemId() == null || row.getOptItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdOptItem::getOptItemId, "U", "optItemId", this);
        CmUtil.requireRowIds(rows, PdProdOptItem::getOptItemId, "D", "optItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdOptItem::getOptItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdOptItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProdOptItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdOptItem row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdProdOptItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProdOptItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOptItem row : insertRows) {
            row.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
