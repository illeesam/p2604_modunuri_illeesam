package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
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
public class PdProdOptService {

    private final PdProdOptRepository pdProdOptRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 옵션 키조회 */
    public PdProdOptDto.Item getById(String id) {
        PdProdOptDto.Item dto = pdProdOptRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptDto.Item getByIdOrNull(String id) {
        return pdProdOptRepository.selectById(id).orElse(null);
    }

    /* 상품 옵션 상세조회 */
    public PdProdOpt findById(String id) {
        return pdProdOptRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOpt findByIdOrNull(String id) {
        return pdProdOptRepository.findById(id).orElse(null);
    }

    /* 상품 옵션 키검증 */
    public boolean existsById(String id) {
        return pdProdOptRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdOptRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 옵션 목록조회 */
    public List<PdProdOptDto.Item> getList(PdProdOptDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptRepository.selectList(req);
    }

    /* 상품 옵션 페이지조회 */
    public PdProdOptDto.PageResponse getPageData(PdProdOptDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdOptRepository.selectPageData(req);
    }

    /* 상품 옵션 등록 */
    @Transactional
    public PdProdOpt create(PdProdOpt body) {
        body.setProdOptId(CmUtil.generateId("pd_prod_opt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 옵션 수정 */
    @Transactional
    public PdProdOpt update(String id, PdProdOpt body) {
        CmUtil.requireId(id, "id", this);
        PdProdOpt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodOptId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 옵션 수정 */
    @Transactional
    public PdProdOpt updateSelective(PdProdOpt entity) {
        if (entity.getProdOptId() == null) throw new CmBizException("prodOptId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdOptId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdOptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 옵션 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdOpt entity = findById(id);
        pdProdOptRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdOpt saveOneBase(PdProdOpt entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getProdOptId() == null || entity.getProdOptId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getProdOptId() == null)
                throw new CmBizException("삭제 대상 prodOptId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdProdOptRepository.existsById(entity.getProdOptId()))
                throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getProdOptId() + "::" + CmUtil.svcCallerInfo(this));
            pdProdOptRepository.deleteById(entity.getProdOptId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdOptId(CmUtil.generateId("pd_prod_opt"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdProdOpt saved = pdProdOptRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdOptId() == null)
                throw new CmBizException("수정 대상 prodOptId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdProdOptRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getProdOptId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getProdOptId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProdOpt> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProdOpt row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdOptId() == null || row.getProdOptId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdOpt::getProdOptId, "U", "prodOptId", this);
        CmUtil.requireRowIds(rows, PdProdOpt::getProdOptId, "D", "prodOptId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdOpt::getProdOptId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdOptRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProdOpt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdOpt row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdProdOptRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdOptId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProdOpt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOpt row : insertRows) {
            row.setProdOptId(CmUtil.generateId("pd_prod_opt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
